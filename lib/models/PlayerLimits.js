import mongoose from "mongoose"

const PlayerLimitsSchema = new mongoose.Schema(
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
    depositLimits: {
      daily: {
        amount: { type: Number, default: null },
        current: { type: Number, default: 0 },
        resetAt: Date,
      },
      weekly: {
        amount: { type: Number, default: null },
        current: { type: Number, default: 0 },
        resetAt: Date,
      },
      monthly: {
        amount: { type: Number, default: null },
        current: { type: Number, default: 0 },
        resetAt: Date,
      },
    },
    stakeLimits: {
      perBet: { type: Number, default: null },
      daily: {
        amount: { type: Number, default: null },
        current: { type: Number, default: 0 },
        resetAt: Date,
      },
      weekly: {
        amount: { type: Number, default: null },
        current: { type: Number, default: 0 },
        resetAt: Date,
      },
      monthly: {
        amount: { type: Number, default: null },
        current: { type: Number, default: 0 },
        resetAt: Date,
      },
    },
    lossLimits: {
      daily: {
        amount: { type: Number, default: null },
        current: { type: Number, default: 0 },
        resetAt: Date,
      },
      weekly: {
        amount: { type: Number, default: null },
        current: { type: Number, default: 0 },
        resetAt: Date,
      },
      monthly: {
        amount: { type: Number, default: null },
        current: { type: Number, default: 0 },
        resetAt: Date,
      },
    },
    coolOffPeriod: {
      isActive: { type: Boolean, default: false },
      endDate: Date,
      reason: String,
    },
    pendingIncrease: {
      type: {
        type: String,
        enum: ["deposit", "stake", "loss"],
      },
      period: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
      },
      newAmount: Number,
      effectiveDate: Date,
    },
  },
  {
    timestamps: true,
  },
)

PlayerLimitsSchema.index({ userId: 1, tenant_id: 1 })

export default mongoose.models.PlayerLimits || mongoose.model("PlayerLimits", PlayerLimitsSchema)
