import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import GuestSession from "@/lib/models/GuestSession"
import { getClientIP } from "@/lib/middleware/rbac-middleware"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { tenant_id } = body

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: "Tenant ID is required" }, { status: 400 })
    }

    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Create new guest session
    const session = await GuestSession.createSession(tenant_id, ipAddress, userAgent)

    console.log("[v0] Guest session created:", { gsid: session.gsid, tenant_id })

    return NextResponse.json(
      {
        success: true,
        gsid: session.gsid,
        expires_at: session.expires_at,
        message: "Guest session created successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Guest session creation error:", error)
    return NextResponse.json({ success: false, error: "Failed to create guest session" }, { status: 500 })
  }
}

// Get guest session details
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const gsid = searchParams.get("gsid")

    if (!gsid) {
      return NextResponse.json({ success: false, error: "GSID is required" }, { status: 400 })
    }

    const session = await GuestSession.findOne({ gsid })

    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 })
    }

    if (!session.isValid()) {
      return NextResponse.json({ success: false, error: "Session expired or invalid" }, { status: 410 })
    }

    return NextResponse.json(
      {
        success: true,
        session: {
          gsid: session.gsid,
          session_data: session.session_data,
          expires_at: session.expires_at,
          status: session.status,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Get guest session error:", error)
    return NextResponse.json({ success: false, error: "Failed to retrieve session" }, { status: 500 })
  }
}
