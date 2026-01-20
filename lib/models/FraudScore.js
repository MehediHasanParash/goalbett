import mongoose from "mongoose"

const FraudScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    factors: {
      identityVerification: { score: Number, verified: Boolean, method: String },
      mobileMoneyVerification: { score: Number, verified: Boolean, provider: String },
      deviceFingerprint: {
        score: Number,
        deviceId: String,
        isNewDevice: Boolean,
        multipleAccounts: Boolean,
        riskSignals: [String],
      },
      ipAnalysis: {
        score: Number,
        currentIp: String,
        country: String,
        isVpn: Boolean,
        isProxy: Boolean,
        isTor: Boolean,
        riskLevel: String,
      },
      behaviorAnalysis: {
        score: Number,
        unusualBettingPatterns: Boolean,
        rapidDeposits: Boolean,
        suspiciousWithdrawals: Boolean,
        accountAge: Number,
      },
      transactionVelocity: {
        score: Number,
        dailyTransactions: Number,
        dailyVolume: Number,
        weeklyTransactions: Number,
        weeklyVolume: Number,
        velocityBreaches: Number,
      },
      amlScore: {
        score: Number,
        pepMatch: Boolean,
        sanctionsMatch: Boolean,
        adverseMedia: Boolean,
        lastChecked: Date,
      },
    },
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
    history: [
      {
        score: Number,
        riskLevel: String,
        reason: String,
        calculatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
)

FraudScoreSchema.index({ overallScore: -1 })
FraudScoreSchema.index({ riskLevel: 1 })

export default mongoose.models.FraudScore || mongoose.model("FraudScore", FraudScoreSchema)
