import mongoose from "mongoose"

if (mongoose.models.CashbackLevel) {
  delete mongoose.models.CashbackLevel
}

const CashbackLevelSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = global
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tier: {
      type: Number,
      required: true,
      min: 1,
    },
    // Qualification criteria
    minMonthlyWager: {
      type: Number,
      default: 0,
    },
    minMonthlyDeposit: {
      type: Number,
      default: 0,
    },
    minTotalWager: {
      type: Number,
      default: 0,
    },
    // Cashback rates by category
    rates: {
      sports: { type: Number, default: 0 },
      casino: { type: Number, default: 0 },
      live_casino: { type: Number, default: 0 },
      virtual_sports: { type: Number, default: 0 },
    },
    // Limits
    maxCashbackPerDay: { type: Number, default: 1000 },
    maxCashbackPerWeek: { type: Number, default: 5000 },
    maxCashbackPerMonth: { type: Number, default: 20000 },
    // Wagering
    wageringRequirement: { type: Number, default: 1 },
    // Additional benefits
    benefits: {
      prioritySupport: { type: Boolean, default: false },
      exclusivePromotions: { type: Boolean, default: false },
      higherLimits: { type: Boolean, default: false },
      fasterWithdrawals: { type: Boolean, default: false },
      personalManager: { type: Boolean, default: false },
      birthdayBonus: { type: Number, default: 0 },
      weeklyBonus: { type: Number, default: 0 },
    },
    // Display
    color: { type: String, default: "#FFD700" },
    icon: { type: String, default: "star" },
    badgeUrl: { type: String, default: "" },
    // Status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

CashbackLevelSchema.index({ tenantId: 1, tier: 1 })
CashbackLevelSchema.index({ minMonthlyWager: 1 })

export default mongoose.model("CashbackLevel", CashbackLevelSchema)
