import mongoose from "mongoose"

const MarketSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    // Market type (1X2, Over/Under, Both Teams to Score, etc.)
    type: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    // Market category for grouping
    category: {
      type: String,
      enum: ["main", "goals", "corners", "cards", "players", "specials", "halftime", "combo"],
      default: "main",
    },
    // Selections/Outcomes
    selections: [
      {
        name: { type: String, required: true }, // e.g., "Home", "Draw", "Away"
        odds: { type: Number, required: true }, // e.g., 1.85
        status: {
          type: String,
          enum: ["open", "suspended", "settled", "void"],
          default: "open",
        },
        result: {
          type: String,
          enum: ["pending", "won", "lost", "void", "half_won", "half_lost"],
          default: "pending",
        },
        // Line/Handicap value if applicable
        line: { type: Number },
        // External selection ID
        externalId: { type: String },
      },
    ],
    // Market status
    status: {
      type: String,
      enum: ["open", "suspended", "closed", "settled"],
      default: "open",
      index: true,
    },
    // Display order
    order: {
      type: Number,
      default: 0,
    },
    // Is this the main/primary market
    isMain: {
      type: Boolean,
      default: false,
    },
    // External ID
    externalId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
MarketSchema.index({ eventId: 1, type: 1 })
MarketSchema.index({ eventId: 1, status: 1, order: 1 })

export default mongoose.models.Market || mongoose.model("Market", MarketSchema)
