import mongoose from "mongoose"

if (mongoose.models.Jackpot) {
  delete mongoose.models.Jackpot
}

const JackpotSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["weekly", "daily", "special", "mega", "mini"],
      default: "weekly",
    },

    // Status
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },

    // Pool Configuration
    pool: {
      current: { type: Number, default: 0 },
      initial: { type: Number, default: 0 },
      guaranteed: { type: Number, default: 0 }, // Guaranteed minimum pool
      contributionRate: { type: Number, default: 5 }, // % of bets that go to pool
    },

    // Entry Configuration
    entry: {
      fee: { type: Number, default: 0 }, // Entry fee (0 = free)
      minBet: { type: Number, default: 10 }, // Minimum bet to participate
      maxBet: { type: Number, default: null },
      currency: { type: String, default: "USD" },
    },

    // Matches/Events for prediction
    matches: [
      {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        homeTeam: { type: String, required: true },
        awayTeam: { type: String, required: true },
        league: { type: String },
        startTime: { type: Date },
        result: {
          home: { type: Number, default: null },
          away: { type: Number, default: null },
        },
        status: {
          type: String,
          enum: ["pending", "live", "finished", "cancelled"],
          default: "pending",
        },
      },
    ],

    // Participants
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String },
        predictions: [
          {
            matchIndex: { type: Number },
            prediction: { type: String, enum: ["home", "draw", "away"] },
          },
        ],
        correctPredictions: { type: Number, default: 0 },
        entryTime: { type: Date, default: Date.now },
        prize: { type: Number, default: 0 },
        rank: { type: Number, default: null },
      },
    ],

    // Prize Distribution
    prizes: {
      distribution: [{ position: { type: Number }, percentage: { type: Number } }],
      winners: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          username: { type: String },
          position: { type: Number },
          correctPredictions: { type: Number },
          prize: { type: Number },
          paid: { type: Boolean, default: false },
        },
      ],
    },

    // Rollover Configuration
    rollover: {
      enabled: { type: Boolean, default: true },
      count: { type: Number, default: 0 },
      minWinners: { type: Number, default: 1 }, // Min winners to not rollover
      minCorrect: { type: Number, default: null }, // Min correct predictions to win
    },

    // Schedule
    schedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      drawDate: { type: Date },
      entryDeadline: { type: Date },
    },

    // Tenant assignment
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = platform-wide
    },

    // Stats
    stats: {
      totalParticipants: { type: Number, default: 0 },
      totalEntries: { type: Number, default: 0 },
      totalPrizesPaid: { type: Number, default: 0 },
      averageCorrect: { type: Number, default: 0 },
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
JackpotSchema.index({ status: 1 })
JackpotSchema.index({ type: 1, status: 1 })
JackpotSchema.index({ tenantId: 1, status: 1 })
JackpotSchema.index({ "schedule.startDate": 1, "schedule.endDate": 1 })
JackpotSchema.index({ "participants.userId": 1 })

export default mongoose.model("Jackpot", JackpotSchema)
