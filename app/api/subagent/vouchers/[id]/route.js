import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"

// PATCH - Cancel voucher (sub-agent)
export async function PATCH(request, { params }) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "sub_agent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === "cancel") {
      const mongoose = await import("mongoose")
      const agentObjectId = new mongoose.Types.ObjectId(decoded.userId)

      const voucher = await Voucher.findOne({ _id: id, agentId: agentObjectId })
      if (!voucher) {
        return NextResponse.json({ success: false, error: "Voucher not found" }, { status: 404 })
      }

      if (voucher.status !== "unused") {
        return NextResponse.json({ success: false, error: "Only unused vouchers can be cancelled" }, { status: 400 })
      }

      // Refund the amount
      const subAgent = await User.findById(decoded.userId)
      if (subAgent) {
        const refundAmount = voucher.amount
        const usedCredit = subAgent.usedCredit || 0
        if (refundAmount <= usedCredit) {
          subAgent.usedCredit = usedCredit - refundAmount
        } else {
          subAgent.usedCredit = 0
          subAgent.balance = (subAgent.balance || 0) + (refundAmount - usedCredit)
        }
        await subAgent.save()
      }

      voucher.status = "cancelled"
      voucher.cancelledAt = new Date()
      voucher.cancelledBy = decoded.userId
      await voucher.save()

      return NextResponse.json({
        success: true,
        data: { voucher, refunded: voucher.amount },
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Cancel voucher error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
