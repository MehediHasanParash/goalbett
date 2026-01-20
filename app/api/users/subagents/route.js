import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"
import { NextResponse } from "next/server"

// GET /api/users/subagents - Agent gets their sub-agents
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    console.log("[v0] GET subagents - full auth header:", authHeader)

    const token = authHeader?.replace("Bearer ", "")
    console.log("[v0] GET subagents - extracted token:", token ? "exists" : "missing")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] GET subagents - decoded token:", decoded)

    if (!decoded || decoded.role !== "agent") {
      console.log("[v0] GET subagents - role mismatch. Expected 'agent', got:", decoded?.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const subAgents = await User.find({
      role: "sub_agent",
      parentAgentId: decoded.userId,
    }).select("-password")

    return NextResponse.json({ subAgents }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get sub-agents error:", error)
    return NextResponse.json({ error: "Failed to fetch sub-agents" }, { status: 500 })
  }
}

// POST /api/users/subagents - Agent creates sub-agent
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization")
    console.log("[v0] POST subagents - full auth header:", authHeader)

    const token = authHeader?.replace("Bearer ", "")
    console.log("[v0] POST subagents - extracted token:", token ? "exists" : "missing")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] POST subagents - decoded token:", decoded)

    if (!decoded || decoded.role !== "agent") {
      console.log("[v0] POST subagents - role mismatch. Expected 'agent', got:", decoded?.role)
      return NextResponse.json({ error: "Forbidden - Only Agent can create sub-agents" }, { status: 403 })
    }

    const { email, password, name, phone, commissionRate, location } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Get the agent to inherit tenant info
    const agent = await User.findById(decoded.userId)
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const subAgent = await User.create({
      email,
      password, // Will be hashed by pre-save hook
      fullName: name,
      role: "sub_agent",
      phone,
      commissionRate: commissionRate || 5,
      isActive: true,
      balance: 0,
      parentAgentId: decoded.userId,
      tenantId: agent.tenantId,
      location,
    })

    console.log("[v0] Sub-agent created successfully:", subAgent._id)

    return NextResponse.json(
      {
        message: "Sub-agent created successfully",
        subAgent: {
          id: subAgent._id,
          email: subAgent.email,
          name: subAgent.fullName,
          role: subAgent.role,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create sub-agent error:", error)
    return NextResponse.json({ error: error.message || "Failed to create sub-agent" }, { status: 500 })
  }
}
