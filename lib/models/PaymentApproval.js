import mongoose from "mongoose"

const PaymentApprovalSchema = new mongoose.Schema(
  {
    // Reference to the transaction
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    // Type
    type: {
      type: String,
      enum: ["deposit", "withdrawal"],
      required: true,
    },
    // Gateway used
    gatewayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentGateway",
    },
    gatewayName: {
      type: String,
    },
    // Amount
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "escalated", "processing"],
      default: "pending",
    },
    // Reason for approval needed
    reason: {
      type: String,
      enum: [
        "amount_threshold",
        "new_user",
        "suspicious_activity",
        "manual_review",
        "kyc_pending",
        "velocity_check",
        "country_restriction",
        "first_withdrawal",
      ],
    },
    // Risk score
    riskScore: {
      type: Number,
      default: 0,
    },
    riskFactors: [
      {
        factor: String,
        score: Number,
        details: String,
      },
    ],
    // Payment details
    paymentDetails: {
      accountNumber: String,
      accountName: String,
      bankName: String,
      phoneNumber: String,
      walletAddress: String,
      reference: String,
    },
    // Review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },
    // Processing
    processedAt: {
      type: Date,
    },
    processingReference: {
      type: String,
    },
    processingError: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

PaymentApprovalSchema.index({ tenantId: 1, status: 1, createdAt: -1 })
PaymentApprovalSchema.index({ userId: 1, status: 1 })

export default mongoose.models.PaymentApproval || mongoose.model("PaymentApproval", PaymentApprovalSchema)
