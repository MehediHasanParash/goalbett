import mongoose from "mongoose"

const CircuitBreakerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    // Daily Net Loss Limit (total losses - total wins)
    dailyNetLossLimit: {
      type: Number,
      default: 50000, // Default $50,000 daily net loss limit
    },
    // Weekly Net Loss Limit
    weeklyNetLossLimit: {
      type: Number,
      default: 200000,
    },
    // Monthly Net Loss Limit
    monthlyNetLossLimit: {
      type: Number,
      default: 500000,
    },
    // Current period tracking
    currentDailyNetLoss: {
      type: Number,
      default: 0,
    },
    currentWeeklyNetLoss: {
      type: Number,
      default: 0,
    },
    currentMonthlyNetLoss: {
      type: Number,
      default: 0,
    },
    // Last reset timestamps
    lastDailyReset: {
      type: Date,
      default: Date.now,
    },
    lastWeeklyReset: {
      type: Date,
      default: Date.now,
    },
    lastMonthlyReset: {
      type: Date,
      default: Date.now,
    },
    // Circuit breaker status
    status: {
      type: String,
      enum: ["active", "tripped_daily", "tripped_weekly", "tripped_monthly", "manually_disabled"],
      default: "active",
    },
    // Auto-reset settings
    autoReset: {
      type: Boolean,
      default: true,
    },
    // Alert thresholds (percentage of limit)
    alertThresholds: {
      warning: { type: Number, default: 70 }, // Alert at 70% of limit
      critical: { type: Number, default: 90 }, // Critical alert at 90%
    },
    // Actions when tripped
    tripActions: {
      blockNewBets: { type: Boolean, default: true },
      blockDeposits: { type: Boolean, default: false },
      notifyAdmin: { type: Boolean, default: true },
      notifySuper: { type: Boolean, default: true },
    },
    // History of trips
    tripHistory: [
      {
        tripType: String, // 'daily', 'weekly', 'monthly'
        trippedAt: Date,
        netLossAtTrip: Number,
        limitAtTrip: Number,
        resetAt: Date,
        resetBy: mongoose.Schema.Types.ObjectId,
      },
    ],
    // Last updated by
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
)

// Check if limits need reset based on time
CircuitBreakerSchema.methods.checkAndResetPeriods = function () {
  const now = new Date()
  let wasReset = false

  // Daily reset (midnight UTC)
  const lastDaily = new Date(this.lastDailyReset)
  if (now.toDateString() !== lastDaily.toDateString()) {
    this.currentDailyNetLoss = 0
    this.lastDailyReset = now
    if (this.status === "tripped_daily" && this.autoReset) {
      this.status = "active"
    }
    wasReset = true
  }

  // Weekly reset (Monday midnight UTC)
  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff)).toDateString()
  }

  if (getWeekStart(now) !== getWeekStart(this.lastWeeklyReset)) {
    this.currentWeeklyNetLoss = 0
    this.lastWeeklyReset = now
    if (this.status === "tripped_weekly" && this.autoReset) {
      this.status = "active"
    }
    wasReset = true
  }

  // Monthly reset (1st of month)
  const lastMonthly = new Date(this.lastMonthlyReset)
  if (now.getMonth() !== lastMonthly.getMonth() || now.getFullYear() !== lastMonthly.getFullYear()) {
    this.currentMonthlyNetLoss = 0
    this.lastMonthlyReset = now
    if (this.status === "tripped_monthly" && this.autoReset) {
      this.status = "active"
    }
    wasReset = true
  }

  return wasReset
}

// Record a net loss/win and check if circuit should trip
CircuitBreakerSchema.methods.recordNetChange = function (amount) {
  // Positive amount = loss for house (player won)
  // Negative amount = win for house (player lost)
  this.currentDailyNetLoss += amount
  this.currentWeeklyNetLoss += amount
  this.currentMonthlyNetLoss += amount

  // Check if any limits exceeded
  if (this.currentDailyNetLoss >= this.dailyNetLossLimit && this.status === "active") {
    this.status = "tripped_daily"
    this.tripHistory.push({
      tripType: "daily",
      trippedAt: new Date(),
      netLossAtTrip: this.currentDailyNetLoss,
      limitAtTrip: this.dailyNetLossLimit,
    })
    return { tripped: true, type: "daily", netLoss: this.currentDailyNetLoss, limit: this.dailyNetLossLimit }
  }

  if (this.currentWeeklyNetLoss >= this.weeklyNetLossLimit && this.status === "active") {
    this.status = "tripped_weekly"
    this.tripHistory.push({
      tripType: "weekly",
      trippedAt: new Date(),
      netLossAtTrip: this.currentWeeklyNetLoss,
      limitAtTrip: this.weeklyNetLossLimit,
    })
    return { tripped: true, type: "weekly", netLoss: this.currentWeeklyNetLoss, limit: this.weeklyNetLossLimit }
  }

  if (this.currentMonthlyNetLoss >= this.monthlyNetLossLimit && this.status === "active") {
    this.status = "tripped_monthly"
    this.tripHistory.push({
      tripType: "monthly",
      trippedAt: new Date(),
      netLossAtTrip: this.currentMonthlyNetLoss,
      limitAtTrip: this.monthlyNetLossLimit,
    })
    return { tripped: true, type: "monthly", netLoss: this.currentMonthlyNetLoss, limit: this.monthlyNetLossLimit }
  }

  return { tripped: false }
}

// Get current status percentages
CircuitBreakerSchema.methods.getStatusPercentages = function () {
  return {
    daily: {
      current: this.currentDailyNetLoss,
      limit: this.dailyNetLossLimit,
      percentage: this.dailyNetLossLimit > 0 ? (this.currentDailyNetLoss / this.dailyNetLossLimit) * 100 : 0,
    },
    weekly: {
      current: this.currentWeeklyNetLoss,
      limit: this.weeklyNetLossLimit,
      percentage: this.weeklyNetLossLimit > 0 ? (this.currentWeeklyNetLoss / this.weeklyNetLossLimit) * 100 : 0,
    },
    monthly: {
      current: this.currentMonthlyNetLoss,
      limit: this.monthlyNetLossLimit,
      percentage: this.monthlyNetLossLimit > 0 ? (this.currentMonthlyNetLoss / this.monthlyNetLossLimit) * 100 : 0,
    },
  }
}

export default mongoose.models.CircuitBreaker || mongoose.model("CircuitBreaker", CircuitBreakerSchema)
