import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import GuestSession from "@/lib/models/GuestSession"
import Tenant from "@/lib/models/Tenant"

// Generate BetID format: GB-{6 uppercase alphanumeric}
function generateBetId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let betId = "GB-"
  for (let i = 0; i < 6; i++) {
    betId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return betId
}

// POST - Save guest betslip and generate BetID
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { tenantId, slip, ipAddress, userAgent } = body

    if (!slip || !slip.legs || slip.legs.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid betslip data" }, { status: 400 })
    }

    // Generate unique BetID
    let betId = generateBetId()
    let attempts = 0

    // Ensure BetID is unique
    while (attempts < 5) {
      const existing = await GuestSession.findOne({ gsid: betId })
      if (!existing) break
      betId = generateBetId()
      attempts++
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    let validTenantId = null
    if (tenantId && tenantId !== "default") {
      // Check if provided tenantId is a valid ObjectId
      if (tenantId.match(/^[0-9a-fA-F]{24}$/)) {
        validTenantId = tenantId
      }
    }

    // If no valid tenantId, try to find the provider/default tenant
    if (!validTenantId) {
      const defaultTenant = await Tenant.findOne({
        $or: [{ type: "provider" }, { status: "active" }],
      }).sort({ createdAt: 1 })

      if (defaultTenant) {
        validTenantId = defaultTenant._id
      }
    }

    // Create guest session with betslip (tenant_id is now optional)
    const sessionData = {
      gsid: betId,
      session_data: {
        betslip: slip.legs,
        totalOdds: slip.totalOdds || 1,
        stake: slip.stake || 0,
        potentialWin: slip.potentialWin || slip.estimatedPayout || 0,
      },
      expires_at: expiresAt,
      ip_address: ipAddress || "unknown",
      user_agent: userAgent || "unknown",
      status: "active",
    }

    // Only add tenant_id if we have a valid one
    if (validTenantId) {
      sessionData.tenant_id = validTenantId
    }

    const guestSession = await GuestSession.create(sessionData)

    return NextResponse.json({
      success: true,
      data: {
        betId: guestSession.gsid,
        expiresAt: guestSession.expires_at,
        slip: guestSession.session_data,
      },
    })
  } catch (error) {
    console.error("[v0] Guest betslip save error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET - Look up guest betslip by BetID
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const betId = searchParams.get("betId")

    if (!betId) {
      return NextResponse.json({ success: false, error: "BetID is required" }, { status: 400 })
    }

    const guestSession = await GuestSession.findOne({
      gsid: betId.toUpperCase(),
      status: "active",
    })

    if (!guestSession) {
      return NextResponse.json({ success: false, error: "BetID not found or expired" }, { status: 404 })
    }

    // Check if expired
    if (new Date() > guestSession.expires_at) {
      await GuestSession.updateOne({ _id: guestSession._id }, { status: "expired" })
      return NextResponse.json({ success: false, error: "BetID has expired" }, { status: 410 })
    }

    return NextResponse.json({
      success: true,
      data: {
        betId: guestSession.gsid,
        slip: {
          legs: guestSession.session_data.betslip,
          totalOdds: guestSession.session_data.totalOdds,
          stake: guestSession.session_data.stake,
          estimatedPayout: guestSession.session_data.potentialWin,
        },
        expiresAt: guestSession.expires_at,
        createdAt: guestSession.createdAt,
      },
    })
  } catch (error) {
    console.error("[v0] Guest betslip lookup error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
