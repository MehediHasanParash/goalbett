import mongoose from "mongoose"

const countryAccessRuleSchema = new mongoose.Schema(
  {
    countryCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 2,
      maxlength: 2,
    },
    countryName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["ALLOW", "BLOCK"],
      default: "ALLOW",
    },
    reason: {
      type: String,
      default: "",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // Granular blocking options
    blockSignup: { type: Boolean, default: true },
    blockLogin: { type: Boolean, default: false },
    blockDeposits: { type: Boolean, default: true },
    blockWithdrawals: { type: Boolean, default: true },
    blockBetting: { type: Boolean, default: true },
    blockCasino: { type: Boolean, default: true },
    // Audit
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedByEmail: String,
  },
  { timestamps: true },
)

// Indexes for fast lookup
countryAccessRuleSchema.index({ countryCode: 1 })
countryAccessRuleSchema.index({ status: 1 })
countryAccessRuleSchema.index({ enabled: 1, status: 1 })

export default mongoose.models.CountryAccessRule || mongoose.model("CountryAccessRule", countryAccessRuleSchema)
