import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Bet from "@/lib/models/Bet"
import User from "@/lib/models/User"
import Transaction from "@/lib/models/Transaction"
import AuditLog from "@/lib/models/AuditLog"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"

export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const { id } = await params

    let token = null
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }

    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get("token")?.value
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Only allow superadmin, admin, tenant_admin, agent roles
    const allowedRoles = ["superadmin", "super_admin", "admin", "tenant_admin", "agent"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Find the bet
    const bet = await Bet.findById(id).populate("userId", "username balance")
    if (!bet) {
      return NextResponse.json({ success: false, error: "Bet not found" }, { status: 404 })
    }

    // Check tenant access for non-superadmins
    if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      if (bet.tenantId.toString() !== decoded.tenant_id) {
        return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
      }
    }

    // Check if bet can be deleted (4 minute window)
    const DELETION_WINDOW_MS = 4 * 60 * 1000
    const createdAtMs = new Date(bet.createdAt).getTime()
    const timeSinceCreation = Date.now() - createdAtMs

    if (timeSinceCreation > DELETION_WINDOW_MS) {
      return NextResponse.json(
        {
          success: false,
          error: "Deletion window has expired. Bets can only be deleted within 4 minutes of creation.",
        },
        { status: 400 },
      )
    }

    // Only pending bets can be deleted
    if (bet.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Only pending bets can be deleted",
        },
        { status: 400 },
      )
    }

    // Refund the stake to the user
    const user = await User.findById(bet.userId)
    if (user) {
      user.balance = (user.balance || 0) + bet.stake
      await user.save()

      // Create refund transaction
      await Transaction.create({
        userId: user._id,
        tenantId: bet.tenantId,
        type: "refund",
        amount: bet.stake,
        currency: bet.currency,
        status: "completed",
        description: `Refund for deleted bet ${bet.ticketNumber}`,
        reference: `REFUND-${bet.ticketNumber}`,
        balanceAfter: user.balance,
      })
    }

    // Create audit log
    await AuditLog.create({
      tenantId: bet.tenantId,
      userId: decoded.userId,
      action: "bet_deleted",
      resource: "bet",
      resourceId: bet._id,
      details: {
        ticketNumber: bet.ticketNumber,
        stake: bet.stake,
        deletedBy: decoded.email,
        reason: "Admin deletion within allowed window",
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    })

    // Delete the bet
    await Bet.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: `Bet ${bet.ticketNumber} deleted and ${bet.stake} ${bet.currency} refunded to player`,
    })
  } catch (error) {
    console.error("[v0] Delete bet error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
