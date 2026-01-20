import connectDB from "@/lib/mongodb"
import AuditLog from "@/lib/models/AuditLog"
import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

// GET /api/super/audit-logs - Get audit logs (Super Admin only)
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden - Only Super Admin can view audit logs" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    await connectDB()

    const statsParam = searchParams.get("stats")
    if (statsParam === "true") {
      const allLogs = await AuditLog.find()
      
      const stats = {
        total: allLogs.length,
        critical: allLogs.filter(log => log.severity === "critical").length,
        high: allLogs.filter(log => log.severity === "high").length,
        medium: allLogs.filter(log => log.severity === "medium").length,
        low: allLogs.filter(log => log.severity === "low").length,
      }
      
      return NextResponse.json({ stats }, { status: 200 })
    }

    const tenant_id = searchParams.get("tenant_id")
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")
    const actionValue = action && action !== "all" ? action : null
    const resource_type = searchParams.get("resource_type")
    const resource_id = searchParams.get("resource_id")
    const severity = searchParams.get("severity")
    const severityValue = severity && severity !== "all" ? severity : null
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = parseInt(searchParams.get("limit") || "100")
    const skip = parseInt(searchParams.get("skip") || "0")

    const logs = await AuditLog.query(
      {
        tenant_id,
        userId,
        action: actionValue,
        resource_type,
        resource_id,
        severity: severityValue,
        startDate,
        endDate,
        limit,
        skip,
      },
      {},
    )

    const total = await AuditLog.countDocuments(
      tenant_id ? { tenant_id } : {},
    )

    return NextResponse.json(
      {
        logs,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + logs.length < total,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Get audit logs error:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
