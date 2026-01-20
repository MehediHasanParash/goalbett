import { NextResponse } from "next/server"
import { MOCK_EVENTS, MOCK_SPORTS, MOCK_LEAGUES } from "@/lib/mock-data/sports"
import connectDB from "@/lib/db"
import Event from "@/lib/models/Event"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit")) || 10
    const useMock = searchParams.get("mock") !== "false"

    let events = []

    if (useMock) {
      events = MOCK_EVENTS.filter((event) => event.isFeatured && event.isBettingOpen).slice(0, limit)

      // Enrich with sport and league info
      events = events.map((event) => {
        const sport = MOCK_SPORTS.find((s) => s._id === event.sportId)
        const league = MOCK_LEAGUES.find((l) => l._id === event.leagueId)
        return {
          ...event,
          sport: sport ? { name: sport.name, slug: sport.slug } : null,
          league: league ? { name: league.name, slug: league.slug, country: league.country } : null,
        }
      })
    } else {
      await connectDB()

      events = await Event.find({
        isFeatured: true,
        isBettingOpen: true,
        status: { $in: ["scheduled", "live"] },
      })
        .populate("sportId", "name slug")
        .populate("leagueId", "name slug country")
        .sort({ startTime: 1 })
        .limit(limit)
        .lean()
    }

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
    })
  } catch (error) {
    console.error("[v0] Featured events error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
