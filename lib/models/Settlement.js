import mongoose from "mongoose"

const SettlementSchema = new mongoose.Schema(
  {
    settlementNumber: {
      type: String,
      unique: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    settlementType: {
      type: String,
      enum: ["agent_commission", "operator_revenue_share", "platform_fee", "tax_settlement", "bonus_settlement"],
      required: true,
    },
    // Who is being settled
    beneficiaryType: {
      type: String,
      enum: ["agent", "subagent", "operator", "platform"],
      required: true,
    },
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    beneficiaryWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    // Settlement period
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    // Financial breakdown
    grossAmount: {
      type: Number,
      required: true,
    },
    deductions: {
      platformFee: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      chargebacks: { type: Number, default: 0 },
      adjustments: { type: Number, default: 0 },
    },
    netAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "USD",
    },
    // Source data
    sourceTransactions: [
      {
        transactionId: mongoose.Schema.Types.ObjectId,
        type: String,
        amount: Number,
      },
    ],
    totalTransactions: {
      type: Number,
      default: 0,
    },
    // Status workflow
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "processing", "completed", "failed", "disputed"],
      default: "draft",
    },
    // Approval chain
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: Date,
    // Payment details
    paymentMethod: {
      type: String,
      enum: ["wallet_credit", "bank_transfer", "mobile_money", "crypto"],
    },
    paymentReference: String,
    // Ledger entries created
    ledgerEntryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LedgerEntry",
      },
    ],
    notes: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

SettlementSchema.pre("save", async function (next) {
  if (!this.settlementNumber) {
    const date = new Date()
    const count = await mongoose.models.Settlement.countDocuments()
    this.settlementNumber = `STL-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(5, "0")}`
  }
  next()
})

SettlementSchema.index({ settlementNumber: 1 })
SettlementSchema.index({ tenantId: 1, status: 1 })
SettlementSchema.index({ beneficiaryId: 1, settlementType: 1 })
SettlementSchema.index({ periodStart: 1, periodEnd: 1 })

export default mongoose.models.Settlement || mongoose.model("Settlement", SettlementSchema)
