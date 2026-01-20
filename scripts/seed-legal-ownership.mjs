import mongoose from "mongoose"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = resolve(__dirname, "../.env.local")

let MONGODB_URI = "mongodb://localhost:27017/your-database"

try {
  const envFile = readFileSync(envPath, "utf8")
  const envVars = envFile.split("\n")
  for (const line of envVars) {
    if (line.startsWith("MONGODB_URI=")) {
      MONGODB_URI = line.split("=").slice(1).join("=").trim()
      MONGODB_URI = MONGODB_URI.replace(/^["']|["']$/g, "")
      
      const [baseUri, queryString] = MONGODB_URI.split("?")
      if (queryString) {
        const validParams = queryString
          .split("&")
          .filter(param => {
            const [key, value] = param.split("=")
            return key && value && value.trim() !== ""
          })
        
        MONGODB_URI = validParams.length > 0 
          ? `${baseUri}?${validParams.join("&")}`
          : baseUri
      }
      
      console.log("Cleaned MongoDB URI loaded from .env.local")
      break
    }
  }
} catch (error) {
  console.warn("Could not read .env.local, using default MongoDB URI")
}

// Define schemas inline
const legalEntitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['corporation', 'llc', 'partnership', 'sole_proprietorship', 'other'],
    required: true 
  },
  registrationNumber: { type: String, required: true },
  registrationCountry: { type: String, required: true },
  registrationDate: { type: Date, required: true },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  taxId: String,
  vatNumber: String,
  beneficialOwners: [{
    name: { type: String, required: true },
    ownershipPercentage: { type: Number, required: true },
    nationality: String,
    dateOfBirth: Date,
    address: String,
    idDocument: {
      type: { type: String },
      number: String,
      issuingCountry: String,
      expiryDate: Date
    }
  }],
  directors: [{
    name: { type: String, required: true },
    role: String,
    appointmentDate: Date,
    nationality: String
  }],
  licenses: [{
    type: { type: String, required: true },
    number: { type: String, required: true },
    issuingAuthority: String,
    country: String,
    issueDate: Date,
    expiryDate: Date,
    status: { 
      type: String, 
      enum: ['active', 'pending', 'expired', 'suspended'],
      default: 'active'
    }
  }],
  softwareOwnership: {
    ownershipType: {
      type: String,
      enum: ['owned', 'licensed', 'partnership'],
      required: true
    },
    declaration: String,
    documents: [{
      name: String,
      url: String,
      uploadDate: Date
    }]
  },
  contactInformation: {
    email: String,
    phone: String,
    website: String,
    primaryContact: {
      name: String,
      role: String,
      email: String,
      phone: String
    }
  },
  isPlatformOwner: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'under_review'],
    default: 'active'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDate: Date,
  verificationNotes: String,
  documents: [{
    type: { type: String },
    name: String,
    url: String,
    uploadDate: Date
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false })

const tenantAgreementSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tenantName: { type: String, required: true },
  legalEntityId: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalEntity', required: true },
  agreementNumber: { type: String, required: true, unique: true },
  agreementType: {
    type: String,
    enum: ['white_label', 'revenue_share', 'fixed_fee', 'hybrid'],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: Date,
  autoRenew: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['draft', 'active', 'suspended', 'terminated', 'expired'],
    default: 'draft'
  },
  financialTerms: {
    revenueSharePercentage: Number,
    fixedFeeAmount: Number,
    currency: { type: String, default: 'USD' },
    paymentFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually']
    },
    minimumGuarantee: Number
  },
  responsibilityMatrix: {
    payments: {
      responsible: {
        type: String,
        enum: ['platform', 'tenant', 'shared'],
        required: true
      },
      description: String,
      platformDuties: [String],
      tenantDuties: [String]
    },
    aml: {
      responsible: {
        type: String,
        enum: ['platform', 'tenant', 'shared'],
        required: true
      },
      description: String,
      platformDuties: [String],
      tenantDuties: [String]
    },
    customerSupport: {
      responsible: {
        type: String,
        enum: ['platform', 'tenant', 'shared'],
        required: true
      },
      description: String,
      platformDuties: [String],
      tenantDuties: [String]
    },
    riskManagement: {
      responsible: {
        type: String,
        enum: ['platform', 'tenant', 'shared'],
        required: true
      },
      description: String,
      platformDuties: [String],
      tenantDuties: [String]
    },
    compliance: {
      responsible: {
        type: String,
        enum: ['platform', 'tenant', 'shared'],
        required: true
      },
      description: String,
      platformDuties: [String],
      tenantDuties: [String]
    },
    technology: {
      responsible: {
        type: String,
        enum: ['platform', 'tenant', 'shared'],
        required: true
      },
      description: String,
      platformDuties: [String],
      tenantDuties: [String]
    }
  },
  termsAndConditions: String,
  specialClauses: [String],
  documents: [{
    type: { type: String },
    name: String,
    url: String,
    uploadDate: Date,
    signedBy: String,
    signedDate: Date
  }],
  signatureStatus: {
    platformSigned: { type: Boolean, default: false },
    platformSignedBy: String,
    platformSignedDate: Date,
    tenantSigned: { type: Boolean, default: false },
    tenantSignedBy: String,
    tenantSignedDate: Date
  },
  terminationClause: {
    noticePeriodDays: Number,
    conditions: [String]
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false })

