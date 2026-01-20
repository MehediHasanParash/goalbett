import mongoose from "mongoose"

if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction
}

const TransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
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
        "deposit",
        "withdrawal",
        "bet_placed",
        "bet_won",
        "bet_lost",
        "bet_refund",
        "bonus_credit",
        "bonus_debit",
        "transfer_in",
        "transfer_out",
        "commission",
        "adjustment",
        "tenant_topup", // Super Admin -> Tenant (prepaid deposit)
        "tenant_credit_line", // Super Admin -> Tenant (credit line)
        "tenant_adjustment", // Super Admin manual adjustment to Tenant
        "agent_topup", // Tenant -> Agent topup
        "credit_sale", // Added credit sale transaction types
        "credit_request_approved",
        "voucher_redemption", // Added voucher redemption transaction type
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    // Balance before and after transaction
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "reversed"],
      default: "pending",
      index: true,
    },
    // Payment method details
    paymentMethod: {
      type: {
        type: String,
        enum: [
          "bank",
          "mpesa",
          "orange",
          "card",
          "airtime",
          "crypto",
          "internal",
          "wire_transfer",
          "credit_line",
          "mobile",
        ],
      },
      reference: String,
      provider: String,
      accountNumber: String,
    },
    // Reference to related bet (if bet transaction)
    betId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bet",
    },
    // From/To wallet tracking for transfers
    fromWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    toWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    // Description
    description: {
      type: String,
      default: "",
    },
    // External reference (from payment provider)
    externalRef: {
      type: String,
      index: true,
    },
    // Processed by (agent/admin/super admin)
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Metadata for additional info
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
)

// Compound indexes for common queries
TransactionSchema.index({ tenantId: 1, createdAt: -1 })
TransactionSchema.index({ userId: 1, type: 1, createdAt: -1 })
TransactionSchema.index({ tenantId: 1, type: 1, status: 1 })

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema)
