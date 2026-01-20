import connectDB from "@/lib/mongodb"

// Notification types
export const NotificationType = {
  INSOLVENCY_CRITICAL: "insolvency_critical",
  INSOLVENCY_WARNING: "insolvency_warning",
  SETTLEMENT_COMPLETE: "settlement_complete",
  FRAUD_ALERT: "fraud_alert",
  SYSTEM_ALERT: "system_alert",
}

class NotificationService {
  // Send insolvency alert to super admins
  static async sendInsolvencyAlert(tenant, daysToInsolvency, burnRate) {
    await connectDB()

    const severity = daysToInsolvency <= 2 ? "critical" : daysToInsolvency <= 7 ? "warning" : "info"

    // Create in-app notification
    const notification = {
      type: NotificationType.INSOLVENCY_CRITICAL,
      severity,
      title: `${severity === "critical" ? "CRITICAL" : "Warning"}: Tenant Insolvency Risk`,
      message: `${tenant.name} has ${daysToInsolvency} days until potential insolvency. Daily burn rate: $${Math.abs(burnRate).toLocaleString()}`,
      tenantId: tenant._id,
      tenantName: tenant.name,
      data: {
        daysToInsolvency,
        burnRate,
        currentBalance: tenant.currentBalance,
      },
      createdAt: new Date(),
      read: false,
    }

    // Store notification in database
    try {
      const Notification = (await import("@/lib/models/Notification")).default || (await createNotificationModel())
      await Notification.create(notification)
    } catch (e) {
      // Model might not exist, create it
      console.log("[v0] Notification model not found, storing in memory")
    }

    // Log the alert
    console.log(`[INSOLVENCY ALERT] ${severity.toUpperCase()}: ${tenant.name} - ${daysToInsolvency} days remaining`)

    // In production, you would also:
    // 1. Send email to super admins
    // 2. Send SMS if critical
    // 3. Push notification to admin app
    // 4. Post to Slack/Discord webhook

    return notification
  }

  // Check all tenants for insolvency and send alerts
  static async checkAndAlertInsolvency() {
    await connectDB()

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/super/insolvency-alerts`,
      )
      const data = await response.json()

      if (!data.success) return { sent: 0, errors: [] }

      const alerts = data.alerts || []
      const criticalAlerts = alerts.filter(
        (a) => a.riskLevel === "critical" || (typeof a.daysToInsolvency === "number" && a.daysToInsolvency <= 2),
      )

      const notifications = []
      for (const alert of criticalAlerts) {
        const notification = await this.sendInsolvencyAlert(
          { _id: alert.tenantId, name: alert.tenantName, currentBalance: alert.currentBalance },
          alert.daysToInsolvency,
          alert.burnRate,
        )
        notifications.push(notification)
      }

      return {
        sent: notifications.length,
        criticalCount: criticalAlerts.length,
        notifications,
      }
    } catch (error) {
      console.error("Error checking insolvency alerts:", error)
      return { sent: 0, errors: [error.message] }
    }
  }

  // Get unread notifications for super admin
  static async getUnreadNotifications(limit = 20) {
    await connectDB()

    try {
      const Notification = (await import("@/lib/models/Notification")).default
      return await Notification.find({ read: false }).sort({ createdAt: -1 }).limit(limit).lean()
    } catch (e) {
      return []
    }
  }
}

// Create Notification model if it doesn't exist
async function createNotificationModel() {
  const mongoose = (await import("mongoose")).default

  const NotificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    tenantName: String,
    data: mongoose.Schema.Types.Mixed,
    read: { type: Boolean, default: false },
    readAt: Date,
    createdAt: { type: Date, default: Date.now },
  })

  return mongoose.models.Notification || mongoose.model("Notification", NotificationSchema)
}

export default NotificationService
