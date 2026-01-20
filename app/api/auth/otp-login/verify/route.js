import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { generateToken } from "@/lib/jwt"
import { createAuditLog } from "@/lib/middleware/audit-middleware"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { phone, otp, tenant_id } = body

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: "Phone and OTP are required" }, { status: 400 })
    }

    // Find user by phone
    const query = { phone }
    if (tenant_id) {
      query.tenant_id = tenant_id
    }

    const user = await User.findOne(query).select("+otp")

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 })
    }

    // Verify OTP
    const isValid = await user.verifyOTP(otp, "login")

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.clearOTP()

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenant_id: user.tenant_id,
    })

    // Create audit log
    await createAuditLog({
      tenant_id: user.tenant_id,
      actor: { userId: user._id.toString(), email: user.email || user.phone, role: user.role },
      action: "user.login",
      resource: { type: "user", id: user._id.toString(), name: user.fullName },
      metadata: { loginMethod: "otp" },
      severity: "low",
      request,
    })

    // Return user data
    const userData = user.toJSON()

    console.log("[v0] OTP login successful:", { phone: user.phone, role: user.role })

    return NextResponse.json(
      {
        success: true,
        user: userData,
        token,
        message: "Login successful",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] OTP login verify error:", error)
    return NextResponse.json({ success: false, error: "Failed to verify OTP" }, { status: 500 })
  }
}
