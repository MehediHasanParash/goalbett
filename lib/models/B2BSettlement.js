import mongoose from "mongoose"

const B2BSettlementSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    settlementId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["tenant_topup", "tenant_withdrawal", "agent_payout", "provider_settlement", "platform_fee"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    // Parties involved
    fromParty: {
      type: {
        type: String,
        enum: ["platform", "tenant", "agent", "provider", "external"],
        required: true,
      },
      id: String,
      name: String,
      walletAddress: String,
    },
    toParty: {
      type: {
        type: String,
        enum: ["platform", "tenant", "agent", "provider", "external"],
        required: true,
      },
      id: String,
      name: String,
      walletAddress: String,
    },
    // Amount details
    amount: {
      value: { type: Number, required: true },
      currency: { type: String, default: "USDT" },
      network: { type: String, enum: ["TRC20", "ERC20", "BEP20"], default: "TRC20" },
      usdEquivalent: Number,
      exchangeRate: Number,
    },
    // Blockchain details - CRITICAL FOR AML
    blockchain: {
      txHash: {
        type: String,
        required: true,
        index: true,
      },
      blockNumber: Number,
      blockHash: String,
      gasUsed: Number,
      gasFee: Number,
      confirmations: { type: Number, default: 0 },
      confirmedAt: Date,
      explorerUrl: String,
    },
    // AML/Compliance fields
    compliance: {
      amlScreeningStatus: {
        type: String,
        enum: ["pending", "passed", "flagged", "failed", "manual_review"],
        default: "pending",
      },
      amlScreeningDate: Date,
      amlNotes: String,
      riskScore: { type: Number, min: 0, max: 100 },
      sourceOfFunds: String,
      destinationVerified: { type: Boolean, default: false },
      sanctionsCheck: {
        type: String,
        enum: ["pending", "clear", "flagged"],
        default: "pending",
      },
    },
    // Status
    status: {
      type: String,
      enum: ["pending", "confirming", "confirmed", "completed", "failed", "refunded", "disputed"],
      default: "pending",
    },
    // Metadata
    reference: String,
    description: String,
    internalNotes: String,
    attachments: [
      {
        type: { type: String, enum: ["receipt", "invoice", "contract", "screenshot", "other"] },
        url: String,
        name: String,
        uploadedAt: Date,
      },
    ],
    // Processing
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    // Error handling
    errorMessage: String,
    retryCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient querying
B2BSettlementSchema.index({ "blockchain.txHash": 1 })
B2BSettlementSchema.index({ status: 1, createdAt: -1 })
B2BSettlementSchema.index({ "compliance.amlScreeningStatus": 1 })
B2BSettlementSchema.index({ "fromParty.walletAddress": 1 })
B2BSettlementSchema.index({ "toParty.walletAddress": 1 })

// Generate settlement ID
B2BSettlementSchema.pre("save", async function (next) {
  if (!this.settlementId) {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    this.settlementId = `B2B-${timestamp}-${random}`
  }
  next()
})

// Static method to find by txHash (for AML audits)
B2BSettlementSchema.statics.findByTxHash = function (txHash) {
  return this.findOne({ "blockchain.txHash": txHash })
}

// Static method to get settlements for AML report
B2BSettlementSchema.statics.getAMLReport = async function (startDate, endDate, tenantId = null) {
  const query = {
    createdAt: { $gte: startDate, $lte: endDate },
  }
  if (tenantId) query.tenant_id = tenantId

  return this.find(query)
    .select({
      settlementId: 1,
      type: 1,
      "amount.value": 1,
      "amount.currency": 1,
      "blockchain.txHash": 1,
      "blockchain.confirmedAt": 1,
      "fromParty.walletAddress": 1,
      "toParty.walletAddress": 1,
      "compliance.amlScreeningStatus": 1,
      "compliance.riskScore": 1,
      status: 1,
      createdAt: 1,
    })
    .sort({ createdAt: -1 })
    .lean()
}

export default mongoose.models.B2BSettlement || mongoose.model("B2BSettlement", B2BSettlementSchema)
