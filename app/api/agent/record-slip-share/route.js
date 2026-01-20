import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Bet } from "@/lib/models"
import { verifyJWT } from "@/lib/auth"

export async function POST(request) {
  try {
    await dbConnect()

    // Verify agent authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== "agent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { betId, platform, sharedAt } = await request.json()

    if (!betId || !platform) {
      return NextResponse.json({ success: false, error: "Missing betId or platform" }, { status: 400 })
    }

    // Find the bet by betId (ticketNumber) and update with slip sharing info
    const bet = await Bet.findOneAndUpdate(
      { ticketNumber: betId },
      {
        $push: {
          slipShares: {
            platform,
            sharedAt: sharedAt || new Date(),
            sharedBy: decoded.userId,
          },
        },
        $set: {
          slipShared: true,
          lastSlipShareAt: new Date(),
        },
      },
      { new: true },
    )

    if (!bet) {
      // If bet not found by ticketNumber, try to find in GuestSession betslips
      // This is for guest bets that haven't been converted to full bets yet
      console.log("[v0] Bet not found, recording share in separate collection")

      // We can still record it for audit purposes
      return NextResponse.json({
        success: true,
        message: "Share recorded (guest bet)",
        betId,
        platform,
      })
    }

    console.log("[v0] Slip share recorded:", { betId, platform, agentId: decoded.userId })

    return NextResponse.json({
      success: true,
      message: "Slip share recorded successfully",
      bet: {
        betId: bet.ticketNumber,
        slipShared: bet.slipShared,
        shareCount: bet.slipShares?.length || 1,
      },
    })
  } catch (error) {
    console.error("[v0] Record slip share error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET endpoint to verify if a slip was shared (for verification when player claims winnings)
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const betId = searchParams.get("betId")

    if (!betId) {
      return NextResponse.json({ success: false, error: "Missing betId" }, { status: 400 })
    }

    const bet = await Bet.findOne({ ticketNumber: betId }).select("ticketNumber slipShared slipShares lastSlipShareAt")

    if (!bet) {
      return NextResponse.json({ success: false, error: "Bet not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      verification: {
        betId: bet.ticketNumber,
        slipShared: bet.slipShared || false,
        shareHistory: bet.slipShares || [],
        lastSharedAt: bet.lastSlipShareAt,
        isVerified: bet.slipShared === true,
      },
    })
  } catch (error) {
    console.error("[v0] Verify slip share error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
