// TOTP MFA Verification API (for sensitive routes - user already logged in)
import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { TOTPService } from "@/lib/services/totp-service"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production"

// POST - Verify MFA code for sensitive routes (user already authenticated)
export async function POST(request) {
  try {
    const { code, isBackupCode } = await request.json()

    if (!code) {
      return NextResponse.json({ success: false, error: "Verification code required" }, { status: 400 })
    }

    const authToken = request.cookies.get("super_admin_token")?.value || request.cookies.get("auth_token")?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let decoded
    try {
      decoded = jwt.verify(authToken, JWT_SECRET)
    } catch (err) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const userId = decoded.userId

    await dbConnect()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "MFA not enabled for this user",
          mfaNotEnabled: true,
        },
        { status: 400 },
      )
    }

    let isValid = false

    if (isBackupCode) {
      // Check backup codes
      const backupCode = user.mfaBackupCodes?.find((bc) => bc.code === code && !bc.used)
      if (backupCode) {
        backupCode.used = true
        await user.save()
        isValid = true
      }
    } else {
      // Verify TOTP
      isValid = TOTPService.verifyTOTP(user.mfaSecret, code)
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 })
    }

    const newToken = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        tenant_id: user.tenant_id?.toString(),
        mfaVerified: true,
        mfaVerifiedAt: Date.now(),
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    const response = NextResponse.json({
      success: true,
      message: "MFA verified successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })

    response.cookies.set("mfa_verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    response.cookies.set("super_admin_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    response.cookies.set("auth_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[MFA Verify] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
