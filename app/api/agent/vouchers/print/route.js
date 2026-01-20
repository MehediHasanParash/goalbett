import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import { verifyToken } from "@/lib/jwt"

// POST - Get vouchers for printing
export async function POST(request) {
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

    const body = await request.json()
    const { voucherIds, batchId } = body

    const query = { agentId: decoded.userId }

    if (voucherIds && voucherIds.length > 0) {
      query._id = { $in: voucherIds }
    } else if (batchId) {
      query.batchId = batchId
    } else {
      return NextResponse.json({ success: false, error: "Provide voucherIds or batchId" }, { status: 400 })
    }

    const vouchers = await Voucher.find(query).select("code amount currency expiresAt prefix").lean()

    return NextResponse.json({
      success: true,
      data: vouchers.map((v) => ({
        code: v.code,
        amount: v.amount,
        currency: v.currency || "USD",
        expiresAt: v.expiresAt,
      })),
    })
  } catch (error) {
    console.error("[v0] Print vouchers error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
