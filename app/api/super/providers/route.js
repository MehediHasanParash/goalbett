import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import GameProvider from "@/lib/models/GameProvider"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const allowedRoles = ["superadmin", "super_admin", "tenant_admin", "admin"]

    if (!decoded || !allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const query = {}
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    if (status) query.status = status
    if (type) query.type = type

    const providers = await GameProvider.find(query).sort({ createdAt: -1 }).lean()

    // Calculate summary stats
    const stats = {
      totalProviders: providers.length,
      activeProviders: providers.filter((p) => p.status === "active").length,
      totalGames: providers.reduce((sum, p) => sum + (p.gamesCount || 0), 0),
      totalRevenue: providers.reduce((sum, p) => sum + (p.revenue || 0), 0),
    }

    return NextResponse.json({
      success: true,
      providers,
      stats,
    })
  } catch (error) {
    console.error("[v0] Providers API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const allowedRoles = ["superadmin", "super_admin", "admin"]

    if (!decoded || !allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()
    const data = await request.json()

    // Generate slug from name if not provided
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    }

    const provider = new GameProvider({
      ...data,
      createdBy: decoded.userId,
    })

    await provider.save()

    return NextResponse.json({ success: true, provider })
  } catch (error) {
    console.error("[v0] Providers API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
