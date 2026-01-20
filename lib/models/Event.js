import mongoose from "mongoose"

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
      index: true,
    },
    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "League",
      required: true,
      index: true,
    },
    // Teams/Participants
    homeTeam: {
      name: { type: String, required: true },
      logo: { type: String, default: "" },
      score: { type: Number, default: null },
    },
    awayTeam: {
      name: { type: String, required: true },
      logo: { type: String, default: "" },
      score: { type: Number, default: null },
    },
    // Event timing
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
    },
    // Event status
    status: {
      type: String,
      enum: [
        "scheduled", // Not started
        "live", // In progress
        "halftime", // Half time break
        "finished", // Completed
        "postponed", // Delayed
        "cancelled", // Cancelled
        "suspended", // Temporarily suspended
      ],
      default: "scheduled",
      index: true,
    },
    // Live match info
    liveInfo: {
      minute: { type: Number, default: 0 },
      period: { type: String, default: "" },
      isBreak: { type: Boolean, default: false },
    },
    // Is this event featured
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Is betting allowed
    isBettingOpen: {
      type: Boolean,
      default: true,
    },
    odds: {
      home: { type: Number, default: 0 },
      draw: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },
    betBoost: {
      enabled: { type: Boolean, default: false },
      originalOdds: { type: Number, default: 0 },
      boostedOdds: { type: Number, default: 0 },
      conditions: [{ type: String }], // e.g., ["Both Teams to Score", "Over 2.5 Goals"]
      placedBets: { type: Number, default: 0 },
    },
    markets: {
      overUnder: {
        line: { type: Number, default: 2.5 },
        over: { type: Number, default: 0 },
        under: { type: Number, default: 0 },
      },
      bothTeamsScore: {
        yes: { type: Number, default: 0 },
        no: { type: Number, default: 0 },
      },
      doubleChance: {
        homeOrDraw: { type: Number, default: 0 },
        homeOrAway: { type: Number, default: 0 },
        drawOrAway: { type: Number, default: 0 },
      },
    },
    // External provider ID
    externalId: {
      type: String,
      index: true,
    },
    // Metadata
    metadata: {
      venue: String,
      referee: String,
      weather: String,
      attendance: Number,
      isSandbox: { type: Boolean, default: false, index: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for common queries
EventSchema.index({ sportId: 1, status: 1, startTime: 1 })
EventSchema.index({ leagueId: 1, status: 1, startTime: 1 })
EventSchema.index({ status: 1, startTime: 1 })
EventSchema.index({ isFeatured: 1, status: 1 })
EventSchema.index({ "metadata.isSandbox": 1, status: 1 })

export default mongoose.models.Event || mongoose.model("Event", EventSchema)
