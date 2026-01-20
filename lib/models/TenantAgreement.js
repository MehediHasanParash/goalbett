import mongoose from "mongoose"

const TenantAgreementSchema = new mongoose.Schema(
  {
    // Parties
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    legalEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LegalEntity",
      required: true,
    },

    // Agreement Details
    agreementType: {
      type: String,
      enum: [
        "platform_license",
        "white_label",
        "revenue_share",
        "software_license",
        "service_agreement",
        "partnership",
        "other",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    referenceNumber: {
      type: String,
      unique: true,
      index: true,
    },

    // Terms
    effectiveDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    autoRenewal: {
      enabled: { type: Boolean, default: false },
      renewalPeriod: { type: Number }, // in months
      noticePeriod: { type: Number }, // days before expiry to notify
    },

    // Financial Terms
    financialTerms: {
      revenueSharePercentage: { type: Number, min: 0, max: 100 },
      fixedFee: { type: Number },
      currency: { type: String, default: "USD" },
      paymentFrequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually", "one_time"],
      },
      paymentTerms: { type: String },
    },

    // Responsibilities
    responsibilities: {
      payments: {
        type: String,
        enum: ["platform", "tenant", "shared"],
        default: "tenant",
      },
      aml_kyc: {
        type: String,
        enum: ["platform", "tenant", "shared"],
        default: "tenant",
      },
      customer_support: {
        type: String,
        enum: ["platform", "tenant", "shared"],
        default: "tenant",
      },
      risk_management: {
        type: String,
        enum: ["platform", "tenant", "shared"],
        default: "shared",
      },
      compliance_reporting: {
        type: String,
        enum: ["platform", "tenant", "shared"],
        default: "shared",
      },
      technical_support: {
        type: String,
        enum: ["platform", "tenant", "shared"],
        default: "platform",
      },
      data_protection: {
        type: String,
        enum: ["platform", "tenant", "shared"],
        default: "shared",
      },
    },

    // Signatories
    signatories: [
      {
        party: { type: String, enum: ["platform", "tenant"], required: true },
        name: { type: String, required: true },
        title: { type: String },
        email: { type: String },
        signedAt: { type: Date },
        ipAddress: { type: String },
        signatureUrl: { type: String },
      },
    ],

    // Document
    documentUrl: {
      type: String,
    },
    documentHash: {
      type: String, // SHA-256 hash for document integrity
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "pending_signature", "active", "expired", "terminated", "suspended"],
      default: "draft",
    },

    // Amendments
    amendments: [
      {
        amendmentNumber: { type: Number },
        description: { type: String },
        effectiveDate: { type: Date },
        documentUrl: { type: String },
        amendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amendedAt: { type: Date, default: Date.now },
      },
    ],

    // Termination
    termination: {
      terminatedAt: { type: Date },
      terminatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String },
      noticeGiven: { type: Date },
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: [
      {
        text: { type: String },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
)

TenantAgreementSchema.index({ tenantId: 1, status: 1 })
TenantAgreementSchema.index({ referenceNumber: 1 })
TenantAgreementSchema.index({ effectiveDate: 1, expiryDate: 1 })

export default mongoose.models.TenantAgreement || mongoose.model("TenantAgreement", TenantAgreementSchema)
