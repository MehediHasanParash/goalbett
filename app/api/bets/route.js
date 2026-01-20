import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Bet from "@/lib/models/Bet"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth"
import WalletService from "@/lib/services/wallet-service"
import { SandboxSportsEngine } from "@/lib/sandbox/sports-engine"

// GET - Get user's bets
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // pending, won, lost, all
    const limit = Number.parseInt(searchParams.get("limit")) || 50
    const page = Number.parseInt(searchParams.get("page")) || 1
    const skip = (page - 1) * limit

    await connectDB()

    const query = { userId: decoded.userId }
    if (status && status !== "all") {
      query.status = status
    }

    const [bets, total] = await Promise.all([
      Bet.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Bet.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: bets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Bets GET error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Place a bet
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { selections, stake, betType = "single" } = body

    if (!selections || selections.length === 0) {
      return NextResponse.json({ success: false, error: "No selections provided" }, { status: 400 })
    }

    if (!stake || stake <= 0) {
      return NextResponse.json({ success: false, error: "Invalid stake amount" }, { status: 400 })
    }

    await connectDB()

    // Get user
    const user = await User.findById(decoded.userId).lean()
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const tenantId = user.tenant_id || user._id

    const wallet = await WalletService.getPlayerWallet(decoded.userId, tenantId)
    if (!wallet) {
      return NextResponse.json({ success: false, error: "Wallet not found" }, { status: 404 })
    }

    const currentBalance = Number(wallet.availableBalance) || 0
    const stakeAmount = Number(stake)

    console.log("[v0] Bet placement - Balance:", currentBalance, "Stake:", stakeAmount)

    // Check balance
    if (currentBalance < stakeAmount) {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 })
    }

    const result = await SandboxSportsEngine.placeBet({
      userId: decoded.userId,
      tenantId: tenantId,
      walletId: wallet._id,
      selections,
      stake: stakeAmount,
      betType,
      createdBy: decoded.userId,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details,
          enforcement: result.enforcement,
        },
        { status: 400 },
      )
    }

    // Get updated balance after bet placement
    const updatedWallet = await WalletService.getPlayerWallet(decoded.userId, tenantId)

    console.log("[v0] Bet placed successfully:", result.bet.ticketNumber)

    return NextResponse.json({
      success: true,
      message: "Bet placed successfully",
      data: {
        ...result.bet,
        newBalance: updatedWallet.availableBalance,
      },
      validation: result.validation,
    })
  } catch (error) {
    console.error("[v0] Place bet error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
