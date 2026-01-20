import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"

// GET - List all leagues (super admin)
export async function GET(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    console.log("[v0] Leagues GET Auth result:", auth)

    if (!auth.authenticated) {
      console.error("[v0] Leagues GET Auth failed:", auth.error)
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const League = (await import("@/lib/models/League")).default

    // Get sportId filter from query params if provided
    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get("sportId")

    const query = sportId ? { sportId } : {}
    const leagues = await League.find(query).populate("sportId", "name slug").sort({ sportId: 1, order: 1 })

    return NextResponse.json({ success: true, data: leagues, count: leagues.length })
  } catch (error) {
    console.error("[v0] Super admin leagues GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new league
export async function POST(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    console.log("[v0] Leagues POST Auth result:", auth)

    if (!auth.authenticated) {
      console.error("[v0] Leagues POST Auth failed:", auth.error, "User:", auth.user)
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
    console.log("[v0] Creating league with data:", body)

    await connectDB()
    const League = (await import("@/lib/models/League")).default

    const league = await League.create(body)
    console.log("[v0] League created successfully:", league)

    return NextResponse.json({ success: true, data: league })
  } catch (error) {
    console.error("[v0] Super admin leagues POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
