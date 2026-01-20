import mongoose from "mongoose"

if (mongoose.models.Wallet) {
  delete mongoose.models.Wallet
}

const WalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    minBalanceThreshold: {
      type: Number,
      default: 0,
    },
    bonusBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingWithdrawal: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWagered: {
      type: Number,
      default: 0,
    },
    totalWinnings: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "FROZEN", "SUSPENDED", "CLOSED"],
      default: "ACTIVE",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    limits: {
      dailyDeposit: { type: Number, default: 10000 },
      dailyWithdrawal: { type: Number, default: 5000 },
      dailyBet: { type: Number, default: 10000 },
      weeklyDeposit: { type: Number, default: 50000 },
      weeklyWithdrawal: { type: Number, default: 25000 },
      monthlyDeposit: { type: Number, default: 200000 },
      monthlyWithdrawal: { type: Number, default: 100000 },
    },
    usage: {
      dailyDeposit: { type: Number, default: 0 },
      dailyWithdrawal: { type: Number, default: 0 },
      dailyBet: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

WalletSchema.virtual("totalBalance").get(function () {
  return this.availableBalance + this.lockedBalance
})

// Remove the compound index that causes duplicate key errors
// WalletSchema.index({ tenantId: 1, userId: 1 }, { sparse: true })

// Create separate indexes instead of compound index
WalletSchema.index({ userId: 1 }, { sparse: true }) // Sparse allows multiple nulls
WalletSchema.index({ tenantId: 1 })
WalletSchema.index({ tenantId: 1, status: 1 })

export default mongoose.model("Wallet", WalletSchema)
