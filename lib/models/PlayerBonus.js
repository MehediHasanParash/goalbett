import mongoose from "mongoose"

if (mongoose.models.PlayerBonus) {
  delete mongoose.models.PlayerBonus
}

const PlayerBonusSchema = new mongoose.Schema(
  {
    // References
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bonusTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BonusTemplate",
      required: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },

    // Bonus Info (copied from template at claim time)
    bonusCode: { type: String, required: true },
    bonusName: { type: String, required: true },
    bonusType: {
      type: String,
      enum: [
        "deposit_match",
        "free_bet",
        "free_spins",
        "bonus_money",
        "cashback",
        "combo_boost",
        "reload_bonus",
        "no_deposit",
        "referral",
        "loyalty",
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ["sports", "casino", "all"],
      default: "all",
    },

    // Amounts
    depositAmount: { type: Number, default: 0 }, // Qualifying deposit
    bonusAmount: { type: Number, default: 0 }, // Bonus credited
    bonusRemaining: { type: Number, default: 0 }, // Remaining bonus balance
    convertedToReal: { type: Number, default: 0 }, // Converted to real money

    // Free Bets tracking
    freeBets: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 },
      amountPerBet: { type: Number, default: 0 },
      minOdds: { type: Number, default: 1.5 },
      betIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bet" }],
    },

    // Free Spins tracking
    freeSpins: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 },
      valuePerSpin: { type: Number, default: 0 },
      winnings: { type: Number, default: 0 },
      validGames: [{ type: String }],
    },

    // Cashback tracking
    cashback: {
      periodStart: { type: Date },
      periodEnd: { type: Date },
      totalLosses: { type: Number, default: 0 },
      cashbackPercentage: { type: Number, default: 0 },
      cashbackAmount: { type: Number, default: 0 },
      credited: { type: Boolean, default: false },
    },

    // Combo Boost tracking
    comboBoost: {
      isActive: { type: Boolean, default: false },
      boostPercentage: { type: Number, default: 0 },
      minLegs: { type: Number, default: 3 },
      appliedBets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bet" }],
    },

    // Wagering Progress
    wagering: {
      requirement: { type: Number, default: 0 }, // Total amount to wager
      completed: { type: Number, default: 0 }, // Amount wagered so far
      remaining: { type: Number, default: 0 }, // Amount left to wager
      progress: { type: Number, default: 0 }, // Percentage (0-100)
      contributionRates: { type: Map, of: Number },
      minOdds: { type: Number, default: 1.5 },
    },

    // Validity
    claimedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    wageringDeadline: { type: Date },

    // Status
    status: {
      type: String,
      enum: [
        "pending", // Awaiting qualifying action (e.g., deposit)
        "active", // Bonus credited and active
        "wagering", // Wagering in progress
        "completed", // Successfully wagered through
        "expired", // Expired without completing
        "cancelled", // Cancelled by admin
        "forfeited", // Player requested withdrawal, bonus forfeited
      ],
      default: "pending",
    },

    // History
    history: [
      {
        action: {
          type: String,
          enum: [
            "claimed",
            "credited",
            "bet_placed",
            "bet_won",
            "bet_lost",
            "spin_used",
            "wagering_progress",
            "completed",
            "expired",
            "cancelled",
            "forfeited",
            "converted",
          ],
        },
        amount: { type: Number },
        details: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Metadata
    source: {
      type: String,
      enum: ["manual", "automatic", "promo_code", "referral", "loyalty", "cashback"],
      default: "manual",
    },
    promoCode: { type: String },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminNotes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
)

// Indexes
PlayerBonusSchema.index({ userId: 1, status: 1 })
PlayerBonusSchema.index({ tenantId: 1, status: 1 })
PlayerBonusSchema.index({ bonusTemplateId: 1 })
PlayerBonusSchema.index({ expiresAt: 1 })
PlayerBonusSchema.index({ "wagering.progress": 1 })

// Method to update wagering progress
PlayerBonusSchema.methods.updateWageringProgress = async function (betAmount, gameType = "sports") {
  const contributionRate = this.wagering.contributionRates?.get(gameType) || 100
  const effectiveWager = (betAmount * contributionRate) / 100

  this.wagering.completed += effectiveWager
  this.wagering.remaining = Math.max(0, this.wagering.requirement - this.wagering.completed)
  this.wagering.progress = Math.min(100, (this.wagering.completed / this.wagering.requirement) * 100)

  this.history.push({
    action: "wagering_progress",
    amount: effectiveWager,
    details: { betAmount, gameType, contributionRate },
    timestamp: new Date(),
  })

  // Check if wagering is complete
  if (this.wagering.progress >= 100) {
    this.status = "completed"
    this.convertedToReal = this.bonusRemaining
    this.history.push({
      action: "completed",
      amount: this.bonusRemaining,
      timestamp: new Date(),
    })
  }

  await this.save()
  return this
}

// Method to consume free bet
PlayerBonusSchema.methods.consumeFreeBet = async function (betId) {
  if (this.freeBets.remaining <= 0) {
    throw new Error("No free bets remaining")
  }

  this.freeBets.used += 1
  this.freeBets.remaining -= 1
  this.freeBets.betIds.push(betId)

  this.history.push({
    action: "bet_placed",
    details: { betId, type: "free_bet" },
    timestamp: new Date(),
  })

  await this.save()
  return this
}

// Method to consume free spin
PlayerBonusSchema.methods.consumeFreeSpin = async function (gameId, winAmount = 0) {
  if (this.freeSpins.remaining <= 0) {
    throw new Error("No free spins remaining")
  }

  this.freeSpins.used += 1
  this.freeSpins.remaining -= 1
  this.freeSpins.winnings += winAmount

  this.history.push({
    action: "spin_used",
    amount: winAmount,
    details: { gameId },
    timestamp: new Date(),
  })

  await this.save()
  return this
}

export default mongoose.model("PlayerBonus", PlayerBonusSchema)
