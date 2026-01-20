import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"

export async function GET(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "agent") {
      return NextResponse.json({ error: "Unauthorized: Agent access required" }, { status: 403 })
    }

    await connectDB()
    const agent = await User.findById(decoded.userId).select("wallet")

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const wallet = agent.wallet || { balance: 0, currency: "USD" }

    // Return wallet balance in the format dashboard expects
    return NextResponse.json(
      {
        success: true,
        data: {
          availableBalance: wallet.balance || 0,
          lockedBalance: 0,
          totalBalance: wallet.balance || 0,
          currency: wallet.currency || "USD",
          minThreshold: 100,
          status: wallet.balance > 100 ? "healthy" : "low",
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[Wallet] Get balance error:", error)
    return NextResponse.json({ error: error.message || "Failed to get balance" }, { status: 500 })
  }
}
