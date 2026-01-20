import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"

// GET /api/agent/credit - Get agent's credit status
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

    const agent = await User.findById(decoded.userId).select(
      "collateralDeposit creditLimit usedCredit collateralRatio balance",
    )

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const availableCredit = agent.creditLimit - agent.usedCredit
    const utilizationPercent = agent.creditLimit > 0 ? (agent.usedCredit / agent.creditLimit) * 100 : 0

    return NextResponse.json({
      success: true,
      credit: {
        collateralDeposit: agent.collateralDeposit || 0,
        creditLimit: agent.creditLimit || 0,
        usedCredit: agent.usedCredit || 0,
        availableCredit: Math.max(0, availableCredit),
        collateralRatio: agent.collateralRatio || 1.0,
        utilizationPercent: Math.min(100, utilizationPercent).toFixed(1),
        walletBalance: agent.balance || 0,
      },
    })
  } catch (error) {
    console.error("Credit status error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
