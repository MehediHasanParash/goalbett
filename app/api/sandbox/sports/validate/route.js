/**
 * Bet Slip Validation API
 *
 * Validates a bet slip BEFORE placement:
 * - Checks max winning limit
 * - Validates selections
 * - Returns enforcement details
 *
 * REGULATOR NOTE: This endpoint demonstrates server-side
 * validation of max winning limits.
 */

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import User from "@/lib/models/User"
import { SandboxSportsEngine } from "@/lib/sandbox/sports-engine"

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { selections, stake } = body

    if (!selections || selections.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No selections provided",
        },
        { status: 400 },
      )
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get validation result
    const limits = await SandboxSportsEngine.getLimits(user.tenant_id)
    const selectionValidation = await SandboxSportsEngine.validateSelections(selections, limits)
    const betValidation = await SandboxSportsEngine.validateBetLimits({
      stake: stake || 0,
      selections,
      tenantId: user.tenant_id,
      userId: decoded.userId,
    })

    // Get slip summary
    const summary = await SandboxSportsEngine.getBetSlipSummary(selections, stake || 0, user.tenant_id)

    return NextResponse.json({
      success: true,
      validation: {
        selectionsValid: selectionValidation.valid,
        selectionErrors: selectionValidation.errors,
        selectionWarnings: selectionValidation.warnings,
        betValid: betValidation.valid,
        betErrors: betValidation.errors,
        enforcement: betValidation.enforcement,
      },
      summary,
      limits: {
        minStake: limits.minStake,
        maxStake: limits.maxStake,
        maxWinning: limits.maxWinning,
        maxSelectionsPerSlip: limits.maxSelectionsPerSlip,
      },
    })
  } catch (error) {
    console.error("[v0] Bet validation error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
