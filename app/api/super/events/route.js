import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Event from "@/lib/models/Event"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"

// GET - List events (super admin)
export async function GET(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get("sportId")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit")) || 100

    await connectDB()

    const query = {}
    if (sportId) query.sportId = sportId
    if (status) query.status = status

    const events = await Event.find(query).populate("sportId", "name slug").sort({ startTime: -1 }).limit(limit)

    return NextResponse.json({ success: true, data: events, count: events.length })
  } catch (error) {
    console.error("[v0] Super admin events GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create event
export async function POST(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await connectDB()

    const event = await Event.create(body)

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error("[v0] Super admin events POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
