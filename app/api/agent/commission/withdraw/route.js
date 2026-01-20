import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { CommissionSettlementService } from "@/lib/services/commission-settlement-service"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"

// POST - Agent withdraws from commission wallet to main wallet
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

    const agent = await User.findById(decoded.userId).select("tenant_id role")
    if (!agent || !["agent", "master_agent", "sub_agent"].includes(agent.role)) {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valid amount is required" }, { status: 400 })
    }

    const result = await CommissionSettlementService.withdrawCommission({
      agentId: decoded.userId,
      amount: Number.parseFloat(amount),
      tenantId: agent.tenant_id,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] Commission withdrawal error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET - Get commission wallet balance
export async function GET(request) {
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

    const agent = await User.findById(decoded.userId).select("tenant_id role")
    if (!agent || !["agent", "master_agent", "sub_agent"].includes(agent.role)) {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    const balance = await CommissionSettlementService.getCommissionWalletBalance(decoded.userId, agent.tenant_id)

    return NextResponse.json({ success: true, data: balance })
  } catch (error) {
    console.error("[v0] Commission balance error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
