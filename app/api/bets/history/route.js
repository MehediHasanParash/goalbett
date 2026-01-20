import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Bet from "@/lib/models/Bet"
import { verifyToken } from "@/lib/auth"

// GET - Get betting history with stats
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "all" // today, week, month, all

    await connectDB()

    // Build date filter
    let dateFilter = {}
    const now = new Date()

    if (period === "today") {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      dateFilter = { createdAt: { $gte: startOfDay } }
    } else if (period === "week") {
      const startOfWeek = new Date(now.setDate(now.getDate() - 7))
      dateFilter = { createdAt: { $gte: startOfWeek } }
    } else if (period === "month") {
      const startOfMonth = new Date(now.setDate(now.getDate() - 30))
      dateFilter = { createdAt: { $gte: startOfMonth } }
    }

    // Get stats
    const [stats, recentBets] = await Promise.all([
      Bet.aggregate([
        { $match: { userId: decoded.userId, ...dateFilter } },
        {
          $group: {
            _id: null,
            totalBets: { $sum: 1 },
            totalStake: { $sum: "$stake" },
            totalWinnings: { $sum: "$actualWin" },
            wonBets: {
              $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] },
            },
            lostBets: {
              $sum: { $cond: [{ $eq: ["$status", "lost"] }, 1, 0] },
            },
            pendingBets: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
          },
        },
      ]),
      Bet.find({ userId: decoded.userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ])

    const statsResult = stats[0] || {
      totalBets: 0,
      totalStake: 0,
      totalWinnings: 0,
      wonBets: 0,
      lostBets: 0,
      pendingBets: 0,
    }

    // Calculate profit/loss and win rate
    statsResult.profitLoss = statsResult.totalWinnings - statsResult.totalStake
    statsResult.winRate =
      statsResult.totalBets > 0
        ? ((statsResult.wonBets / (statsResult.wonBets + statsResult.lostBets)) * 100).toFixed(1)
        : 0

    return NextResponse.json({
      success: true,
      data: {
        stats: statsResult,
        recentBets,
        period,
      },
    })
  } catch (error) {
    console.error("[v0] Bet history error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
