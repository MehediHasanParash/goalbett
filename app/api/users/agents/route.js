import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"
import { verifyToken } from "@/lib/jwt"
import { NextResponse } from "next/server"
import mongoose from "mongoose"

// GET /api/users/agents - Tenant gets their agents
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("[v0] GET agents - token exists:", !!token)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] GET agents - decoded token:", JSON.stringify(decoded, null, 2))

    if (!decoded || (decoded.role !== "tenant_admin" && decoded.role !== "admin")) {
      console.log("[v0] GET agents - forbidden, role:", decoded?.role)
      return NextResponse.json({ error: "Forbidden", success: false }, { status: 403 })
    }

    await connectDB()

    const adminUserId = decoded.userId
    let adminUserObjectId = null
    if (adminUserId && mongoose.Types.ObjectId.isValid(adminUserId)) {
      adminUserObjectId = new mongoose.Types.ObjectId(adminUserId)
    }

    let tenantId = decoded.tenant_id || decoded.tenantId
    let tenantObjectId = null

    // If the user is a tenant_admin, find their tenant by adminUserId
    if (decoded.role === "tenant_admin") {
      const tenant = await Tenant.findOne({ adminUserId: decoded.userId }).lean()
      if (tenant) {
        tenantId = tenant._id.toString()
        tenantObjectId = tenant._id
        console.log("[v0] GET agents - found tenant by adminUserId:", tenantId)
      }
    }

    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      tenantObjectId = new mongoose.Types.ObjectId(tenantId)
    }

    console.log("[v0] GET agents - adminUserId:", adminUserId)
    console.log("[v0] GET agents - tenantId (string):", tenantId)
    console.log("[v0] GET agents - tenantObjectId:", tenantObjectId?.toString())

    const query = {
      role: { $in: ["agent", "sub_agent"] },
      $or: [
        // Match by tenant_id field
        { tenant_id: tenantId },
        { tenant_id: tenantObjectId },
        // Match by tenantId field (could be tenant's _id or admin's userId)
        { tenantId: tenantId },
        { tenantId: tenantObjectId },
        // Match by admin's userId (agents store this in tenantId field)
        { tenantId: adminUserId },
        { tenantId: adminUserObjectId },
        { tenant_id: adminUserId },
        { tenant_id: adminUserObjectId },
        // Match by createdBy
        { createdBy: adminUserId },
        { createdBy: adminUserObjectId },
      ],
    }

    console.log("[v0] GET agents - query $or conditions count:", query.$or.length)

    const agents = await User.find(query).select("-password").lean()

    console.log("[v0] GET agents - found agents:", agents.length)

    // Log each agent's tenant fields for debugging
    agents.forEach((a, i) => {
      console.log(`[v0] Agent ${i}:`, {
        id: a._id?.toString(),
        name: a.fullName,
        role: a.role,
        tenant_id: a.tenant_id?.toString ? a.tenant_id.toString() : a.tenant_id,
        tenantId: a.tenantId?.toString ? a.tenantId.toString() : a.tenantId,
      })
    })

    // Calculate stats
    const agentsList = agents.filter((a) => a.role === "agent")
    const subAgentsList = agents.filter((a) => a.role === "sub_agent")
    const activeAgents = agents.filter((a) => a.status === "active" || a.isActive)

    return NextResponse.json(
      {
        success: true,
        data: agents,
        stats: {
          totalAgents: agentsList.length,
          activeAgents: activeAgents.length,
          subAgents: subAgentsList.length,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Get agents error:", error)
    return NextResponse.json({ error: "Failed to fetch agents", success: false }, { status: 500 })
  }
}

// POST /api/users/agents - Tenant creates agent
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] POST agent - decoded token:", JSON.stringify(decoded, null, 2))

    if (!decoded || decoded.role !== "tenant_admin") {
      return NextResponse.json({ error: "Forbidden - Only Tenant can create agents" }, { status: 403 })
    }

    const { email, password, name, phone, profitPercentage, role = "agent" } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    let tenantId = decoded.tenant_id || decoded.tenantId

    const tenant = await Tenant.findOne({ adminUserId: decoded.userId }).lean()
    if (tenant) {
      tenantId = tenant._id
      console.log("[v0] POST agent - found tenant by adminUserId:", tenant._id.toString())
    }

    const username = email.split("@")[0]

    const agent = await User.create({
      email,
      password,
      fullName: name,
      username,
      role: role === "sub_agent" ? "sub_agent" : "agent",
      phone,
      profitPercentage: Number(profitPercentage) || 5,
      status: "active",
      balance: 0,
      createdBy: decoded.userId,
      tenant_id: tenantId,
      tenantId: tenantId,
    })

    console.log("[v0] POST agent - created agent:", {
      id: agent._id,
      name: agent.fullName,
      tenant_id: agent.tenant_id,
      tenantId: agent.tenantId,
    })

    return NextResponse.json(
      {
        success: true,
        agent: {
          id: agent._id,
          name: agent.fullName,
          email: agent.email,
          role: agent.role,
          phone: agent.phone,
          profitPercentage: agent.profitPercentage,
          status: agent.status,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create agent error:", error)
    return NextResponse.json({ error: error.message || "Failed to create agent" }, { status: 500 })
  }
}
