import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import B2BSettlement from "@/lib/models/B2BSettlement"
import AuditLog from "@/lib/models/AuditLog"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt"

function getAuthToken(request) {
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    if (token && token !== "null" && token !== "undefined") {
      return token
    }
  }
  const cookieStore = cookies()
  return cookieStore.get("auth_token")?.value || null
}

// GET /api/super/b2b-settlements/[id] - Get single settlement
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    const settlement = await B2BSettlement.findById(params.id)
      .populate("tenant_id", "name subdomain")
      .populate("processedBy", "fullName email")
      .populate("approvedBy", "fullName email")
      .lean()

    if (!settlement) {
      return NextResponse.json({ success: false, error: "Settlement not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, settlement })
  } catch (error) {
    console.error("B2B Settlement GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch settlement" }, { status: 500 })
  }
}

// PUT /api/super/b2b-settlements/[id] - Update settlement (AML status, confirmations, etc.)
export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { action, amlStatus, amlNotes, riskScore, confirmations, status, internalNotes } = body

    const settlement = await B2BSettlement.findById(params.id)
    if (!settlement) {
      return NextResponse.json({ success: false, error: "Settlement not found" }, { status: 404 })
    }

    const oldData = settlement.toObject()

    // Handle different actions
    switch (action) {
      case "updateAML":
        if (amlStatus) {
          settlement.compliance.amlScreeningStatus = amlStatus
          settlement.compliance.amlScreeningDate = new Date()
        }
        if (amlNotes) settlement.compliance.amlNotes = amlNotes
        if (riskScore !== undefined) settlement.compliance.riskScore = riskScore
        break

      case "updateConfirmations":
        if (confirmations !== undefined) {
          settlement.blockchain.confirmations = confirmations
          if (confirmations >= 20 && settlement.status === "confirming") {
            settlement.blockchain.confirmedAt = new Date()
            settlement.status = "confirmed"
          }
        }
        break

      case "approve":
        settlement.approvedBy = decoded.userId
        settlement.approvedAt = new Date()
        settlement.status = "completed"
        break

      case "reject":
        settlement.status = "failed"
        settlement.errorMessage = body.reason || "Rejected by admin"
        break

      case "flag":
        settlement.compliance.amlScreeningStatus = "flagged"
        settlement.compliance.amlNotes = body.reason || "Flagged for review"
        break

      default:
        // Direct field updates
        if (status) settlement.status = status
        if (internalNotes) settlement.internalNotes = internalNotes
    }

    await settlement.save()

    // Create audit log
    await AuditLog.create({
      tenant_id: settlement.tenant_id,
      actor: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      action: "config.payment.update",
      resource: {
        type: "transaction",
        id: settlement._id.toString(),
        name: settlement.settlementId,
      },
      changes: {
        before: { status: oldData.status, amlStatus: oldData.compliance?.amlScreeningStatus },
        after: { status: settlement.status, amlStatus: settlement.compliance?.amlScreeningStatus },
      },
      severity: action === "flag" ? "high" : "medium",
    })

    return NextResponse.json({ success: true, settlement })
  } catch (error) {
    console.error("B2B Settlement PUT error:", error)
    return NextResponse.json({ success: false, error: "Failed to update settlement" }, { status: 500 })
  }
}
