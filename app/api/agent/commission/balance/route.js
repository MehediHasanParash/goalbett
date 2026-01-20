import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import dbConnect from "@/lib/mongodb"
import Wallet from "@/lib/models/Wallet"
import User from "@/lib/models/User"

export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await dbConnect()

    // Get the agent user to find their commission balance
    const agent = await User.findById(decoded.userId).select("commissionBalance commissionEarned wallet").lean()

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    // Also check commission wallet if exists
    const commissionWallet = await Wallet.findOne({
      userId: decoded.userId,
      type: "commission",
    }).lean()

    return NextResponse.json({
      success: true,
      balance: commissionWallet?.availableBalance || agent.commissionBalance || 0,
      totalEarned: agent.commissionEarned || 0,
      currency: commissionWallet?.currency || "USD",
    })
  } catch (error) {
    console.error("[v0] Commission balance error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
