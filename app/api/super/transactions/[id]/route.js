import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Transaction from "@/lib/models/Transaction"
import Wallet from "@/lib/models/Wallet"
import { logAudit } from "@/lib/audit-logger"

// GET single transaction
export async function GET(request, { params }) {
  try {
    await dbConnect()
    const { id } = await params

    const transaction = await Transaction.findById(id)
      .populate("userId", "username email phone")
      .populate("tenantId", "name")
      .populate("walletId", "balance currency")
      .populate("betId", "ticketNumber status selections")
      .populate("processedBy", "username email")
      .populate("fromWalletId", "balance")
      .populate("toWalletId", "balance")
      .lean()

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error("[v0] Transaction GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update transaction status (approve/reject/reverse)
export async function PATCH(request, { params }) {
  try {
    await dbConnect()
    const { id } = await params
    const body = await request.json()
    const { action, reason, adminId } = body

    const transaction = await Transaction.findById(id)
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const previousStatus = transaction.status

    switch (action) {
      case "approve":
        if (transaction.status !== "pending") {
          return NextResponse.json({ error: "Only pending transactions can be approved" }, { status: 400 })
        }

        transaction.status = "completed"
        transaction.processedBy = adminId

        const wallet = await Wallet.findById(transaction.walletId)
        if (wallet) {
          // For deposits, ADD to wallet
          if (transaction.type === "deposit") {
            const balanceBefore = wallet.availableBalance || 0
            wallet.availableBalance = (wallet.availableBalance || 0) + Math.abs(transaction.amount)

            // Also update daily usage tracking
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            if (!wallet.usage?.lastResetDate || wallet.usage.lastResetDate < today) {
              wallet.usage = {
                dailyDeposit: Math.abs(transaction.amount),
                dailyWithdrawal: 0,
                dailyBet: 0,
                lastResetDate: today,
              }
            } else {
              wallet.usage = {
                ...wallet.usage,
                dailyDeposit: (wallet.usage?.dailyDeposit || 0) + Math.abs(transaction.amount),
              }
            }

            await wallet.save()

            // Update transaction with correct balance info
            transaction.balanceBefore = balanceBefore
            transaction.balanceAfter = wallet.availableBalance
            transaction.description = (transaction.description || "").replace("Pending", "Approved")
          }
          // For withdrawals, deduct from wallet
          else if (transaction.type === "withdrawal") {
            wallet.availableBalance = (wallet.availableBalance || 0) - Math.abs(transaction.amount)
            wallet.pendingWithdrawal = Math.max(0, (wallet.pendingWithdrawal || 0) - Math.abs(transaction.amount))
            await wallet.save()
          }
        }
        break

      case "reject":
        if (transaction.status !== "pending") {
          return NextResponse.json({ error: "Only pending transactions can be rejected" }, { status: 400 })
        }

        transaction.status = "failed"
        transaction.processedBy = adminId
        transaction.description = (transaction.description || "") + ` | Rejected: ${reason || "No reason provided"}`

        if (transaction.type === "withdrawal") {
          const walletForReject = await Wallet.findById(transaction.walletId)
          if (walletForReject) {
            walletForReject.pendingWithdrawal = Math.max(
              0,
              (walletForReject.pendingWithdrawal || 0) - Math.abs(transaction.amount),
            )
            walletForReject.availableBalance = (walletForReject.availableBalance || 0) + Math.abs(transaction.amount)
            await walletForReject.save()
          }
        }
        break

      case "reverse":
        if (transaction.status !== "completed") {
          return NextResponse.json({ error: "Only completed transactions can be reversed" }, { status: 400 })
        }

        // Reverse the transaction by adjusting wallet balance
        const walletToReverse = await Wallet.findById(transaction.walletId)
        if (walletToReverse) {
          // If it was a deposit, subtract. If withdrawal, add back.
          if (["deposit", "tenant_topup", "agent_topup", "bonus_credit", "bet_won"].includes(transaction.type)) {
            walletToReverse.availableBalance = Math.max(
              0,
              (walletToReverse.availableBalance || 0) - Math.abs(transaction.amount),
            )
          } else if (["withdrawal", "bet_placed", "bonus_debit", "bet_lost"].includes(transaction.type)) {
            walletToReverse.availableBalance = (walletToReverse.availableBalance || 0) + Math.abs(transaction.amount)
          }
          await walletToReverse.save()
        }

        transaction.status = "reversed"
        transaction.processedBy = adminId
        transaction.description = (transaction.description || "") + ` | Reversed: ${reason || "Admin reversal"}`
        break

      case "cancel":
        if (transaction.status !== "pending") {
          return NextResponse.json({ error: "Only pending transactions can be cancelled" }, { status: 400 })
        }

        transaction.status = "cancelled"
        transaction.processedBy = adminId
        transaction.description = (transaction.description || "") + ` | Cancelled: ${reason || "No reason provided"}`

        if (transaction.type === "withdrawal") {
          const walletForCancel = await Wallet.findById(transaction.walletId)
          if (walletForCancel) {
            walletForCancel.pendingWithdrawal = Math.max(
              0,
              (walletForCancel.pendingWithdrawal || 0) - Math.abs(transaction.amount),
            )
            walletForCancel.availableBalance = (walletForCancel.availableBalance || 0) + Math.abs(transaction.amount)
            await walletForCancel.save()
          }
        }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await transaction.save()

    // Log audit
    await logAudit({
      action: `transaction_${action}`,
      performedBy: adminId,
      targetType: "transaction",
      targetId: transaction._id,
      details: {
        previousStatus,
        newStatus: transaction.status,
        amount: transaction.amount,
        type: transaction.type,
        reason,
      },
    })

    return NextResponse.json({
      success: true,
      data: transaction,
      message: `Transaction ${action}d successfully`,
    })
  } catch (error) {
    console.error("[v0] Transaction PATCH error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
