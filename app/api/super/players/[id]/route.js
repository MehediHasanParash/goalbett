import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Wallet from "@/lib/models/Wallet"
import Bet from "@/lib/models/Bet"
import Transaction from "@/lib/models/Transaction"

// GET /api/super/players/[id] - Get single player details
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const player = await User.findById(id).populate("tenant_id", "name businessName domain").lean()

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    return NextResponse.json({ player })
  } catch (error) {
    console.error("[v0] Error fetching player:", error)
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 })
  }
}

// PATCH /api/super/players/[id] - Update player status
export async function PATCH(request, { params }) {
  try {
    const { id } = await params

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()
    const { status } = body

    if (!status || !["active", "suspended", "blocked"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const player = await User.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true })

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, player })
  } catch (error) {
    console.error("[v0] Error updating player:", error)
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 })
  }
}

// DELETE /api/super/players/[id] - Delete player and associated data
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    // Check if player exists
    const player = await User.findById(id)
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Only allow deleting players, not admins or other roles
    if (player.role !== "player") {
      return NextResponse.json({ error: "Can only delete player accounts" }, { status: 400 })
    }

    // Delete associated data
    await Promise.all([
      Wallet.deleteMany({ userId: id }),
      Bet.deleteMany({ userId: id }),
      Transaction.deleteMany({ userId: id }),
    ])

    // Delete the player
    await User.findByIdAndDelete(id)

    return NextResponse.json({ success: true, message: "Player deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting player:", error)
    return NextResponse.json({ error: "Failed to delete player" }, { status: 500 })
  }
}
