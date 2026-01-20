import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Wallet from "@/lib/models/Wallet"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth"

// GET - Get user's wallet
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    // Find or create wallet
    let wallet = await Wallet.findOne({ userId: decoded.userId }).lean()

    if (!wallet) {
      // Get user's tenant
      const user = await User.findById(decoded.userId).lean()

      // Create new wallet
      wallet = await Wallet.create({
        userId: decoded.userId,
        tenantId: user?.tenant_id || decoded.tenantId,
        balance: 0,
        currency: "USD",
      })

      wallet = wallet.toObject()
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: wallet.balance,
        bonusBalance: wallet.bonusBalance || 0,
        pendingWithdrawal: wallet.pendingWithdrawal || 0,
        currency: wallet.currency,
        totalWagered: wallet.totalWagered || 0,
        totalWinnings: wallet.totalWinnings || 0,
        status: wallet.status,
        limits: wallet.limits,
      },
    })
  } catch (error) {
    console.error("[v0] Wallet GET error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
