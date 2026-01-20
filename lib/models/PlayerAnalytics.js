import mongoose from "mongoose"

const PlayerAnalyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },

    // Lifetime Value (LTV) Metrics
    ltv: {
      totalValue: { type: Number, default: 0 }, // Total GGR from player
      projectedValue: { type: Number, default: 0 }, // Predicted future value
      segment: {
        type: String,
        enum: ["whale", "vip", "high_value", "regular", "casual", "low_value", "dormant", "churned"],
        default: "casual",
      },
      score: { type: Number, default: 0, min: 0, max: 100 }, // LTV score
    },

    // Activity Metrics
    activity: {
      firstBetDate: Date,
      lastBetDate: Date,
      firstDepositDate: Date,
      lastDepositDate: Date,
      lastActiveDate: Date,
      totalActiveDays: { type: Number, default: 0 },
      averageSessionDuration: { type: Number, default: 0 }, // minutes
      loginCount: { type: Number, default: 0 },

      // Activity streaks
      currentStreak: { type: Number, default: 0 }, // Days
      longestStreak: { type: Number, default: 0 },
    },

    // Betting Behavior
    betting: {
      totalBets: { type: Number, default: 0 },
      totalStake: { type: Number, default: 0 },
      totalWinnings: { type: Number, default: 0 },
      totalLosses: { type: Number, default: 0 },
      netPosition: { type: Number, default: 0 }, // Winnings - Losses from house perspective
      winRate: { type: Number, default: 0 },
      averageStake: { type: Number, default: 0 },
      averageOdds: { type: Number, default: 0 },
      maxStake: { type: Number, default: 0 },

      // Preferences
      preferredSports: [{ sport: String, percentage: Number }],
      preferredBetTypes: [{ type: String, percentage: Number }],
      preferredOddsRange: { min: Number, max: Number },
    },

    // Financial Behavior
    financial: {
      totalDeposits: { type: Number, default: 0 },
      depositCount: { type: Number, default: 0 },
      averageDeposit: { type: Number, default: 0 },
      maxDeposit: { type: Number, default: 0 },
      totalWithdrawals: { type: Number, default: 0 },
      withdrawalCount: { type: Number, default: 0 },
      averageWithdrawal: { type: Number, default: 0 },

      // Deposit frequency
      depositsLast7Days: { type: Number, default: 0 },
      depositsLast30Days: { type: Number, default: 0 },

      // Preferred payment method
      preferredDepositMethod: String,
      preferredWithdrawalMethod: String,
    },

    // Retention Metrics
    retention: {
      cohort: String, // e.g., "2024-01" for Jan 2024 signup cohort
      daysSinceRegistration: { type: Number, default: 0 },
      daysSinceLastActivity: { type: Number, default: 0 },
      isAtRisk: { type: Boolean, default: false }, // Churn risk flag
      churnProbability: { type: Number, default: 0, min: 0, max: 100 },

      // Engagement score
      engagementScore: { type: Number, default: 0, min: 0, max: 100 },

      // Retention status
      status: {
        type: String,
        enum: ["new", "active", "engaged", "at_risk", "dormant", "churned", "reactivated"],
        default: "new",
      },
    },

    // Bonus & Promotion Response
    promotions: {
      bonusesClaimed: { type: Number, default: 0 },
      bonusValue: { type: Number, default: 0 },
      bonusConversionRate: { type: Number, default: 0 }, // Percentage of bonuses wagered
      promoResponseRate: { type: Number, default: 0 }, // Response to promotions
      lastBonusClaimed: Date,
    },

    // Risk Indicators
    risk: {
      problemGamblingScore: { type: Number, default: 0, min: 0, max: 100 },
      depositVelocity: { type: Number, default: 0 }, // Deposits per day
      chasingLosses: { type: Boolean, default: false },
      exceededLimits: { type: Number, default: 0 },
      selfExcluded: { type: Boolean, default: false },
    },

    // Last updated
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
PlayerAnalyticsSchema.index({ tenantId: 1, "ltv.segment": 1 })
PlayerAnalyticsSchema.index({ tenantId: 1, "retention.status": 1 })
PlayerAnalyticsSchema.index({ "ltv.totalValue": -1 })
PlayerAnalyticsSchema.index({ "retention.churnProbability": -1 })

export default mongoose.models.PlayerAnalytics || mongoose.model("PlayerAnalytics", PlayerAnalyticsSchema)
