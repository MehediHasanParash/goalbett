import mongoose from "mongoose"

const AnalyticsSnapshotSchema = new mongoose.Schema(
  {
    // Snapshot type and period
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"],
      required: true,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
      index: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },

    // Tenant scope (null for platform-wide)
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },

    // Revenue Metrics
    revenue: {
      ggr: { type: Number, default: 0 }, // Gross Gaming Revenue (Stakes - Payouts)
      ngr: { type: Number, default: 0 }, // Net Gaming Revenue (GGR - Bonuses - Taxes - Fees)
      turnover: { type: Number, default: 0 }, // Total stakes/wagered amount
      totalStakes: { type: Number, default: 0 },
      totalPayouts: { type: Number, default: 0 },
      totalBonusesPaid: { type: Number, default: 0 },
      houseEdge: { type: Number, default: 0 }, // Percentage

      // By product type
      sportsbookGGR: { type: Number, default: 0 },
      casinoGGR: { type: Number, default: 0 },
      virtualGGR: { type: Number, default: 0 },
      jackpotGGR: { type: Number, default: 0 },
    },

    // Betting Metrics
    betting: {
      totalBets: { type: Number, default: 0 },
      wonBets: { type: Number, default: 0 },
      lostBets: { type: Number, default: 0 },
      voidedBets: { type: Number, default: 0 },
      cashedOutBets: { type: Number, default: 0 },
      pendingBets: { type: Number, default: 0 },
      averageStake: { type: Number, default: 0 },
      averageOdds: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 }, // Player win rate percentage

      // Bet type breakdown
      singleBets: { type: Number, default: 0 },
      multipleBets: { type: Number, default: 0 },
      systemBets: { type: Number, default: 0 },
    },

    // Player Metrics
    players: {
      totalRegistered: { type: Number, default: 0 },
      newRegistrations: { type: Number, default: 0 },
      activeUsers: { type: Number, default: 0 }, // Placed at least 1 bet
      dailyActiveUsers: { type: Number, default: 0 },
      weeklyActiveUsers: { type: Number, default: 0 },
      monthlyActiveUsers: { type: Number, default: 0 },
      depositingPlayers: { type: Number, default: 0 },
      firstTimeDepositors: { type: Number, default: 0 },

      // Retention & Churn
      retentionRate: { type: Number, default: 0 }, // Percentage
      churnRate: { type: Number, default: 0 }, // Percentage
      churnedPlayers: { type: Number, default: 0 },
      reactivatedPlayers: { type: Number, default: 0 },

      // Lifetime Value
      averageLTV: { type: Number, default: 0 },
      highValuePlayers: { type: Number, default: 0 }, // LTV > threshold

      // Player segments
      vipPlayers: { type: Number, default: 0 },
      regularPlayers: { type: Number, default: 0 },
      casualPlayers: { type: Number, default: 0 },
      dormantPlayers: { type: Number, default: 0 },
    },

    // Financial Metrics
    financial: {
      totalDeposits: { type: Number, default: 0 },
      depositCount: { type: Number, default: 0 },
      averageDeposit: { type: Number, default: 0 },
      totalWithdrawals: { type: Number, default: 0 },
      withdrawalCount: { type: Number, default: 0 },
      averageWithdrawal: { type: Number, default: 0 },
      pendingWithdrawals: { type: Number, default: 0 },

      // Net flow
      netDeposits: { type: Number, default: 0 }, // Deposits - Withdrawals

      // By payment method
      depositsByMethod: [
        {
          method: String,
          amount: Number,
          count: Number,
          percentage: Number,
        },
      ],
      withdrawalsByMethod: [
        {
          method: String,
          amount: Number,
          count: Number,
          percentage: Number,
        },
      ],
    },

    // Agent Metrics
    agents: {
      totalAgents: { type: Number, default: 0 },
      activeAgents: { type: Number, default: 0 },
      totalCommissionPaid: { type: Number, default: 0 },
      averageCommission: { type: Number, default: 0 },
      topAgentProfit: { type: Number, default: 0 },

      // Agent performance list
      agentPerformance: [
        {
          agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          agentName: String,
          playerCount: Number,
          turnover: Number,
          ggr: Number,
          commission: Number,
          profit: Number,
        },
      ],
    },

    // Sport/Category breakdown
    sportBreakdown: [
      {
        sport: String,
        betCount: Number,
        turnover: Number,
        ggr: Number,
        percentage: Number,
      },
    ],

    // Comparison with previous period
    comparison: {
      ggrChange: { type: Number, default: 0 }, // Percentage change
      ngrChange: { type: Number, default: 0 },
      turnoverChange: { type: Number, default: 0 },
      newPlayersChange: { type: Number, default: 0 },
      activePlayersChange: { type: Number, default: 0 },
      depositsChange: { type: Number, default: 0 },
    },

    // Generation metadata
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: String,
      enum: ["system", "manual", "scheduled"],
      default: "system",
    },
    status: {
      type: String,
      enum: ["generating", "completed", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  },
)

// Compound indexes for efficient queries
AnalyticsSnapshotSchema.index({ type: 1, periodStart: -1 })
AnalyticsSnapshotSchema.index({ tenantId: 1, type: 1, periodStart: -1 })

export default mongoose.models.AnalyticsSnapshot || mongoose.model("AnalyticsSnapshot", AnalyticsSnapshotSchema)
