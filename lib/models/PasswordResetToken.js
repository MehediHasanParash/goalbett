import mongoose from "mongoose"

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["player", "agent", "subagent", "tenant", "super_admin", "staff"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

passwordResetTokenSchema.statics.generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

passwordResetTokenSchema.statics.generateToken = function () {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

passwordResetTokenSchema.statics.createResetToken = async function (user, ipAddress, userAgent) {
  await this.deleteMany({ userId: user._id, usedAt: null })

  const otp = this.generateOTP()
  const token = this.generateToken()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  const resetToken = await this.create({
    userId: user._id,
    email: user.email,
    token,
    otp,
    expiresAt,
    ipAddress,
    userAgent,
    role: user.role,
  })

  return { otp, token, resetToken }
}

passwordResetTokenSchema.statics.verifyOTP = async function (email, otp) {
  const resetToken = await this.findOne({
    email: email.toLowerCase(),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })

  if (!resetToken) {
    return { valid: false, error: "No valid reset request found. Please request a new code." }
  }

  if (resetToken.attempts >= resetToken.maxAttempts) {
    await this.deleteOne({ _id: resetToken._id })
    return { valid: false, error: "Too many failed attempts. Please request a new code." }
  }

  if (resetToken.otp !== otp) {
    resetToken.attempts += 1
    await resetToken.save()
    const remaining = resetToken.maxAttempts - resetToken.attempts
    return {
      valid: false,
      error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    }
  }

  return { valid: true, resetToken }
}

passwordResetTokenSchema.statics.verifyToken = async function (token) {
  const resetToken = await this.findOne({
    token,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  })

  if (!resetToken) {
    return { valid: false, error: "Invalid or expired reset link." }
  }

  return { valid: true, resetToken }
}

passwordResetTokenSchema.statics.markAsUsed = async function (tokenId) {
  return this.findByIdAndUpdate(tokenId, { usedAt: new Date() })
}

passwordResetTokenSchema.statics.cleanupExpired = async function () {
  return this.deleteMany({
    $or: [{ expiresAt: { $lt: new Date() } }, { usedAt: { $ne: null } }],
  })
}

export const PasswordResetToken =
  mongoose.models.PasswordResetToken || mongoose.model("PasswordResetToken", passwordResetTokenSchema)

export default PasswordResetToken
