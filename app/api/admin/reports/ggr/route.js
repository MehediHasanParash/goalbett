import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { SettlementService } from "@/lib/services/settlement-service"

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!tenantId || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    const ggrReport = await SettlementService.calculateGGR({
      tenantId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    })

    return NextResponse.json({
      success: true,
      report: ggrReport,
    })
  } catch (error) {
    console.error("[v0] Error generating GGR report:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
