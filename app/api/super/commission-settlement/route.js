import { NextResponse } from "next/server"
import { CommissionSettlementService } from "@/lib/services/commission-settlement-service"
import connectDB from "@/lib/db"
import Settlement from "@/lib/models/Settlement"

// GET - Get commission settlement history and stats
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const query = { settlementType: "agent_commission" }
    if (tenantId) query.tenantId = tenantId

    const [settlements, total] = await Promise.all([
      Settlement.find(query)
        .populate("beneficiaryId", "fullName username email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Settlement.countDocuments(query),
    ])

    // Calculate stats
    const stats = await Settlement.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSettlements: { $sum: 1 },
          totalPaid: { $sum: "$netAmount" },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      settlements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || { totalSettlements: 0, totalPaid: 0, pendingCount: 0, completedCount: 0 },
    })
  } catch (error) {
    console.error("[v0] Commission settlement API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Manually trigger commission settlement
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { action, tenantId, agentId } = body

    if (action === "run_weekly" || action === "run_settlement") {
      const results = await CommissionSettlementService.runWeeklySettlement({
        tenantId,
        processedBy: "manual_trigger",
      })

      return NextResponse.json({
        success: true,
        results,
        agentsProcessed: results?.agentsProcessed || 0,
        totalCommission: results?.totalCommission || 0,
      })
    }

    if (action === "preview" || action === "calculate_preview") {
      const now = new Date()
      const lastMonday = new Date(now)
      lastMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7)
      lastMonday.setHours(0, 0, 0, 0)

      const lastSunday = new Date(lastMonday)
      lastSunday.setDate(lastMonday.getDate() + 6)
      lastSunday.setHours(23, 59, 59, 999)

      if (agentId) {
        const preview = await CommissionSettlementService.calculateAgentGGR({
          agentId,
          tenantId,
          periodStart: lastMonday,
          periodEnd: lastSunday,
        })
        return NextResponse.json({ success: true, preview })
      } else {
        // Get preview for all agents (full settlement preview)
        const preview = await CommissionSettlementService.previewWeeklySettlement({
          tenantId,
          periodStart: lastMonday,
          periodEnd: lastSunday,
        })
        return NextResponse.json({ success: true, preview })
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Commission settlement action error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
