import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth-service"
import { cookies } from "next/headers"

export async function POST() {
  try {
    await dbConnect()

    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "super_admin") {
      return Response.json({ error: "Access denied" }, { status: 403 })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Disable MFA
    user.mfaEnabled = false
    user.mfaSecret = null
    user.mfaBackupCodes = []
    await user.save()

    return Response.json({
      success: true,
      message: "MFA disabled successfully",
    })
  } catch (error) {
    console.error("[v0] MFA disable error:", error)
    return Response.json({ error: "Failed to disable MFA" }, { status: 500 })
  }
}
