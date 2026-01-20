import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { AgentTopupService } from "@/lib/services/agent-topup-service"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"

// POST - Agent tops up player
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    console.log("[v0] Topup request - decoded token:", {
      userId: decoded.userId,
      role: decoded.role,
      tenant_id: decoded.tenant_id,
      tenantId: decoded.tenantId,
    })

    await connectDB()

    const agent = await User.findById(decoded.userId).select("tenant_id role")
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const agentTenantId = agent.tenant_id
    console.log("[v0] Agent tenant_id from database:", agentTenantId)

    const body = await request.json()
    const { playerIdentifier, amount, location } = body

    console.log("[v0] Topup request body:", { playerIdentifier, amount, location })

    // Validate input
    if (!playerIdentifier) {
      return NextResponse.json({ success: false, error: "Player phone/email/username is required" }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valid amount is required" }, { status: 400 })
    }

    // Call service with agent's actual tenant_id from database
    const result = await AgentTopupService.topupPlayer({
      agentId: decoded.userId,
      playerIdentifier,
      amount: Number.parseFloat(amount),
      currency: body.currency || "ETB",
      tenantId: agentTenantId, // Use tenant_id from database instead of token
      metadata: {
        location,
        channel: "agent_app",
        deviceId: body.deviceId,
      },
    })

    console.log("[v0] Topup successful:", result)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("[v0] Player topup error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
