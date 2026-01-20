import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, phone, otp, newPassword } = body

    if ((!email && !phone) || !otp || !newPassword) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Find user by email or phone
    const query = email ? { email: email.toLowerCase() } : { phone }
    const user = await User.findOne(query).select("+otp")

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Verify OTP
    const isValid = await user.verifyOTP(otp, "password_reset")

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Update password
    user.password = newPassword
    await user.clearOTP()

    console.log("[v0] Password reset successful:", { email: user.email })

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Password reset verify error:", error)
    return NextResponse.json({ success: false, error: "Failed to reset password" }, { status: 500 })
  }
}
