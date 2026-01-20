import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Sport from "@/lib/models/Sport"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"

// PUT - Update sport
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await connectDB()

    const sport = await Sport.findByIdAndUpdate(params.id, body, { new: true })

    if (!sport) {
      return NextResponse.json({ error: "Sport not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: sport })
  } catch (error) {
    console.error("[v0] Super admin sports PUT error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete sport
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const sport = await Sport.findByIdAndDelete(params.id)

    if (!sport) {
      return NextResponse.json({ error: "Sport not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Sport deleted" })
  } catch (error) {
    console.error("[v0] Super admin sports DELETE error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
