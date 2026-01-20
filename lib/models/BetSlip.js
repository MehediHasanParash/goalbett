import mongoose from "mongoose"

// BetSlip is a temporary storage for user's current selections before placing bet
const BetSlipSchema = new mongoose.Schema(
  {
    // Can be user ID or session ID for guests
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    // Current selections
    selections: [
      {
        eventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
          required: true,
        },
        marketId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Market",
          required: true,
        },
        selectionIndex: {
          type: Number,
          required: true,
        },
        // Cached data for display
        eventName: String,
        marketName: String,
        selectionName: String,
        odds: Number,
        startTime: Date,
        // Has odds changed since added?
        oddsChanged: { type: Boolean, default: false },
        previousOdds: Number,
      },
    ],
    // Bet type preference
    betType: {
      type: String,
      enum: ["single", "multiple", "system"],
      default: "single",
    },
    // Stake amounts (for singles, each selection can have different stake)
    stakes: {
      type: Map,
      of: Number,
      default: {},
    },
    // Total stake for multiples
    totalStake: {
      type: Number,
      default: 0,
    },
    // Expires after 24 hours of inactivity
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// TTL index to auto-delete expired betslips
BetSlipSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.BetSlip || mongoose.model("BetSlip", BetSlipSchema)
