import mongoose from "mongoose"

const SyndicateAlertSchema = new mongoose.Schema(
  {
    eventId: { type: String },
    eventName: { type: String },
    odds: { type: Number },
    stake: { type: Number },
    totalAmount: { type: Number },
    matchedBets: [
      {
        betId: String,
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        playerName: String,
        ip: String,
        device: String,
      },
    ],
    status: {
      type: String,
      enum: ["active", "investigating", "resolved", "dismissed"],
      default: "active",
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    resolution: { type: String },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
  },
  { timestamps: true },
)

export default mongoose.models.SyndicateAlert || mongoose.model("SyndicateAlert", SyndicateAlertSchema)
