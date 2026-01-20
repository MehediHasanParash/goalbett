import { NextResponse } from "next/server"
import { isAllowed, getClientIp, getCountryFromIp } from "@/lib/services/geo-access-service"
import { verifyToken } from "@/lib/auth"

// POST - Check if IP/country is allowed (for testing)
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { ip, routeType = "general" } = body

    // Get country from IP
    const geoData = await getCountryFromIp(ip || getClientIp(request))

    // Create mock request for testing
    const mockRequest = {
      headers: {
        get: (key) => {
          if (key === "x-forwarded-for") return ip
          return request.headers.get(key)
        },
      },
    }

    // Check access
    const result = await isAllowed(mockRequest, null, routeType)

    return NextResponse.json({
      success: true,
      ip: ip || getClientIp(request),
      geoData,
      accessResult: result,
    })
  } catch (error) {
    console.error("Error checking geo access:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET - Get current client's geo info
export async function GET(request) {
  try {
    const ip = getClientIp(request)
    const geoData = await getCountryFromIp(ip)
    const result = await isAllowed(request)

    return NextResponse.json({
      success: true,
      ip,
      ...geoData,
      ...result,
    })
  } catch (error) {
    console.error("Error getting geo info:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
