import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/db"
import Bet from "@/lib/models/Bet"
import GuestSession from "@/lib/models/GuestSession"
import mongoose from "mongoose"

export async function POST(request) {
  try {
    // Verify agent auth
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || !["agent", "sub_agent"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized: Agent access required" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { betId, selections, totalOdds, stake, estimatedPayout } = body

    if (!betId) {
      return NextResponse.json({ error: "BetID is required" }, { status: 400 })
    }

    const guestSession = await GuestSession.findOne({ bet_id: betId })

    if (guestSession) {
      guestSession.status = "accepted"
      guestSession.accepted_by = decoded.userId
      guestSession.accepted_at = new Date()
      await guestSession.save()
    }

    const bet = await Bet.create({
      tenantId: decoded.tenant_id,
      userId: decoded.userId, // Agent is the user placing the bet
      agentId: decoded.userId, // Same agent
      type: selections.length > 1 ? "multiple" : "single",
      stake: stake,
      currency: "USD",
      totalOdds: totalOdds,
      potentialWin: estimatedPayout,
      actualWin: 0,
      selections: selections.map((sel) => ({
        eventId: sel.matchId || sel.id || new mongoose.Types.ObjectId(),
        eventName: sel.match || sel.matchName || "Unknown Match",
        marketName: sel.betType || "Unknown Market",
        selectionName: sel.selection || "Unknown Selection",
        odds: sel.odds || 1.0,
        status: "pending",
      })),
      status: "pending",
      placedFrom: {
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
        device: "agent_scanner",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Bet accepted successfully",
      betId: bet._id,
      ticketNumber: bet.ticketNumber,
      guestBetId: betId,
    })
  } catch (error) {
    console.error("[v0] Accept bet error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to accept bet" }, { status: 500 })
  }
}
