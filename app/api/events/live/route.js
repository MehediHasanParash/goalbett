import { NextResponse } from "next/server"
import { MOCK_EVENTS, MOCK_SPORTS, MOCK_LEAGUES } from "@/lib/mock-data/sports"
import connectDB from "@/lib/db"
import Event from "@/lib/models/Event"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sportSlug = searchParams.get("sport")
    const useMock = searchParams.get("mock") === "true"

    let events = []

    if (useMock) {
      events = MOCK_EVENTS.filter((event) => {
        if (event.status !== "live") return false
        if (sportSlug) {
          const sportIdFromSlug = `sport_${sportSlug.replace(/-/g, "_")}`
          if (event.sportId !== sportIdFromSlug) return false
        }
        return true
      })

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

      // Build query for live events
      const query = {
        $or: [{ status: "live" }, { status: "in_play" }, { isLive: true }],
      }

      // Filter by sport if provided
      if (sportSlug) {
        const Sport = (await import("@/lib/models/Sport")).default
        const sport = await Sport.findOne({ slug: sportSlug }).lean()
        if (sport) {
          query.sportId = sport._id
        }
      }

      events = await Event.find(query)
        .populate("sportId", "name slug icon")
        .populate("leagueId", "name slug country")
        .sort({ startTime: 1 })
        .limit(20)
        .lean()

      events = events.map((event) => {
        // Ensure odds are properly structured
        const odds = event.odds || {}
        const matchWinnerOdds = odds["1X2"] || odds["Match Winner"] || odds["moneyline"] || {}

        return {
          ...event,
          _id: event._id.toString(),
          sport: event.sportId
            ? {
                name: event.sportId.name,
                slug: event.sportId.slug,
                icon: event.sportId.icon,
              }
            : null,
          league: event.leagueId
            ? {
                name: event.leagueId.name,
                slug: event.leagueId.slug,
                country: event.leagueId.country,
              }
            : null,
          // Ensure score structure
          score: event.score || { home: 0, away: 0 },
          // Ensure liveInfo structure
          liveInfo: event.liveInfo || { minute: null, period: null },
          // Ensure odds structure for 1X2 market
          odds: {
            ...odds,
            "1X2": {
              home: matchWinnerOdds.home || matchWinnerOdds["1"] || 2.0,
              draw: matchWinnerOdds.draw || matchWinnerOdds["X"] || 3.0,
              away: matchWinnerOdds.away || matchWinnerOdds["2"] || 3.5,
            },
          },
        }
      })

      console.log(`[v0] Found ${events.length} live events from database`)
    }

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
    })
  } catch (error) {
    console.error("[v0] Live events error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
