import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-middleware"
import { connectDB } from "@/lib/db"
import Bet from "@/lib/models/Bet"
import LedgerEntry from "@/lib/models/LedgerEntry"

export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const betId = searchParams.get("betId")

    if (!betId) {
      return NextResponse.json({ error: "Bet ID required" }, { status: 400 })
    }

    const bet = await Bet.findById(betId).lean()
    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 })
    }

    if (bet.userId.toString() !== auth.user.userId && !["super_admin", "superadmin", "admin"].includes(auth.user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ledgerEntries = await LedgerEntry.find({ betId }).sort({ timestamp: -1 }).lean()

    const metadata = bet.settlementMetadata || {}
    const breakdown = metadata.breakdown || {}

    const receipt = {
      betId: bet._id,
      placedAt: bet.createdAt,
      settledAt: bet.settledAt,
      status: bet.status,
      result: bet.result,
      stake: bet.stake,
      payout: bet.potentialPayout,
      grossWin: breakdown.grossWin || 0,
      deductions: breakdown.deductions || [],
      totalDeductions: breakdown.totalDeductions || 0,
      netAmount: breakdown.netAmount || 0,
      currency: bet.currency,
      appliedRule: breakdown.appliedRule || null,
      ledgerEntries,
    }

    return NextResponse.json({ receipt })
  } catch (error) {
    console.error("[GET /api/financial/player-receipt] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}
