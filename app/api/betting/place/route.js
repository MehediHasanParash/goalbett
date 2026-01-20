import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { SportsBettingService } from "@/lib/services/sports-betting-service"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { userId, tenantId, selections, stake, type } = body

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const bet = await SportsBettingService.placeBet({
      userId,
      tenantId,
      selections,
      stake: Number.parseFloat(stake),
      type: type || "multiple",
      metadata: {
        ip,
        userAgent,
        device: "web",
      },
    })

    return NextResponse.json({
      success: true,
      bet,
    })
  } catch (error) {
    console.error("[v0] Error placing bet:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
