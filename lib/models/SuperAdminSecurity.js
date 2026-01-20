import mongoose from "mongoose"

const SuperAdminSecuritySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // MFA/TOTP Configuration
    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false }, // TOTP secret, hidden by default
      backupCodes: [
        {
          code: { type: String, select: false },
          used: { type: Boolean, default: false },
          usedAt: { type: Date },
        },
      ],
      verifiedAt: { type: Date },
      lastUsedAt: { type: Date },
    },
    // IP Allowlist - stored in database for easy management
    ipAllowlist: [
      {
        ip: { type: String, required: true },
        label: { type: String }, // e.g., "Office", "Home", "VPN"
        addedAt: { type: Date, default: Date.now },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        lastAccessAt: { type: Date },
        isActive: { type: Boolean, default: true },
      },
    ],
    // Session tracking for security
    activeSessions: [
      {
        sessionId: { type: String },
        ip: { type: String },
        userAgent: { type: String },
        createdAt: { type: Date, default: Date.now },
        lastActivityAt: { type: Date },
        mfaVerified: { type: Boolean, default: false },
      },
    ],
    // Security settings
    settings: {
      requireMfaForAllRoutes: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 60 },
      maxActiveSessions: { type: Number, default: 3 },
      allowUnknownIPs: { type: Boolean, default: true }, // If false, only allowlisted IPs can access
      notifyOnNewIP: { type: Boolean, default: true },
    },
    // Audit trail
    securityEvents: [
      {
        event: {
          type: String,
          enum: [
            "mfa_enabled",
            "mfa_disabled",
            "mfa_verified",
            "ip_added",
            "ip_removed",
            "login_blocked",
            "session_created",
            "session_terminated",
          ],
        },
        ip: { type: String },
        userAgent: { type: String },
        timestamp: { type: Date, default: Date.now },
        details: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index for faster IP lookups
SuperAdminSecuritySchema.index({ "ipAllowlist.ip": 1 })

export default mongoose.models.SuperAdminSecurity || mongoose.model("SuperAdminSecurity", SuperAdminSecuritySchema)
