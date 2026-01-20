/**
 * Migration Script: Fix Sandbox Events Metadata
 *
 * This script updates all existing sandbox events to have the correct
 * metadata.isSandbox flag structure so they can be properly queried.
 *
 * Run this script from the sandbox testing page to fix event display issues.
 */

import connectDB from "@/lib/db"
import Event from "@/lib/models/Event"

async function fixSandboxEvents() {
  try {
    await connectDB()

    console.log("[Migration] Starting sandbox events fix...")

    // Find all events that have metadata but might not have proper isSandbox flag
    const allEvents = await Event.find({})
    console.log(`[Migration] Found ${allEvents.length} total events`)

    let fixedCount = 0
    let alreadyCorrect = 0

    for (const event of allEvents) {
      // Check if event was created via sandbox (device: "sandbox" in any bets)
      // or if it has metadata.createdBy but no metadata.isSandbox

      const needsFix =
        (event.metadata && !event.metadata.hasOwnProperty("isSandbox")) ||
        (event.metadata && event.metadata.isSandbox !== true && event.metadata.createdBy)

      if (needsFix) {
        event.metadata = event.metadata || {}
        event.metadata.isSandbox = true
        await event.save()
        fixedCount++
        console.log(`[Migration] Fixed event: ${event.name} (${event._id})`)
      } else if (event.metadata?.isSandbox === true) {
        alreadyCorrect++
      }
    }

    console.log(`[Migration] Complete!`)
    console.log(`- Fixed: ${fixedCount} events`)
    console.log(`- Already correct: ${alreadyCorrect} events`)
    console.log(`- Total sandbox events: ${fixedCount + alreadyCorrect}`)

    return {
      success: true,
      fixed: fixedCount,
      alreadyCorrect,
      total: fixedCount + alreadyCorrect,
    }
  } catch (error) {
    console.error("[Migration] Error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Auto-execute if run directly
if (typeof window === "undefined") {
  fixSandboxEvents().then(() => process.exit(0))
}

export default fixSandboxEvents
