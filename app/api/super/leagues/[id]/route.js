import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import League from "@/lib/models/League"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"

// GET - Get single league
export async function GET(request, { params }) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const league = await League.findById(params.id).populate("sportId", "name slug")

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: league })
  } catch (error) {
    console.error("[v0] Get league error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update league
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await connectDB()

    const league = await League.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: league })
  } catch (error) {
    console.error("[v0] Update league error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete league
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const league = await League.findByIdAndDelete(params.id)

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: league })
  } catch (error) {
    console.error("[v0] Delete league error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
