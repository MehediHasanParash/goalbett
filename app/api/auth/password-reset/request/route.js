import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import PasswordResetToken from "@/lib/models/PasswordResetToken"
import { sendPasswordResetOTP } from "@/lib/email-service"

const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 3

const rateLimitMap = new Map()

function checkRateLimit(identifier) {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW

  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, [])
  }

  const requests = rateLimitMap.get(identifier).filter((time) => time > windowStart)
  rateLimitMap.set(identifier, requests)

  if (requests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }

  requests.push(now)
  return true
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, phone, identifier } = body

    const searchValue = email || phone || identifier

    if (!searchValue) {
      return NextResponse.json(
        { success: false, error: "Email, phone, or username is required" },
        { status: 400 }
      )
    }

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    if (!checkRateLimit(searchValue.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a minute before trying again." },
        { status: 429 }
      )
    }

    await connectDB()

    const searchLower = searchValue.toLowerCase()
    const user = await User.findOne({
      $or: [
        { email: searchLower },
        { phone: searchValue },
        { username: searchLower },
      ],
    })

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with that email/phone, you will receive a verification code shortly.",
          email: searchValue.includes("@") ? searchValue : null,
        },
        { status: 200 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { success: false, error: "No email associated with this account. Please contact support." },
        { status: 400 }
      )
    }

    const { otp, token } = await PasswordResetToken.createResetToken(user, ipAddress, userAgent)

    const emailResult = await sendPasswordResetOTP(
      user.email,
      otp,
      user.username || user.name || user.email.split("@")[0],
      user.role
    )

    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")

    console.log("[v0] Password reset OTP sent:", {
      email: user.email,
      otp: emailResult.dev ? otp : "[sent via email]",
      role: user.role,
    })

    return NextResponse.json(
      {
        success: true,
        message: `Verification code sent to ${maskedEmail}`,
        email: user.email,
        _debug_otp: emailResult.dev ? otp : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Password reset request error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process request. Please try again." },
      { status: 500 }
    )
  }
}
