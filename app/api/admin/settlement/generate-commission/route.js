import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { SettlementService } from "@/lib/services/settlement-service"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { tenantId, agentId, periodStart, periodEnd, preparedBy } = body

    const settlement = await SettlementService.generateAgentCommissionSettlement({
      tenantId,
      agentId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      preparedBy,
    })

    return NextResponse.json({
      success: true,
      settlement,
    })
  } catch (error) {
    console.error("[v0] Error generating commission settlement:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
