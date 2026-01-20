import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Sport from "@/lib/models/Sport"
import League from "@/lib/models/League"
import Event from "@/lib/models/Event"
import { MOCK_SPORTS, MOCK_LEAGUES, MOCK_EVENTS } from "@/lib/mock-data/sports"

// POST - Seed database with mock data (no auth for initial setup)
export async function POST() {
  try {
    await connectDB()

    await Sport.deleteMany({})
    await League.deleteMany({})
    await Event.deleteMany({})

    const sports = await Sport.insertMany(MOCK_SPORTS.map((s) => ({ ...s, _id: undefined })))

    const sportIdMap = {}
    sports.forEach((sport, idx) => {
      sportIdMap[MOCK_SPORTS[idx]._id] = sport._id
    })

    const leaguesToInsert = MOCK_LEAGUES.map((league) => ({
      ...league,
      _id: undefined,
      sportId: sportIdMap[league.sportId] || sports[0]._id,
    }))

    const leagues = await League.insertMany(leaguesToInsert)

    const leagueIdMap = {}
    leagues.forEach((league, idx) => {
      leagueIdMap[MOCK_LEAGUES[idx]._id] = league._id
    })

    const eventsToInsert = MOCK_EVENTS.map((event) => ({
      ...event,
      _id: undefined,
      sportId: sportIdMap[event.sportId] || sports[0]._id,
      leagueId: leagueIdMap[event.leagueId] || leagues[0]._id,
      odds: {
        home: Number.parseFloat((1.5 + Math.random() * 2).toFixed(2)),
        draw: Number.parseFloat((2.8 + Math.random() * 1.5).toFixed(2)),
        away: Number.parseFloat((2 + Math.random() * 3).toFixed(2)),
      },
    }))

    const events = await Event.insertMany(eventsToInsert)

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        sports: sports.length,
        leagues: leagues.length,
        events: events.length,
      },
    })
  } catch (error) {
    console.error("[v0] Seed error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
