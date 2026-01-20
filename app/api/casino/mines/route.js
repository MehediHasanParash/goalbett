import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { CasinoService } from "@/lib/services/casino-service"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { userId, tenantId, stake, minesCount, revealedTiles } = body

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const round = await CasinoService.playMines({
      userId,
      tenantId,
      stake: Number.parseFloat(stake),
      minesCount: Number.parseInt(minesCount),
      revealedTiles,
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
    console.error("[v0] Error playing mines:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
