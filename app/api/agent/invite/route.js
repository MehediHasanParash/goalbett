import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"
import crypto from "crypto"

// GET /api/agent/invite - Get agent's invite link and stats
export async function GET(request) {
  try {
    await dbConnect()

    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent", "master_agent"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    const agent = await User.findById(decoded.userId).select("inviteCode inviteCount fullName username")

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    // Generate invite code if not exists
    if (!agent.inviteCode) {
      agent.inviteCode = crypto.randomBytes(6).toString("hex").toUpperCase()
      await agent.save()
    }

    // Get recruited sub-agents
    const recruitedAgents = await User.find({ invitedBy: agent._id })
      .select("fullName username createdAt isActive role")
      .sort({ createdAt: -1 })
      .limit(50)

    // Get hostname for invite link
    const host = request.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const inviteLink = `${protocol}://${host}/a/register?ref=${agent.inviteCode}`

    return NextResponse.json({
      success: true,
      inviteCode: agent.inviteCode,
      inviteLink,
      inviteCount: agent.inviteCount || recruitedAgents.length,
      recruitedAgents: recruitedAgents.map((a) => ({
        id: a._id,
        name: a.fullName || a.username,
        role: a.role,
        joinedAt: a.createdAt,
        isActive: a.isActive,
      })),
    })
  } catch (error) {
    console.error("Invite API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/agent/invite - Regenerate invite code
export async function POST(request) {
  try {
    await dbConnect()

    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent", "master_agent"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    const agent = await User.findById(decoded.userId)
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    // Generate new invite code
    agent.inviteCode = crypto.randomBytes(6).toString("hex").toUpperCase()
    await agent.save()

    const host = request.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const inviteLink = `${protocol}://${host}/a/register?ref=${agent.inviteCode}`

    return NextResponse.json({
      success: true,
      inviteCode: agent.inviteCode,
      inviteLink,
      message: "Invite code regenerated successfully",
    })
  } catch (error) {
    console.error("Regenerate invite error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
