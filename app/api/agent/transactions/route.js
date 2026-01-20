import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/db"
import Bet from "@/lib/models/Bet"
import Transaction from "@/lib/models/Transaction"

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "agent") {
      return NextResponse.json({ error: "Unauthorized: Agent access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit")) || 50
    const page = Number.parseInt(searchParams.get("page")) || 1
    const skip = (page - 1) * limit

    await connectDB()

    const query = {
      agentId: decoded.userId,
    }

    const [bets, transactions, totalBets, totalTransactions] = await Promise.all([
      Bet.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("userId", "name email phone").lean(),
      Transaction.find({ userId: decoded.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Bet.countDocuments(query),
      Transaction.countDocuments({ userId: decoded.userId }),
    ])

    const combinedData = [
      ...bets.map((bet) => ({
        id: bet._id,
        betId: bet.ticketNumber,
        type: "bet",
        amount: bet.stake,
        status: bet.status,
        timestamp: bet.createdAt,
        player: bet.userId?.name || bet.userId?.email || "Guest",
        potentialWin: bet.potentialWin,
        odds: bet.totalOdds,
      })),
      ...transactions.map((tx) => ({
        id: tx._id,
        transactionId: tx.transactionId,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        timestamp: tx.createdAt,
        method: tx.paymentMethod || "N/A",
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return NextResponse.json({
      success: true,
      data: combinedData.slice(0, limit),
      pagination: {
        total: totalBets + totalTransactions,
        page,
        limit,
        pages: Math.ceil((totalBets + totalTransactions) / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Agent transactions error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
