import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Notification from "@/lib/models/Notification"

// GET /api/super/notifications - Get notifications for super admin
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = Number.parseInt(searchParams.get("limit")) || 50
    const type = searchParams.get("type")

    const query = {}
    if (unreadOnly) query.read = false
    if (type) query.type = type

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean()

    const unreadCount = await Notification.countDocuments({ read: false })
    const criticalCount = await Notification.countDocuments({ read: false, severity: "critical" })

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      criticalCount,
    })
  } catch (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/super/notifications - Mark notifications as read
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { action, notificationIds } = body

    if (action === "mark_read" && notificationIds?.length) {
      await Notification.updateMany({ _id: { $in: notificationIds } }, { $set: { read: true, readAt: new Date() } })

      return NextResponse.json({
        success: true,
        message: `Marked ${notificationIds.length} notifications as read`,
      })
    }

    if (action === "mark_all_read") {
      const result = await Notification.updateMany({ read: false }, { $set: { read: true, readAt: new Date() } })

      return NextResponse.json({
        success: true,
        message: `Marked ${result.modifiedCount} notifications as read`,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Notifications POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
