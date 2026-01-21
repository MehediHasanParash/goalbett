import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken, getAuthToken } from "@/lib/auth-service"
import bcrypt from "bcryptjs"

export async function GET(request) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        mfaEnabled: user.mfaEnabled || false,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    return NextResponse.json({ success: false, error: "Failed to get profile" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { email, currentPassword, newPassword } = body

    const user = await User.findById(decoded.userId).select("+password")

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (currentPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ success: false, error: "Current password is required" }, { status: 400 })
    }

    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
      }

      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } })
      if (existingUser) {
        return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 })
      }

      user.email = email.toLowerCase()
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 })
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
      if (!passwordRegex.test(newPassword)) {
        return NextResponse.json(
          { success: false, error: "Password must contain uppercase, lowercase, and number" },
          { status: 400 }
        )
      }

      user.password = await bcrypt.hash(newPassword, 12)
      user.passwordChangedAt = new Date()
    }

    await user.save()

    console.log("[v0] Super admin profile updated:", { userId: user._id, email: user.email })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 })
  }
}
