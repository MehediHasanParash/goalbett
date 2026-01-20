import crypto from "crypto"
import dbConnect from "./mongodb"
import ApiKey from "./models/ApiKey"
import ApiUsageLog from "./models/ApiUsageLog"

// Generate a new API key
export async function generateApiKey(prefix = "gb") {
  const key = `${prefix}_${crypto.randomBytes(32).toString("hex")}`
  const keyHash = crypto.createHash("sha256").update(key).digest("hex")
  const keyId = crypto.randomBytes(16).toString("hex")
  const keyPrefix = key.substring(0, 12) + "..."

  return {
    key, // Only returned once, not stored
    keyHash, // Stored in database
    keyId, // Unique identifier
    keyPrefix, // For display
  }
}

// Validate API key from request
export async function validateApiKey(request) {
  await dbConnect()

  const startTime = Date.now()
  const authHeader = request.headers.get("authorization")
  const apiKeyHeader = request.headers.get("x-api-key")

  const providedKey = apiKeyHeader || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null)

  if (!providedKey) {
    return {
      valid: false,
      error: "API key required",
      code: "MISSING_API_KEY",
    }
  }

  // Hash the provided key to compare with stored hash
  const keyHash = crypto.createHash("sha256").update(providedKey).digest("hex")

  const apiKey = await ApiKey.findOne({ keyHash }).populate("tenantId")

  if (!apiKey) {
    return {
      valid: false,
      error: "Invalid API key",
      code: "INVALID_API_KEY",
    }
  }

  // Check if key is active
  if (!apiKey.isValid()) {
    return {
      valid: false,
      error: `API key is ${apiKey.status}`,
      code: "API_KEY_INACTIVE",
      apiKey,
    }
  }

  // Check IP whitelist
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"

  if (!apiKey.isIpAllowed(clientIp)) {
    await logApiUsage(apiKey, request, 403, Date.now() - startTime, {
      occurred: true,
      code: "IP_NOT_WHITELISTED",
      message: `IP ${clientIp} not in whitelist`,
    })
    return {
      valid: false,
      error: "IP address not whitelisted",
      code: "IP_NOT_WHITELISTED",
      apiKey,
    }
  }

  // Check quota
  if (!apiKey.isWithinQuota()) {
    await logApiUsage(apiKey, request, 429, Date.now() - startTime, {
      occurred: true,
      code: "QUOTA_EXCEEDED",
      message: "Monthly quota exceeded",
    })
    return {
      valid: false,
      error: "Monthly quota exceeded",
      code: "QUOTA_EXCEEDED",
      apiKey,
    }
  }

  // Check rate limits
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [minuteCount, hourCount, dayCount] = await Promise.all([
    ApiUsageLog.countDocuments({ apiKeyId: apiKey._id, timestamp: { $gte: oneMinuteAgo } }),
    ApiUsageLog.countDocuments({ apiKeyId: apiKey._id, timestamp: { $gte: oneHourAgo } }),
    ApiUsageLog.countDocuments({ apiKeyId: apiKey._id, timestamp: { $gte: oneDayAgo } }),
  ])

  const withinRateLimit = await apiKey.isWithinRateLimit(minuteCount, hourCount, dayCount)
  if (!withinRateLimit) {
    await logApiUsage(apiKey, request, 429, Date.now() - startTime, {
      occurred: true,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Rate limit exceeded",
    })
    return {
      valid: false,
      error: "Rate limit exceeded",
      code: "RATE_LIMIT_EXCEEDED",
      apiKey,
      retryAfter: 60, // seconds
    }
  }

  return {
    valid: true,
    apiKey,
    tenant: apiKey.tenantId,
    clientIp,
    rateLimitStatus: {
      minuteCount,
      hourCount,
      dayCount,
      minuteLimit: apiKey.rateLimit.requestsPerMinute,
      hourLimit: apiKey.rateLimit.requestsPerHour,
      dayLimit: apiKey.rateLimit.requestsPerDay,
    },
  }
}

// Check if API key has required scope
export function checkScope(apiKey, requiredScope) {
  return apiKey.hasScope(requiredScope)
}

// Log API usage
export async function logApiUsage(apiKey, request, statusCode, responseTime, error = null) {
  try {
    await dbConnect()

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"

    const url = new URL(request.url)

    const log = new ApiUsageLog({
      apiKeyId: apiKey._id,
      tenantId: apiKey.tenantId._id || apiKey.tenantId,
      endpoint: url.pathname,
      method: request.method,
      statusCode,
      responseTime,
      clientIp,
      userAgent: request.headers.get("user-agent") || "",
      error: error ? { occurred: true, ...error } : { occurred: false },
      rateLimitStatus: {
        quotaUsed: apiKey.quota.currentMonthUsage,
        quotaLimit: apiKey.quota.monthlyLimit,
      },
      timestamp: new Date(),
    })

    await log.save()

    // Update API key stats
    await ApiKey.findByIdAndUpdate(apiKey._id, {
      $inc: {
        "stats.totalRequests": 1,
        "stats.successfulRequests": statusCode < 400 ? 1 : 0,
        "stats.failedRequests": statusCode >= 400 ? 1 : 0,
        "quota.currentMonthUsage": 1,
      },
      $set: {
        "stats.lastUsedAt": new Date(),
        "stats.lastUsedIp": clientIp,
      },
    })
  } catch (err) {
    console.error("[API Governance] Error logging usage:", err)
  }
}

// Reset monthly quotas (call from cron job)
export async function resetMonthlyQuotas() {
  await dbConnect()

  const now = new Date()
  const dayOfMonth = now.getDate()

  const result = await ApiKey.updateMany(
    {
      "quota.quotaResetDay": dayOfMonth,
      "quota.lastResetDate": { $lt: new Date(now.setHours(0, 0, 0, 0)) },
    },
    {
      $set: {
        "quota.currentMonthUsage": 0,
        "quota.alertSent": false,
        "quota.lastResetDate": new Date(),
      },
    },
  )

  return result.modifiedCount
}
