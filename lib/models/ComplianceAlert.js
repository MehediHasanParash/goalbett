import mongoose from "mongoose"

const ComplianceAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "suspicious_activity",
        "large_transaction",
        "velocity_breach",
        "fraud_detected",
        "aml_flag",
        "kyc_expired",
        "multiple_accounts",
        "ip_mismatch",
        "device_fingerprint",
        "mobile_money_fraud",
        "identity_mismatch",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["new", "investigating", "resolved", "dismissed", "escalated"],
      default: "new",
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    details: {
      transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
      betId: { type: mongoose.Schema.Types.ObjectId, ref: "Bet" },
      amount: Number,
      currency: String,
      ipAddress: String,
      deviceFingerprint: String,
      location: {
        country: String,
        city: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      riskScore: Number,
      riskFactors: [String],
      matchedRules: [String],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolution: {
      action: {
        type: String,
        enum: [
          "no_action",
          "warning_issued",
          "account_suspended",
          "account_blocked",
          "reported_to_authority",
          "false_positive",
        ],
      },
      notes: String,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      resolvedAt: Date,
    },
    notes: [
      {
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
)

ComplianceAlertSchema.index({ type: 1, status: 1 })
ComplianceAlertSchema.index({ createdAt: -1 })
ComplianceAlertSchema.index({ severity: 1, status: 1 })

export default mongoose.models.ComplianceAlert || mongoose.model("ComplianceAlert", ComplianceAlertSchema)
