import mongoose from "mongoose"

const PaymentRouteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
    },
    // Route type
    type: {
      type: String,
      enum: ["deposit", "withdrawal"],
      required: true,
    },
    // Status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // Priority (higher = more preferred)
    priority: {
      type: Number,
      default: 0,
    },
    // Conditions for this route
    conditions: {
      // Amount range
      minAmount: { type: Number, default: 0 },
      maxAmount: { type: Number, default: Number.POSITIVE_INFINITY },
      // Currency
      currencies: [{ type: String }],
      // Countries
      countries: [{ type: String }],
      // Payment methods
      paymentMethods: [{ type: String }],
      // User segments
      userSegments: [{ type: String }],
      // Time-based rules
      activeHours: {
        start: { type: Number, default: 0 }, // 0-23
        end: { type: Number, default: 24 },
      },
      activeDays: [{ type: Number }], // 0-6 (Sunday-Saturday)
    },
    // Primary gateway
    primaryGateway: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentGateway",
      required: true,
    },
    // Fallback gateways in order of preference
    fallbackGateways: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentGateway",
      },
    ],
    // Split routing (for load balancing)
    splitRouting: {
      enabled: { type: Boolean, default: false },
      splits: [
        {
          gateway: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentGateway" },
          percentage: { type: Number }, // 0-100
        },
      ],
    },
    // Stats
    stats: {
      totalTransactions: { type: Number, default: 0 },
      successfulTransactions: { type: Number, default: 0 },
      failedTransactions: { type: Number, default: 0 },
      totalVolume: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
)

PaymentRouteSchema.index({ tenantId: 1, type: 1, status: 1 })

export default mongoose.models.PaymentRoute || mongoose.model("PaymentRoute", PaymentRouteSchema)
