import mongoose from "mongoose"

const PlayerKYCSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    documents: {
      identity: {
        type: {
          type: String,
          enum: ["passport", "national_id", "drivers_license"],
        },
        frontImage: String,
        backImage: String,
        number: String,
        expiryDate: Date,
        status: {
          type: String,
          enum: ["not_submitted", "pending", "approved", "rejected"],
          default: "not_submitted",
        },
        rejectionReason: String,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reviewedAt: Date,
      },
      proofOfAddress: {
        type: {
          type: String,
          enum: ["utility_bill", "bank_statement", "rental_agreement"],
        },
        image: String,
        status: {
          type: String,
          enum: ["not_submitted", "pending", "approved", "rejected"],
          default: "not_submitted",
        },
        rejectionReason: String,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reviewedAt: Date,
      },
      selfie: {
        image: String,
        status: {
          type: String,
          enum: ["not_submitted", "pending", "approved", "rejected"],
          default: "not_submitted",
        },
        rejectionReason: String,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reviewedAt: Date,
      },
    },
    personalInfo: {
      dateOfBirth: Date,
      nationality: String,
      address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
    },
    overallStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected", "requires_update"],
      default: "not_submitted",
    },
    verificationLevel: {
      type: String,
      enum: ["level_0", "level_1", "level_2", "level_3"],
      default: "level_0",
    },
    notes: [
      {
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
)

PlayerKYCSchema.index({ userId: 1, tenant_id: 1 })
PlayerKYCSchema.index({ overallStatus: 1 })

export default mongoose.models.PlayerKYC || mongoose.model("PlayerKYC", PlayerKYCSchema)
