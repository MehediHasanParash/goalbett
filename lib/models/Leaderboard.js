import mongoose from "mongoose"

const LeaderboardEntrySchema = new mongoose.Schema(
  {
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
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "alltime"],
      required: true,
    },
    periodKey: {
      type: String, // e.g., "2024-01-15" for daily, "2024-W03" for weekly
      required: true,
    },
    stats: {
      totalBets: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      totalWinnings: { type: Number, default: 0 },
      totalStaked: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      biggestWin: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      bestStreak: { type: Number, default: 0 },
    },
    rank: {
      type: Number,
      default: 0,
    },
    previousRank: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

LeaderboardEntrySchema.index({ tenantId: 1, period: 1, periodKey: 1, points: -1 })
LeaderboardEntrySchema.index({ userId: 1, period: 1, periodKey: 1 }, { unique: true })

export const LeaderboardEntry =
  mongoose.models.LeaderboardEntry || mongoose.model("LeaderboardEntry", LeaderboardEntrySchema)
