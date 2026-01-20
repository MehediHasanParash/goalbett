import mongoose from "mongoose"

const CreditRequestSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ["self", "player"],
      default: "self",
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: ["bank", "mpesa", "orange", "crypto", "card", "airtime"],
      required: true,
    },
    paymentProof: {
      url: { type: String },
      filename: { type: String },
      uploadedAt: { type: Date },
    },
    transactionReference: {
      type: String,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

CreditRequestSchema.index({ agentId: 1, status: 1 })
CreditRequestSchema.index({ tenantId: 1, status: 1, createdAt: -1 })

const CreditRequest = mongoose.models.CreditRequest || mongoose.model("CreditRequest", CreditRequestSchema)

export default CreditRequest
