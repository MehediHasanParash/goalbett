import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"

async function getTokenAndDecode(request) {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]
    return await verifyToken(token)
  }

  // Try cookies
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  if (token) {
    return await verifyToken(token)
  }

  return null
}

// GET - Get tenant's current design
export async function GET(request) {
  try {
    const decoded = await getTokenAndDecode(request)

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const tenant = await Tenant.findById(decoded.tenant_id).select("designId theme name")

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      designId: tenant.designId || "classic",
      theme: tenant.theme,
      tenantName: tenant.name,
    })
  } catch (error) {
    console.error("[v0] Get tenant design error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update tenant's design
export async function PUT(request) {
  try {
    const decoded = await getTokenAndDecode(request)

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allowedRoles = [
      "superadmin",
      "super_admin",
      "admin",
      "tenant_admin",
      "provider",
      "finance_manager",
      "general_manager",
      "support_manager",
    ]

    console.log("[v0] Design API - User role:", decoded.role, "Allowed:", allowedRoles.includes(decoded.role))

    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json(
        {
          error: "Insufficient permissions",
          yourRole: decoded.role,
          allowedRoles,
        },
        { status: 403 },
      )
    }

    const { designId, tenantId } = await request.json()

    if (!["classic", "modern", "neon"].includes(designId)) {
      return NextResponse.json({ error: "Invalid design ID" }, { status: 400 })
    }

    await connectToDatabase()

    const targetTenantId = decoded.tenant_id || tenantId

    if (!targetTenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 })
    }

    console.log("[v0] Design API - Updating tenant:", targetTenantId, "to design:", designId)

    const tenant = await Tenant.findByIdAndUpdate(targetTenantId, { designId }, { new: true }).select(
      "designId theme name",
    )

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    console.log("[v0] Design updated for tenant:", tenant.name, "->", designId)

    return NextResponse.json({
      success: true,
      message: "Design updated successfully",
      designId: tenant.designId,
      tenantName: tenant.name,
    })
  } catch (error) {
    console.error("[v0] Update tenant design error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
