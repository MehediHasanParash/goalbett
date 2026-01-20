/**
 * GGR (Gross Gaming Revenue) Report API
 *
 * Generates comprehensive GGR reports for regulators
 */

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import Bet from "@/lib/models/Bet"
import CasinoRound from "@/lib/models/CasinoRound"
import LedgerEntry from "@/lib/models/LedgerEntry"
import mongoose from "mongoose"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get("endDate") || new Date().toISOString()

    const dateQuery = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }

    console.log("[v0] GGR: Querying sandbox bets with date range:", { startDate, endDate })

    const sportsBettingStats = await Bet.aggregate([
      {
        $match: {
          "placedFrom.device": "sandbox",
          createdAt: dateQuery,
          status: { $in: ["won", "lost", "void", "pending"] }, // Include pending for total count
        },
      },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalStaked: { $sum: "$stake" },
          totalPayout: {
            $sum: {
              $cond: [{ $in: ["$status", ["won", "void"]] }, "$actualWin", 0],
            },
          },
          wonCount: { $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] } },
          lostCount: { $sum: { $cond: [{ $eq: ["$status", "lost"] }, 1, 0] } },
          voidCount: { $sum: { $cond: [{ $eq: ["$status", "void"] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        },
      },
    ])

    console.log("[v0] GGR: Sports betting stats:", sportsBettingStats)

    // Casino GGR
    const casinoStats = await CasinoRound.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(decoded.tenant_id),
          completedAt: dateQuery,
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$gameType",
          totalRounds: { $sum: 1 },
          totalStaked: { $sum: "$stake" },
          totalPayout: { $sum: "$outcome.payout" },
        },
      },
    ])

    // Commission calculations
    const commissionStats = await LedgerEntry.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(decoded.tenant_id),
          createdAt: dateQuery,
          transactionType: { $in: ["AGENT_COMMISSION", "OPERATOR_REVENUE_SHARE"] },
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$transactionType",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    // Calculate totals
    const sportsGGR = sportsBettingStats[0] ? sportsBettingStats[0].totalStaked - sportsBettingStats[0].totalPayout : 0

    let casinoTotalStaked = 0
    let casinoTotalPayout = 0
    const casinoByGame = {}

    casinoStats.forEach((g) => {
      casinoTotalStaked += g.totalStaked
      casinoTotalPayout += g.totalPayout
      casinoByGame[g._id] = {
        rounds: g.totalRounds,
        staked: g.totalStaked,
        payout: g.totalPayout,
        ggr: g.totalStaked - g.totalPayout,
        rtp: ((g.totalPayout / g.totalStaked) * 100).toFixed(2) + "%",
      }
    })

    const casinoGGR = casinoTotalStaked - casinoTotalPayout

    const commissions = {}
    commissionStats.forEach((c) => {
      commissions[c._id] = { amount: c.totalAmount, count: c.count }
    })

    const totalGGR = sportsGGR + casinoGGR
    const totalCommissions = 0 // Calculate commission as 0 for sandbox (no real money)
    const netGGR = sportsGGR - totalCommissions

    console.log("[v0] GGR: Calculated GGR:", {
      totalBets: sportsBettingStats[0]?.totalBets || 0,
      totalStaked: sportsBettingStats[0]?.totalStaked || 0,
      totalPayout: sportsBettingStats[0]?.totalPayout || 0,
      ggr: sportsGGR,
    })

    return NextResponse.json({
      success: true,
      data: {
        totalBets: sportsBettingStats[0]?.totalBets || 0,
        totalStaked: sportsBettingStats[0]?.totalStaked || 0,
        totalPayout: sportsBettingStats[0]?.totalPayout || 0,
        ggr: sportsGGR,
        commission: totalCommissions,
      },
      report: {
        period: { startDate, endDate },
        sportsBetting: {
          totalBets: sportsBettingStats[0]?.totalBets || 0,
          totalStaked: sportsBettingStats[0]?.totalStaked || 0,
          totalPayout: sportsBettingStats[0]?.totalPayout || 0,
          ggr: sportsGGR,
          breakdown: {
            won: sportsBettingStats[0]?.wonCount || 0,
            lost: sportsBettingStats[0]?.lostCount || 0,
            void: sportsBettingStats[0]?.voidCount || 0,
            pending: sportsBettingStats[0]?.pendingCount || 0,
          },
        },
        casino: {
          totalRounds: casinoStats.reduce((sum, g) => sum + g.totalRounds, 0),
          totalStaked: casinoTotalStaked,
          totalPayout: casinoTotalPayout,
          ggr: casinoGGR,
          byGame: casinoByGame,
        },
        commissions,
        summary: {
          totalGGR,
          totalCommissions,
          netGGR,
          currency: "USD",
        },
      },
    })
  } catch (error) {
    console.error("[v0] GGR Report error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
