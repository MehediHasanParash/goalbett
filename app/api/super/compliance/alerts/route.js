import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ComplianceAlert from "@/lib/models/ComplianceAlert"
import { verifyToken } from "@/lib/auth"
import { logAudit } from "@/lib/audit-logger"

export async function GET(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const query = {}
    if (status) query.status = status
    if (type) query.type = type
    if (severity) query.severity = severity

    const [alerts, total] = await Promise.all([
      ComplianceAlert.find(query)
        .populate("userId", "fullName email phone status")
        .populate("tenantId", "name")
        .populate("assignedTo", "fullName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ComplianceAlert.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[v0] Compliance alerts error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const alert = await ComplianceAlert.create(body)

    await logAudit({
      action: "compliance_alert_created",
      performedBy: decoded.userId,
      targetType: "compliance_alert",
      targetId: alert._id,
      details: { type: body.type, severity: body.severity },
    })

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    console.error("[v0] Create compliance alert error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
