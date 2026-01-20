import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { SettlementService } from "@/lib/services/settlement-service"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { settlementId, approvedBy } = body

    const settlement = await SettlementService.approveSettlement(settlementId, approvedBy)

    return NextResponse.json({
      success: true,
      settlement,
    })
  } catch (error) {
    console.error("[v0] Error approving settlement:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
