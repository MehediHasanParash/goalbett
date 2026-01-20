import mongoose from "mongoose"

const LegalEntitySchema = new mongoose.Schema(
  {
    // Platform/Tenant Link
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    // Basic Legal Information
    legalName: {
      type: String,
      required: [true, "Legal entity name is required"],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["corporation", "llc", "partnership", "sole_proprietorship", "other"],
      required: true,
    },
    incorporationDate: {
      type: Date,
      required: true,
    },
    jurisdiction: {
      country: { type: String, required: true },
      state: { type: String },
      city: { type: String },
    },

    // Registered Address
    registeredAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, required: true },
    },

    // Contact Information
    contact: {
      primaryEmail: { type: String, required: true },
      secondaryEmail: { type: String },
      phone: { type: String, required: true },
      website: { type: String },
    },

    // Beneficial Owners (UBO - Ultimate Beneficial Owners)
    beneficialOwners: [
      {
        name: { type: String, required: true },
        nationality: { type: String },
        ownershipPercentage: { type: Number, required: true, min: 0, max: 100 },
        idType: { type: String, enum: ["passport", "national_id", "drivers_license"] },
        idNumber: { type: String },
        address: { type: String },
        isPoliticallyExposed: { type: Boolean, default: false },
        verificationStatus: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        verifiedAt: { type: Date },
      },
    ],

    // Directors/Officers
    directors: [
      {
        name: { type: String, required: true },
        position: { type: String, required: true },
        appointmentDate: { type: Date },
        nationality: { type: String },
        idType: { type: String },
        idNumber: { type: String },
        isActive: { type: Boolean, default: true },
      },
    ],

    // Licensing Information
    licenses: [
      {
        licenseType: { type: String, required: true },
        licenseNumber: { type: String, required: true },
        issuingAuthority: { type: String, required: true },
        issueDate: { type: Date, required: true },
        expiryDate: { type: Date, required: true },
        jurisdiction: { type: String, required: true },
        status: { type: String, enum: ["active", "expired", "suspended", "revoked"], default: "active" },
        documentUrl: { type: String },
      },
    ],

    // Software Ownership Declaration
    softwareOwnership: {
      ownershipType: {
        type: String,
        enum: ["owned", "licensed", "white_label", "saas"],
        required: true,
      },
      providerName: { type: String },
      providerLegalEntity: { type: String },
      contractReference: { type: String },
      licenseAgreementUrl: { type: String },
      sourceCodeOwnership: { type: String, enum: ["owned", "third_party", "shared"] },
      declaration: { type: String },
      declaredBy: { type: String },
      declaredAt: { type: Date },
    },

    // Verification Status
    verificationStatus: {
      type: String,
      enum: ["draft", "submitted", "under_review", "verified", "rejected"],
      default: "draft",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },

    // Documents
    documents: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: [
            "certificate_of_incorporation",
            "tax_registration",
            "gaming_license",
            "proof_of_address",
            "shareholder_agreement",
            "director_id",
            "other",
          ],
          required: true,
        },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        expiryDate: { type: Date },
        verified: { type: Boolean, default: false },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    // Compliance Notes
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

LegalEntitySchema.index({ tenantId: 1, status: 1 })
LegalEntitySchema.index({ registrationNumber: 1 })
LegalEntitySchema.index({ "licenses.licenseNumber": 1 })

export default mongoose.models.LegalEntity || mongoose.model("LegalEntity", LegalEntitySchema)
