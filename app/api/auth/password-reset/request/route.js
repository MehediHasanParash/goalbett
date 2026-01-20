import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, phone } = body

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: "Email or phone is required" }, { status: 400 })
    }

    // Find user by email or phone
    const query = email ? { email: email.toLowerCase() } : { phone }
    const user = await User.findOne(query)

    // Don't reveal if user exists or not (security)
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists, you will receive an OTP shortly",
        },
        { status: 200 }
      )
    }

    // Generate OTP
    const otp = await user.generateOTP("password_reset")

    // TODO: Send OTP via SMS/Email
    // For now, just log it (in production, integrate with SMS/Email service)
    console.log("[v0] Password reset OTP:", { email: user.email, phone: user.phone, otp })

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully",
        // REMOVE IN PRODUCTION - only for testing
        _debug_otp: process.env.NODE_ENV === "development" ? otp : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Password reset request error:", error)
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 })
  }
}
