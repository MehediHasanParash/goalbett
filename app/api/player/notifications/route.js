import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function PUT(request) {
  try {
    await dbConnect()

    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const { notifications } = await request.json()

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { notificationPreferences: notifications },
      { new: true, runValidators: false },
    ).select("-password")

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Notification preferences saved" })
  } catch (error) {
    console.error("Notification settings error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to save preferences" }, { status: 500 })
  }
}
