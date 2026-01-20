import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"

// GET - List all sports (super admin)
export async function GET(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    console.log("[v0] Sports GET Auth result:", auth)

    if (!auth.authenticated) {
      console.error("[v0] Sports GET Auth failed:", auth.error)
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const Sport = (await import("@/lib/models/Sport")).default

    const sports = await Sport.find({}).sort({ order: 1 })

    return NextResponse.json({ success: true, data: sports, count: sports.length })
  } catch (error) {
    console.error("[v0] Super admin sports GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new sport
export async function POST(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    console.log("[v0] Sports POST Auth result:", auth)

    if (!auth.authenticated) {
      console.error("[v0] Sports POST Auth failed:", auth.error, "User:", auth.user)
      return NextResponse.json(
        {
          error: auth.error || "Unauthorized",
          details: "Super admin access required",
          userRole: auth.user?.role,
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    console.log("[v0] Creating sport with data:", body)

    await connectDB()
    const Sport = (await import("@/lib/models/Sport")).default

    const sport = await Sport.create(body)
    console.log("[v0] Sport created successfully:", sport)

    return NextResponse.json({ success: true, data: sport })
  } catch (error) {
    console.error("[v0] Super admin sports POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
