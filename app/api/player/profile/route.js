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
    const body = await request.json()
    const { firstName, lastName, phone, dateOfBirth, address } = body

    console.log("[v0] Profile update request body:", body)
    console.log("[v0] User ID:", decoded.userId)

    const updateData = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth)
    if (address) updateData.address = address

    console.log("[v0] Update data:", updateData)

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true, runValidators: false },
    ).select("-password")

    console.log("[v0] Updated user:", updatedUser)

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("[v0] Profile update error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to update profile" }, { status: 500 })
  }
}
