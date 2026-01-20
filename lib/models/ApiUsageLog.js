import mongoose from "mongoose"

const ApiUsageLogSchema = new mongoose.Schema(
  {
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    // Request details
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      required: true,
    },

    // Response
    statusCode: {
      type: Number,
      required: true,
    },
    responseTime: {
      type: Number, // in milliseconds
      required: true,
    },

    // Client info
    clientIp: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
    },

    // Error tracking
    error: {
      occurred: { type: Boolean, default: false },
      code: { type: String, default: "" },
      message: { type: String, default: "" },
    },

    // Rate limit info at time of request
    rateLimitStatus: {
      minuteCount: { type: Number, default: 0 },
      hourCount: { type: Number, default: 0 },
      dayCount: { type: Number, default: 0 },
      quotaUsed: { type: Number, default: 0 },
      quotaLimit: { type: Number, default: 0 },
    },

    // Request/Response size
    requestSize: { type: Number, default: 0 }, // bytes
    responseSize: { type: Number, default: 0 }, // bytes

    // Timestamp for time-based queries
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    // Auto-delete logs older than 90 days
    expireAfterSeconds: 90 * 24 * 60 * 60,
  },
)

// Compound indexes for analytics
ApiUsageLogSchema.index({ apiKeyId: 1, timestamp: -1 })
ApiUsageLogSchema.index({ tenantId: 1, timestamp: -1 })
ApiUsageLogSchema.index({ endpoint: 1, timestamp: -1 })
ApiUsageLogSchema.index({ "error.occurred": 1, timestamp: -1 })

export default mongoose.models.ApiUsageLog || mongoose.model("ApiUsageLog", ApiUsageLogSchema)
