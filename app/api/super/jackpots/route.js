import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import Jackpot from "@/lib/models/Jackpot"
import JackpotEntry from "@/lib/models/JackpotEntry"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    console.log("[v0] Jackpots GET - Token present:", !!token)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] Jackpots GET - Decoded token:", decoded ? { role: decoded.role, userId: decoded.userId } : null)

    const allowedRoles = ["superadmin", "super_admin", "tenant_admin", "admin"]
    if (!decoded || !allowedRoles.includes(decoded.role)) {
      console.log("[v0] Jackpots GET - Forbidden. Role:", decoded?.role, "Allowed:", allowedRoles)
      return NextResponse.json({ error: `Forbidden - Role '${decoded?.role}' not allowed` }, { status: 403 })
    }

    await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const query = {}
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    if (status) query.status = status
    if (type) query.type = type

    const jackpots = await Jackpot.find(query).sort({ createdAt: -1 }).lean()

    // Get participant counts for each jackpot
    const jackpotsWithStats = await Promise.all(
      jackpots.map(async (jackpot) => {
        const participantCount = await JackpotEntry.countDocuments({ jackpotId: jackpot._id })
        return {
          ...jackpot,
          participantCount,
        }
      }),
    )

    // Calculate summary stats
    const activeRounds = jackpots.filter((j) => j.status === "active").length
    const totalPool = jackpots.filter((j) => j.status === "active").reduce((sum, j) => sum + (j.pool?.current || 0), 0)
    const totalParticipants = jackpotsWithStats
      .filter((j) => j.status === "active")
      .reduce((sum, j) => sum + j.participantCount, 0)
    const totalRollovers = jackpots.reduce((sum, j) => sum + (j.rollover?.count || 0), 0)

    // Get participation trend (last 5 weeks)
    const now = new Date()
    const weeks = []
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - i * 7 - 7)
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() - i * 7)

      const entries = await JackpotEntry.countDocuments({
        createdAt: { $gte: weekStart, $lt: weekEnd },
      })

      weeks.push({
        week: `Week ${5 - i}`,
        participants: entries,
      })
    }

    console.log("[v0] Jackpots GET - Success. Count:", jackpots.length)

    return NextResponse.json({
      success: true,
      jackpots: jackpotsWithStats,
      stats: {
        activeRounds,
        totalPool,
        totalParticipants,
        totalRollovers,
      },
      participationTrend: weeks,
    })
  } catch (error) {
    console.error("[v0] Jackpots API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    console.log("[v0] Jackpots POST - Token present:", !!token)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] Jackpots POST - Decoded token:", decoded ? { role: decoded.role, userId: decoded.userId } : null)

    const allowedRoles = ["superadmin", "super_admin", "admin"]
    if (!decoded || !allowedRoles.includes(decoded.role)) {
      console.log("[v0] Jackpots POST - Forbidden. Role:", decoded?.role)
      return NextResponse.json({ error: `Forbidden - Role '${decoded?.role}' not allowed` }, { status: 403 })
    }

    await connectToDatabase()
    const data = await request.json()

    const jackpot = new Jackpot({
      ...data,
      pool: {
        current: data.pool?.initial || 0,
        initial: data.pool?.initial || 0,
        guaranteed: data.pool?.guaranteed || 0,
        contributionRate: data.pool?.contributionRate || 5,
      },
      createdBy: decoded.userId,
    })

    await jackpot.save()
    console.log("[v0] Jackpots POST - Created:", jackpot._id)

    return NextResponse.json({ success: true, jackpot })
  } catch (error) {
    console.error("[v0] Jackpots API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
