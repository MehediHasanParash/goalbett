import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

// GET /api/super/agents/[id] - Get single agent details
export async function GET(request, { params }) {
  try {
    let token = null

    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }

    if (!token) {
      token = request.cookies.get("token")?.value
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const agent = await User.findById(params.id)
      .populate("tenant_id", "name businessName brandName domain status")
      .populate("parentAgentId", "fullName email")
      .select("-password")
      .lean()

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    // Get player count
    const playerCount = await User.countDocuments({ role: "player", agentId: agent._id })

    return NextResponse.json({
      success: true,
      agent: {
        ...agent,
        _id: agent._id.toString(),
        playerCount,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching agent:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch agent" }, { status: 500 })
  }
}

// PUT /api/super/agents/[id] - Update agent
export async function PUT(request, { params }) {
  try {
    let token = null

    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }

    if (!token) {
      token = request.cookies.get("token")?.value
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()
    const { fullName, username, email, phone, role, tenant_id, commissionRate, parentAgentId, status, password } = body

    const updateData = {}

    if (fullName) updateData.fullName = fullName
    if (username) updateData.username = username
    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (role) updateData.role = role
    if (tenant_id) updateData.tenant_id = tenant_id
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate
    if (parentAgentId) updateData.parentAgentId = parentAgentId
    if (status) {
      updateData.status = status
      updateData.isActive = status === "active"
    }

    // If password is being updated, hash it
    if (password) {
      const bcrypt = require("bcryptjs")
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    const agent = await User.findByIdAndUpdate(params.id, updateData, { new: true, runValidators: true })
      .populate("tenant_id", "name businessName brandName domain status")
      .select("-password")
      .lean()

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      agent: {
        ...agent,
        _id: agent._id.toString(),
        tenant: {
          name: agent.tenant_id?.name || agent.tenant_id?.businessName || agent.tenant_id?.brandName,
          brandName: agent.tenant_id?.brandName || agent.tenant_id?.name,
          domain: agent.tenant_id?.domain,
          status: agent.tenant_id?.status,
        },
        tenantName: agent.tenant_id?.name || agent.tenant_id?.businessName || "No Tenant",
        tenantDomain: agent.tenant_id?.domain || "-",
      },
    })
  } catch (error) {
    console.error("[v0] Error updating agent:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to update agent" }, { status: 500 })
  }
}

// DELETE /api/super/agents/[id] - Delete agent
export async function DELETE(request, { params }) {
  try {
    let token = null

    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }

    if (!token) {
      token = request.cookies.get("token")?.value
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized - Super admin only" }, { status: 403 })
    }

    await dbConnect()

    // Check if agent has players
    const playerCount = await User.countDocuments({ role: "player", agentId: params.id })

    if (playerCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete agent with ${playerCount} active players. Please reassign or remove players first.`,
        },
        { status: 400 },
      )
    }

    const agent = await User.findByIdAndDelete(params.id)

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Agent deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Error deleting agent:", error)
    return NextResponse.json({ success: false, error: "Failed to delete agent" }, { status: 500 })
  }
}
