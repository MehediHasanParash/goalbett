import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"

// GET - Get single voucher details
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const voucher = await Voucher.findById(id)
      .populate("agentId", "fullName username")
      .populate("redeemedBy", "fullName username phone")
      .lean()

    if (!voucher) {
      return NextResponse.json({ success: false, error: "Voucher not found" }, { status: 404 })
    }

    // Check ownership for agents
    if (["agent", "sub_agent"].includes(decoded.role)) {
      if (voucher.agentId._id.toString() !== decoded.userId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, data: voucher })
  } catch (error) {
    console.error("[v0] Get voucher error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PATCH - Cancel voucher
export async function PATCH(request, { params }) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    const voucher = await Voucher.findById(id)
    if (!voucher) {
      return NextResponse.json({ success: false, error: "Voucher not found" }, { status: 404 })
    }

    // Check ownership
    if (voucher.agentId.toString() !== decoded.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    if (action === "cancel") {
      if (voucher.status !== "unused") {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot cancel voucher with status: ${voucher.status}`,
          },
          { status: 400 },
        )
      }

      // Refund the amount to agent
      const agent = await User.findById(decoded.userId)
      if (agent) {
        // Refund to credit first
        const creditUsed = Math.min(agent.usedCredit, voucher.amount)
        agent.usedCredit -= creditUsed
        // If there's remaining amount, add to balance
        const remaining = voucher.amount - creditUsed
        if (remaining > 0) {
          agent.balance = (agent.balance || 0) + remaining
        }
        await agent.save()
      }

      voucher.status = "cancelled"
      await voucher.save()

      return NextResponse.json({
        success: true,
        message: "Voucher cancelled and refunded",
        data: voucher,
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Update voucher error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
