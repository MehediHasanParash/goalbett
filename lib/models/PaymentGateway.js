import mongoose from "mongoose"

const PaymentGatewaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: [
        "mpesa",
        "airtel_money",
        "mtn_money",
        "ecocash",
        "opay",
        "paystack",
        "flutterwave",
        "crypto_usdt",
        "crypto_btc",
        "orange_money",
        "bank_transfer",
      ],
    },
    displayName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
    },
    type: {
      type: String,
      enum: ["mobile_money", "bank", "crypto", "card", "fintech"],
      required: true,
    },
    // Regions where this gateway is available
    regions: [
      {
        type: String,
        enum: ["africa", "asia", "latam", "global"],
      },
    ],
    countries: [
      {
        type: String, // ISO country codes
      },
    ],
    // Tenant-specific or global
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null, // null means global/platform-level
    },
    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "pending_setup", "maintenance"],
      default: "pending_setup",
    },
    // API Configuration (encrypted in production)
    depositConfig: {
      apiKey: { type: String, default: "" },
      apiSecret: { type: String, default: "" },
      merchantId: { type: String, default: "" },
      webhookSecret: { type: String, default: "" },
      sandboxMode: { type: Boolean, default: true },
      endpoint: { type: String, default: "" },
      additionalConfig: { type: Map, of: String },
    },
    withdrawalConfig: {
      apiKey: { type: String, default: "" },
      apiSecret: { type: String, default: "" },
      merchantId: { type: String, default: "" },
      webhookSecret: { type: String, default: "" },
      sandboxMode: { type: Boolean, default: true },
      endpoint: { type: String, default: "" },
      additionalConfig: { type: Map, of: String },
    },
    // Fee Structure
    fees: {
      depositFeeType: { type: String, enum: ["fixed", "percentage", "mixed"], default: "percentage" },
      depositFeeFixed: { type: Number, default: 0 },
      depositFeePercent: { type: Number, default: 0 },
      depositMinFee: { type: Number, default: 0 },
      depositMaxFee: { type: Number, default: 0 },
      withdrawalFeeType: { type: String, enum: ["fixed", "percentage", "mixed"], default: "percentage" },
      withdrawalFeeFixed: { type: Number, default: 0 },
      withdrawalFeePercent: { type: Number, default: 0 },
      withdrawalMinFee: { type: Number, default: 0 },
      withdrawalMaxFee: { type: Number, default: 0 },
    },
    // Limits
    limits: {
      minDeposit: { type: Number, default: 1 },
      maxDeposit: { type: Number, default: 10000 },
      dailyDepositLimit: { type: Number, default: 50000 },
      minWithdrawal: { type: Number, default: 5 },
      maxWithdrawal: { type: Number, default: 5000 },
      dailyWithdrawalLimit: { type: Number, default: 25000 },
    },
    // Supported currencies
    currencies: [
      {
        type: String,
        uppercase: true,
      },
    ],
    // Processing time
    processingTime: {
      deposit: { type: String, default: "Instant" },
      withdrawal: { type: String, default: "1-24 hours" },
    },
    // Priority for routing
    priority: {
      type: Number,
      default: 0,
    },
    // Stats
    stats: {
      totalDeposits: { type: Number, default: 0 },
      totalWithdrawals: { type: Number, default: 0 },
      depositVolume: { type: Number, default: 0 },
      withdrawalVolume: { type: Number, default: 0 },
      successRate: { type: Number, default: 100 },
      lastTransaction: { type: Date },
    },
    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
)

PaymentGatewaySchema.index({ tenantId: 1, status: 1 })
PaymentGatewaySchema.index({ name: 1, tenantId: 1 }, { unique: true })

export default mongoose.models.PaymentGateway || mongoose.model("PaymentGateway", PaymentGatewaySchema)
