import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import PaymentApproval from "@/lib/models/PaymentApproval"
import Transaction from "@/lib/models/Transaction"
import Wallet from "@/lib/models/Wallet"
import { logAudit } from "@/lib/audit-logger"

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()
    const { id } = await params
    const { action, notes } = await request.json()

    const approval = await PaymentApproval.findById(id)
    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 })
    }

    if (approval.status !== "pending" && approval.status !== "escalated") {
      return NextResponse.json({ error: "Approval already processed" }, { status: 400 })
    }

    let newStatus = approval.status
    let transactionUpdate = {}

    switch (action) {
      case "approve":
        newStatus = "approved"
        transactionUpdate = { status: "completed" }

        // For withdrawals, deduct from wallet (already done when created)
        // For deposits, credit to wallet
        if (approval.type === "deposit") {
          const wallet = await Wallet.findOne({ userId: approval.userId })
          if (wallet) {
            wallet.balance += approval.amount
            await wallet.save()
          }
        }
        break

      case "reject":
        newStatus = "rejected"
        transactionUpdate = { status: "failed" }

        // For withdrawals, refund the held amount
        if (approval.type === "withdrawal") {
          const wallet = await Wallet.findOne({ userId: approval.userId })
          if (wallet) {
            wallet.balance += approval.amount
            await wallet.save()
          }
        }
        break

      case "escalate":
        newStatus = "escalated"
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update approval
    approval.status = newStatus
    approval.reviewedBy = decoded.userId
    approval.reviewedAt = new Date()
    approval.reviewNotes = notes || ""
    if (newStatus === "approved") {
      approval.processedAt = new Date()
    }
    await approval.save()

    // Update transaction if applicable
    if (transactionUpdate.status && approval.transactionId) {
      await Transaction.findByIdAndUpdate(approval.transactionId, transactionUpdate)
    }

    // Log audit
    await logAudit({
      action: `payment_${action}`,
      userId: decoded.userId,
      resourceType: "payment_approval",
      resourceId: id,
      details: {
        approvalType: approval.type,
        amount: approval.amount,
        previousStatus: "pending",
        newStatus,
        notes,
      },
    })

    return NextResponse.json({
      success: true,
      approval,
      message: `Payment ${action}d successfully`,
    })
  } catch (error) {
    console.error("Error processing approval:", error)
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 })
  }
}
