import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { AgentTopupService } from "@/lib/services/agent-topup-service"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"

// POST - Sub-agent returns float to parent agent
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

    const subAgent = await User.findById(decoded.userId).select("tenant_id role parentAgentId")
    if (!subAgent || subAgent.role !== "sub_agent") {
      return NextResponse.json({ success: false, error: "Sub-agent access required" }, { status: 403 })
    }

    const body = await request.json()
    const { amount, note } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valid amount is required" }, { status: 400 })
    }

    const result = await AgentTopupService.returnFloatToParent({
      subAgentId: decoded.userId,
      amount: Number.parseFloat(amount),
      currency: body.currency || "USD",
      tenantId: subAgent.tenant_id,
      metadata: {
        note,
        channel: "agent_app",
      },
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] Float return error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
