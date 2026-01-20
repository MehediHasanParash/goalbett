import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { verifyToken } from "@/lib/jwt"
import Event from "@/lib/models/Event"

export async function GET(request) {
  try {
    console.log("[v0] Matches API: Fetching events from database...")

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    const decoded = verifyToken(token)

    if (!decoded || !["superadmin", "super_admin", "tenant_admin", "admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    console.log("[v0] Matches API: Querying all events...")

    const events = await Event.find({})
      .populate("sportId", "name icon")
      .populate("leagueId", "name")
      .sort({ startTime: -1 })
      .limit(100)
      .lean()

    console.log("[v0] Matches API: Found", events.length, "events in database")
    if (events.length > 0) {
      console.log("[v0] Matches API: First event sample:", {
        id: events[0]._id,
        homeTeam: events[0].homeTeam,
        awayTeam: events[0].awayTeam,
        status: events[0].status,
      })
    }

    const matches = events.map((event) => ({
      _id: event._id.toString(),
      homeTeam: event.homeTeam?.name || "Unknown",
      awayTeam: event.awayTeam?.name || "Unknown",
      league: event.leagueId?.name || "Unknown League",
      sport: event.sportId?.name || "Unknown Sport",
      startTime: event.startTime,
      status: event.status,
    }))

    console.log("[v0] Matches API: Returning", matches.length, "matches")
    return NextResponse.json({ success: true, matches })
  } catch (error) {
    console.error("[v0] Matches API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
