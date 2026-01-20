import mongoose from "mongoose"

const ComplianceReportSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    type: {
      type: String,
      enum: [
        "monthly_ggr",
        "player_activity",
        "tax_withholding",
        "suspicious_activity_report",
        "kyc_summary",
        "aml_summary",
        "transaction_summary",
        "regulatory_filing",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "generated", "submitted", "approved", "rejected"],
      default: "pending",
    },
    period: {
      startDate: Date,
      endDate: Date,
    },
    dueDate: Date,
    generatedAt: Date,
    submittedAt: Date,
    fileUrl: String,
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
  },
  {
    timestamps: true,
  },
)

ComplianceReportSchema.index({ type: 1, status: 1 })
ComplianceReportSchema.index({ dueDate: 1 })

export default mongoose.models.ComplianceReport || mongoose.model("ComplianceReport", ComplianceReportSchema)
