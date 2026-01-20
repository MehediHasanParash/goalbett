import mongoose from "mongoose"

const geoAccessExceptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ACCOUNT", "IP", "CIDR", "DOMAIN"],
      required: true,
    },
    // For ACCOUNT type
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    accountEmail: String,
    // For IP/CIDR type
    ipOrCidr: String,
    // Optional: scope exception to specific country
    countryCode: {
      type: String,
      uppercase: true,
    },
    // Exception action
    status: {
      type: String,
      enum: ["ALLOW", "BLOCK"],
      required: true,
    },
    // Time limits
    startsAt: {
      type: Date,
      default: Date.now,
    },
    endsAt: Date,
    // Audit info
    note: String,
    licenseProofUrl: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdByEmail: String,
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

// Indexes
geoAccessExceptionSchema.index({ type: 1, isActive: 1 })
geoAccessExceptionSchema.index({ accountId: 1 })
geoAccessExceptionSchema.index({ ipOrCidr: 1 })
geoAccessExceptionSchema.index({ countryCode: 1 })
geoAccessExceptionSchema.index({ startsAt: 1, endsAt: 1 })

// Virtual to check if exception is currently valid
geoAccessExceptionSchema.virtual("isCurrentlyValid").get(function () {
  if (!this.isActive) return false
  const now = new Date()
  if (this.startsAt && now < this.startsAt) return false
  if (this.endsAt && now > this.endsAt) return false
  return true
})

export default mongoose.models.GeoAccessException || mongoose.model("GeoAccessException", geoAccessExceptionSchema)
