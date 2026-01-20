import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { generateToken } from "@/lib/jwt"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { fullName, email, phone, password, role = "player" } = body

    // Validate required fields
    if (!fullName || !email || !password) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["player", "agent", "sub_agent", "admin", "tenant_admin", "superadmin"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 })
    }

    // Create new user
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      password,
      role,
      balance: role === "player" ? 1000 : role === "agent" ? 5000 : 0, // Initial balance
    })

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    })

    // Return user data without password
    const userData = user.toJSON()

    return NextResponse.json(
      {
        success: true,
        user: userData,
        token,
        message: "Account created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json({ success: false, error: error.message || "Signup failed" }, { status: 500 })
  }
}
