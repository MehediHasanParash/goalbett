import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Transaction from "@/lib/models/Transaction"

export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 50
    const type = searchParams.get("type") // deposit, withdrawal, bet_placed, etc.
    const status = searchParams.get("status") // pending, completed, failed
    const search = searchParams.get("search")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build filter
    const filter = {}

    if (type && type !== "all") {
      if (type === "deposits") {
        filter.type = { $in: ["deposit", "tenant_topup", "agent_topup"] }
      } else if (type === "withdrawals") {
        filter.type = "withdrawal"
      } else if (type === "bets") {
        filter.type = { $in: ["bet_placed", "bet_won", "bet_lost", "bet_refund"] }
      } else {
        filter.type = type
      }
    }

    if (status && status !== "all") {
      filter.status = status
    }

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    // Get transactions with populated fields
    const skip = (page - 1) * limit

    let transactions = await Transaction.find(filter)
      .populate("userId", "username email phone")
      .populate("tenantId", "name")
      .populate("walletId", "balance")
      .populate("betId", "ticketNumber")
      .populate("processedBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Search filter (after population)
    if (search) {
      const searchLower = search.toLowerCase()
      transactions = transactions.filter(
        (t) =>
          t._id.toString().includes(search) ||
          t.userId?.username?.toLowerCase().includes(searchLower) ||
          t.userId?.email?.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower) ||
          t.externalRef?.toLowerCase().includes(searchLower),
      )
    }

    const total = await Transaction.countDocuments(filter)

    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalRevenue, pendingPayouts, todayDeposits, commissionPaid, totalTransactionsToday, pendingCount] =
      await Promise.all([
        // Total revenue (all completed deposits)
        Transaction.aggregate([
          { $match: { type: { $in: ["deposit", "tenant_topup"] }, status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        // Pending withdrawals
        Transaction.aggregate([
          { $match: { type: "withdrawal", status: "pending" } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        // Today's deposits
        Transaction.aggregate([
          { $match: { type: { $in: ["deposit", "tenant_topup"] }, status: "completed", createdAt: { $gte: today } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        // Commission paid (last 30 days)
        Transaction.aggregate([
          { $match: { type: "commission", status: "completed", createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        // Total transactions today
        Transaction.countDocuments({ createdAt: { $gte: today } }),
        // Pending transactions count
        Transaction.countDocuments({ status: "pending" }),
      ])

    const stats = {
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingPayouts: pendingPayouts[0]?.total || 0,
      pendingPayoutsCount: pendingPayouts[0]?.count || 0,
      todayDeposits: todayDeposits[0]?.total || 0,
      commissionPaid: commissionPaid[0]?.total || 0,
      totalTransactionsToday,
      pendingCount,
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Super admin transactions GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
