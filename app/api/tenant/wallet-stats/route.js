import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/db"
import LedgerEntry from "@/lib/models/LedgerEntry"

// GET - Get wallet statistics for tenant
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const tenantId = decoded.tenant_id || decoded.tenantId

    // Get total float distributed (all time)
    const totalFloatResult = await LedgerEntry.aggregate([
      {
        $match: {
          tenantId: tenantId ? new (await import("mongoose")).default.Types.ObjectId(tenantId) : { $exists: true },
          transactionType: "AGENT_FLOAT_TOPUP",
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ])

    // Get this month's float
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const thisMonthResult = await LedgerEntry.aggregate([
      {
        $match: {
          tenantId: tenantId ? new (await import("mongoose")).default.Types.ObjectId(tenantId) : { $exists: true },
          transactionType: "AGENT_FLOAT_TOPUP",
          status: "completed",
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalFloatDistributed: totalFloatResult[0]?.total || 0,
        thisMonthFloat: thisMonthResult[0]?.total || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Wallet stats error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
