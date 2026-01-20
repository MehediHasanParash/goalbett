import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { AgentTopupService } from "@/lib/services/agent-topup-service"
import connectDB from "@/lib/db"

// POST - Player withdraws cash from agent
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

    await connectDB()

    const body = await request.json()
    const { amount, location, otp } = body

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valid amount is required" }, { status: 400 })
    }

    // Call service
    const result = await AgentTopupService.withdrawFromAgent({
      playerId: decoded.userId,
      agentId: body.agentId,
      amount: Number.parseFloat(amount),
      currency: body.currency || "ETB",
      tenantId: decoded.tenant_id || decoded.tenantId,
      metadata: {
        location,
        channel: "player_app",
        otp,
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("[v0] Player withdrawal error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