async function seedLegalOwnership() {
  try {
    console.log("🔄 Connecting to database...")
    await mongoose.connect(MONGODB_URI)
    console.log("✅ Connected to MongoDB\n")

    const LegalEntity = mongoose.model("LegalEntity", legalEntitySchema)
    const TenantAgreement = mongoose.model("TenantAgreement", tenantAgreementSchema)
    const Tenant = mongoose.model("Tenant", new mongoose.Schema({}, { strict: false }))

    // Check if platform owner already exists
    const existingPlatform = await LegalEntity.findOne({ isPlatformOwner: true })
    
    if (existingPlatform) {
      console.log("⚠️  Platform legal entity already exists!")
      console.log(`   Entity: ${existingPlatform.name}`)
      console.log(`   Registration: ${existingPlatform.registrationNumber}`)
      console.log("\n💡 You can update it from the admin panel at /s/legal-ownership\n")
      await mongoose.connection.close()
      return
    }

    console.log("🏢 Creating Platform Legal Entity...\n")

    // Create platform legal entity
    const platformEntity = await LegalEntity.create({
      name: "[YOUR COMPANY NAME]",
      type: "corporation",
      registrationNumber: "[YOUR-REG-NUMBER]",
      registrationCountry: "[COUNTRY]",
      registrationDate: new Date("2020-01-01"),
      businessAddress: {
        street: "[YOUR STREET ADDRESS]",
        city: "[CITY]",
        state: "[STATE/PROVINCE]",
        postalCode: "[POSTAL CODE]",
        country: "[COUNTRY]"
      },
      taxId: "[YOUR-TAX-ID]",
      vatNumber: "[YOUR-VAT-NUMBER]",
      beneficialOwners: [{
        name: "[OWNER NAME]",
        ownershipPercentage: 100,
        nationality: "[NATIONALITY]",
        dateOfBirth: new Date("1980-01-01"),
        address: "[OWNER ADDRESS]",
        idDocument: {
          type: "passport",
          number: "[ID-NUMBER]",
          issuingCountry: "[COUNTRY]",
          expiryDate: new Date("2030-12-31")
        }
      }],
      directors: [{
        name: "[DIRECTOR NAME]",
        role: "CEO",
        appointmentDate: new Date("2020-01-01"),
        nationality: "[NATIONALITY]"
      }],
      licenses: [{
        type: "gaming_license",
        number: "[LICENSE-NUMBER]",
        issuingAuthority: "[AUTHORITY NAME]",
        country: "[COUNTRY]",
        issueDate: new Date("2020-06-01"),
        expiryDate: new Date("2025-06-01"),
        status: "active"
      }],
      softwareOwnership: {
        ownershipType: "owned",
        declaration: "We, [YOUR COMPANY NAME], hereby declare that we are the sole owners and operators of this betting platform software. The software has been developed in-house and all intellectual property rights belong to us. We maintain full control over the codebase, infrastructure, and operations.",
        documents: []
      },
      contactInformation: {
        email: "legal@yourcompany.com",
        phone: "+1234567890",
        website: "https://yourcompany.com",
        primaryContact: {
          name: "[CONTACT NAME]",
          role: "Legal Officer",
          email: "legal@yourcompany.com",
          phone: "+1234567890"
        }
      },
      isPlatformOwner: true,
      status: "active",
      verificationStatus: "verified",
      verificationDate: new Date(),
      verificationNotes: "Platform owner entity - initial setup"
    })

    console.log("✅ Platform Legal Entity Created!")
    console.log(`   ID: ${platformEntity._id}`)
    console.log(`   Name: ${platformEntity.name}`)
    console.log(`   Registration: ${platformEntity.registrationNumber}\n`)

    // Get first tenant to create sample agreement
    const firstTenant = await Tenant.findOne()
    
    if (firstTenant) {
      console.log("📄 Creating Sample Tenant Agreement...\n")

      const sampleAgreement = await TenantAgreement.create({
        tenantId: firstTenant._id,
        tenantName: firstTenant.name,
        legalEntityId: platformEntity._id,
        agreementNumber: `AGR-${Date.now()}`,
        agreementType: "white_label",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        autoRenew: true,
        status: "active",
        financialTerms: {
          revenueSharePercentage: 15,
          fixedFeeAmount: 0,
          currency: "USD",
          paymentFrequency: "monthly",
          minimumGuarantee: 1000
        },
        responsibilityMatrix: {
          payments: {
            responsible: "platform",
            description: "Payment processing and financial transactions",
            platformDuties: [
              "Maintain payment gateway integrations",
              "Process deposits and withdrawals",
              "Handle payment disputes",
              "Ensure PCI-DSS compliance"
            ],
            tenantDuties: [
              "Provide payment method preferences",
              "Support customer payment inquiries"
            ]
          },
          aml: {
            responsible: "shared",
            description: "Anti-Money Laundering compliance and monitoring",
            platformDuties: [
              "Implement AML monitoring systems",
              "Conduct transaction monitoring",
              "File suspicious activity reports (SARs)",
              "Maintain AML policies and procedures"
            ],
            tenantDuties: [
              "Verify customer identity (KYC)",
              "Report suspicious customer behavior",
              "Maintain customer due diligence records"
            ]
          },
          customerSupport: {
            responsible: "tenant",
            description: "Customer service and support operations",
            platformDuties: [
              "Provide technical support tools",
              "Handle platform-level technical issues"
            ],
            tenantDuties: [
              "Provide first-line customer support",
              "Handle customer complaints",
              "Manage customer communications",
              "Maintain support documentation"
            ]
          },
          riskManagement: {
            responsible: "shared",
            description: "Risk assessment and fraud prevention",
            platformDuties: [
              "Implement fraud detection systems",
              "Monitor betting patterns",
              "Set platform-wide risk limits",
              "Provide risk management tools"
            ],
            tenantDuties: [
              "Monitor customer betting behavior",
              "Report unusual activities",
              "Implement customer limits",
              "Review high-value transactions"
            ]
          },
          compliance: {
            responsible: "platform",
            description: "Regulatory compliance and licensing",
            platformDuties: [
              "Maintain gaming licenses",
              "Ensure regulatory compliance",
              "Submit regulatory reports",
              "Handle regulatory audits",
              "Update terms and conditions"
            ],
            tenantDuties: [
              "Comply with platform policies",
              "Report compliance issues",
              "Assist with audits when required"
            ]
          },
          technology: {
            responsible: "platform",
            description: "Software development and infrastructure",
            platformDuties: [
              "Maintain platform software",
              "Ensure system uptime and availability",
              "Implement security updates",
              "Provide API access",
              "Handle data backups"
            ],
            tenantDuties: [
              "Report technical issues",
              "Test new features in sandbox",
              "Provide content (logos, branding)"
            ]
          }
        },
        termsAndConditions: "This agreement is governed by the laws of [JURISDICTION]. Both parties agree to the terms outlined in this agreement and the responsibility matrix defined herein.",
        specialClauses: [
          "Platform owns all software and intellectual property",
          "Tenant is licensed to use the platform under white-label agreement",
          "Either party may terminate with 30 days written notice",
          "All customer data remains property of the platform"
        ],
        signatureStatus: {
          platformSigned: true,
          platformSignedBy: "[PLATFORM REPRESENTATIVE]",
          platformSignedDate: new Date(),
          tenantSigned: false
        },
        terminationClause: {
          noticePeriodDays: 30,
          conditions: [
            "Either party may terminate with 30 days written notice",
            "Immediate termination for breach of agreement",
            "Outstanding financial obligations must be settled"
          ]
        },
        notes: "Sample agreement created during initial setup. Please review and update as needed."
      })

      console.log("✅ Sample Tenant Agreement Created!")
      console.log(`   Agreement Number: ${sampleAgreement.agreementNumber}`)
      console.log(`   Tenant: ${sampleAgreement.tenantName}`)
      console.log(`   Type: ${sampleAgreement.agreementType}\n`)
    }

    console.log("=" .repeat(60))
    console.log("🎉 LEGAL OWNERSHIP SYSTEM INITIALIZED!")
    console.log("=" .repeat(60))
    console.log("\n⚠️  IMPORTANT NEXT STEPS:\n")
    console.log("1. Go to Super Admin Panel → Legal & Ownership")
    console.log("   URL: http://localhost:3000/s/legal-ownership\n")
    console.log("2. Update the platform legal entity with REAL information:")
    console.log("   - Company name and registration details")
    console.log("   - Beneficial owners information")
    console.log("   - Directors and licenses")
    console.log("   - Contact information\n")
    console.log("3. Create agreements for all your tenants\n")
    console.log("4. Export reports when needed for regulators\n")
    console.log("📖 Read the full documentation at:")
    console.log("   docs/LEGAL_OWNERSHIP_TRACEABILITY.md\n")

    await mongoose.connection.close()
    console.log("✅ Database connection closed\n")
    process.exit(0)

  } catch (error) {
    console.error("❌ Error seeding legal ownership data:", error)
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
    }
    process.exit(1)
  }
}

seedLegalOwnership()
