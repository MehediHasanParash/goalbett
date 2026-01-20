import AuditLog from "@/lib/models/AuditLog"

// Action severity mapping
const SEVERITY_MAP = {
  // Critical actions
  "tenant.delete": "critical",
  "tenant.suspend": "critical",
  "user.delete": "critical",
  "wallet.adjust": "critical",
  "bet.manual_settle": "critical",
  "config.tax.update": "critical",

  // High severity
  "tenant.create": "high",
  "tenant.config.update": "high",
  "wallet.credit": "high",
  "wallet.debit": "high",
  "wallet.transfer": "high",
  "config.odds.update": "high",
  "config.payment.update": "high",
  "config.risk.update": "high",
  "permissions.update": "high",
  "bet.void": "high",
  "bet.cancel": "high",

  // Medium severity
  "tenant.update": "medium",
  "tenant.enable": "medium",
  "user.create": "medium",
  "user.update": "medium",
  "user.suspend": "medium",
  "user.enable": "medium",
  "config.module.enable": "medium",
  "config.module.disable": "medium",
  "game.create": "medium",
  "game.update": "medium",
  "game.delete": "medium",

  // Low severity
  "auth.login": "low",
  "auth.logout": "low",
  "auth.failed": "low",
}

// Extract client IP
export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) {
    return cfIp
  }

  // For local development
  try {
    const url = new URL(request.url)
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return "127.0.0.1"
    }
    return url.hostname
  } catch (e) {
    console.error("[v0] Failed to extract IP:", e)
  }

  return "unknown"
}

// Create audit log entry
export async function createAuditLog({
  tenant_id,
  actor,
  action,
  resource,
  changes = {},
  metadata = {},
  tags = [],
  request = null,
}) {
  try {
    console.log("[v0] Creating audit log:", { action, resource: resource.type })
    
    const { default: connectDB } = await import("@/lib/mongodb")
    await connectDB()
    
    const ipAddress = request ? getClientIp(request) : "unknown"
    const userAgent = request ? request.headers.get("user-agent") : undefined
    
    console.log("[v0] Audit log IP details:", {
      ipAddress,
      xForwardedFor: request?.headers.get("x-forwarded-for"),
      xRealIp: request?.headers.get("x-real-ip"),
      url: request?.url,
    })
    
    const auditData = {
      tenant_id,
      actor: {
        ...actor,
        ipAddress,
        userAgent,
      },
      action,
      resource,
      changes,
      metadata: {
        ...metadata,
        ipAddress, // Also store in metadata for easier frontend access
        userAgent,
        endpoint: request?.url,
        method: request?.method,
      },
      severity: SEVERITY_MAP[action] || "medium",
      tags,
    }

    const log = await AuditLog.log(auditData)
    console.log("[v0] Audit log created successfully:", log?._id, "IP:", ipAddress)
    return log
  } catch (error) {
    console.error("[v0] Failed to create audit log:", error)
    // Don't throw - audit logging should never break the main operation
  }
}

// Audit middleware wrapper for API routes
export function withAudit(handler, { action, resourceType, getResourceId, getTenantId }) {
  return async (request, context) => {
    const startTime = Date.now()
    let response
    let success = true
    let errorMessage = null
    let changes = {}

    try {
      // Execute the handler
      response = await handler(request, context)

      // Extract response data if JSON
      const responseClone = response.clone()
      try {
        const responseData = await responseClone.json()
        changes.after = responseData
      } catch (e) {
        // Not JSON or failed to parse
      }

      return response
    } catch (error) {
      success = false
      errorMessage = error.message
      throw error
    } finally {
      try {
        // Extract actor from request
        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (token) {
          const { verifyToken } = await import("@/lib/jwt")
          const decoded = verifyToken(token)

          if (decoded) {
            const tenant_id = getTenantId ? await getTenantId(request, context) : decoded.tenant_id
            const resourceId = getResourceId ? await getResourceId(request, context) : context?.params?.id

            await createAuditLog({
              tenant_id,
              actor: {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
              },
              action,
              resource: {
                type: resourceType,
                id: resourceId?.toString() || "unknown",
              },
              changes,
              metadata: {
                duration: Date.now() - startTime,
                success,
                errorMessage,
              },
              request,
            })
          }
        }
      } catch (auditError) {
        console.error("[AuditMiddleware] Audit logging failed:", auditError)
        // Don't throw - audit logging should never break the main operation
      }
    }
  }
}

// Helper to track changes
export function trackChanges(before, after) {
  return {
    before: before || null,
    after: after || null,
  }
}
