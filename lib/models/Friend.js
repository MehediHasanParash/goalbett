import mongoose from "mongoose"

const FriendshipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
)

FriendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true })

const ReferralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "registered", "deposited", "rewarded"],
      default: "pending",
    },
    reward: {
      referrerAmount: { type: Number, default: 0 },
      referredAmount: { type: Number, default: 0 },
      claimed: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
)

export const Friendship = mongoose.models.Friendship || mongoose.model("Friendship", FriendshipSchema)
export const Referral = mongoose.models.Referral || mongoose.model("Referral", ReferralSchema)
