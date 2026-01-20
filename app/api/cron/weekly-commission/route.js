import { NextResponse } from "next/server"
import { CommissionSettlementService } from "@/lib/services/commission-settlement-service"

/**
 * Weekly Commission Settlement Cron Job
 *
 * This endpoint should be called every Monday at 00:00 UTC
 *
 * Setup with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/weekly-commission",
 *     "schedule": "0 0 * * 1"
 *   }]
 * }
 *
 * Or use external cron service to call this endpoint
 */
export async function GET(request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Allow if CRON_SECRET matches or if running locally
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check if it's a Vercel cron request
      const isVercelCron = request.headers.get("x-vercel-cron") === "1"
      if (!isVercelCron) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    console.log("[v0] Starting weekly commission settlement cron job...")

    const results = await CommissionSettlementService.runWeeklySettlement({
      processedBy: "system_cron",
    })

    console.log("[v0] Weekly commission settlement completed:", results)

    return NextResponse.json({
      success: true,
      message: "Weekly commission settlement completed",
      results,
    })
  } catch (error) {
    console.error("[v0] Weekly commission cron error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

// Also support POST for manual triggering
export async function POST(request) {
  return GET(request)
}
