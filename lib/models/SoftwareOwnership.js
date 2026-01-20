import mongoose from "mongoose"

const SoftwareOwnershipSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    // Software Information
    softwareName: {
      type: String,
      required: true,
      default: "GoalBett Betting Platform",
    },
    version: {
      type: String,
      required: true,
    },
    // Ownership Declaration
    ownershipType: {
      type: String,
      enum: ["proprietary", "licensed", "white_label", "saas", "open_source"],
      required: true,
    },
    // Copyright Information
    copyright: {
      holder: { type: String, required: true },
      year: { type: Number, required: true },
      registrationNumber: String,
      jurisdiction: String,
    },
    // License Agreement
    licenseAgreement: {
      licenseType: {
        type: String,
        enum: ["perpetual", "subscription", "usage_based", "revenue_share"],
      },
      licensor: String,
      licensee: String,
      agreementDate: Date,
      expiryDate: Date,
      documentUrl: String,
      terms: String,
    },
    // Intellectual Property
    intellectualProperty: {
      patents: [
        {
          number: String,
          title: String,
          jurisdiction: String,
          filingDate: Date,
          grantDate: Date,
          status: String,
        },
      ],
      trademarks: [
        {
          name: String,
          registrationNumber: String,
          jurisdiction: String,
          registrationDate: Date,
          expiryDate: Date,
          classes: [String],
        },
      ],
      copyrights: [
        {
          work: String,
          registrationNumber: String,
          registrationDate: Date,
          owner: String,
        },
      ],
    },
    // Third-Party Components
    thirdPartyComponents: [
      {
        name: { type: String, required: true },
        version: String,
        license: { type: String, required: true },
        licenseUrl: String,
        purpose: String,
        vendor: String,
      },
    ],
    // Source Code
    sourceCode: {
      repository: String,
      accessType: {
        type: String,
        enum: ["private", "restricted", "public"],
        default: "private",
      },
      escrowStatus: {
        type: String,
        enum: ["not_applicable", "in_escrow", "not_in_escrow"],
        default: "not_applicable",
      },
      escrowAgent: String,
      escrowAgreementUrl: String,
    },
    // Compliance Documents
    documents: [
      {
        type: {
          type: String,
          enum: [
            "license_agreement",
            "copyright_certificate",
            "patent_document",
            "trademark_certificate",
            "source_code_escrow",
            "third_party_licenses",
            "ownership_declaration",
          ],
          required: true,
        },
        name: String,
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        expiryDate: Date,
      },
    ],
    // Verification
    verificationStatus: {
      type: String,
      enum: ["not_verified", "pending", "verified", "rejected"],
      default: "not_verified",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    // Declaration Statement
    declarationStatement: {
      type: String,
      default:
        "We hereby declare that the software platform is legally owned/licensed and complies with all applicable intellectual property laws and regulations.",
    },
    declarationDate: Date,
    declarationBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

SoftwareOwnershipSchema.index({ tenantId: 1, version: 1 })
SoftwareOwnershipSchema.index({ verificationStatus: 1 })

export default mongoose.models.SoftwareOwnership || mongoose.model("SoftwareOwnership", SoftwareOwnershipSchema)
