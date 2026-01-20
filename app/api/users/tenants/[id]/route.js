import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

// GET /api/users/tenants/[id] - Get single tenant
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    const tenant = await User.findOne({ _id: id, role: "tenant_admin" }).select("-password")

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({ tenant }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get tenant error:", error)
    return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 })
  }
}

// PUT /api/users/tenants/[id] - Update tenant configuration
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden - Only Super Admin can update tenants" }, { status: 403 })
    }

    const updateData = await request.json()
    console.log("[v0] PUT tenant - received data:", JSON.stringify(updateData, null, 2))

    await connectDB()

    const tenant = await User.findOne({ _id: id, role: "tenant_admin" })
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    if (updateData.tenantConfig) {
      // Get current tenantConfig or create default
      const currentConfig = tenant.tenantConfig?.toObject ? tenant.tenantConfig.toObject() : (tenant.tenantConfig || {})
      
      // Merge with new config
      tenant.tenantConfig = {
        businessName: updateData.tenantConfig.businessName || currentConfig.businessName || tenant.fullName || "",
        domain: updateData.tenantConfig.domain || currentConfig.domain || "",
        subdomain: updateData.tenantConfig.subdomain || currentConfig.subdomain || "",
        currency: updateData.tenantConfig.currency || currentConfig.currency || "USD",
        timezone: updateData.tenantConfig.timezone || currentConfig.timezone || "UTC",
        primaryColor: updateData.tenantConfig.primaryColor || currentConfig.primaryColor || "#FFD700",
        secondaryColor: updateData.tenantConfig.secondaryColor || currentConfig.secondaryColor || "#0A1A2F",
        status: updateData.tenantConfig.status || currentConfig.status || "active",
        enabledModules: updateData.tenantConfig.enabledModules || currentConfig.enabledModules || [],
        paymentProviders: updateData.tenantConfig.paymentProviders || currentConfig.paymentProviders || {},
        oddsProviders: updateData.tenantConfig.oddsProviders || currentConfig.oddsProviders || {},
        riskSettings: updateData.tenantConfig.riskSettings || currentConfig.riskSettings || {
          maxBetPerSlip: 10000,
          maxDailyExposure: 100000,
          autoLimitThreshold: 50000
        }
      }
      
      // Mark as modified
      tenant.markModified('tenantConfig')
      
      console.log("[v0] Setting tenantConfig:", JSON.stringify(tenant.tenantConfig, null, 2))
    }

    // Update basic fields
    if (updateData.fullName) tenant.fullName = updateData.fullName
    if (updateData.email) tenant.email = updateData.email
    if (updateData.phone) tenant.phone = updateData.phone
    if (updateData.isActive !== undefined) tenant.isActive = updateData.isActive

    await tenant.save()
    
    console.log("[v0] Tenant saved successfully")
    
    const updatedTenant = await User.findById(id).select("-password").lean()

    console.log("[v0] Fetched tenant object keys:", Object.keys(updatedTenant))
    console.log("[v0] tenantConfig exists?", !!updatedTenant.tenantConfig)
    console.log("[v0] tenantConfig:", JSON.stringify(updatedTenant.tenantConfig, null, 2))

    return NextResponse.json(
      {
        message: "Tenant updated successfully",
        tenant: updatedTenant,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Update tenant error:", error)
    return NextResponse.json({ error: "Failed to update tenant", details: error.message }, { status: 500 })
  }
}

// DELETE /api/users/tenants/[id] - Delete tenant
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden - Only Super Admin can delete tenants" }, { status: 403 })
    }

    await connectDB()

    const tenant = await User.findOneAndDelete({ _id: id, role: "tenant_admin" })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // TODO: Also delete all agents, admins, and sub-agents under this tenant
    // This is a cascading delete operation

    return NextResponse.json({ message: "Tenant deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Delete tenant error:", error)
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 })
  }
}
