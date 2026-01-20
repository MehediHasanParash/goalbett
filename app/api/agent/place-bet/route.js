import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Bet from "@/lib/models/Bet"
import User from "@/lib/models/User"
import Transaction from "@/lib/models/Transaction"
import WalletService from "@/lib/services/wallet-service"
import { verifyToken } from "@/lib/auth"

// POST - Agent places bet on behalf of player
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "agent") {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    const body = await request.json()
    const { playerId, selections, stake, betType = "single" } = body

    console.log("[v0] Agent placing bet:", { playerId, agentId: decoded.userId, stake, betType })

    if (!playerId) {
      return NextResponse.json({ success: false, error: "Player ID required" }, { status: 400 })
    }

    if (!selections || selections.length === 0) {
      return NextResponse.json({ success: false, error: "No selections provided" }, { status: 400 })
    }

    if (!stake || stake <= 0) {
      return NextResponse.json({ success: false, error: "Invalid stake amount" }, { status: 400 })
    }

    await connectDB()

    // Get agent
    const agent = await User.findById(decoded.userId)
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    // Get player
    const player = await User.findById(playerId)
    if (!player || player.role !== "player") {
      return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 })
    }

    const agentTenantId = (agent.tenant_id || agent.tenantId)?.toString()
    const playerTenantId = (player.tenant_id || player.tenantId)?.toString()

    console.log("[v0] Tenant validation:", {
      agentTenantId,
      playerTenantId,
      agentFields: Object.keys(agent.toObject()),
      playerFields: Object.keys(player.toObject()),
    })

    // Verify player belongs to agent's tenant
    if (!agentTenantId || !playerTenantId || playerTenantId !== agentTenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Player does not belong to your tenant",
        },
        { status: 403 },
      )
    }

    // Check player balance
    if (player.balance < stake) {
      return NextResponse.json({ success: false, error: "Insufficient player balance" }, { status: 400 })
    }

    // Calculate total odds and potential win
    let totalOdds = 1
    if (betType === "multiple") {
      selections.forEach((s) => {
        totalOdds *= s.odds
      })
    } else {
      totalOdds = selections[0].odds
    }

    const potentialWin = stake * totalOdds

    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const ticketNumber = `BET-${timestamp}-${random}`

    console.log("[v0] Raw selections received:", JSON.stringify(selections, null, 2))

    const processedSelections = selections.map((s) => {
      const isValidMarketId = s.marketId && /^[0-9a-fA-F]{24}$/.test(s.marketId)
      console.log("[v0] Processing selection:", {
        eventId: s.eventId,
        marketId: s.marketId,
        isValidMarketId,
        eventName: s.eventName,
      })

      const selection = {
        eventId: s.eventId,
        eventName: s.eventName,
        marketName: s.marketName,
        selectionName: s.selectionName,
        odds: s.odds,
        status: "pending",
      }

      // Only add marketId if it's valid
      if (isValidMarketId) {
        selection.marketId = s.marketId
      }

      return selection
    })

    console.log("[v0] Processed selections:", JSON.stringify(processedSelections, null, 2))

    // Create bet
    const bet = await Bet.create({
      ticketNumber,
      userId: playerId,
      tenantId: player.tenant_id || player.tenantId,
      type: betType,
      stake,
      currency: "ETB",
      totalOdds: Number.parseFloat(totalOdds.toFixed(2)),
      potentialWin: Number.parseFloat(potentialWin.toFixed(2)),
      selections: processedSelections,
      status: "pending",
      agentId: decoded.userId,
      placedFrom: {
        userAgent: request.headers.get("user-agent"),
      },
    })

    // Deduct from player balance
    const balanceBefore = player.balance
    player.balance -= stake
    await player.save()

    const playerWallet = await WalletService.getPlayerWallet(playerId, player.tenant_id || player.tenantId)

    // Create transaction
    await Transaction.create({
      walletId: playerWallet._id,
      userId: playerId,
      tenantId: player.tenant_id,
      type: "bet_placed",
      amount: -stake,
      currency: "ETB",
      balanceBefore,
      balanceAfter: player.balance,
      status: "completed",
      betId: bet._id,
      description: `Bet placed by agent - ${bet.ticketNumber}`,
      metadata: {
        agentId: decoded.userId,
        agentName: agent.fullName,
      },
    })

    console.log("[v0] Bet placed successfully:", {
      ticketNumber: bet.ticketNumber,
      playerId,
      agentId: decoded.userId,
    })

    return NextResponse.json({
      success: true,
      message: "Bet placed successfully",
      data: {
        ticketNumber: bet.ticketNumber,
        betId: bet._id,
        stake: bet.stake,
        totalOdds: bet.totalOdds,
        potentialWin: bet.potentialWin,
        selections: bet.selections,
        playerNewBalance: player.balance,
      },
    })
  } catch (error) {
    console.error("[v0] Agent place bet error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
