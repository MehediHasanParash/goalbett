import dbConnect from "@/lib/mongodb"
import AuditLog from "@/lib/models/AuditLog"

/**
 * Log an audit event using the new AuditLog schema
 * @param {Object} options
 * @param {string} options.action - The action performed (must be valid enum value)
 * @param {Object} options.actor - Actor information
 * @param {string} options.actor.userId - User ID who performed the action
 * @param {string} options.actor.email - Email of the actor
 * @param {string} options.actor.role - Role of the actor
 * @param {string} options.actor.ipAddress - IP address (optional)
 * @param {Object} options.resource - Resource information
 * @param {string} options.resource.type - Type of resource
 * @param {string} options.resource.id - ID of the resource
 * @param {string} options.resource.name - Name of the resource (optional)
 * @param {string} options.tenant_id - Tenant ID
 * @param {Object} options.changes - Changes made (optional)
 * @param {Object} options.metadata - Additional metadata (optional)
 * @param {string} options.severity - Severity level (optional)
 */
export async function logAudit({
  action,
  actor,
  resource,
  tenant_id,
  changes = {},
  metadata = {},
  severity = "medium",
  // Legacy support - map old fields to new schema
  performedBy,
  targetType,
  targetId,
  details = {},
  ip = null,
}) {
  try {
    await dbConnect()

    const auditData = {
      action: action || "config.update", // Default to a valid action
      tenant_id: tenant_id || details?.tenantId || "000000000000000000000000",
      actor: actor || {
        userId: performedBy || "000000000000000000000000",
        email: details?.email || "system@system.local",
        role: details?.role || "system",
        ipAddress: ip,
      },
      resource: resource || {
        type: mapTargetTypeToResourceType(targetType) || "config",
        id: targetId?.toString() || "unknown",
        name: details?.name,
      },
      changes: changes?.before || changes?.after ? changes : { before: null, after: details },
      metadata: {
        ...metadata,
        success: true,
      },
      severity,
    }

    const auditLog = await AuditLog.create(auditData)
    return auditLog
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break main functionality
    console.error("[v0] Audit log error:", error)
    return null
  }
}

function mapTargetTypeToResourceType(targetType) {
  const typeMap = {
    bet: "bet",
    player: "player",
    user: "user",
    agent: "agent",
    subagent: "subagent",
    wallet: "wallet",
    transaction: "transaction",
    game: "game",
    tenant: "tenant",
    config: "config",
  }
  return typeMap[targetType?.toLowerCase()] || "config"
}

export function mapActionToEnum(action) {
  const actionMap = {
    bet_placed: "bet.manual_settle", // No bet.place in enum, use closest
    bet_void: "bet.void",
    bet_cancel: "bet.cancel",
    bet_settle: "bet.manual_settle",
    player_suspend: "player.suspend",
    player_enable: "player.enable",
    user_create: "user.create",
    user_update: "user.update",
    wallet_credit: "wallet.credit",
    wallet_debit: "wallet.debit",
    login: "auth.login",
    logout: "auth.logout",
  }
  return actionMap[action] || action
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs({
  action,
  performedBy,
  targetType,
  targetId,
  startDate,
  endDate,
  limit = 50,
  skip = 0,
  tenant_id,
} = {}) {
  try {
    await dbConnect()

    const query = {}

    if (action) query.action = action
    if (performedBy) query["actor.userId"] = performedBy
    if (targetType) query["resource.type"] = mapTargetTypeToResourceType(targetType)
    if (targetId) query["resource.id"] = targetId
    if (tenant_id) query.tenant_id = tenant_id

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()

    const total = await AuditLog.countDocuments(query)

    return { logs, total }
  } catch (error) {
    console.error("[v0] Get audit logs error:", error)
    return { logs: [], total: 0 }
  }
}
