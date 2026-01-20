import mongoose from "mongoose"

const countryRuleHistorySchema = new mongoose.Schema(
  {
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    countryName: String,
    actionType: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE", "EXCEPTION_ADD", "EXCEPTION_REMOVE"],
      required: true,
    },
    oldStatus: String,
    newStatus: String,
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    changedByEmail: String,
    ipAddress: String,
    userAgent: String,
    note: String,
  },
  { timestamps: true },
)

// Indexes
countryRuleHistorySchema.index({ countryCode: 1, createdAt: -1 })
countryRuleHistorySchema.index({ changedBy: 1 })
countryRuleHistorySchema.index({ actionType: 1 })

export default mongoose.models.CountryRuleHistory || mongoose.model("CountryRuleHistory", countryRuleHistorySchema)
