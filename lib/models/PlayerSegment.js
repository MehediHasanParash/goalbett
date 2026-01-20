import mongoose from "mongoose"

const PlayerSegmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    segments: [
      {
        type: String,
        enum: ["VIP", "High Risk", "New", "Regular", "Inactive", "High Value", "Problem Gambling", "Bonus Hunter"],
      },
    ],
    tags: [String],
    vipLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lifetimeValue: {
      type: Number,
      default: 0,
    },
    totalDeposits: {
      type: Number,
      default: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
    },
    totalBets: {
      type: Number,
      default: 0,
    },
    totalWins: {
      type: Number,
      default: 0,
    },
    totalLosses: {
      type: Number,
      default: 0,
    },
    lastBetDate: Date,
    lastDepositDate: Date,
    daysActive: {
      type: Number,
      default: 0,
    },
    responsibleGamblingFlags: {
      highFrequencyBetting: { type: Boolean, default: false },
      largeLosses: { type: Boolean, default: false },
      chaseLosses: { type: Boolean, default: false },
      lateNightGambling: { type: Boolean, default: false },
      increasingBets: { type: Boolean, default: false },
      excessiveTimeSpent: { type: Boolean, default: false },
    },
    automationRules: [
      {
        rule: String,
        triggeredAt: Date,
        action: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

PlayerSegmentSchema.index({ userId: 1, tenant_id: 1 })
PlayerSegmentSchema.index({ segments: 1 })
PlayerSegmentSchema.index({ riskScore: 1 })
PlayerSegmentSchema.index({ vipLevel: 1 })

export default mongoose.models.PlayerSegment || mongoose.model("PlayerSegment", PlayerSegmentSchema)
