import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import SportsEvent from "@/lib/models/SportsEvent"
import { SportsBettingService } from "@/lib/services/sports-betting-service"
import Bet from "@/lib/models/Bet"

export async function POST(request, { params }) {
  try {
    await connectDB()

    const { eventId } = params
    const body = await request.json()
    const { result, marketResults, settledBy } = body

    const event = await SportsEvent.findOne({ eventId })
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    event.result = result
    event.status = "finished"

    for (const marketResult of marketResults) {
      const market = event.markets.find((m) => m.marketId === marketResult.marketId)
      if (market) {
        market.result = marketResult.result
        market.status = marketResult.status || "settled"
      }
    }

    event.settledAt = new Date()
    event.settledBy = "manual"
    await event.save()

    const betsToSettle = await Bet.find({
      "selections.eventId": event._id,
      status: "pending",
    })

    const settledBets = []
    for (const bet of betsToSettle) {
      const settled = await SportsBettingService.settleBet(bet._id, event.tenantId, settledBy)
      settledBets.push(settled)
    }

    return NextResponse.json({
      success: true,
      event,
      settledBetsCount: settledBets.length,
    })
  } catch (error) {
    console.error("[v0] Error settling event:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
