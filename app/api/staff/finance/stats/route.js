import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Transaction from "@/lib/models/Transaction"
import Bet from "@/lib/models/Bet"
import { verifyToken } from "@/lib/jwt"
import { hasPermission } from "@/lib/staff-permissions"

export async function GET(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !hasPermission(decoded.role, "view_deposits")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const tenantId = decoded.tenant_id || decoded.tenantId

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    switch (range) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24)
        break
      case "7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    // Get deposit stats
    const depositStats = await Transaction.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          type: "deposit",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    // Get withdrawal stats
    const withdrawalStats = await Transaction.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          type: "withdrawal",
          createdAt: { $gte: startDate },
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

    // Calculate GGR from bets
    const betStats = await Bet.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalStake: { $sum: "$stake" },
          totalPayout: { $sum: { $cond: [{ $eq: ["$status", "won"] }, "$potentialWin", 0] } },
        },
      },
    ])

    const totalDeposits = depositStats[0]?.total || 0
    const depositCount = depositStats[0]?.count || 0

    const completedWithdrawals = withdrawalStats.find((w) => w._id === "completed")
    const pendingWithdrawals = withdrawalStats.find((w) => w._id === "pending")

    const totalWithdrawals = completedWithdrawals?.total || 0
    const withdrawalCount = completedWithdrawals?.count || 0
    const pendingWithdrawalsTotal = pendingWithdrawals?.total || 0
    const pendingCount = pendingWithdrawals?.count || 0

    const totalStake = betStats[0]?.totalStake || 0
    const totalPayout = betStats[0]?.totalPayout || 0
    const ggr = totalStake - totalPayout
    const netRevenue = ggr * 0.8 // Assuming 20% goes to taxes/fees

    return NextResponse.json({
      success: true,
      stats: {
        totalDeposits,
        depositCount,
        totalWithdrawals,
        withdrawalCount,
        pendingWithdrawals: pendingWithdrawalsTotal,
        pendingCount,
        ggr,
        netRevenue,
      },
    })
  } catch (error) {
    console.error("Error fetching finance stats:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
