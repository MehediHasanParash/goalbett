import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import PasswordResetToken from "@/lib/models/PasswordResetToken"
import { sendPasswordChangedNotification } from "@/lib/email-service"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, otp, newPassword, token } = body

    if (!newPassword) {
      return NextResponse.json(
        { success: false, error: "New password is required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" },
        { status: 400 }
      )
    }

    let resetToken = null
    let user = null

    if (token) {
      const result = await PasswordResetToken.verifyToken(token)
      if (!result.valid) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }
      resetToken = result.resetToken
      user = await User.findById(resetToken.userId)
    } else if (email && otp) {
      const result = await PasswordResetToken.verifyOTP(email, otp)
      if (!result.valid) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }
      resetToken = result.resetToken
      user = await User.findById(resetToken.userId)
    } else {
      return NextResponse.json(
        { success: false, error: "Email and OTP or reset token is required" },
        { status: 400 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    user.password = hashedPassword
    user.passwordChangedAt = new Date()
    await user.save()

    await PasswordResetToken.markAsUsed(resetToken._id)

    await sendPasswordChangedNotification(
      user.email,
      user.username || user.name || user.email.split("@")[0],
      user.role
    )

    console.log("[v0] Password reset successful:", {
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully. You can now log in with your new password.",
        role: user.role,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Password reset verify error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to reset password. Please try again." },
      { status: 500 }
    )
  }
}
