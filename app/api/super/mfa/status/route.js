import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"

function getAuthToken(request) {
  // First try Authorization header
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    if (token && token !== "null" && token !== "undefined") {
      return token
    }
  }

  const cookieStore = cookies()
  const superToken = cookieStore.get("super_admin_token")?.value
  const authToken = cookieStore.get("auth_token")?.value

  console.log("[v0] MFA status - super_admin_token exists:", !!superToken)
  console.log("[v0] MFA status - auth_token exists:", !!authToken)

  return superToken || authToken
}

export async function GET(request) {
  try {
    await dbConnect()

    const token = getAuthToken(request)
    console.log("[v0] MFA status - token found:", !!token)

    if (!token) {
      console.log("[v0] MFA status - no token, returning 401")
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] MFA status - decoded token:", decoded ? { userId: decoded.userId, role: decoded.role } : null)

    const validRoles = ["super_admin", "superadmin", "super-admin", "admin"]
    if (!decoded || !validRoles.includes(decoded.role?.toLowerCase())) {
      console.log("[v0] MFA status - invalid role:", decoded?.role)
      return Response.json({ error: "Access denied", role: decoded?.role }, { status: 403 })
    }

    const user = await User.findById(decoded.userId).select("+mfaEnabled +mfaSecret")
    console.log("[v0] MFA status - user found:", !!user, "mfaEnabled:", user?.mfaEnabled)

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    return Response.json({
      enabled: user.mfaEnabled || false,
      enabledAt: user.mfaEnabledAt || null,
    })
  } catch (error) {
    console.error("[v0] MFA status check error:", error)
    return Response.json({ error: "Failed to check MFA status" }, { status: 500 })
  }
}
