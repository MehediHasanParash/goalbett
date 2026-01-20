import mongoose from "mongoose"
import crypto from "crypto"

// Delete cached model to ensure fresh schema
delete mongoose.models.Voucher

const VoucherSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be at least 1"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["unused", "redeemed", "expired", "cancelled"],
      default: "unused",
      index: true,
    },
    // Redemption info
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    redeemedAt: {
      type: Date,
    },
    // Expiry
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    // Batch info for bulk generation
    batchId: {
      type: String,
      index: true,
    },
    // Optional prefix for custom branding
    prefix: {
      type: String,
      default: "VCH",
      uppercase: true,
    },
    // Notes/description
    description: {
      type: String,
    },
    // Commission earned by agent on redemption
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    commissionPaid: {
      type: Number,
      default: 0,
    },
    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
)

// Compound indexes
VoucherSchema.index({ tenantId: 1, code: 1 })
VoucherSchema.index({ tenantId: 1, status: 1 })
VoucherSchema.index({ agentId: 1, status: 1 })
VoucherSchema.index({ tenantId: 1, agentId: 1, createdAt: -1 })

// Static method to generate secure voucher code
VoucherSchema.statics.generateCode = (prefix = "VCH") => {
  // Generate cryptographically secure random string
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase()
  // Format: PREFIX-XXXX-XXXX (e.g., VCH-9K2L-P4W1)
  const formatted = `${prefix}-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`
  return formatted
}

// Static method to generate batch of codes
VoucherSchema.statics.generateBatchCodes = async function (count, prefix = "VCH") {
  const codes = new Set()
  while (codes.size < count) {
    codes.add(this.generateCode(prefix))
  }
  return Array.from(codes)
}

VoucherSchema.statics.markExpiredVouchers = async function () {
  const result = await this.updateMany(
    {
      status: "unused",
      expiresAt: { $lt: new Date() },
    },
    {
      $set: { status: "expired" },
    },
  )
  return result.modifiedCount
}

// Instance method to check if voucher is valid for redemption
VoucherSchema.methods.isValid = function () {
  if (this.status !== "unused") {
    return { valid: false, reason: `Voucher is ${this.status}` }
  }
  if (new Date() > this.expiresAt) {
    return { valid: false, reason: "Voucher has expired" }
  }
  return { valid: true }
}

// Instance method to redeem voucher
VoucherSchema.methods.redeem = async function (playerId) {
  const validity = this.isValid()
  if (!validity.valid) {
    throw new Error(validity.reason)
  }

  this.status = "redeemed"
  this.redeemedBy = playerId
  this.redeemedAt = new Date()
  await this.save()
  return this
}

export default mongoose.models.Voucher || mongoose.model("Voucher", VoucherSchema)
