import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Bet from "@/lib/models/Bet"
import Transaction from "@/lib/models/Transaction"
import { verifyToken } from "@/lib/jwt"
import { hasPermission } from "@/lib/staff-permissions"

export async function GET(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !hasPermission(decoded.role, "view_player_profile_limited")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tenantId = decoded.tenant_id || decoded.tenantId

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const playerId = searchParams.get("playerId")

    // If specific player requested
    if (playerId) {
      const player = await User.findOne({
        _id: playerId,
        tenant_id: tenantId,
        role: "player",
      })
        .select("firstName lastName fullName username email status lastLogin kycStatus createdAt")
        .lean()

      if (!player) {
        return NextResponse.json({ error: "Player not found" }, { status: 404 })
      }

      // Get limited transaction history (read-only)
      const transactions = await Transaction.find({ user_id: playerId })
        .select("type amount status createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      // Get bet history (read-only)
      const bets = await Bet.find({ user_id: playerId })
        .select("eventId stake payout status createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      return NextResponse.json({
        player,
        transactions,
        bets,
      })
    }

    // Search players
    const query = {
      tenant_id: tenantId,
      role: "player",
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ]
    }

    // Only return limited fields for support
    const players = await User.find(query)
      .select("firstName lastName fullName username status lastLogin kycStatus")
      .sort({ lastLogin: -1 })
      .limit(50)
      .lean()

    return NextResponse.json({ players })
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !hasPermission(decoded.role, "reset_passwords")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tenantId = decoded.tenant_id || decoded.tenantId

    const body = await request.json()
    const { playerId, action, note } = body

    const player = await User.findOne({
      _id: playerId,
      tenant_id: tenantId,
      role: "player",
    })

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    if (action === "lock_account") {
      player.status = "blocked"
      player.lockedBy = decoded.userId
      player.lockedAt = new Date()
      player.lockReason = note || "Locked by support"
    } else if (action === "unlock_account") {
      player.status = "active"
      player.lockedBy = null
      player.lockedAt = null
      player.lockReason = null
    } else if (action === "reset_password") {
      // Generate temporary password - let pre-save hook hash it
      const tempPassword = Math.random().toString(36).slice(-8)
      player.password = tempPassword
      player.mustChangePassword = true

      await player.save()

      // In real system, send email to player
      return NextResponse.json({
        success: true,
        message: "Password reset",
        tempPassword, // In production, send via email instead
      })
    }

    await player.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating player:", error)
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 })
  }
}
