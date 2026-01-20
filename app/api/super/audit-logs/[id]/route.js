import connectDB from "@/lib/mongodb"
import AuditLog from "@/lib/models/AuditLog"
import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

// GET /api/super/audit-logs/[id] - Get specific audit log details
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden - Only Super Admin can view audit logs" }, { status: 403 })
    }

    await connectDB()

    const log = await AuditLog.findById(id).populate("actor.userId", "fullName email role").lean()
    if (!log) {
      return NextResponse.json({ error: "Audit log not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: log }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get audit log error:", error)
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 })
  }
}

// DELETE operations are blocked at model level with pre-hooks
// This ensures regulatory compliance and chain-of-custody integrity
