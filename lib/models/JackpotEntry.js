import mongoose from "mongoose"

if (mongoose.models.JackpotEntry) {
  delete mongoose.models.JackpotEntry
}

const JackpotEntrySchema = new mongoose.Schema(
  {
    jackpotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jackpot",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    predictions: [
      {
        matchIndex: { type: Number, required: true },
        prediction: {
          type: String,
          enum: ["home", "draw", "away"],
          required: true,
        },
        isCorrect: { type: Boolean, default: null },
      },
    ],
    correctPredictions: { type: Number, default: 0 },
    entryFee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "submitted", "evaluated", "winner", "loser"],
      default: "pending",
    },
    rank: { type: Number, default: null },
    prize: { type: Number, default: 0 },
    prizePaid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
)

// Indexes
JackpotEntrySchema.index({ jackpotId: 1, userId: 1 }, { unique: true })
JackpotEntrySchema.index({ jackpotId: 1, correctPredictions: -1 })
JackpotEntrySchema.index({ userId: 1 })
JackpotEntrySchema.index({ status: 1 })

export default mongoose.model("JackpotEntry", JackpotEntrySchema)
