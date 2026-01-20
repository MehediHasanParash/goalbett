/**
 * Provably Fair Verification API
 *
 * Allows players to verify game fairness
 */

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { SandboxCasinoEngine } from "@/lib/sandbox/casino-engine"

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const roundNumber = searchParams.get("round")

    if (!roundNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing round number",
        },
        { status: 400 },
      )
    }

    const verification = await SandboxCasinoEngine.verifyRound(roundNumber)

    return NextResponse.json({
      success: true,
      data: verification,
    })
  } catch (error) {
    console.error("[v0] Verification error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
