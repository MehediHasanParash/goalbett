import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"
import { SandboxCasinoEngine } from "@/lib/sandbox/casino-engine"
import CasinoRound from "@/lib/models/CasinoRound"
import mongoose from "mongoose"

export async function GET(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const gameType = searchParams.get("gameType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const tenantId = auth.user.tenant_id || auth.user.tenantId || "000000000000000000000000"

    const stats = await SandboxCasinoEngine.getRTPStats({
      tenantId,
      gameType,
      startDate,
      endDate,
    })

    // Get recent rounds
    const recentRounds = await CasinoRound.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      status: "completed",
    })
      .sort({ completedAt: -1 })
      .limit(20)
      .lean()

    // Calculate overall stats across all games
    const overallStats = {
      totalRounds: 0,
      totalStaked: 0,
      totalPayout: 0,
      ggr: 0,
      actualRtp: 0,
    }

    Object.values(stats).forEach((gameStat) => {
      overallStats.totalRounds += gameStat.totalRounds
      overallStats.totalStaked += gameStat.totalStaked
      overallStats.totalPayout += gameStat.totalPayout
      overallStats.ggr += gameStat.ggr
    })

    if (overallStats.totalStaked > 0) {
      overallStats.actualRtp = Number(((overallStats.totalPayout / overallStats.totalStaked) * 100).toFixed(2))
    }

    return NextResponse.json({
      success: true,
      stats: overallStats,
      gameStats: stats,
      recentRounds: recentRounds.map((round) => ({
        roundNumber: round.roundNumber,
        gameType: round.gameType,
        stake: round.stake,
        outcome: round.outcome,
        completedAt: round.completedAt,
      })),
      period: { startDate, endDate },
    })
  } catch (error) {
    console.error("[v0] Casino stats error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
