import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import dbConnect from "@/lib/mongodb"
import Transaction from "@/lib/models/Transaction"

export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await dbConnect()

    // Find commission-related transactions for this agent
    const commissionTxns = await Transaction.find({
      userId: decoded.userId,
      type: { $in: ["commission", "agent_commission", "credit_sale"] },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const formattedSettlements = commissionTxns.map((t) => ({
      id: t._id,
      date: t.createdAt,
      amount: t.metadata?.commission || t.amount,
      ggr: t.metadata?.ggr || t.amount * 10,
      rate: t.metadata?.commissionRate || 10,
      status: t.status || "completed",
      type: t.type,
      description: t.description,
    }))

    return NextResponse.json({
      success: true,
      settlements: formattedSettlements,
    })
  } catch (error) {
    console.error("[v0] Commission history error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
