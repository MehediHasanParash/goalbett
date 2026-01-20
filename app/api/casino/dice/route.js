import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { CasinoService } from "@/lib/services/casino-service"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { userId, tenantId, stake, target, overUnder } = body

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const round = await CasinoService.playDice({
      userId,
      tenantId,
      stake: Number.parseFloat(stake),
      target: Number.parseInt(target),
      overUnder,
      metadata: {
        ip,
        userAgent,
        device: "web",
      },
    })

    return NextResponse.json({
      success: true,
      round,
    })
  } catch (error) {
    console.error("[v0] Error playing dice:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
