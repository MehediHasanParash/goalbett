import mongoose from "mongoose"

const geoAccessLogSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
    },
    countryCode: String,
    countryName: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userEmail: String,
    route: String,
    decision: {
      type: String,
      enum: ["ALLOWED", "BLOCKED"],
      required: true,
    },
    decisionSource: {
      type: String,
      enum: ["EXCEPTION", "COUNTRY_RULE", "DEFAULT", "VPN_DETECTED"],
    },
    reason: String,
    exceptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeoAccessException",
    },
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CountryAccessRule",
    },
    userAgent: String,
    // VPN/Proxy detection
    isVpn: Boolean,
    isProxy: Boolean,
    isTor: Boolean,
    // Request metadata
    requestMethod: String,
    requestPath: String,
  },
  { timestamps: true },
)

// Indexes for analytics and monitoring
geoAccessLogSchema.index({ createdAt: -1 })
geoAccessLogSchema.index({ countryCode: 1, createdAt: -1 })
geoAccessLogSchema.index({ decision: 1, createdAt: -1 })
geoAccessLogSchema.index({ ipAddress: 1, createdAt: -1 })
geoAccessLogSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.GeoAccessLog || mongoose.model("GeoAccessLog", geoAccessLogSchema)
