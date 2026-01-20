import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    await connectDB()

    const user = await User.findOne({ username }).select("+password")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    return NextResponse.json({
      username: user.username,
      passwordHash: user.password,
      testPassword: password,
      doesMatch: isMatch,
      hashFormat: user.password.startsWith("$2") ? "valid bcrypt" : "invalid",
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
