import mongoose from "mongoose"

const SupportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["account", "deposit", "withdrawal", "betting", "technical", "other"],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "waiting_user", "resolved", "closed"],
      default: "open",
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ["user", "support"],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        attachments: [String],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: [
      {
        content: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    escalatedTo: {
      type: String,
      enum: ["finance", "admin", null],
      default: null,
    },
    escalatedAt: Date,
    escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    escalationReason: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
)

export default mongoose.models.SupportTicket || mongoose.model("SupportTicket", SupportTicketSchema)
