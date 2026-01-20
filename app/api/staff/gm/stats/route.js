import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Bet from "@/lib/models/Bet"
import Transaction from "@/lib/models/Transaction"
import { verifyToken } from "@/lib/jwt"
import { hasPermission } from "@/lib/staff-permissions"

export async function GET(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !hasPermission(decoded.role, "view_ggr")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tenantId = decoded.tenant_id || decoded.tenantId

    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Count agents
    const totalAgents = await User.countDocuments({ tenant_id: tenantId, role: "agent" })
    const activeAgents = await User.countDocuments({ tenant_id: tenantId, role: "agent", status: "active" })

    // Count players
    const totalPlayers = await User.countDocuments({ tenant_id: tenantId, role: "player" })
    const activePlayers = await User.countDocuments({
      tenant_id: tenantId,
      role: "player",
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })

    // Calculate GGR (Gross Gaming Revenue)
    const betsThisMonth = await Bet.aggregate([
      { $match: { tenant_id: tenantId, createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalStake: { $sum: "$stake" },
          totalPayout: { $sum: "$payout" },
        },
      },
    ])

    const betsLastMonth = await Bet.aggregate([
      { $match: { tenant_id: tenantId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      {
        $group: {
          _id: null,
          totalStake: { $sum: "$stake" },
          totalPayout: { $sum: "$payout" },
        },
      },
    ])

    const ggrThisMonth = betsThisMonth[0] ? (betsThisMonth[0].totalStake || 0) - (betsThisMonth[0].totalPayout || 0) : 0
    const ggrLastMonth = betsLastMonth[0] ? (betsLastMonth[0].totalStake || 0) - (betsLastMonth[0].totalPayout || 0) : 0

    // Get deposits/withdrawals
    const depositsThisMonth = await Transaction.aggregate([
      { $match: { tenant_id: tenantId, type: "deposit", status: "completed", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    const withdrawalsThisMonth = await Transaction.aggregate([
      { $match: { tenant_id: tenantId, type: "withdrawal", status: "completed", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    // Get weekly data for chart
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date.setHours(0, 0, 0, 0))
      const endOfDay = new Date(date.setHours(23, 59, 59, 999))

      const dayBets = await Bet.aggregate([
        { $match: { tenant_id: tenantId, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        {
          $group: {
            _id: null,
            stakes: { $sum: "$stake" },
            payouts: { $sum: "$payout" },
          },
        },
      ])

      const newPlayers = await User.countDocuments({
        tenant_id: tenantId,
        role: "player",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      })

      weeklyData.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        ggr: dayBets[0] ? (dayBets[0].stakes || 0) - (dayBets[0].payouts || 0) : 0,
        players: newPlayers,
      })
    }

    return NextResponse.json({
      stats: {
        totalAgents,
        activeAgents,
        totalPlayers,
        activePlayers,
        ggrThisMonth,
        ggrLastMonth,
        ggrChange: ggrLastMonth > 0 ? (((ggrThisMonth - ggrLastMonth) / ggrLastMonth) * 100).toFixed(1) : 0,
        depositsThisMonth: depositsThisMonth[0]?.total || 0,
        withdrawalsThisMonth: withdrawalsThisMonth[0]?.total || 0,
      },
      weeklyData,
    })
  } catch (error) {
    console.error("Error fetching GM stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
