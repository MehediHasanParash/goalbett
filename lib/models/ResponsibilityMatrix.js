import mongoose from "mongoose"

const ResponsibilityMatrixSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
      index: true,
    },
    // Payment Processing Responsibilities
    payments: {
      primaryResponsible: {
        type: String,
        enum: ["platform_provider", "tenant", "third_party", "shared"],
        required: true,
      },
      details: {
        processor: String,
        processorDetails: {
          name: String,
          registrationNumber: String,
          contact: String,
        },
        merchantAccount: {
          owner: String,
          accountNumber: String,
          provider: String,
        },
        paymentMethods: [String],
        settlementAccount: {
          owner: String,
          bankName: String,
          accountNumber: String,
        },
      },
      responsibilities: [
        {
          task: String,
          responsible: String,
          description: String,
        },
      ],
    },
    // AML/KYC Responsibilities
    aml: {
      primaryResponsible: {
        type: String,
        enum: ["platform_provider", "tenant", "third_party", "shared"],
        required: true,
      },
      details: {
        officer: {
          name: String,
          title: String,
          email: String,
          phone: String,
          certifications: [String],
        },
        policies: [
          {
            policyName: String,
            documentUrl: String,
            effectiveDate: Date,
            reviewDate: Date,
          },
        ],
        screening: {
          provider: String,
          frequency: String,
          databases: [String],
        },
        reportingAuthority: {
          name: String,
          jurisdiction: String,
          filingMethod: String,
        },
      },
      responsibilities: [
        {
          task: String,
          responsible: String,
          description: String,
        },
      ],
    },
    // Customer Support Responsibilities
    support: {
      primaryResponsible: {
        type: String,
        enum: ["platform_provider", "tenant", "third_party", "shared"],
        required: true,
      },
      details: {
        supportTeam: {
          size: Number,
          location: String,
          manager: {
            name: String,
            email: String,
            phone: String,
          },
        },
        channels: [
          {
            type: {
              type: String,
              enum: ["email", "phone", "chat", "ticket_system", "social_media"],
            },
            contact: String,
            hours: String,
            languages: [String],
          },
        ],
        sla: {
          firstResponseTime: String,
          resolutionTime: String,
          escalationProcess: String,
        },
      },
      responsibilities: [
        {
          task: String,
          responsible: String,
          description: String,
        },
      ],
    },
    // Risk Management Responsibilities
    risk: {
      primaryResponsible: {
        type: String,
        enum: ["platform_provider", "tenant", "third_party", "shared"],
        required: true,
      },
      details: {
        riskOfficer: {
          name: String,
          title: String,
          email: String,
          phone: String,
          qualifications: [String],
        },
        riskFramework: {
          documentUrl: String,
          lastReview: Date,
          nextReview: Date,
        },
        monitoring: {
          tools: [String],
          frequency: String,
          reportingTo: String,
        },
        limits: [
          {
            type: String,
            value: Number,
            currency: String,
            period: String,
          },
        ],
      },
      responsibilities: [
        {
          task: String,
          responsible: String,
          description: String,
        },
      ],
    },
    // Data Protection & Privacy
    dataProtection: {
      primaryResponsible: {
        type: String,
        enum: ["platform_provider", "tenant", "third_party", "shared"],
        required: true,
      },
      details: {
        dataProtectionOfficer: {
          name: String,
          email: String,
          phone: String,
        },
        dataLocation: {
          primary: String,
          backup: String,
          jurisdiction: String,
        },
        policies: [
          {
            policyName: String,
            documentUrl: String,
            effectiveDate: Date,
          },
        ],
        compliance: [
          {
            regulation: String,
            registrationNumber: String,
            expiryDate: Date,
          },
        ],
      },
      responsibilities: [
        {
          task: String,
          responsible: String,
          description: String,
        },
      ],
    },
    // Regulatory Compliance & Reporting
    regulatory: {
      primaryResponsible: {
        type: String,
        enum: ["platform_provider", "tenant", "third_party", "shared"],
        required: true,
      },
      details: {
        complianceOfficer: {
          name: String,
          title: String,
          email: String,
          phone: String,
        },
        regulators: [
          {
            name: String,
            jurisdiction: String,
            licenseNumber: String,
            reportingFrequency: String,
            contactPerson: String,
          },
        ],
        reportingSchedule: [
          {
            reportType: String,
            frequency: String,
            dueDate: String,
            responsible: String,
          },
        ],
      },
      responsibilities: [
        {
          task: String,
          responsible: String,
          description: String,
        },
      ],
    },
    // Technology & Infrastructure
    technology: {
      primaryResponsible: {
        type: String,
        enum: ["platform_provider", "tenant", "third_party", "shared"],
        required: true,
      },
      details: {
        infrastructure: {
          hosting: String,
          provider: String,
          location: String,
        },
        security: {
          certifications: [String],
          lastAudit: Date,
          nextAudit: Date,
        },
        maintenance: {
          schedule: String,
          responsible: String,
          notificationProcess: String,
        },
      },
      responsibilities: [
        {
          task: String,
          responsible: String,
          description: String,
        },
      ],
    },
    // Financial Management
    financial: {
      primaryResponsible: {
        type: String,
        enum: ["platform_provider", "tenant", "third_party", "shared"],
        required: true,
      },
      details: {
        accounting: {
          system: String,
          responsible: String,
          auditor: String,
        },
        treasury: {
          responsible: String,
          banks: [String],
          signatories: [String],
        },
        taxation: {
          registrations: [
            {
              type: String,
              number: String,
              jurisdiction: String,
            },
          ],
          filingSchedule: String,
          responsible: String,
        },
      },
      responsibilities: [
        {
          task: String,
          responsible: String,
          description: String,
        },
      ],
    },
    // Document Management
    documents: [
      {
        type: {
          type: String,
          enum: ["responsibility_chart", "process_flow", "contact_list", "escalation_matrix", "sop"],
        },
        name: String,
        documentUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // Last Review
    lastReviewDate: Date,
    nextReviewDate: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Status
    status: {
      type: String,
      enum: ["draft", "active", "under_review", "outdated"],
      default: "draft",
    },
    // Approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
  },
  {
    timestamps: true,
  },
)

ResponsibilityMatrixSchema.index({ tenantId: 1 })
ResponsibilityMatrixSchema.index({ status: 1 })

export default mongoose.models.ResponsibilityMatrix ||
  mongoose.model("ResponsibilityMatrix", ResponsibilityMatrixSchema)
