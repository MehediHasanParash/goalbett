import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ApiKey, ApiUsageLog } from "@/lib/models"

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

export async function GET(request, { params }) {
  try {
    await dbConnect()

    const decoded = await getTokenAndVerify(request)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const apiKey = await ApiKey.findById(id).populate("tenantId", "name").populate("createdBy", "username email").lean()

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    // Get usage logs for this key
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const logs = await ApiUsageLog.find({ apiKeyId: id, timestamp: { $gte: last24h } })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean()

    return NextResponse.json({
      success: true,
      apiKey: { ...apiKey, id: apiKey._id.toString() },
      recentLogs: logs,
    })
  } catch (error) {
    console.error("[API Governance] GET Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const decoded = await getTokenAndVerify(request)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData = {}

    if (body.name) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.status) updateData.status = body.status
    if (body.rateLimit) updateData.rateLimit = body.rateLimit
    if (body.ipWhitelist) updateData.ipWhitelist = body.ipWhitelist
    if (body.scopes) updateData.scopes = body.scopes
    if (body.quota) updateData["quota.monthlyLimit"] = body.quota.monthlyLimit
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt

    const apiKey = await ApiKey.findByIdAndUpdate(id, updateData, { new: true }).populate("tenantId", "name").lean()

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      apiKey: { ...apiKey, id: apiKey._id.toString() },
    })
  } catch (error) {
    console.error("[API Governance] PUT Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const decoded = await getTokenAndVerify(request)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Soft delete - just revoke the key
    await ApiKey.findByIdAndUpdate(id, { status: "revoked" })

    return NextResponse.json({ success: true, message: "API key revoked" })
  } catch (error) {
    console.error("[API Governance] DELETE Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
