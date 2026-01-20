import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Transaction from "@/lib/models/Transaction"
import { verifyToken } from "@/lib/jwt"

export async function GET(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "finance_manager") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"

    // Determine number of days
    let days = 7
    switch (range) {
      case "24h":
        days = 1
        break
      case "7d":
        days = 7
        break
      case "30d":
        days = 30
        break
      case "90d":
        days = 90
        break
    }

    const chartData = []
    const tenantId = decoded.tenant_id || decoded.tenantId

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date.setHours(0, 0, 0, 0))
      const endOfDay = new Date(date.setHours(23, 59, 59, 999))

      const query = {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }

      if (tenantId) {
        query.tenant_id = tenantId
      }

      const deposits = await Transaction.aggregate([
        { $match: { ...query, type: "deposit", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])

      const withdrawals = await Transaction.aggregate([
        { $match: { ...query, type: "withdrawal", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])

      chartData.push({
        name: startOfDay.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        deposits: deposits[0]?.total || 0,
        withdrawals: withdrawals[0]?.total || 0,
      })
    }

    return NextResponse.json({
      success: true,
      chartData,
    })
  } catch (error) {
    console.error("[Finance Chart] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
