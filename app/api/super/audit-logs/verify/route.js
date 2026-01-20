import connectDB from "@/lib/mongodb"
import AuditLog from "@/lib/models/AuditLog"
import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

// POST /api/super/audit-logs/verify - Verify audit log integrity
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden - Only Super Admin can verify audit logs" }, { status: 403 })
    }

    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 })
    }

    await connectDB()

    const results = await AuditLog.verifyIntegrity(new Date(startDate), new Date(endDate))

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        integrityStatus: results.invalid === 0 ? "VERIFIED" : "COMPROMISED",
        verifiedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Verify audit logs error:", error)
    return NextResponse.json({ error: "Failed to verify audit logs" }, { status: 500 })
  }
}
