import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ApiKey, ApiUsageLog, Tenant } from "@/lib/models"
import { generateApiKey } from "@/lib/api-key-auth"

async function getTokenAndVerify(request) {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "")
    const decoded = verifyToken(token)
    if (decoded) return decoded
  }

  // Fallback to cookies
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get("token")?.value
  if (cookieToken) {
    const decoded = verifyToken(cookieToken)
    if (decoded) return decoded
  }

  return null
}

export async function GET(request) {
  try {
    await dbConnect()

    const decoded = await getTokenAndVerify(request)

    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get("action")

    if (action === "analytics") {
      const now = new Date()
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [
        totalKeys,
        activeKeys,
        requests24h,
        requests7d,
        requests30d,
        errors24h,
        topEndpoints,
        topKeys,
        hourlyUsage,
      ] = await Promise.all([
        ApiKey.countDocuments(),
        ApiKey.countDocuments({ status: "active" }),
        ApiUsageLog.countDocuments({ timestamp: { $gte: last24h } }),
        ApiUsageLog.countDocuments({ timestamp: { $gte: last7d } }),
        ApiUsageLog.countDocuments({ timestamp: { $gte: last30d } }),
        ApiUsageLog.countDocuments({ timestamp: { $gte: last24h }, "error.occurred": true }),
        ApiUsageLog.aggregate([
          { $match: { timestamp: { $gte: last24h } } },
          { $group: { _id: "$endpoint", count: { $sum: 1 }, avgTime: { $avg: "$responseTime" } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        ApiUsageLog.aggregate([
          { $match: { timestamp: { $gte: last24h } } },
          { $group: { _id: "$apiKeyId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "apikeys",
              localField: "_id",
              foreignField: "_id",
              as: "keyInfo",
            },
          },
        ]),
        ApiUsageLog.aggregate([
          { $match: { timestamp: { $gte: last24h } } },
          {
            $group: {
              _id: { $hour: "$timestamp" },
              count: { $sum: 1 },
              errors: { $sum: { $cond: ["$error.occurred", 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ])

      const tenants = await Tenant.find({}).select("name status").lean()

      return NextResponse.json({
        success: true,
        analytics: {
          keys: { total: totalKeys, active: activeKeys },
          requests: {
            last24h: requests24h,
            last7d: requests7d,
            last30d: requests30d,
          },
          errors: { last24h: errors24h, rate: requests24h > 0 ? ((errors24h / requests24h) * 100).toFixed(2) : 0 },
          topEndpoints,
          topKeys,
          hourlyUsage,
        },
        tenants: tenants.map((t) => ({ id: t._id.toString(), name: t.name, _id: t._id.toString() })),
      })
    }

    const apiKeys = await ApiKey.find()
      .populate("tenantId", "name")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 })
      .lean()

    const tenants = await Tenant.find({}).select("name status").lean()
    const tenantsMap = new Map(tenants.map((t) => [t._id.toString(), t.name]))

    const processedKeys = apiKeys.map((key) => {
      const processedKey = {
        ...key,
        id: key._id.toString(),
        _id: key._id.toString(),
      }

      // If allowedTenants exists and has IDs, resolve them to names
      if (key.allowedTenants && Array.isArray(key.allowedTenants) && key.allowedTenants.length > 0) {
        processedKey.allowedTenantsResolved = key.allowedTenants.map((id) => ({
          _id: id.toString(),
          name: tenantsMap.get(id.toString()) || "Unknown",
        }))
      }

      return processedKey
    })

    return NextResponse.json({
      success: true,
      apiKeys: processedKeys,
      tenants: tenants.map((t) => ({ id: t._id.toString(), name: t.name, _id: t._id.toString() })),
    })
  } catch (error) {
    console.error("[API Governance] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await dbConnect()

    const decoded = await getTokenAndVerify(request)

    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (action === "create") {
      const keyType = data.keyType || "tenant"

      if (keyType === "tenant" && !data.tenantId) {
        return NextResponse.json({ error: "Tenant ID is required for tenant-specific keys" }, { status: 400 })
      }

      if ((keyType === "external" || keyType === "partner") && !data.partnerInfo?.organizationName) {
        return NextResponse.json({ error: "Organization name is required for external/partner keys" }, { status: 400 })
      }

      // Generate new API key
      const { key, keyHash, keyId, keyPrefix } = await generateApiKey(
        data.environment === "production" ? "gb_live" : "gb_test",
      )

      const apiKeyData = {
        keyId,
        keyHash,
        keyPrefix,
        name: data.name,
        description: data.description || "",
        keyType,
        createdBy: decoded.userId,
        environment: data.environment || "sandbox",
        rateLimit: {
          requestsPerMinute: data.rateLimit?.requestsPerMinute || 60,
          requestsPerHour: data.rateLimit?.requestsPerHour || 1000,
          requestsPerDay: data.rateLimit?.requestsPerDay || 10000,
        },
        ipWhitelist: {
          enabled: data.ipWhitelist?.enabled || false,
          addresses: data.ipWhitelist?.addresses || [],
        },
        scopes: data.scopes || ["read:events", "read:odds"],
        quota: {
          monthlyLimit: data.quota?.monthlyLimit || 100000,
        },
        expiresAt: data.expiresAt || null,
      }

      if (keyType === "tenant" && data.tenantId) {
        apiKeyData.tenantId = data.tenantId
      }

      if (keyType !== "tenant" && data.allowedTenants && data.allowedTenants.length > 0) {
        apiKeyData.allowedTenants = data.allowedTenants
      }

      if ((keyType === "external" || keyType === "partner") && data.partnerInfo) {
        apiKeyData.partnerInfo = {
          organizationName: data.partnerInfo.organizationName || "",
          contactEmail: data.partnerInfo.contactEmail || "",
          contactPhone: data.partnerInfo.contactPhone || "",
          website: data.partnerInfo.website || "",
          notes: data.partnerInfo.notes || "",
        }
      }

      console.log("[v0] Creating API key with data:", JSON.stringify(apiKeyData, null, 2))

      const apiKey = new ApiKey(apiKeyData)
      await apiKey.save()

      return NextResponse.json({
        success: true,
        apiKey: key,
        keyInfo: {
          id: apiKey._id.toString(),
          keyId: apiKey.keyId,
          keyPrefix: apiKey.keyPrefix,
          name: apiKey.name,
          keyType: apiKey.keyType,
          environment: apiKey.environment,
        },
        message: "Save this key securely. It will not be shown again.",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[API Governance] POST Error:", error)
    return NextResponse.json({ error: `Error creating API key: ${error.message}` }, { status: 500 })
  }
}
