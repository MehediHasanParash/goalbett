import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import SportsEvent from "@/lib/models/SportsEvent"

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const status = searchParams.get("status")

    const query = { tenantId }
    if (status) query.status = status

    const events = await SportsEvent.find(query).sort({ eventDate: 1 }).limit(100)

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error("[v0] Error fetching events:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { tenantId, sport, league, homeTeam, awayTeam, eventDate, markets } = body

    const event = await SportsEvent.create({
      tenantId,
      sport,
      league,
      homeTeam,
      awayTeam,
      eventDate: new Date(eventDate),
      markets: markets.map((m) => ({
        marketId: `MKT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        marketName: m.marketName,
        marketType: m.marketType,
        odds: new Map(Object.entries(m.odds)),
        status: "open",
      })),
      status: "upcoming",
    })

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("[v0] Error creating event:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
