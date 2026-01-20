import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ComplianceAlert from "@/lib/models/ComplianceAlert"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth"
import { logAudit } from "@/lib/audit-logger"

export async function GET(request, { params }) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const alert = await ComplianceAlert.findById(id)
      .populate("userId", "fullName email phone status kyc_status")
      .populate("tenantId", "name")
      .populate("assignedTo", "fullName email")
      .populate("resolution.resolvedBy", "fullName")
      .populate("notes.createdBy", "fullName")

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    console.error("[v0] Get compliance alert error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, notes, assignedTo, resolution } = body

    const alert = await ComplianceAlert.findById(id)
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    // Handle different actions
    if (action === "investigate") {
      alert.status = "investigating"
      alert.assignedTo = decoded.userId
    } else if (action === "escalate") {
      alert.status = "escalated"
      alert.severity = "critical"
    } else if (action === "resolve") {
      alert.status = "resolved"
      alert.resolution = {
        action: resolution?.action || "no_action",
        notes: resolution?.notes,
        resolvedBy: decoded.userId,
        resolvedAt: new Date(),
      }

      // Take action on user if needed
      if (resolution?.action === "account_suspended") {
        await User.findByIdAndUpdate(alert.userId, { status: "suspended" })
      } else if (resolution?.action === "account_blocked") {
        await User.findByIdAndUpdate(alert.userId, { status: "blocked" })
      }
    } else if (action === "dismiss") {
      alert.status = "dismissed"
      alert.resolution = {
        action: "false_positive",
        notes: notes || "Dismissed as false positive",
        resolvedBy: decoded.userId,
        resolvedAt: new Date(),
      }
    } else if (action === "add_note" && notes) {
      alert.notes.push({
        text: notes,
        createdBy: decoded.userId,
        createdAt: new Date(),
      })
    }

    if (assignedTo) {
      alert.assignedTo = assignedTo
    }

    await alert.save()

    await logAudit({
      action: `compliance_alert_${action}`,
      performedBy: decoded.userId,
      targetType: "compliance_alert",
      targetId: alert._id,
      details: { action, resolution: resolution?.action },
    })

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    console.error("[v0] Update compliance alert error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
