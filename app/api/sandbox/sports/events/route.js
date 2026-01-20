/**
 * Sandbox Sports Events API
 *
 * Endpoints for managing demo sports events:
 * - GET: List available events
 * - POST: Create demo event (admin)
 * - PUT: Update event odds (admin)
 */

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"
import { SandboxSportsEngine } from "@/lib/sandbox/sports-engine"
import Event from "@/lib/models/Event"

// GET - List available events
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get("sportId")
    const leagueId = searchParams.get("leagueId")
    const status = searchParams.get("status") || "scheduled"
    const limit = Number.parseInt(searchParams.get("limit")) || 50

    console.log("[v0] Fetching sandbox events with params:", { sportId, leagueId, status, limit })

    const events = await SandboxSportsEngine.getAvailableEvents({
      sportId,
      leagueId,
      status,
      limit,
    })

    console.log("[v0] Found events:", events.length)

    if (events.length === 0) {
      const totalEvents = await Event.countDocuments({})
      const sandboxEvents = await Event.countDocuments({ "metadata.isSandbox": true })
      const eventsWithMetadata = await Event.countDocuments({ metadata: { $exists: true } })

      console.log("[v0] Debug - Total events:", totalEvents)
      console.log("[v0] Debug - Sandbox events:", sandboxEvents)
      console.log("[v0] Debug - Events with metadata:", eventsWithMetadata)

      // Sample an event to see its structure
      const sampleEvent = await Event.findOne({}).lean()
      if (sampleEvent) {
        console.log("[v0] Debug - Sample event metadata:", JSON.stringify(sampleEvent.metadata, null, 2))
        console.log("[v0] Debug - Sample event _id:", sampleEvent._id)
        console.log("[v0] Debug - Sample event status:", sampleEvent.status)
      }
    } else {
      console.log("[v0] Debug - First event:", {
        _id: events[0]._id,
        name: events[0].name,
        metadata: events[0].metadata,
        status: events[0].status,
      })
    }

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
    })
  } catch (error) {
    console.error("[v0] Sandbox events GET error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create demo event
export async function POST(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { sportId, leagueId, homeTeam, awayTeam, startTime, odds, markets } = body

    if (!sportId || !leagueId || !homeTeam?.name || !awayTeam?.name || !startTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: sportId, leagueId, homeTeam, awayTeam, startTime",
        },
        { status: 400 },
      )
    }

    const event = await SandboxSportsEngine.createDemoEvent({
      tenantId: auth.user.tenant_id,
      sportId,
      leagueId,
      homeTeam,
      awayTeam,
      startTime,
      odds,
      markets,
      createdBy: auth.user.userId,
    })

    console.log("[v0] Created event metadata:", event.metadata)

    return NextResponse.json({
      success: true,
      message: "Demo event created successfully",
      data: event,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update event odds
export async function PUT(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { eventId, odds } = body

    if (!eventId || !odds) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing eventId or odds",
        },
        { status: 400 },
      )
    }

    const event = await SandboxSportsEngine.updateEventOdds(eventId, odds, auth.user.userId)

    return NextResponse.json({
      success: true,
      message: "Event odds updated",
      data: event,
    })
  } catch (error) {
    console.error("[v0] Sandbox events PUT error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
