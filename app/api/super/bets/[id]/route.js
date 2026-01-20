import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Bet from "@/lib/models/Bet"
import Wallet from "@/lib/models/Wallet"
import { logAudit } from "@/lib/audit-logger"

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const { id } = await params
    const bet = await Bet.findById(id).populate("userId", "username email phone").populate("tenantId", "name").lean()

    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, bet })
  } catch (error) {
    console.error("[v0] Super admin bet GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const { id } = await params
    const body = await request.json()
    const { action, reason } = body

    const bet = await Bet.findById(id)
    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 })
    }

    const previousStatus = bet.status

    switch (action) {
      case "void":
        // Void the bet and refund stake
        bet.status = "void"
        bet.settledAt = new Date()
        bet.settledBy = "manual"

        // Refund stake to user wallet
        const wallet = await Wallet.findOne({ userId: bet.userId })
        if (wallet) {
          wallet.balance += bet.stake
          await wallet.save()
        }
        break

      case "settle_won":
        // Settle as won and credit winnings
        bet.status = "won"
        bet.actualWin = bet.potentialWin
        bet.settledAt = new Date()
        bet.settledBy = "manual"

        // Credit winnings to user wallet
        const winWallet = await Wallet.findOne({ userId: bet.userId })
        if (winWallet) {
          winWallet.balance += bet.potentialWin
          await winWallet.save()
        }

        // Update all selections to won
        bet.selections = bet.selections.map((s) => ({ ...s.toObject(), status: "won" }))
        break

      case "settle_lost":
        // Settle as lost
        bet.status = "lost"
        bet.actualWin = 0
        bet.settledAt = new Date()
        bet.settledBy = "manual"

        // Update all selections to lost
        bet.selections = bet.selections.map((s) => ({ ...s.toObject(), status: "lost" }))
        break

      case "flag_review":
        // Flag for review (add a field or just log)
        bet.flaggedForReview = true
        bet.flagReason = reason
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await bet.save()

    // Log the action
    await logAudit({
      action: `bet_${action}`,
      performedBy: decoded.userId,
      targetType: "bet",
      targetId: bet._id,
      details: {
        previousStatus,
        newStatus: bet.status,
        reason,
        ticketNumber: bet.ticketNumber,
      },
    })

    return NextResponse.json({ success: true, bet })
  } catch (error) {
    console.error("[v0] Super admin bet PATCH error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
