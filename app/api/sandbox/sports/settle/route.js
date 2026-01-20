/**
 * Settlement API
 *
 * Endpoints for settling sports events:
 * - POST: Set event result and trigger settlement
 */

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"
import { SettlementEngine } from "@/lib/sandbox/settlement-engine"

// POST - Settle event
export async function POST(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { action, eventId, result, betId, outcome, reason } = body

    switch (action) {
      case "settle_event": {
        if (!eventId || result === undefined) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing eventId or result",
            },
            { status: 400 },
          )
        }

        const settlementResult = await SettlementEngine.setEventResult(eventId, result, auth.user.userId)

        return NextResponse.json({
          success: true,
          message: "Event settled successfully",
          data: settlementResult,
        })
      }

      case "manual_settle_bet": {
        if (!betId || !outcome) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing betId or outcome",
            },
            { status: 400 },
          )
        }

        const betResult = await SettlementEngine.manualSettleBet(
          betId,
          outcome,
          auth.user.userId,
          reason || "Manual settlement",
        )

        return NextResponse.json({
          success: true,
          message: "Bet settled manually",
          data: betResult,
        })
      }

      case "get_stats": {
        const { searchParams } = new URL(request.url)
        const stats = await SettlementEngine.getSettlementStats({
          tenantId: searchParams.get("tenantId"),
          startDate: searchParams.get("startDate"),
          endDate: searchParams.get("endDate"),
        })

        return NextResponse.json({ success: true, data: stats })
      }

      case "get_pending": {
        const pending = await SettlementEngine.getPendingSettlements({
          tenantId: auth.user.tenant_id,
        })

        return NextResponse.json({ success: true, data: pending })
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use: settle_event, manual_settle_bet, get_stats, get_pending",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("[v0] Settlement API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
