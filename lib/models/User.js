import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
      default: undefined,
      minlength: [3, "Username must be at least 3 characters"],
      match: [/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, underscores, and hyphens"],
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
      default: undefined,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: undefined,
      match: [
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
        "Please provide a valid phone number",
      ],
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: [
        "player",
        "agent",
        "sub_agent",
        "admin",
        "tenant_admin",
        "superadmin",
        "super_admin",
        // New staff roles
        "finance_manager",
        "general_manager",
        "support_manager",
        "support_agent",
      ],
      default: "player",
      required: true,
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    balance: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      default: "/placeholder-user.jpg",
    },
    avatarCloudinaryId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Agent/Sub-Agent specific fields
    parentAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    subAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    commissionRate: {
      type: Number,
      default: 0,
    },
    profitPercentage: {
      type: Number,
      default: 0,
    },
    // Agent Collateral & Credit Limit Fields
    collateralDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCredit: {
      type: Number,
      default: 0,
      min: 0,
    },
    collateralRatio: {
      type: Number,
      default: 1.0, // 1:1 ratio by default (credit = collateral)
      min: 0.1,
      max: 10,
    },
    // Viral Invite Link
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    inviteCount: {
      type: Number,
      default: 0,
    },
    // Admin specific fields
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    permissions: {
      // Finance permissions
      canViewDeposits: { type: Boolean, default: false },
      canViewWithdrawals: { type: Boolean, default: false },
      canApproveWithdrawals: { type: Boolean, default: false },
      canViewWalletLedger: { type: Boolean, default: false },
      canViewReconciliation: { type: Boolean, default: false },
      canExportFinanceReports: { type: Boolean, default: false },
      // General Manager permissions
      canCreateAgents: { type: Boolean, default: false },
      canSetCommissions: { type: Boolean, default: false },
      canCreateSupportUsers: { type: Boolean, default: false },
      canViewKPIs: { type: Boolean, default: false },
      canViewTenantSettings: { type: Boolean, default: false },
      // Support permissions
      canViewTickets: { type: Boolean, default: false },
      canViewPlayerProfile: { type: Boolean, default: false },
      canResetPasswords: { type: Boolean, default: false },
      canLockAccounts: { type: Boolean, default: false },
      canViewBetHistory: { type: Boolean, default: false },
      canViewTransactionHistory: { type: Boolean, default: false },
      canCreateNotes: { type: Boolean, default: false },
      canEscalateIssues: { type: Boolean, default: false },
      // Legacy permissions
      canManageFinancials: { type: Boolean, default: false },
      canManageCurrency: { type: Boolean, default: false },
      canManagePOS: { type: Boolean, default: false },
      canManageRouting: { type: Boolean, default: false },
      canManageAgents: { type: Boolean, default: false },
    },
    staffMetadata: {
      department: { type: String, trim: true },
      employeeId: { type: String, trim: true },
      hireDate: { type: Date },
      notes: { type: String },
    },
    // Player specific fields
    betHistory: [
      {
        betId: String,
        amount: Number,
        status: String,
        date: Date,
      },
    ],
    lastLogin: {
      type: Date,
    },
    metadata: {
      type: Map,
      of: String,
    },
    // Tenant configuration fields (legacy)
    tenantConfig: {
      type: new mongoose.Schema({
        businessName: { type: String, default: "" },
        domain: { type: String, default: "" },
        subdomain: { type: String, default: "" },
        currency: { type: String, default: "USD" },
        timezone: { type: String, default: "UTC" },
        primaryColor: { type: String, default: "#FFD700" },
        secondaryColor: { type: String, default: "#0A1A2F" },
        status: { type: String, enum: ["active", "pending", "inactive"], default: "active" },
        paymentProviders: {
          bank: {
            enabled: { type: Boolean, default: false },
            apiKey: { type: String, default: "" },
            secretKey: { type: String, default: "" },
          },
          mpesa: {
            enabled: { type: Boolean, default: false },
            apiKey: { type: String, default: "" },
            merchantId: { type: String, default: "" },
          },
          orange: {
            enabled: { type: Boolean, default: false },
            apiKey: { type: String, default: "" },
            merchantId: { type: String, default: "" },
          },
          card: {
            enabled: { type: Boolean, default: false },
            apiKey: { type: String, default: "" },
            secretKey: { type: String, default: "" },
          },
          airtime: {
            enabled: { type: Boolean, default: false },
            apiKey: { type: String, default: "" },
            apiSecret: { type: String, default: "" },
          },
          crypto: {
            enabled: { type: Boolean, default: false },
            apiKey: { type: String, default: "" },
            walletAddress: { type: String, default: "" },
          },
        },
        oddsProviders: {
          provider1: {
            enabled: { type: Boolean, default: false },
            apiKey: { type: String, default: "" },
            marginPercentage: { type: Number, default: 5 },
          },
          provider2: {
            enabled: { type: Boolean, default: false },
            apiKey: { type: String, default: "" },
            marginPercentage: { type: Number, default: 5 },
          },
        },
        enabledModules: {
          type: [String],
          default: [],
        },
        riskSettings: {
          maxBetPerSlip: { type: Number, default: 10000 },
          maxDailyExposure: { type: Number, default: 100000 },
          autoLimitThreshold: { type: Number, default: 50000 },
        },
      }),
      default: () => ({}),
    },
    kyc_status: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected", "verified"],
      default: "not_submitted",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "blocked", "pending_verification"],
      default: "active",
    },
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      purpose: { type: String, enum: ["password_reset", "phone_verification", "login"], select: false },
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false, // Don't include in queries by default for security
    },
    mfaBackupCodes: [
      {
        code: { type: String, required: true },
        used: { type: Boolean, default: false },
        usedAt: { type: Date },
      },
    ],
    mfaVerifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

