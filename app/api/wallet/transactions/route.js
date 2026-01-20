import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Transaction from "@/lib/models/Transaction"
import { verifyToken } from "@/lib/auth"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // deposit, withdrawal, bet_placed, etc.
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit")) || 50
    const page = Number.parseInt(searchParams.get("page")) || 1
    const skip = (page - 1) * limit

    await connectDB()

    // Build query
    const query = { userId: decoded.userId }
    if (type) query.type = type
    if (status) query.status = status

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Transactions error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
