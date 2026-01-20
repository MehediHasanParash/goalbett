import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Event from "@/lib/models/Event"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"

// PUT - Update event
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await connectDB()

    const event = await Event.findByIdAndUpdate(params.id, body, { new: true })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error("[v0] Super admin events PUT error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete event
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const event = await Event.findByIdAndDelete(params.id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Event deleted" })
  } catch (error) {
    console.error("[v0] Super admin events DELETE error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