UserSchema.index({ tenant_id: 1, role: 1 })
UserSchema.index({ tenant_id: 1, email: 1 })
UserSchema.index({ tenant_id: 1, phone: 1 })
UserSchema.index({ tenant_id: 1, username: 1 })

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (this.email === null || this.email === "" || this.email === undefined) {
    this.email = undefined
  }
  if (this.phone === null || this.phone === "" || this.phone === undefined) {
    this.phone = undefined
  }
  if (this.username === null || this.username === "" || this.username === undefined) {
    this.username = undefined
  }

  // Generate invite code for new agents
  if (this.isNew && ["agent", "sub_agent"].includes(this.role) && !this.inviteCode) {
    this.inviteCode = crypto.randomBytes(6).toString("hex").toUpperCase()
  }

  // Calculate credit limit based on collateral
  if (this.isModified("collateralDeposit") || this.isModified("collateralRatio")) {
    this.creditLimit = this.collateralDeposit * (this.collateralRatio || 1.0)
  }

  if (!this.isModified("password")) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const result = await bcrypt.compare(candidatePassword, this.password)
    return result
  } catch (error) {
    console.error("[v0] comparePassword error:", error)
    return false
  }
}

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

UserSchema.methods.canIssueCredit = function (amount) {
  const availableCredit = this.creditLimit - this.usedCredit
  return amount <= availableCredit
}

UserSchema.methods.useCredit = async function (amount) {
  if (!this.canIssueCredit(amount)) {
    throw new Error(`Insufficient credit. Available: ${this.creditLimit - this.usedCredit}, Requested: ${amount}`)
  }
  this.usedCredit += amount
  await this.save()
  return this.creditLimit - this.usedCredit
}

UserSchema.methods.releaseCredit = async function (amount) {
  this.usedCredit = Math.max(0, this.usedCredit - amount)
  await this.save()
  return this.creditLimit - this.usedCredit
}

// Generate OTP method
UserSchema.methods.generateOTP = async function (purpose = "password_reset") {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  this.otp = {
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    purpose,
  }
  await this.save()
  return code
}

// Verify OTP method
UserSchema.methods.verifyOTP = async function (code, purpose) {
  if (!this.otp || !this.otp.code) {
    return false
  }
  if (this.otp.purpose !== purpose) {
    return false
  }
  if (new Date() > this.otp.expiresAt) {
    return false
  }
  return this.otp.code === code
}

// Clear OTP method
UserSchema.methods.clearOTP = async function () {
  this.otp = undefined
  await this.save()
}

export default mongoose.models.User || mongoose.model("User", UserSchema)
