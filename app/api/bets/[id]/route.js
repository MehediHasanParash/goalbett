import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Bet from "@/lib/models/Bet"
import { verifyToken } from "@/lib/auth"

// GET - Get single bet details
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    // Find bet by ID or ticket number
    const bet = await Bet.findOne({
      $or: [{ _id: id }, { ticketNumber: id }],
      userId: decoded.userId,
    }).lean()

    if (!bet) {
      return NextResponse.json({ success: false, error: "Bet not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: bet,
    })
  } catch (error) {
    console.error("[v0] Bet detail error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
