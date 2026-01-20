import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Bet from "@/lib/models/Bet"

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const tenantId = searchParams.get("tenantId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search")

    // Build query
    const query = {}
    if (status && status !== "all") {
      query.status = status
    }
    if (tenantId) {
      query.tenantId = tenantId
    }

    // Get bets with user info - populate user with tenant_id
    const skip = (page - 1) * limit
    const bets = await Bet.find(query)
      .populate({
        path: "userId",
        select: "username email phone tenant_id",
        populate: {
          path: "tenant_id",
          select: "name",
        },
      })
      .populate("tenantId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const mappedBets = bets.map((bet) => {
      // If tenantId is not populated, try to get it from user's tenant_id
      if (!bet.tenantId?.name && bet.userId?.tenant_id?.name) {
        bet.tenantId = bet.userId.tenant_id
      }
      return bet
    })

    const total = await Bet.countDocuments(query)

    // Get stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayStats, totalStats, pendingCount] = await Promise.all([
      Bet.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalStakes: { $sum: "$stake" },
          },
        },
      ]),
      Bet.aggregate([
        {
          $group: {
            _id: null,
            totalStakes: { $sum: "$stake" },
            totalWon: {
              $sum: {
                $cond: [{ $eq: ["$status", "won"] }, "$actualWin", 0],
              },
            },
          },
        },
      ]),
      Bet.countDocuments({ status: "pending" }),
    ])

    const stats = {
      todayBets: todayStats[0]?.count || 0,
      todayStakes: todayStats[0]?.totalStakes || 0,
      totalStakes: totalStats[0]?.totalStakes || 0,
      totalWon: totalStats[0]?.totalWon || 0,
      ggr: (totalStats[0]?.totalStakes || 0) - (totalStats[0]?.totalWon || 0),
      pendingReview: pendingCount,
    }

    return NextResponse.json({
      success: true,
      bets: mappedBets,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Super admin bets GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
