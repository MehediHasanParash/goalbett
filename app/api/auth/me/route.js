import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"

export async function GET(request) {
  try {
    await connectDB()

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    // Get user from database
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: "Account is deactivated" }, { status: 403 })
    }

    // Return user data
    const userData = user.toJSON()

    return NextResponse.json(
      {
        success: true,
        user: userData,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to get user" }, { status: 500 })
  }
}
