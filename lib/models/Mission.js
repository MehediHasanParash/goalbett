import mongoose from "mongoose"

const MissionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["daily", "weekly", "special", "achievement"],
      default: "daily",
    },
    category: {
      type: String,
      enum: ["betting", "casino", "social", "deposit", "loyalty"],
      default: "betting",
    },
    icon: {
      type: String,
      default: "trophy",
    },
    requirements: {
      type: {
        type: String,
        enum: [
          "bet_count",
          "bet_amount",
          "win_count",
          "win_amount",
          "deposit",
          "login_streak",
          "refer_friend",
          "play_casino",
        ],
      },
      target: Number,
      sportFilter: String, // Optional: filter by sport
    },
    reward: {
      type: {
        type: String,
        enum: ["cash", "bonus", "free_bet", "points", "badge"],
      },
      amount: Number,
      description: String,
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

// User's mission progress
const UserMissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mission",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    target: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "claimed", "expired"],
      default: "active",
    },
    completedAt: Date,
    claimedAt: Date,
    rewardAmount: Number,
    rewardType: String,
  },
  { timestamps: true },
)

UserMissionSchema.index({ userId: 1, missionId: 1 }, { unique: true })

export const Mission = mongoose.models.Mission || mongoose.model("Mission", MissionSchema)
export const UserMission = mongoose.models.UserMission || mongoose.model("UserMission", UserMissionSchema)
