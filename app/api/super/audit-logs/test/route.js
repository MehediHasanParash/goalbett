import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { createAuditLog } from "@/lib/middleware/audit-middleware"

// POST /api/super/audit-logs/test - Create a test audit log
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log("[v0] Creating test audit log...")

    await createAuditLog({
      tenant_id: "000000000000000000000000", // Dummy tenant ID
      actor: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      action: "tenant.create",
      resource: {
        type: "tenant",
        id: "test-tenant-123",
        name: "Test Tenant",
      },
      changes: {
        after: {
          name: "Test Tenant",
          slug: "test-tenant",
        },
      },
      metadata: {
        test: true,
      },
      request,
    })

    console.log("[v0] Test audit log created!")

    return NextResponse.json({ message: "Test audit log created successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Test audit log error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
