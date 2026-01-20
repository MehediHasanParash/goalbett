import mongoose from "mongoose"

/**
 * Jurisdiction Rule Model
 *
 * This model stores all financial rules (taxes, charity, cashback, etc.)
 * per country/jurisdiction. Rules are NEVER hard-coded and fully configurable.
 *
 * CRITICAL PRINCIPLES:
 * - All rules stored in DB, configurable via admin UI
 * - Backend enforces rules during settlement
 * - Rules have versions (never modify active rules, create new version)
 * - Bets tied to rule version at time of placement
 * - Full audit trail of all changes
 */

const DeductionRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ["win_tax", "betting_tax", "charity", "withholding_tax", "vat", "excise_duty", "social_responsibility", "gaming_levy", "other"],
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
  },
  // Threshold: only apply if amount >= threshold
  threshold: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Base: what to calculate percentage on
  calculationBase: {
    type: String,
    enum: ["gross_win", "net_profit", "stake", "payout", "ggr", "turnover"],
    default: "gross_win",
  },
  // Apply to player or operator
  appliesTo: {
    type: String,
    enum: ["player", "operator", "both"],
    default: "player",
  },
  // Order of application (lower numbers first)
  applicationOrder: {
    type: Number,
    default: 1,
  },
  // Destination account
  destinationAccount: {
    type: String,
    enum: ["tax_payable", "charity_payable", "vat_payable", "excise_payable", "other_payable"],
    default: "tax_payable",
  },
  // Rounding
  rounding: {
    type: String,
    enum: ["floor", "ceil", "normal"],
    default: "normal",
  },
  description: {
    type: String,
    default: "",
  },
})

const JurisdictionRuleSchema = new mongoose.Schema(
  {
    // Country/Jurisdiction
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    countryName: {
      type: String,
      required: true,
    },

    // Profile name for multiple profiles per country
    profileName: {
      type: String,
      required: true,
      default: "standard",
    },

    // Version control (CRITICAL)
    version: {
      type: Number,
      required: true,
      default: 1,
    },

    // Effective dates
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },

    // Currency enforcement
    baseCurrency: {
      type: String,
      required: true,
      uppercase: true,
      default: "USD",
    },

    // Player-side deductions (applied to winnings)
    playerDeductions: [DeductionRuleSchema],

    // Operator-side deductions (applied to GGR/revenue)
    operatorDeductions: [DeductionRuleSchema],

    // Betting limits
    limits: {
      maxWinPerBet: {
        type: Number,
        default: null,
      },
      maxWinPerDay: {
        type: Number,
        default: null,
      },
      maxBetAmount: {
        type: Number,
        default: null,
      },
      minBetAmount: {
        type: Number,
        default: 1,
      },
    },

    // Features allowed
    featuresAllowed: {
      cashbackEnabled: {
        type: Boolean,
        default: true,
      },
      bonusesEnabled: {
        type: Boolean,
        default: true,
      },
      liveBettingEnabled: {
        type: Boolean,
        default: true,
      },
    },

    // Provider lock (if locked, tenants cannot change)
    providerLocked: {
      type: Boolean,
      default: false,
    },
    lockedFields: [
      {
        type: String,
      },
    ],

    // Who created/modified
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Change reason (for audit)
    changeReason: {
      type: String,
      default: "",
    },

    // Previous version reference
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JurisdictionRule",
      default: null,
    },

    // Regulatory info
    regulatoryInfo: {
      licensingBody: {
        type: String,
        default: "",
      },
      licenseNumber: {
        type: String,
        default: "",
      },
      complianceNotes: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes
JurisdictionRuleSchema.index({ countryCode: 1, profileName: 1, version: 1 }, { unique: true })
JurisdictionRuleSchema.index({ status: 1, effectiveFrom: 1 })
JurisdictionRuleSchema.index({ countryCode: 1, status: 1 })

// Methods
JurisdictionRuleSchema.statics.getActiveRule = async function (countryCode, profileName = "standard") {
  return await this.findOne({
    countryCode: countryCode.toUpperCase(),
    profileName,
    status: "active",
    effectiveFrom: { $lte: new Date() },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: new Date() } }],
  })
}

JurisdictionRuleSchema.statics.createNewVersion = async function (ruleId, updates, userId, reason) {
  const currentRule = await this.findById(ruleId)
  if (!currentRule) throw new Error("Rule not found")

  // Archive current rule
  currentRule.status = "archived"
  currentRule.effectiveTo = new Date()
  await currentRule.save()

  // Create new version
  const newRule = new this({
    ...currentRule.toObject(),
    _id: undefined,
    version: currentRule.version + 1,
    ...updates,
    previousVersionId: currentRule._id,
    createdBy: userId,
    lastModifiedBy: userId,
    changeReason: reason,
    effectiveFrom: new Date(),
    effectiveTo: null,
    status: "active",
    createdAt: undefined,
    updatedAt: undefined,
  })

  await newRule.save()
  return newRule
}

JurisdictionRuleSchema.methods.calculatePlayerDeductions = function (grossWin, stake, payout) {
  const deductions = []
  let remainingAmount = grossWin

  // Sort by application order
  const sortedDeductions = this.playerDeductions
    .filter((d) => d.enabled)
    .sort((a, b) => a.applicationOrder - b.applicationOrder)

  for (const rule of sortedDeductions) {
    // Check threshold
    if (grossWin < rule.threshold) continue

    // Determine base amount
    let baseAmount = grossWin
    if (rule.calculationBase === "stake") baseAmount = stake
    if (rule.calculationBase === "payout") baseAmount = payout
    if (rule.calculationBase === "net_profit") baseAmount = Math.max(0, grossWin - stake)

    // Calculate deduction
    let amount = (baseAmount * rule.percentage) / 100

    // Apply rounding
    if (rule.rounding === "floor") amount = Math.floor(amount)
    else if (rule.rounding === "ceil") amount = Math.ceil(amount)
    else amount = Math.round(amount * 100) / 100

    deductions.push({
      name: rule.name,
      percentage: rule.percentage,
      baseAmount,
      amount,
      destinationAccount: rule.destinationAccount,
      calculationBase: rule.calculationBase,
    })

    remainingAmount -= amount
  }

  return {
    deductions,
    totalDeducted: deductions.reduce((sum, d) => sum + d.amount, 0),
    netAmount: Math.max(0, remainingAmount),
  }
}

export default mongoose.models.JurisdictionRule || mongoose.model("JurisdictionRule", JurisdictionRuleSchema)
