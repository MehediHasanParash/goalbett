import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"
import mongoose from "mongoose"

async function verifyAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
}

// GET - Get single agent details
export async function GET(request, { params }) {
  try {
    const decoded = await verifyAuth()
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!["tenant_admin", "admin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const agent = await User.findById(id).select("-password")

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error("Get agent error:", error)
    return NextResponse.json({ error: "Failed to get agent" }, { status: 500 })
  }
}

// PUT - Update agent
export async function PUT(request, { params }) {
  try {
    const decoded = await verifyAuth()
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!["tenant_admin", "admin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { fullName, email, phone, profitPercentage, status, isActive, commissionRate } = body

    const agent = await User.findById(id)

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Verify this agent belongs to the tenant
    if (decoded.role === "tenant_admin") {
      const adminUserId = decoded.userId
      const tenantIdFromToken = decoded.tenant_id

      // Find tenant by admin user
      const tenant = await Tenant.findOne({ adminUserId })
      const tenantId = tenant ? tenant._id.toString() : tenantIdFromToken

      // Convert to ObjectId for comparison
      const adminObjectId = mongoose.Types.ObjectId.isValid(adminUserId)
        ? new mongoose.Types.ObjectId(adminUserId)
        : null
      const tenantObjectId =
        tenantId && mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : null

      const agentTenantId = agent.tenantId?.toString()
      const agentTenantIdString = agent.tenant_id

      const belongsToTenant =
        agentTenantId === adminUserId ||
        agentTenantId === tenantId ||
        agentTenantIdString === adminUserId ||
        agentTenantIdString === tenantId

      if (!belongsToTenant) {
        return NextResponse.json({ error: "Agent does not belong to your tenant" }, { status: 403 })
      }
    }

    // Update fields
    if (fullName) agent.fullName = fullName
    if (email) agent.email = email
    if (phone !== undefined) agent.phone = phone
    if (profitPercentage !== undefined) agent.profitPercentage = profitPercentage
    if (status) agent.status = status
    if (isActive !== undefined) agent.isActive = isActive
    if (commissionRate !== undefined) agent.commissionRate = commissionRate

    await agent.save()

    return NextResponse.json({
      message: "Agent updated successfully",
      agent: {
        _id: agent._id,
        fullName: agent.fullName,
        email: agent.email,
        phone: agent.phone,
        profitPercentage: agent.profitPercentage,
        status: agent.status,
        isActive: agent.isActive,
        role: agent.role,
      },
    })
  } catch (error) {
    console.error("Update agent error:", error)
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 })
  }
}

// DELETE - Delete agent
export async function DELETE(request, { params }) {
  try {
    const decoded = await verifyAuth()
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!["tenant_admin", "admin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const agent = await User.findById(id)

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Verify this agent belongs to the tenant
    if (decoded.role === "tenant_admin") {
      const adminUserId = decoded.userId
      const tenantIdFromToken = decoded.tenant_id

      const tenant = await Tenant.findOne({ adminUserId })
      const tenantId = tenant ? tenant._id.toString() : tenantIdFromToken

      const agentTenantId = agent.tenantId?.toString()
      const agentTenantIdString = agent.tenant_id

      const belongsToTenant =
        agentTenantId === adminUserId ||
        agentTenantId === tenantId ||
        agentTenantIdString === adminUserId ||
        agentTenantIdString === tenantId

      if (!belongsToTenant) {
        return NextResponse.json({ error: "Agent does not belong to your tenant" }, { status: 403 })
      }
    }

    await User.findByIdAndDelete(id)

    return NextResponse.json({ message: "Agent deleted successfully" })
  } catch (error) {
    console.error("Delete agent error:", error)
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 })
  }
}
