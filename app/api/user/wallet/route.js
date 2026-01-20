import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Wallet from "@/lib/models/Wallet"
import Transaction from "@/lib/models/Transaction"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth"

// GET /api/user/wallet - Get current user's wallet with recent transactions
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

    console.log("[v0] User wallet API - userId:", decoded.userId)

    await connectDB()

    // Get user
    const user = await User.findById(decoded.userId).lean()
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ userId: decoded.userId })

    console.log(
      "[v0] Wallet found:",
      wallet ? { availableBalance: wallet.availableBalance, currency: wallet.currency } : "null",
    )

    if (!wallet) {
      console.log("[v0] Creating new wallet for user")
      wallet = await Wallet.create({
        userId: decoded.userId,
        tenantId: user.tenant_id,
        availableBalance: 0,
        lockedBalance: 0,
        currency: user.default_currency || "USD",
      })
    }

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          balance: wallet.availableBalance || 0,
          bonusBalance: wallet.bonusBalance || 0,
          pendingWithdrawal: wallet.pendingWithdrawal || 0,
          currency: wallet.currency,
          totalWagered: wallet.totalWagered || 0,
          totalWinnings: wallet.totalWinnings || 0,
          status: wallet.status || "active",
        },
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx._id,
          type: tx.type,
          amount: tx.amount,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error("[v0] User wallet error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
