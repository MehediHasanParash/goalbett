import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import BetSlip from "@/lib/models/BetSlip"
import { verifyToken } from "@/lib/auth"
import { MOCK_EVENTS, MOCK_MARKETS } from "@/lib/mock-data/sports"

// GET - Get current betslip
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const sessionId = request.headers.get("x-session-id")

    if (!token && !sessionId) {
      return NextResponse.json({ success: false, error: "Authentication or session required" }, { status: 401 })
    }

    let userId = null
    let tenantId = null

    if (token) {
      const decoded = await verifyToken(token)
      if (decoded) {
        userId = decoded.userId
        tenantId = decoded.tenantId
      }
    }

    await connectDB()

    // Find betslip by user ID or session ID
    const query = userId ? { userId } : { sessionId }

    const betslip = await BetSlip.findOne(query).lean()

    if (!betslip) {
      return NextResponse.json({
        success: true,
        data: {
          selections: [],
          betType: "single",
          stakes: {},
          totalStake: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: betslip,
    })
  } catch (error) {
    console.error("[v0] BetSlip GET error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Add selection to betslip
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const sessionId = request.headers.get("x-session-id") || `guest_${Date.now()}`

    const body = await request.json()
    const { eventId, marketId, selectionIndex, tenantId: bodyTenantId } = body

    if (!eventId || !marketId || selectionIndex === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    let userId = null
    let tenantId = bodyTenantId

    if (token) {
      const decoded = await verifyToken(token)
      if (decoded) {
        userId = decoded.userId
        tenantId = decoded.tenantId || tenantId
      }
    }

    // Get event and market data (using mock for now)
    const event = MOCK_EVENTS.find((e) => e._id === eventId)
    const market = MOCK_MARKETS.find((m) => m._id === marketId)

    if (!event || !market) {
      return NextResponse.json({ success: false, error: "Event or market not found" }, { status: 404 })
    }

    const selection = market.selections[selectionIndex]
    if (!selection) {
      return NextResponse.json({ success: false, error: "Selection not found" }, { status: 404 })
    }

    await connectDB()

    // Find or create betslip
    const query = userId ? { userId } : { sessionId }
    let betslip = await BetSlip.findOne(query)

    if (!betslip) {
      betslip = new BetSlip({
        sessionId,
        userId,
        tenantId,
        selections: [],
        betType: "single",
        stakes: new Map(),
        totalStake: 0,
      })
    }

    // Check if selection already exists (same event)
    const existingIndex = betslip.selections.findIndex((s) => s.eventId.toString() === eventId)

    const newSelection = {
      eventId,
      marketId,
      selectionIndex,
      eventName: event.name,
      marketName: market.name,
      selectionName: selection.name,
      odds: selection.odds,
      startTime: new Date(event.startTime),
      oddsChanged: false,
    }

    if (existingIndex >= 0) {
      // Replace existing selection for same event
      betslip.selections[existingIndex] = newSelection
    } else {
      // Add new selection
      betslip.selections.push(newSelection)
    }

    // Auto switch to multiple if more than 1 selection
    if (betslip.selections.length > 1) {
      betslip.betType = "multiple"
    }

    // Update expiry
    betslip.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await betslip.save()

    return NextResponse.json({
      success: true,
      message: "Selection added to betslip",
      data: betslip,
    })
  } catch (error) {
    console.error("[v0] BetSlip POST error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Remove selection or clear betslip
export async function DELETE(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const sessionId = request.headers.get("x-session-id")

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const clearAll = searchParams.get("clearAll") === "true"

    let userId = null

    if (token) {
      const decoded = await verifyToken(token)
      if (decoded) {
        userId = decoded.userId
      }
    }

    await connectDB()

    const query = userId ? { userId } : { sessionId }

    if (clearAll) {
      await BetSlip.deleteOne(query)
      return NextResponse.json({
        success: true,
        message: "Betslip cleared",
      })
    }

    if (!eventId) {
      return NextResponse.json({ success: false, error: "Event ID required" }, { status: 400 })
    }

    const betslip = await BetSlip.findOne(query)

    if (!betslip) {
      return NextResponse.json({ success: false, error: "Betslip not found" }, { status: 404 })
    }

    // Remove selection
    betslip.selections = betslip.selections.filter((s) => s.eventId.toString() !== eventId)

    // Switch back to single if only 1 selection left
    if (betslip.selections.length <= 1) {
      betslip.betType = "single"
    }

    if (betslip.selections.length === 0) {
      await BetSlip.deleteOne(query)
    } else {
      await betslip.save()
    }

    return NextResponse.json({
      success: true,
      message: "Selection removed",
      data: betslip.selections.length > 0 ? betslip : null,
    })
  } catch (error) {
    console.error("[v0] BetSlip DELETE error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PATCH - Update stake or bet type
export async function PATCH(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const sessionId = request.headers.get("x-session-id")

    const body = await request.json()
    const { betType, stakes, totalStake } = body

    let userId = null

    if (token) {
      const decoded = await verifyToken(token)
      if (decoded) {
        userId = decoded.userId
      }
    }

    await connectDB()

    const query = userId ? { userId } : { sessionId }
    const betslip = await BetSlip.findOne(query)

    if (!betslip) {
      return NextResponse.json({ success: false, error: "Betslip not found" }, { status: 404 })
    }

    if (betType) betslip.betType = betType
    if (stakes) betslip.stakes = new Map(Object.entries(stakes))
    if (totalStake !== undefined) betslip.totalStake = totalStake

    await betslip.save()

    return NextResponse.json({
      success: true,
      message: "Betslip updated",
      data: betslip,
    })
  } catch (error) {
    console.error("[v0] BetSlip PATCH error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
