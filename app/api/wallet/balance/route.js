import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { WalletService } from "@/lib/services/wallet-service"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"

// GET - Get wallet balance
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    // Get user to determine owner type
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Determine owner type based on role
    let ownerType = "PLAYER"
    if (user.role === "agent") ownerType = "AGENT_REGULAR"
    else if (user.role === "sub_agent") ownerType = "AGENT_SUB"
    else if (["admin", "tenant_admin"].includes(user.role)) ownerType = "TENANT"
    else if (["superadmin", "super_admin"].includes(user.role)) ownerType = "SYSTEM"

    // Get balance
    const balance = await WalletService.getBalance(decoded.userId, ownerType)

    return NextResponse.json({
      success: true,
      data: balance,
    })
  } catch (error) {
    console.error("[v0] Wallet balance error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
