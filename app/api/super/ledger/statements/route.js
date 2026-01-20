import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import LedgerEntry from "@/lib/models/LedgerEntry"
import Transaction from "@/lib/models/Transaction"
import Wallet from "@/lib/models/Wallet"
import mongoose from "mongoose"

export async function GET(request) {
  try {
    await connectDB()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded || !["super_admin", "superadmin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get("walletId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const types = searchParams.get("types")?.split(",")

    if (!walletId) {
      return NextResponse.json({ error: "walletId is required" }, { status: 400 })
    }

    const walletObjectId = new mongoose.Types.ObjectId(walletId)

    const ledgerQuery = {
      $or: [{ "debitAccount.walletId": walletObjectId }, { "creditAccount.walletId": walletObjectId }],
      status: { $in: ["completed", "reversed"] },
    }

    if (startDate && endDate) {
      ledgerQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    const ledgerEntries = await LedgerEntry.find(ledgerQuery).sort({ createdAt: -1 }).limit(500)

    const transactionQuery = {
      walletId: walletObjectId,
      status: "completed",
    }

    if (startDate && endDate) {
      transactionQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    const transactions = await Transaction.find(transactionQuery).sort({ createdAt: -1 }).limit(500)

    const wallet = await Wallet.findById(walletObjectId)

    const statement = []

    // Add ledger entries
    ledgerEntries.forEach((entry) => {
      const isDebit = entry.debitAccount.walletId?.toString() === walletId
      statement.push({
        _id: entry._id,
        source: "ledger",
        entryNumber: entry.entryNumber || `LE-${entry._id.toString().slice(-8).toUpperCase()}`,
        transactionType: entry.transactionType,
        description: entry.description || entry.transactionType?.replace(/_/g, " ").toLowerCase() || "Transaction",
        amount: entry.amount,
        isDebit,
        runningBalance: isDebit ? entry.debitBalanceAfter : entry.creditBalanceAfter,
        status: entry.status,
        createdAt: entry.createdAt,
      })
    })

    // Add transactions (for older entries without ledger records)
    transactions.forEach((tx) => {
      // Skip if already in ledger
      if (ledgerEntries.some((le) => le.referenceId?.toString() === tx._id.toString())) {
        return
      }

      const isDebit = ["withdrawal", "bet_placed", "bet_loss", "transfer_out", "fee"].includes(tx.type)
      statement.push({
        _id: tx._id,
        source: "transaction",
        entryNumber: tx.transactionId || `TXN-${tx._id.toString().slice(-8).toUpperCase()}`,
        transactionType: tx.type?.toUpperCase() || "UNKNOWN",
        description: tx.description || `${tx.type} transaction`,
        amount: Math.abs(tx.amount),
        isDebit,
        runningBalance: tx.balanceAfter,
        status: tx.status,
        createdAt: tx.createdAt,
      })
    })

    // Sort by date descending
    statement.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Calculate summary
    const summary = {
      totalDebits: statement.filter((e) => e.isDebit).reduce((sum, e) => sum + e.amount, 0),
      totalCredits: statement.filter((e) => !e.isDebit).reduce((sum, e) => sum + e.amount, 0),
      netChange: statement.reduce((sum, e) => sum + (e.isDebit ? -e.amount : e.amount), 0),
      transactionCount: statement.length,
      currentBalance: wallet?.availableBalance || 0,
    }

    return NextResponse.json({
      success: true,
      statement,
      summary,
      wallet: {
        _id: wallet?._id,
        availableBalance: wallet?.availableBalance || 0,
        lockedBalance: wallet?.lockedBalance || 0,
        bonusBalance: wallet?.bonusBalance || 0,
        currency: wallet?.currency || "USD",
      },
    })
  } catch (error) {
    console.error("Statement API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
