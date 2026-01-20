import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { phone, tenant_id } = body

    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    // Find user by phone
    const query = { phone }
    if (tenant_id) {
      query.tenant_id = tenant_id
    }

    const user = await User.findOne(query)

    if (!user) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 })
    }

    if (user.status !== "active") {
      return NextResponse.json({ success: false, error: "Account is not active" }, { status: 403 })
    }

    // Generate OTP
    const otp = await user.generateOTP("login")

    // TODO: Send OTP via SMS
    // Integrate with SMS gateway (Twilio, Africa's Talking, etc.)
    console.log("[v0] Login OTP:", { phone: user.phone, otp })

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your phone",
        // REMOVE IN PRODUCTION - only for testing
        _debug_otp: process.env.NODE_ENV === "development" ? otp : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] OTP login request error:", error)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
