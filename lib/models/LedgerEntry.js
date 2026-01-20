import mongoose from "mongoose"

const LedgerEntrySchema = new mongoose.Schema(
  {
    // Unique ledger entry number for auditing
    entryNumber: {
      type: String,
      unique: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    // Double-entry: Debit side (money leaving)
    debitAccount: {
      walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" },
      accountType: {
        type: String,
        enum: ["player", "agent", "tenant", "operator", "system", "bonus", "commission", "jackpot", "revenue"],
      },
      accountName: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    // Double-entry: Credit side (money entering)
    creditAccount: {
      walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" },
      accountType: {
        type: String,
        enum: ["player", "agent", "tenant", "operator", "system", "bonus", "commission", "jackpot", "revenue"],
      },
      accountName: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "USD",
    },
    // Balance snapshots for audit trail
    debitBalanceBefore: Number,
    debitBalanceAfter: Number,
    creditBalanceBefore: Number,
    creditBalanceAfter: Number,
    transactionType: {
      type: String,
      enum: [
        // Deposits & Withdrawals
        "DEPOSIT",
        "WITHDRAWAL",
        "DEPOSIT_REVERSAL",
        "WITHDRAWAL_REVERSAL",
        // Betting
        "BET_PLACEMENT",
        "BET_WINNING",
        "BET_LOSS",
        "BET_REFUND",
        "BET_CASHOUT",
        // Bonuses
        "BONUS_CREDIT",
        "BONUS_WAGERING",
        "BONUS_CONVERSION",
        "BONUS_EXPIRY",
        "PROMOTIONAL_CREDIT",
        // Agent Operations
        "AGENT_FLOAT_TOPUP",
        "AGENT_COMMISSION",
        "AGENT_SETTLEMENT",
        "AGENT_PLAYER_TOPUP",
        "SUBAGENT_TRANSFER",
        // Operator Revenue
        "OPERATOR_REVENUE_SHARE",
        "OPERATOR_COMMISSION",
        "OPERATOR_SETTLEMENT",
        "PLATFORM_FEE",
        // System Operations
        "SYSTEM_ADJUSTMENT",
        "MANUAL_CREDIT",
        "MANUAL_DEBIT",
        "FEE_CHARGE",
        "TAX_DEDUCTION",
        // Jackpot
        "JACKPOT_CONTRIBUTION",
        "JACKPOT_WIN",
        // Transfers
        "INTERNAL_TRANSFER",
        "PLAYER_TRANSFER",
      ],
      required: true,
      index: true,
    },
    // Reference to source transaction/bet
    referenceType: {
      type: String,
      enum: ["transaction", "bet", "bonus", "settlement", "adjustment", "jackpot"],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    externalReference: String,
    description: {
      type: String,
      required: true,
    },
    // For reconciliation
    reconciliationStatus: {
      type: String,
      enum: ["pending", "matched", "unmatched", "disputed", "resolved"],
      default: "pending",
    },
    reconciliationDate: Date,
    reconciliationNotes: String,
    // Risk and compliance
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    // Audit fields
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "reversed", "disputed"],
      default: "pending",
      index: true,
    },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reversedAt: Date,
    reversalReason: String,
    reversalEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerEntry",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Period tracking for reporting
    fiscalYear: Number,
    fiscalMonth: Number,
    fiscalQuarter: Number,
  },
  {
    timestamps: true,
  },
)

// Pre-save hook to generate entry number and fiscal periods
LedgerEntrySchema.pre("save", async function (next) {
  if (!this.entryNumber) {
    const date = new Date()
    const count = await mongoose.models.LedgerEntry.countDocuments()
    this.entryNumber = `LE-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(count + 1).padStart(6, "0")}`
  }
  // Set fiscal periods
  const now = new Date()
  this.fiscalYear = now.getFullYear()
  this.fiscalMonth = now.getMonth() + 1
  this.fiscalQuarter = Math.ceil((now.getMonth() + 1) / 3)
  next()
})

LedgerEntrySchema.index({ entryNumber: 1 })
LedgerEntrySchema.index({ externalReference: 1 })
LedgerEntrySchema.index({ createdBy: 1, createdAt: -1 })
LedgerEntrySchema.index({ "debitAccount.walletId": 1, "creditAccount.walletId": 1 })
LedgerEntrySchema.index({ transactionType: 1, status: 1, createdAt: -1 })
LedgerEntrySchema.index({ tenantId: 1, fiscalYear: 1, fiscalMonth: 1 })
LedgerEntrySchema.index({ reconciliationStatus: 1 })

export default mongoose.models.LedgerEntry || mongoose.model("LedgerEntry", LedgerEntrySchema)
