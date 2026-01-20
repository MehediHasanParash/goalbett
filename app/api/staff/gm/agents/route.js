import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"
import { hasPermission } from "@/lib/staff-permissions"

export async function GET(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !hasPermission(decoded.role, "create_agents")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tenantId = decoded.tenant_id || decoded.tenantId

    const agents = await User.find({
      tenant_id: tenantId,
      role: "agent",
    })
      .select("fullName firstName lastName email phone commissionRate status createdAt totalEarnings")
      .sort({ createdAt: -1 })
      .lean()

    // Get agent stats
    const stats = {
      total: agents.length,
      active: agents.filter((a) => a.status === "active").length,
      inactive: agents.filter((a) => a.status !== "active").length,
      totalCommission: agents.reduce((sum, a) => sum + (a.totalEarnings || 0), 0),
    }

    return NextResponse.json({ agents, stats })
  } catch (error) {
    console.error("Error fetching agents:", error)
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !hasPermission(decoded.role, "create_agents")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tenantId = decoded.tenant_id || decoded.tenantId

    const body = await request.json()
    const { firstName, lastName, email, phone, password, commissionRate } = body

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Create agent - let the User model pre-save hook hash the password
    const agent = new User({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      phone,
      password, // Pre-save hook will hash this
      role: "agent",
      tenant_id: tenantId,
      commissionRate: commissionRate || 10,
      status: "active",
      createdBy: decoded.userId,
    })

    await agent.save()

    return NextResponse.json({
      success: true,
      agent: {
        id: agent._id,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        commissionRate: agent.commissionRate,
      },
    })
  } catch (error) {
    console.error("Error creating agent:", error)
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 })
  }
}
