import mongoose from "mongoose"

/**
 * System Account Model
 *
 * Represents internal system accounts where deductions (tax, charity, etc.) are held.
 * These accounts provide clear separation and tracking of funds for compliance.
 *
 * CRITICAL:
 * - Every deduction goes to a specific system account
 * - System accounts have running balances
 * - All movements are logged in ledger
 * - Reports can show how much tax/charity collected
 */

const SystemAccountSchema = new mongoose.Schema(
  {
    // Account identification
    accountName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    accountType: {
      type: String,
      required: true,
      enum: [
        "tax_payable",
        "charity_payable",
        "vat_payable",
        "excise_payable",
        "social_responsibility",
        "gaming_levy",
        "operator_revenue",
        "platform_commission",
        "other_payable",
      ],
      index: true,
    },

    // Tenant-specific (if applicable)
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },

    // Country-specific (if applicable)
    countryCode: {
      type: String,
      uppercase: true,
      default: null,
      index: true,
    },

    // Balance tracking
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "USD",
    },

    // Status
    status: {
      type: String,
      enum: ["active", "suspended", "closed"],
      default: "active",
      index: true,
    },

    // Destination info (where funds go when paid out)
    destinationInfo: {
      bankName: {
        type: String,
        default: "",
      },
      accountNumber: {
        type: String,
        default: "",
      },
      routingNumber: {
        type: String,
        default: "",
      },
      beneficiaryName: {
        type: String,
        default: "",
      },
      swiftCode: {
        type: String,
        default: "",
      },
      notes: {
        type: String,
        default: "",
      },
    },

    // Settlement tracking
    lastSettledAt: {
      type: Date,
      default: null,
    },
    totalSettled: {
      type: Number,
      default: 0,
    },

    // Metadata
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
SystemAccountSchema.index({ tenantId: 1, accountType: 1 })
SystemAccountSchema.index({ countryCode: 1, accountType: 1 })

// Methods
SystemAccountSchema.statics.getAccount = async function (accountType, tenantId = null, countryCode = null) {
  const query = { accountType, status: "active" }
  if (tenantId) query.tenantId = tenantId
  if (countryCode) query.countryCode = countryCode

  let account = await this.findOne(query)

  // If not found and no specific filters, try global account
  if (!account && (tenantId || countryCode)) {
    account = await this.findOne({ accountType, status: "active", tenantId: null, countryCode: null })
  }

  return account
}

SystemAccountSchema.statics.createDefaultAccounts = async function (tenantId, currency, createdBy) {
  const defaultAccounts = [
    {
      accountName: `Tax Payable - ${tenantId}`,
      accountType: "tax_payable",
      tenantId,
      currency,
      description: "Account for all tax deductions",
      createdBy,
    },
    {
      accountName: `Charity Payable - ${tenantId}`,
      accountType: "charity_payable",
      tenantId,
      currency,
      description: "Account for charity contributions",
      createdBy,
    },
    {
      accountName: `VAT Payable - ${tenantId}`,
      accountType: "vat_payable",
      tenantId,
      currency,
      description: "Account for VAT collections",
      createdBy,
    },
    {
      accountName: `Excise Duty Payable - ${tenantId}`,
      accountType: "excise_payable",
      tenantId,
      currency,
      description: "Account for excise duty",
      createdBy,
    },
    {
      accountName: `Operator Revenue - ${tenantId}`,
      accountType: "operator_revenue",
      tenantId,
      currency,
      description: "Account for operator's net revenue",
      createdBy,
    },
  ]

  const created = []
  for (const accountData of defaultAccounts) {
    const existing = await this.findOne({
      accountType: accountData.accountType,
      tenantId: accountData.tenantId,
    })

    if (!existing) {
      const account = await this.create(accountData)
      created.push(account)
    }
  }

  return created
}

SystemAccountSchema.methods.credit = async function (amount, ledgerEntryId) {
  this.balance += amount
  await this.save()
  return this
}

SystemAccountSchema.methods.debit = async function (amount, ledgerEntryId) {
  if (this.balance < amount) {
    throw new Error(`Insufficient balance in ${this.accountName}`)
  }
  this.balance -= amount
  await this.save()
  return this
}

export default mongoose.models.SystemAccount || mongoose.model("SystemAccount", SystemAccountSchema)
