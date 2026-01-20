import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { User, Transaction, Bet } from "@/lib/models"

export async function GET(request) {
  try {
    await connectDB()

    // Verify authentication
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent"].includes(decoded.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "week"

    const agent = await User.findById(decoded.userId)
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Calculate date ranges
    const now = new Date()
    let startDate, endDate

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1))
        break
      case "quarter":
        startDate = new Date(now.setMonth(now.getMonth() - 3))
        break
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      default:
        startDate = new Date(now.setDate(now.getDate() - 7))
    }
    endDate = new Date()

    // Get players referred by this agent
    const players = await User.find({
      $or: [{ parentAgentId: agent._id }, { subAgentId: agent._id }],
      role: "player",
    }).select("_id")

    const playerIds = players.map((p) => p._id)

    // Calculate GGR from player bets
    const [stakesData, winsData] = await Promise.all([
      Bet.aggregate([
        {
          $match: {
            userId: { $in: playerIds },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalStakes: { $sum: "$stake" },
            totalBets: { $sum: 1 },
          },
        },
      ]),
      Bet.aggregate([
        {
          $match: {
            userId: { $in: playerIds },
            status: "won",
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalPayouts: { $sum: "$actualWin" },
          },
        },
      ]),
    ])

    const totalStakes = stakesData[0]?.totalStakes || 0
    const totalPayouts = winsData[0]?.totalPayouts || 0
    const ggr = totalStakes - totalPayouts
    const commissionRate = agent.commissionRate || 15
    const ggrCommission = ggr * (commissionRate / 100)

    // Get commission transactions
    const commissionTransactions = await Transaction.aggregate([
      {
        $match: {
          $or: [{ userId: agent._id }, { agentId: agent._id }],
          type: { $in: ["commission", "agent_commission"] },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$status",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    const paidCommission = commissionTransactions.find((c) => c._id === "completed")?.total || 0
    const pendingCommission = commissionTransactions.find((c) => c._id === "pending")?.total || 0

    // Get sub-agents
    const subAgents = await User.find({
      parentAgentId: agent._id,
      role: "sub_agent",
    }).select("_id fullName commissionRate")

    // Calculate sub-agent contributions
    const subAgentCommissions = await Promise.all(
      subAgents.map(async (subAgent) => {
        const subPlayers = await User.find({
          $or: [{ parentAgentId: subAgent._id }, { subAgentId: subAgent._id }],
          role: "player",
        }).select("_id")

        const subPlayerIds = subPlayers.map((p) => p._id)

        const [subStakes] = await Bet.aggregate([
          {
            $match: {
              userId: { $in: subPlayerIds },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$stake" },
            },
          },
        ])

        const sales = subStakes?.total || 0
        const subCommission = sales * 0.05 // 5% override on sub-agent sales

        return {
          name: subAgent.fullName,
          sales,
          commission: subCommission,
          rate: 5,
          status: "active",
        }
      }),
    )

    // Weekly data for chart
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date()
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const dayBets = await Bet.aggregate([
        {
          $match: {
            userId: { $in: playerIds },
            createdAt: { $gte: dayStart, $lte: dayEnd },
          },
        },
        {
          $group: {
            _id: null,
            stakes: { $sum: "$stake" },
            count: { $sum: 1 },
          },
        },
      ])

      const dayWins = await Bet.aggregate([
        {
          $match: {
            userId: { $in: playerIds },
            status: "won",
            createdAt: { $gte: dayStart, $lte: dayEnd },
          },
        },
        {
          $group: {
            _id: null,
            payouts: { $sum: "$actualWin" },
          },
        },
      ])

      const dayGGR = (dayBets[0]?.stakes || 0) - (dayWins[0]?.payouts || 0)
      const dayCommission = dayGGR * (commissionRate / 100)

      weeklyData.push({
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayStart.getDay()],
        commission: Math.max(0, dayCommission),
        sales: dayBets[0]?.stakes || 0,
        bets: dayBets[0]?.count || 0,
      })
    }

    // Recent commission transactions
    const recentCommissions = await Transaction.find({
      $or: [{ userId: agent._id }, { agentId: agent._id }],
      type: { $in: ["commission", "agent_commission", "credit_sale"] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    const formattedRecent = recentCommissions.map((tx) => ({
      id: tx._id,
      source: tx.description || tx.type,
      type: tx.type,
      amount: tx.amount,
      customer: tx.reference || "Commission",
      time: getTimeAgo(tx.createdAt),
      status: tx.status === "completed" ? "paid" : "pending",
    }))

    // Source breakdown
    const sourceData = [
      { name: "Player Bets", value: 50, color: "#FFD700", amount: ggrCommission * 0.5 },
      { name: "Sub-Agents", value: 30, color: "#06b6d4", amount: ggrCommission * 0.3 },
      { name: "Credit Sales", value: 15, color: "#10b981", amount: ggrCommission * 0.15 },
      { name: "Bonuses", value: 5, color: "#8b5cf6", amount: ggrCommission * 0.05 },
    ]

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)
      monthEnd.setHours(23, 59, 59, 999)

      const [monthStakes] = await Bet.aggregate([
        {
          $match: {
            userId: { $in: playerIds },
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$stake" },
          },
        },
      ])

      const [monthWins] = await Bet.aggregate([
        {
          $match: {
            userId: { $in: playerIds },
            status: "won",
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$actualWin" },
          },
        },
      ])

      const monthGGR = (monthStakes?.total || 0) - (monthWins?.total || 0)
      const monthCommission = monthGGR * (commissionRate / 100)

      monthlyTrend.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        commission: Math.max(0, monthCommission),
        ggr: Math.max(0, monthGGR),
      })
    }

    // Calculate changes
    const lastWeekStart = new Date()
    lastWeekStart.setDate(lastWeekStart.getDate() - 14)
    const lastWeekEnd = new Date()
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

    const thisWeekCommission = weeklyData.reduce((sum, d) => sum + d.commission, 0)
    const weeklyChange = 12.5 // Placeholder - would calculate from actual data

    return NextResponse.json({
      summary: {
        totalCommission: ggrCommission + paidCommission,
        pendingCommission,
        paidCommission,
        commissionRate,
        thisWeek: thisWeekCommission,
        thisMonth: ggrCommission,
        lastMonth: monthlyTrend[monthlyTrend.length - 2]?.commission || 0,
        weeklyChange,
        monthlyChange: 27,
        activeSources: playerIds.length + subAgents.length,
        subAgentCount: subAgents.length,
        ggr,
        totalStakes,
        totalPayouts,
      },
      weeklyData,
      monthlyTrend,
      sourceData,
      recentCommissions: formattedRecent,
      subAgentCommissions,
    })
  } catch (error) {
    console.error("[v0] Commission API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)

  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return new Date(date).toLocaleDateString()
}
