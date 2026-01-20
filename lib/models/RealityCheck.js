import mongoose from "mongoose"

const RealityCheckSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    frequency: {
      type: Number,
      default: 60,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastShownAt: Date,
    sessionData: {
      startTime: Date,
      totalTimeSpent: { type: Number, default: 0 },
      totalWagered: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },
      numberOfBets: { type: Number, default: 0 },
    },
    history: [
      {
        shownAt: Date,
        timeSpent: Number,
        amountWagered: Number,
        netProfit: Number,
        playerAction: {
          type: String,
          enum: ["continue", "take_break", "self_exclude"],
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

RealityCheckSchema.index({ userId: 1, tenant_id: 1 })

export default mongoose.models.RealityCheck || mongoose.model("RealityCheck", RealityCheckSchema)
