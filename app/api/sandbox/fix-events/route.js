/**
 * Fix Sandbox Events Migration API
 *
 * Fixes existing sandbox events to have proper metadata.isSandbox structure
 */

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyAuth } from "@/lib/auth-middleware"
import { ROLES } from "@/lib/auth-service"
import Event from "@/lib/models/Event"
import Bet from "@/lib/models/Bet"

export async function POST(request) {
  try {
    const auth = await verifyAuth(request, [ROLES.SUPER_ADMIN])
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized - Super Admin only" }, { status: 401 })
    }

    await connectDB()

    console.log("[Migration] Starting sandbox events fix...")

    // Find all events
    const allEvents = await Event.find({}).lean()
    console.log(`[Migration] Found ${allEvents.length} total events`)

    let fixedCount = 0
    let alreadyCorrect = 0
    let nonSandboxCount = 0

    for (const event of allEvents) {
      // Check if event has bets placed from sandbox device
      const hasSandboxBets = await Bet.exists({
        "selections.eventId": event._id,
        "placedFrom.device": "sandbox",
      })

      const shouldBeSandbox = hasSandboxBets || (event.metadata?.createdBy && !event.externalId)

      if (shouldBeSandbox) {
        if (!event.metadata?.isSandbox) {
          // Fix the event
          await Event.updateOne(
            { _id: event._id },
            {
              $set: {
                "metadata.isSandbox": true,
              },
            },
          )
          fixedCount++
          console.log(`[Migration] Fixed event: ${event.name} (${event._id})`)
        } else {
          alreadyCorrect++
        }
      } else {
        nonSandboxCount++
      }
    }

    console.log(`[Migration] Complete!`)
    console.log(`- Fixed: ${fixedCount} events`)
    console.log(`- Already correct: ${alreadyCorrect} events`)
    console.log(`- Non-sandbox: ${nonSandboxCount} events`)

    return NextResponse.json({
      success: true,
      message: "Sandbox events migration completed",
      data: {
        fixed: fixedCount,
        alreadyCorrect,
        nonSandbox: nonSandboxCount,
        totalSandbox: fixedCount + alreadyCorrect,
      },
    })
  } catch (error) {
    console.error("[Migration] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
