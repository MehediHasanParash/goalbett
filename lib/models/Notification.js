import mongoose from "mongoose"

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "insolvency_critical",
      "insolvency_warning",
      "settlement_complete",
      "fraud_alert",
      "system_alert",
      "domain_blocked",
      "payment_failed",
    ],
  },
  severity: {
    type: String,
    enum: ["info", "warning", "critical"],
    default: "info",
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
  },
  tenantName: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  emailSent: {
    type: Boolean,
    default: false,
  },
  smsSent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for quick lookup
NotificationSchema.index({ read: 1, createdAt: -1 })
NotificationSchema.index({ tenantId: 1, type: 1 })
NotificationSchema.index({ severity: 1, read: 1 })

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema)
