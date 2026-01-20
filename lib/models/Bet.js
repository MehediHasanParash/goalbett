import mongoose from "mongoose"

if (mongoose.models.Bet) {
  delete mongoose.models.Bet
}

const BetSchema = new mongoose.Schema(
  {
    // Bet ticket reference number
    ticketNumber: {
      type: String,
      required: false,
      unique: true,
      index: true,
    },
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
    // Bet type
    type: {
      type: String,
      enum: ["single", "multiple", "system"],
      required: true,
    },
    // Stake amount
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
    // Total odds (combined for multiples)
    totalOdds: {
      type: Number,
      required: true,
    },
    // Potential winnings
    potentialWin: {
      type: Number,
      required: true,
    },
    // Actual winnings (after settlement)
    actualWin: {
      type: Number,
      default: 0,
    },
    // Bet selections
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
          required: false,
        },
        // Snapshot of selection at time of bet
        eventName: { type: String, required: true },
        marketName: { type: String, required: true },
        selectionName: { type: String, required: true },
        odds: { type: Number, required: true },
        // Selection status
        status: {
          type: String,
          enum: ["pending", "won", "lost", "void", "cashout"],
          default: "pending",
        },
        // Result details
        result: {
          homeScore: Number,
          awayScore: Number,
          settledAt: Date,
        },
      },
    ],
    // Overall bet status
    status: {
      type: String,
      enum: ["pending", "won", "lost", "void", "cashout", "partial"],
      default: "pending",
      index: true,
    },
    // Cashout info
    cashout: {
      isAvailable: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      cashedOutAt: Date,
    },
    // Bonus used
    bonusUsed: {
      type: Number,
      default: 0,
    },
    // IP and device info for security
    placedFrom: {
      ip: String,
      userAgent: String,
      device: String,
    },
    // Settlement info
    settledAt: {
      type: Date,
    },
    settledBy: {
      type: String,
      enum: ["auto", "manual"],
    },
    // Agent who placed bet (if applicable)
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    slipShared: {
      type: Boolean,
      default: false,
    },
    slipShares: [
      {
        platform: {
          type: String,
          enum: ["whatsapp", "telegram", "messenger", "sms", "clipboard", "other"],
          required: true,
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        sharedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    lastSlipShareAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Generate unique ticket number
BetSchema.pre("save", async function (next) {
  if (!this.ticketNumber) {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.ticketNumber = `BET-${timestamp}-${random}`
  }
  next()
})

// Indexes
BetSchema.index({ tenantId: 1, status: 1, createdAt: -1 })
BetSchema.index({ userId: 1, status: 1, createdAt: -1 })
BetSchema.index({ "selections.eventId": 1 })

export default mongoose.model("Bet", BetSchema)
