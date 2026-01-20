import mongoose from "mongoose"

/**
 * Casino Round Model
 *
 * Records every casino game round for:
 * - Audit trail
 * - RTP tracking
 * - Provably fair verification
 * - Regulatory reporting
 */
const CasinoRoundSchema = new mongoose.Schema(
  {
    // Unique round identifier
    roundId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roundNumber: {
      type: String,
      required: false,
      unique: true,
      index: true,
    },
    // Player info
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
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: false,
    },
    // Game info
    gameType: {
      type: String,
      enum: ["dice", "crash", "mines", "plinko", "slots", "roulette"],
      required: true,
      index: true,
    },
    gameName: {
      type: String,
      required: true,
    },
    // Bet details
    stake: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    // Game parameters (varies by game type)
    gameParams: {
      // Dice
      targetNumber: Number,
      rollType: String, // "over" or "under"
      // Crash
      autoCashout: Number,
      // Mines
      minesCount: Number,
      tilesRevealed: [Number],
      // Plinko
      risk: String,
      rows: Number,
      // Generic
      multiplier: Number,
    },
    // Outcome
    outcome: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    multiplier: {
      type: Number,
      required: true,
      default: 0,
    },
    payout: {
      type: Number,
      required: true,
      default: 0,
    },
    profit: {
      type: Number,
      required: true,
      default: 0,
    },
    // Round status
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled", "error"],
      default: "pending",
      index: true,
    },
    // Provably Fair
    provablyFair: {
      serverSeed: { type: String, required: true },
      serverSeedHash: { type: String, required: true }, // Shown before game
      clientSeed: { type: String, required: true },
      nonce: { type: Number, required: true },
      combinedSeed: { type: String, required: true },
      serverSeedRevealed: { type: Boolean, default: true },
    },
    // RTP tracking
    rtp: {
      theoreticalRtp: { type: Number, default: 0.96 }, // 96% default
      actualRtp: Number, // Calculated post-game
    },
    // Ledger reference
    ledgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerEntry",
    },
    // Timestamps
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Generate unique round number
CasinoRoundSchema.pre("save", async function (next) {
  if (!this.roundId) {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.roundId = `CASINO-${this.gameType?.toUpperCase() || "GAME"}-${timestamp}-${random}`
  }
  if (!this.roundNumber) {
    this.roundNumber = this.roundId
  }
  next()
})

// Indexes
CasinoRoundSchema.index({ userId: 1, gameType: 1, createdAt: -1 })
CasinoRoundSchema.index({ tenantId: 1, gameType: 1, status: 1 })
CasinoRoundSchema.index({ "provablyFair.serverSeedHash": 1 })

export default mongoose.models.CasinoRound || mongoose.model("CasinoRound", CasinoRoundSchema)
