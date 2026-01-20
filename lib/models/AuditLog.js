import mongoose from "mongoose"

const AuditLogSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
      ipAddress: String,
      userAgent: String,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Tenant actions
        "tenant.create",
        "tenant.update",
        "tenant.suspend",
        "tenant.enable",
        "tenant.delete",
        "tenant.config.update",
        // User actions
        "user.create",
        "user.update",
        "user.delete",
        "user.suspend",
        "user.enable",
        // Player actions
        "player.create",
        "player.update",
        "player.delete",
        "player.suspend",
        "player.enable",
        // Agent actions
        "agent.create",
        "agent.update",
        "agent.delete",
        "subagent.create",
        "subagent.update",
        "subagent.delete",
        // Wallet actions
        "wallet.credit",
        "wallet.debit",
        "wallet.adjust",
        "wallet.transfer",
        // Config actions
        "config.odds.update",
        "config.tax.update",
        "config.payment.update",
        "config.risk.update",
        "config.module.enable",
        "config.module.disable",
        // Security actions
        "auth.login",
        "auth.logout",
        "auth.failed",
        "permissions.update",
        // Game actions
        "game.create",
        "game.update",
        "game.delete",
        // Bet actions
        "bet.cancel",
        "bet.void",
        "bet.manual_settle",
      ],
    },
    resource: {
      type: {
        type: String,
        required: true,
        enum: ["tenant", "user", "player", "agent", "subagent", "wallet", "transaction", "bet", "game", "config"],
      },
      id: {
        type: String,
        required: true,
      },
      name: String,
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      endpoint: String,
      method: String,
      duration: Number,
      success: {
        type: Boolean,
        default: true,
      },
      errorMessage: String,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    tags: [String],
    immutable: {
      type: Boolean,
      default: true,
    },
    checksum: {
      type: String,
      index: true,
    },
    previousChecksum: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

AuditLogSchema.pre("save", async function (next) {
  if (this.isNew) {
    const crypto = await import("crypto")

    const previousLog = await this.constructor.findOne({}).sort({ createdAt: -1 }).select("checksum")
    this.previousChecksum = previousLog?.checksum || "GENESIS"

    const content = JSON.stringify({
      tenant_id: this.tenant_id,
      actor: this.actor,
      action: this.action,
      resource: this.resource,
      changes: this.changes,
      previousChecksum: this.previousChecksum,
      timestamp: this.createdAt || new Date(),
    })

    this.checksum = crypto.createHash("sha256").update(content).digest("hex")
  }
  next()
})

AuditLogSchema.pre("findOneAndUpdate", (next) => {
  const error = new Error("IMMUTABLE_RECORD: Audit logs cannot be modified")
  error.code = "AUDIT_IMMUTABLE"
  next(error)
})

AuditLogSchema.pre("updateOne", (next) => {
  const error = new Error("IMMUTABLE_RECORD: Audit logs cannot be modified")
  error.code = "AUDIT_IMMUTABLE"
  next(error)
})

AuditLogSchema.pre("updateMany", (next) => {
  const error = new Error("IMMUTABLE_RECORD: Audit logs cannot be modified")
  error.code = "AUDIT_IMMUTABLE"
  next(error)
})

AuditLogSchema.index({ tenant_id: 1, createdAt: -1 })
AuditLogSchema.index({ "actor.userId": 1, createdAt: -1 })
AuditLogSchema.index({ action: 1, createdAt: -1 })
AuditLogSchema.index({ "resource.type": 1, "resource.id": 1 })
AuditLogSchema.index({ severity: 1, createdAt: -1 })

AuditLogSchema.statics.log = async function (data) {
  try {
    return await this.create(data)
  } catch (error) {
    console.error("[AuditLog] Failed to create log:", error)
    return null
  }
}

AuditLogSchema.statics.query = async function (filters = {}, options = {}) {
  const {
    tenant_id,
    userId,
    action,
    resource_type,
    resource_id,
    severity,
    startDate,
    endDate,
    limit = 100,
    skip = 0,
  } = filters

  const query = {}

  if (tenant_id) query.tenant_id = tenant_id
  if (userId) query["actor.userId"] = userId
  if (action) query.action = action
  if (resource_type) query["resource.type"] = resource_type
  if (resource_id) query["resource.id"] = resource_id
  if (severity) query.severity = severity

  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("actor.userId", "fullName email role")
    .lean()
}

AuditLogSchema.statics.verifyIntegrity = async function (startDate, endDate) {
  const crypto = await import("crypto")

  const logs = await this.find({
    createdAt: { $gte: startDate, $lte: endDate },
  }).sort({ createdAt: 1 })

  const results = {
    total: logs.length,
    valid: 0,
    invalid: 0,
    brokenChain: [],
  }

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]

    const content = JSON.stringify({
      tenant_id: log.tenant_id,
      actor: log.actor,
      action: log.action,
      resource: log.resource,
      changes: log.changes,
      previousChecksum: log.previousChecksum,
      timestamp: log.createdAt,
    })

    const calculatedChecksum = crypto.createHash("sha256").update(content).digest("hex")

    if (calculatedChecksum === log.checksum) {
      results.valid++
    } else {
      results.invalid++
      results.brokenChain.push({
        logId: log._id,
        expectedChecksum: calculatedChecksum,
        actualChecksum: log.checksum,
        createdAt: log.createdAt,
      })
    }
  }

  return results
}

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema)
