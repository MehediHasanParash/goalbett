import mongoose from "mongoose"

if (mongoose.models.ApiKey) {
  delete mongoose.models.ApiKey
}

const ApiKeySchema = new mongoose.Schema(
  {
    // Key identification
    keyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },

    keyType: {
      type: String,
      enum: ["tenant", "global", "external", "partner"],
      default: "tenant",
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: false,
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    partnerInfo: {
      organizationName: { type: String, default: "" },
      contactEmail: { type: String, default: "" },
      contactPhone: { type: String, default: "" },
      website: { type: String, default: "" },
      notes: { type: String, default: "" },
    },

    allowedTenants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
      },
    ],

    // Environment
    environment: {
      type: String,
      enum: ["sandbox", "production"],
      default: "sandbox",
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "revoked", "expired"],
      default: "active",
      index: true,
    },

    // Rate Limiting
    rateLimit: {
      requestsPerMinute: { type: Number, default: 60 },
      requestsPerHour: { type: Number, default: 1000 },
      requestsPerDay: { type: Number, default: 10000 },
      burstLimit: { type: Number, default: 100 },
    },

    // IP Whitelisting
    ipWhitelist: {
      enabled: { type: Boolean, default: false },
      addresses: [{ type: String }],
    },

    // API Scopes
    scopes: [
      {
        type: String,
        enum: [
          "read:bets",
          "read:players",
          "read:transactions",
          "read:events",
          "read:odds",
          "read:reports",
          "read:wallets",
          "write:bets",
          "write:players",
          "write:transactions",
          "write:wallets",
          "admin:full",
          "admin:reports",
          "webhooks:receive",
          "webhooks:manage",
          "global:read",
          "global:write",
          "global:admin",
        ],
      },
    ],

    // Usage quota
    quota: {
      monthlyLimit: { type: Number, default: 100000 },
      currentUsage: { type: Number, default: 0 },
      resetDate: { type: Date },
    },

    // Metadata
    lastUsedAt: { type: Date },
    lastUsedIp: { type: String },
    expiresAt: { type: Date },

    // Usage stats
    usageStats: {
      totalRequests: { type: Number, default: 0 },
      successfulRequests: { type: Number, default: 0 },
      failedRequests: { type: Number, default: 0 },
      lastHourRequests: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
)

// Index for quota reset
ApiKeySchema.index({ "quota.resetDate": 1 })

ApiKeySchema.pre("validate", function (next) {
  // For non-tenant keys, explicitly set tenantId to undefined to skip validation
  if (this.keyType && this.keyType !== "tenant") {
    this.tenantId = undefined
  }
  next()
})

// Check if key is valid
ApiKeySchema.methods.isValid = function () {
  if (this.status !== "active") return false
  if (this.expiresAt && new Date() > this.expiresAt) return false
  return true
}

// Check if IP is allowed
ApiKeySchema.methods.isIpAllowed = function (ip) {
  if (!this.ipWhitelist.enabled) return true
  if (this.ipWhitelist.addresses.length === 0) return true
  return this.ipWhitelist.addresses.some((allowed) => {
    if (allowed.includes("/")) {
      return ip.startsWith(allowed.split("/")[0].split(".").slice(0, 3).join("."))
    }
    return allowed === ip
  })
}

// Check if scope is allowed
ApiKeySchema.methods.hasScope = function (requiredScope) {
  if (this.scopes.includes("admin:full")) return true
  return this.scopes.includes(requiredScope)
}

// Check rate limit
ApiKeySchema.methods.isWithinRateLimit = async function (currentMinuteCount, currentHourCount, currentDayCount) {
  if (currentMinuteCount >= this.rateLimit.requestsPerMinute) return false
  if (currentHourCount >= this.rateLimit.requestsPerHour) return false
  if (currentDayCount >= this.rateLimit.requestsPerDay) return false
  return true
}

// Check quota
ApiKeySchema.methods.isWithinQuota = function () {
  return this.quota.currentUsage < this.quota.monthlyLimit
}

ApiKeySchema.methods.canAccessTenant = function (tenantId) {
  // Tenant-specific keys can only access their tenant
  if (this.keyType === "tenant") {
    return this.tenantId && this.tenantId.toString() === tenantId.toString()
  }

  // Global/external/partner keys - check allowedTenants if set
  if (this.allowedTenants && this.allowedTenants.length > 0) {
    return this.allowedTenants.some((id) => id.toString() === tenantId.toString())
  }

  // If no allowedTenants specified, can access all
  return true
}

const ApiKey = mongoose.model("ApiKey", ApiKeySchema)

export default ApiKey
