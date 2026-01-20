import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/mongodb"
import AuditLog from "@/lib/models/AuditLog"

// GET /api/super/audit-logs/export - Export audit logs to CSV
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const severity = searchParams.get("severity")
    const action = searchParams.get("action")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    await connectDB()

    const filters = {}
    if (severity && severity !== "all") filters.severity = severity
    if (action && action !== "all") filters.action = action
    if (startDate || endDate) {
      filters.createdAt = {}
      if (startDate) filters.createdAt.$gte = new Date(startDate)
      if (endDate) filters.createdAt.$lte = new Date(endDate)
    }

    const logs = await AuditLog.find(filters)
      .sort({ createdAt: -1 })
      .limit(1000)
      .populate("actor.userId", "fullName email")
      .lean()

    // Generate CSV
    const csvHeaders = "Timestamp,Actor,Action,Resource,Severity,IP Address\n"
    const csvRows = logs
      .map((log) => {
        return `${new Date(log.createdAt).toISOString()},${log.actor.email},${log.action},${log.resource.type}:${log.resource.name || log.resource.id},${log.severity},${log.actor.ipAddress || "N/A"}`
      })
      .join("\n")

    const csv = csvHeaders + csvRows

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error("[v0] Export audit logs error:", error)
    return NextResponse.json({ error: "Failed to export audit logs" }, { status: 500 })
  }
}
