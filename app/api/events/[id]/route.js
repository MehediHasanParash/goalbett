import { NextResponse } from "next/server"
import { MOCK_EVENTS, MOCK_MARKETS, MOCK_SPORTS, MOCK_LEAGUES } from "@/lib/mock-data/sports"
import connectDB from "@/lib/db"
import Event from "@/lib/models/Event"
import Market from "@/lib/models/Market"

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeMarkets = searchParams.get("markets") !== "false"
    const useMock = searchParams.get("mock") !== "false"

    let event = null
    let markets = []

    if (useMock) {
      event = MOCK_EVENTS.find((e) => e._id === id)

      if (event) {
        const sport = MOCK_SPORTS.find((s) => s._id === event.sportId)
        const league = MOCK_LEAGUES.find((l) => l._id === event.leagueId)

        event = {
          ...event,
          sport: sport ? { name: sport.name, slug: sport.slug } : null,
          league: league ? { name: league.name, slug: league.slug, country: league.country } : null,
        }

        if (includeMarkets) {
          markets = MOCK_MARKETS.filter((m) => m.eventId === id)
        }
      }
    } else {
      await connectDB()
      event = await Event.findById(id).populate("sportId", "name slug").populate("leagueId", "name slug country").lean()

      if (event && includeMarkets) {
        markets = await Market.find({ eventId: id, status: "open" }).sort({ order: 1 }).lean()
      }
    }

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        event,
        markets: includeMarkets ? markets : undefined,
      },
    })
  } catch (error) {
    console.error("[v0] Event detail error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
