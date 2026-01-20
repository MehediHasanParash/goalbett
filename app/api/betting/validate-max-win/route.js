import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { SportsBettingService } from "@/lib/services/sports-betting-service"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { userId, tenantId, selections, stake } = body

    const validation = await SportsBettingService.validateMultiBetMaxWin({
      tenantId,
      userId,
      selections,
      stake: Number.parseFloat(stake),
    })

    return NextResponse.json({
      success: true,
      validation,
    })
  } catch (error) {
    console.error("[v0] Error validating max win:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
