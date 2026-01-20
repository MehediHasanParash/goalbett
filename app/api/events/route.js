import { NextResponse } from "next/server"
import { MOCK_EVENTS, MOCK_SPORTS, MOCK_LEAGUES } from "@/lib/mock-data/sports"
import connectDB from "@/lib/db"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get("sportId")
    const sportSlug = searchParams.get("sport")
    const leagueId = searchParams.get("leagueId")
    const status = searchParams.get("status") // live, scheduled, finished
    const featured = searchParams.get("featured")
    const limit = Number.parseInt(searchParams.get("limit")) || 50
    const useMock = searchParams.get("mock") === "true"

    let events = []

    if (useMock) {
      events = MOCK_EVENTS.filter((event) => {
        if (sportId && event.sportId !== sportId) return false
        if (sportSlug) {
          const sportIdFromSlug = `sport_${sportSlug.replace(/-/g, "_")}`
          if (event.sportId !== sportIdFromSlug) return false
        }
        if (leagueId && event.leagueId !== leagueId) return false
        if (status && event.status !== status) return false
        if (featured === "true" && !event.isFeatured) return false
        return true
      }).slice(0, limit)

      // Enrich events with sport and league names
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
      const Event = (await import("@/lib/models/Event")).default

      const query = {}
      if (sportId) query.sportId = sportId
      if (leagueId) query.leagueId = leagueId
      if (status) query.status = status
      if (featured === "true") query.isFeatured = true

      events = await Event.find(query)
        .populate("sportId", "name slug icon")
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
    console.error("[v0] Events API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
