// Test endpoint to verify TOTP code generation
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { TOTPService } from "@/lib/services/totp-service"
import { verifyToken } from "@/lib/jwt"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

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
    if (!user || !user.mfaSecret) {
      return NextResponse.json({ success: false, error: "No MFA secret found" }, { status: 404 })
    }

    const currentCode = TOTPService.generateTOTP(user.mfaSecret)
    const isValid = TOTPService.verifyTOTP(user.mfaSecret, currentCode)

    return NextResponse.json({
      success: true,
      secret: user.mfaSecret,
      currentCode,
      isValidWhenVerified: isValid,
      timestamp: new Date().toISOString(),
      message: "Use this code in your authenticator app to test",
    })
  } catch (error) {
    console.error("[MFA Test] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
