/**
 * Sandbox Sports Betting API
 *
 * Endpoints for placing and managing bets:
 * - GET: Get user's bets
 * - POST: Place a bet with max-win enforcement
 */

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import Bet from "@/lib/models/Bet"
import Wallet from "@/lib/models/Wallet"
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"
import { SandboxSportsEngine } from "@/lib/sandbox/sports-engine"
import WalletService from "@/lib/services/wallet-service"

async function getOrCreateDemoUser(tenantId) {
  let user = await User.findOne({ username: "demo_tester", tenant_id: tenantId })

  if (!user) {
    // Get default tenant if not provided
    if (!tenantId) {
      const tenant = await Tenant.findOne({ status: "active" })
      tenantId = tenant?._id
    }

    user = await User.create({
      username: "demo_tester",
      email: "demo@goalbett.com",
      password: "demo_password_hash",
      role: "player",
      tenant_id: tenantId,
      status: "active",
      metadata: { isDemo: true, createdFor: "TMA_Debug" },
    })
  }

  return user
}

// GET - Get user's bets
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const debugMode = searchParams.get("debug") === "true"

    let userId

    if (debugMode || !token || token === "null" || token === "undefined") {
      const tenant = await Tenant.findOne({ status: "active" })
      const demoUser = await getOrCreateDemoUser(tenant?._id)
      userId = demoUser._id
    } else {
      const decoded = await verifyToken(token)
      if (!decoded) {
        return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
      }
      userId = decoded.userId
    }

    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit")) || 50
    const page = Number.parseInt(searchParams.get("page")) || 1

    const query = { userId }
    if (status && status !== "all") query.status = status

    const [bets, total] = await Promise.all([
      Bet.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Bet.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: bets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[v0] Sandbox bets GET error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Place a bet
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { selections, stake, betType = "single", debug } = body

    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    let user
    let tenantId

    if (debug || !token || token === "null" || token === "undefined") {
      console.log("[v0] TMA Debug mode - using demo user")
      const tenant = await Tenant.findOne({ status: "active" })
      tenantId = tenant?._id
      user = await getOrCreateDemoUser(tenantId)
    } else {
      const decoded = await verifyToken(token)
      if (!decoded) {
        return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
      }
      user = await User.findById(decoded.userId)
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      tenantId = user.tenant_id || user._id
    }

    console.log("[v0] Sandbox bet request:", { userId: user._id, stake, selections: selections?.length })

    // Validate request
    if (!selections || selections.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No selections provided",
        },
        { status: 400 },
      )
    }

    if (!stake || stake <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid stake amount",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Using tenantId:", tenantId?.toString())

    const wallet = await WalletService.getPlayerWallet(user._id, tenantId)

    // If wallet has 0 balance and is for sandbox testing, fund it
    if (wallet && wallet.availableBalance === 0 && !wallet.metadata?.sandboxFunded) {
      console.log("[v0] Funding sandbox wallet with $10,000")
      wallet.availableBalance = 10000
      wallet.metadata = { ...wallet.metadata, isSandbox: true, sandboxFunded: true }
      await wallet.save()
    }

    console.log("[v0] Wallet balance:", wallet.availableBalance)

    // Check balance
    if (wallet.availableBalance < stake) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient balance",
          balance: wallet.availableBalance,
          required: stake,
        },
        { status: 400 },
      )
    }

    // Place bet using sandbox engine (includes max-win enforcement)
    const result = await SandboxSportsEngine.placeBet({
      userId: user._id,
      tenantId: tenantId,
      walletId: wallet._id,
      selections,
      stake,
      betType,
      createdBy: user._id,
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

    // Get updated balance
    const updatedWallet = await Wallet.findById(wallet._id)

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
    console.error("[v0] Sandbox bets POST error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
