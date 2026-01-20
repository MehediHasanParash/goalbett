import mongoose from "mongoose"

const AccountBalanceSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    accountType: {
      type: String,
      enum: ["player", "agent", "tenant", "operator", "system", "bonus", "commission", "jackpot", "revenue"],
      required: true,
    },
    accountName: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "USD",
    },
    // Current balances
    availableBalance: {
      type: Number,
      default: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    lockedBalance: {
      type: Number,
      default: 0,
    },
    // Aggregated stats
    totalDebits: {
      type: Number,
      default: 0,
    },
    totalCredits: {
      type: Number,
      default: 0,
    },
    transactionCount: {
      type: Number,
      default: 0,
    },
    // Period stats
    periodStats: {
      dailyDebits: { type: Number, default: 0 },
      dailyCredits: { type: Number, default: 0 },
      weeklyDebits: { type: Number, default: 0 },
      weeklyCredits: { type: Number, default: 0 },
      monthlyDebits: { type: Number, default: 0 },
      monthlyCredits: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      enum: ["active", "frozen", "suspended", "closed"],
      default: "active",
    },
    lastTransactionAt: Date,
    lastReconciliationAt: Date,
  },
  {
    timestamps: true,
  },
)

AccountBalanceSchema.index({ walletId: 1, accountType: 1 }, { unique: true })
AccountBalanceSchema.index({ tenantId: 1, accountType: 1 })
AccountBalanceSchema.index({ userId: 1 })

export default mongoose.models.AccountBalance || mongoose.model("AccountBalance", AccountBalanceSchema)
