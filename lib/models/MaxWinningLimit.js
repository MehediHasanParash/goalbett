import mongoose from "mongoose"

const MaxWinningLimitSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    limitType: {
      type: String,
      enum: ["global", "sport", "league", "user_level"],
      default: "global",
    },
    sportType: {
      type: String,
    },
    leagueId: {
      type: String,
    },
    userLevel: {
      type: String,
      enum: ["basic", "silver", "gold", "platinum", "vip"],
    },
    maxWinAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

MaxWinningLimitSchema.index({ tenantId: 1, limitType: 1, isActive: 1 })

export default mongoose.models.MaxWinningLimit || mongoose.model("MaxWinningLimit", MaxWinningLimitSchema)
