import mongoose from "mongoose"

const PlayerExclusionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["self_exclusion", "timeout", "admin_suspension"],
      required: true,
    },
    duration: {
      type: String,
      enum: ["24_hours", "48_hours", "1_week", "1_month", "3_months", "6_months", "1_year", "permanent"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    requestedBy: {
      type: String,
      enum: ["player", "admin"],
      required: true,
    },
    adminNotes: String,
    canRevert: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

PlayerExclusionSchema.index({ userId: 1, tenant_id: 1, isActive: 1 })
PlayerExclusionSchema.index({ endDate: 1 })

export default mongoose.models.PlayerExclusion || mongoose.model("PlayerExclusion", PlayerExclusionSchema)
