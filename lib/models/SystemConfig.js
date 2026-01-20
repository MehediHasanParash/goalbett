import mongoose from "mongoose"

const SystemConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
      index: true,
    },
    betting: {
      minStake: {
        type: Number,
        default: 1,
      },
      maxStake: {
        type: Number,
        default: 100000,
      },
      maxSelections: {
        type: Number,
        default: 100,
      },
      defaultMaxWinning: {
        type: Number,
        default: 500000,
      },
    },
    casino: {
      minBet: {
        type: Number,
        default: 1,
      },
      maxBet: {
        type: Number,
        default: 10000,
      },
      targetRTP: {
        dice: { type: Number, default: 98 },
        crash: { type: Number, default: 97 },
        mines: { type: Number, default: 95 },
        plinko: { type: Number, default: 96 },
      },
    },
    commissions: {
      agentCommission: {
        type: Number,
        default: 5,
      },
      subAgentCommission: {
        type: Number,
        default: 3,
      },
      operatorShare: {
        type: Number,
        default: 15,
      },
      platformFee: {
        type: Number,
        default: 2,
      },
    },
    regulatory: {
      requireKYC: {
        type: Boolean,
        default: true,
      },
      kycThreshold: {
        type: Number,
        default: 1000,
      },
      mandatoryRealityCheck: {
        type: Boolean,
        default: true,
      },
      realityCheckInterval: {
        type: Number,
        default: 60,
      },
      enableAuditLog: {
        type: Boolean,
        default: true,
      },
      enableFraudDetection: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.SystemConfig || mongoose.model("SystemConfig", SystemConfigSchema)
