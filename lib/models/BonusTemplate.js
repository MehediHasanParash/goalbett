import mongoose from "mongoose"

if (mongoose.models.BonusTemplate) {
  delete mongoose.models.BonusTemplate
}

const BonusTemplateSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "deposit_match", // Match percentage of deposit
        "free_bet", // Free bet credits
        "free_spins", // Casino free spins
        "bonus_money", // Direct bonus credit
        "cashback", // Cashback on losses
        "combo_boost", // Boost for combo/accumulator bets
        "reload_bonus", // Reload deposit bonus
        "no_deposit", // No deposit required bonus
        "referral", // Referral bonus
        "loyalty", // Loyalty program bonus
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ["sports", "casino", "all"],
      default: "all",
    },

    // Tenant/Operator assignment
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = available to all tenants
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },

    // Value Configuration
    value: {
      // For deposit_match, reload_bonus: percentage (e.g., 100 = 100% match)
      // For free_bet, bonus_money, no_deposit: fixed amount
      // For cashback: percentage of losses
      // For combo_boost: percentage boost per leg
      amount: {
        type: Number,
        required: true,
        default: 0,
      },
      // Maximum bonus amount
      maxAmount: {
        type: Number,
        default: null,
      },
      // Minimum deposit/bet to qualify
      minDeposit: {
        type: Number,
        default: 0,
      },
      // Currency
      currency: {
        type: String,
        default: "ETB",
      },
    },

    // Free Spins specific
    freeSpins: {
      count: { type: Number, default: 0 },
      valuePerSpin: { type: Number, default: 0 },
      validGames: [{ type: String }], // Game IDs or slugs
      provider: { type: String, default: "" },
    },

    // Free Bet specific
    freeBet: {
      count: { type: Number, default: 1 },
      amountPerBet: { type: Number, default: 0 },
      minOdds: { type: Number, default: 1.5 },
      maxOdds: { type: Number, default: null },
      validSports: [{ type: String }],
      validMarkets: [{ type: String }],
      stakeReturned: { type: Boolean, default: false }, // Whether stake is returned on win
    },

    // Combo/Accumulator Boost
    comboBoost: {
      minLegs: { type: Number, default: 3 },
      boostPerLeg: { type: Number, default: 5 }, // 5% per leg
      maxBoost: { type: Number, default: 100 }, // Max 100% boost
      minOddsPerLeg: { type: Number, default: 1.2 },
    },

    // Cashback Configuration
    cashback: {
      percentage: { type: Number, default: 10 },
      maxAmount: { type: Number, default: 1000 },
      period: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "weekly",
      },
      minLoss: { type: Number, default: 100 }, // Minimum loss to qualify
    },

    // Wagering Requirements
    wagering: {
      multiplier: {
        type: Number,
        default: 10, // 10x wagering
        min: 0,
      },
      contributionRates: {
        sports: { type: Number, default: 100 }, // 100% contribution
        slots: { type: Number, default: 100 },
        table_games: { type: Number, default: 10 },
        live_casino: { type: Number, default: 10 },
        virtual_sports: { type: Number, default: 50 },
      },
      minOdds: { type: Number, default: 1.5 }, // Min odds for bets to count
      maxStakePerBet: { type: Number, default: null }, // Max stake per bet
      excludedGames: [{ type: String }],
    },

    // Validity & Expiration
    validity: {
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date, default: null },
      daysToExpire: { type: Number, default: 30 }, // Days after claim to use
      daysToWager: { type: Number, default: 30 }, // Days to complete wagering
    },

    // Eligibility Rules
    eligibility: {
      newPlayersOnly: { type: Boolean, default: false },
      minDeposits: { type: Number, default: 0 }, // Min number of previous deposits
      maxDeposits: { type: Number, default: null }, // Max deposits (for new player detection)
      playerSegments: [{ type: String }], // VIP, Regular, etc.
      countries: [{ type: String }],
      excludedCountries: [{ type: String }],
      minAccountAge: { type: Number, default: 0 }, // Days
      maxClaimsPerUser: { type: Number, default: 1 },
      maxClaimsTotal: { type: Number, default: null },
      requiresCode: { type: Boolean, default: false },
      kycRequired: { type: Boolean, default: false },
    },

    // Status & Tracking
    status: {
      type: String,
      enum: ["draft", "active", "paused", "expired", "archived"],
      default: "draft",
    },
    priority: {
      type: Number,
      default: 0, // Higher = shown first
    },

    // Stats
    stats: {
      totalClaimed: { type: Number, default: 0 },
      totalValueAwarded: { type: Number, default: 0 },
      totalWagered: { type: Number, default: 0 },
      totalConverted: { type: Number, default: 0 }, // Successfully wagered through
      conversionRate: { type: Number, default: 0 },
    },

    // Display
    display: {
      imageUrl: { type: String, default: "" },
      badgeText: { type: String, default: "" },
      highlightColor: { type: String, default: "#FFD700" },
      showOnHomepage: { type: Boolean, default: true },
      showInPromotions: { type: Boolean, default: true },
      sortOrder: { type: Number, default: 0 },
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
BonusTemplateSchema.index({ code: 1 }, { unique: true })
BonusTemplateSchema.index({ type: 1, status: 1 })
BonusTemplateSchema.index({ tenantId: 1, status: 1 })
BonusTemplateSchema.index({ "validity.startDate": 1, "validity.endDate": 1 })

export default mongoose.model("BonusTemplate", BonusTemplateSchema)
