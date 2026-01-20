// TOTP MFA Setup API for Super Admin
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { TOTPService } from "@/lib/services/totp-service"
import { verifyToken } from "@/lib/jwt"

// Helper function to get token from either cookies or Authorization header
function getAuthToken(request, cookieStore) {
  // Try Authorization header first (for localStorage-based auth)
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    if (token && token !== "null" && token !== "undefined") {
      return token
    }
  }
  // Fallback to cookies (for cookie-based auth)
  return cookieStore.get("auth_token")?.value
}

// GET - Get MFA setup info (QR code, secret)
export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = getAuthToken(request, cookieStore)

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const validRoles = ["super_admin", "superadmin"]
    if (!decoded || !validRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    await dbConnect()

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if MFA is already enabled
    if (user.mfaEnabled && user.mfaSecret) {
      return NextResponse.json({
        success: true,
        mfaEnabled: true,
        message: "MFA is already enabled",
      })
    }

    // Generate new secret
    const secret = TOTPService.generateSecret()
    const qrCodeUrl = TOTPService.generateQRCodeURL(secret, user.email || user.username, "GoalBett Admin")
    const backupCodes = TOTPService.generateBackupCodes()

    // Store secret temporarily (not enabled until verified)
    user.mfaSecret = secret
    user.mfaBackupCodes = backupCodes.map((code) => ({ code, used: false }))
    await user.save()

    return NextResponse.json({
      success: true,
      mfaEnabled: false,
      secret,
      qrCodeUrl,
      backupCodes,
      message: "Scan the QR code with your authenticator app, then verify with a code",
    })
  } catch (error) {
    console.error("[MFA Setup] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Verify and enable MFA
export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const token = getAuthToken(request, cookieStore)

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const validRoles = ["super_admin", "superadmin"]
    if (!decoded || !validRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    const { code, secret } = await request.json()

    if (!code) {
      return NextResponse.json({ success: false, error: "Verification code required" }, { status: 400 })
    }

    if (!secret) {
      return NextResponse.json({ success: false, error: "Secret required. Please restart MFA setup." }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const isValid = TOTPService.verifyTOTP(secret, code)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code. Please try again." },
        { status: 400 },
      )
    }

    // Generate fresh backup codes and save MFA settings
    const backupCodes = TOTPService.generateBackupCodes()
    user.mfaEnabled = true
    user.mfaSecret = secret
    user.mfaBackupCodes = backupCodes.map((code) => ({ code, used: false }))
    user.mfaVerifiedAt = new Date()
    await user.save()

    return NextResponse.json({
      success: true,
      message: "MFA enabled successfully",
      mfaEnabled: true,
      backupCodes,
    })
  } catch (error) {
    console.error("[MFA Verify] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Disable MFA
export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const token = getAuthToken(request, cookieStore)

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const validRoles = ["super_admin", "superadmin"]
    if (!decoded || !validRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    const { code } = await request.json()

    await dbConnect()

    const user = await User.findById(decoded.userId).select("+mfaSecret +mfaBackupCodes")
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Require current MFA code to disable
    if (user.mfaEnabled && user.mfaSecret) {
      if (!code) {
        return NextResponse.json({ success: false, error: "MFA code required to disable" }, { status: 400 })
      }

      const isValid = TOTPService.verifyTOTP(user.mfaSecret, code)
      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid MFA code" }, { status: 400 })
      }
    }

    // Disable MFA
    user.mfaEnabled = false
    user.mfaSecret = null
    user.mfaBackupCodes = []
    user.mfaVerifiedAt = null
    await user.save()

    return NextResponse.json({
      success: true,
      message: "MFA disabled successfully",
      mfaEnabled: false,
    })
  } catch (error) {
    console.error("[MFA Disable] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
