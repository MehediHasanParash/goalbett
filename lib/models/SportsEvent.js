import mongoose from "mongoose"

const SportsEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    sport: {
      type: String,
      required: true,
    },
    league: {
      type: String,
      required: true,
    },
    homeTeam: {
      type: String,
      required: true,
    },
    awayTeam: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "finished", "cancelled", "postponed"],
      default: "upcoming",
      index: true,
    },
    markets: [
      {
        marketId: {
          type: String,
          required: true,
        },
        marketName: {
          type: String,
          required: true,
        },
        marketType: {
          type: String,
          required: true,
        },
        odds: {
          type: Map,
          of: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["open", "closed", "settled", "void"],
          default: "open",
        },
        result: {
          type: String,
        },
      },
    ],
    result: {
      homeScore: Number,
      awayScore: Number,
      winner: String,
      period: String,
    },
    settledAt: {
      type: Date,
    },
    settledBy: {
      type: String,
      enum: ["auto", "manual", "system"],
    },
  },
  {
    timestamps: true,
  },
)

SportsEventSchema.pre("save", async function (next) {
  if (!this.eventId) {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    this.eventId = `EVT-${timestamp}-${random}`
  }
  next()
})

SportsEventSchema.index({ tenantId: 1, status: 1, eventDate: 1 })
SportsEventSchema.index({ sport: 1, league: 1 })

export default mongoose.models.SportsEvent || mongoose.model("SportsEvent", SportsEventSchema)
