import { NextResponse } from "next/server"
import NotificationService from "@/lib/services/notification-service"

// This cron job runs every 6 hours to check for insolvency risks
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/insolvency-check", "schedule": "0 */6 * * *" }] }

export async function GET(request) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[CRON] Running insolvency check...")

    const result = await NotificationService.checkAndAlertInsolvency()

    console.log(`[CRON] Insolvency check complete. Sent ${result.sent} alerts.`)

    return NextResponse.json({
      success: true,
      message: `Insolvency check complete`,
      alertsSent: result.sent,
      criticalCount: result.criticalCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[CRON] Insolvency check error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
