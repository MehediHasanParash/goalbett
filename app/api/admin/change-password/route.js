import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"

export async function POST(request) {
  try {
    await connectDB()

    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Find user
    const user = await User.findById(decoded.userId).select("+password")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    await User.findByIdAndUpdate(decoded.userId, { password: hashedPassword }, { runValidators: false })

    console.log("[v0] Password changed successfully for:", user.email, "role:", user.role)

    return NextResponse.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("[v0] Admin password change error:", error)
    return NextResponse.json({ error: error.message || "Failed to change password" }, { status: 500 })
  }
}
