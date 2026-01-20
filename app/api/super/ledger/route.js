import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import LedgerEntry from "@/lib/models/LedgerEntry"
import Wallet from "@/lib/models/Wallet"
import User from "@/lib/models/User"
import { LedgerEngine } from "@/lib/ledger-engine"

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
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 50
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")

    // Build query
    const query = {}
    if (type && type !== "all") query.transactionType = type
    if (status && status !== "all") query.status = status
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }
    if (search) {
      query.$or = [
        { entryNumber: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { externalReference: { $regex: search, $options: "i" } },
      ]
    }

    // Get entries with pagination
    const [rawEntries, total] = await Promise.all([
      LedgerEntry.find(query)
        .populate("createdBy", "name email")
        .populate("approvedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LedgerEntry.countDocuments(query),
    ])

    const entries = await Promise.all(
      rawEntries.map(async (entry, idx) => {
        // Generate display entry number if missing
        if (!entry.entryNumber) {
          entry.entryNumber = `LE-${entry._id.toString().slice(-8).toUpperCase()}`
        }

        // Populate debit account user
        if (entry.debitAccount?.userId) {
          const user = await User.findById(entry.debitAccount.userId).select("name email").lean()
          if (user) {
            entry.debitAccount.userId = user
            entry.debitAccount.accountName = user.name || user.email || entry.debitAccount.accountName
          }
        }

        // Populate credit account user
        if (entry.creditAccount?.userId) {
          const user = await User.findById(entry.creditAccount.userId).select("name email").lean()
          if (user) {
            entry.creditAccount.userId = user
            entry.creditAccount.accountName = user.name || user.email || entry.creditAccount.accountName
          }
        }

        // Populate wallet info if available
        if (entry.debitAccount?.walletId) {
          const wallet = await Wallet.findById(entry.debitAccount.walletId).populate("userId", "name email").lean()
          if (wallet) {
            entry.debitAccount.wallet = wallet
            entry.debitAccount.accountName =
              wallet.userId?.name || wallet.userId?.email || entry.debitAccount.accountName || "Wallet"
          }
        }

        if (entry.creditAccount?.walletId) {
          const wallet = await Wallet.findById(entry.creditAccount.walletId).populate("userId", "name email").lean()
          if (wallet) {
            entry.creditAccount.wallet = wallet
            entry.creditAccount.accountName =
              wallet.userId?.name || wallet.userId?.email || entry.creditAccount.accountName || "Wallet"
          }
        }

        // Ensure description is not empty
        if (!entry.description) {
          entry.description = entry.transactionType?.replace(/_/g, " ").toLowerCase() || "Transaction"
        }

        return entry
      }),
    )

    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayStats, totalStats, pendingCount] = await Promise.all([
      LedgerEntry.aggregate([
        { $match: { createdAt: { $gte: today }, status: "completed" } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      LedgerEntry.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: "$transactionType",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      LedgerEntry.countDocuments({ status: "pending" }),
    ])

    // Get wallet stats
    const walletStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$availableBalance" },
          totalLocked: { $sum: "$lockedBalance" },
          totalBonus: { $sum: "$bonusBalance" },
          walletCount: { $sum: 1 },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        todayVolume: todayStats[0]?.totalAmount || 0,
        todayTransactions: todayStats[0]?.count || 0,
        pendingApprovals: pendingCount,
        totalBalance: walletStats[0]?.totalBalance || 0,
        totalLocked: walletStats[0]?.totalLocked || 0,
        totalBonus: walletStats[0]?.totalBonus || 0,
        walletCount: walletStats[0]?.walletCount || 0,
        byType: totalStats.reduce((acc, item) => {
          acc[item._id] = { amount: item.totalAmount, count: item.count }
          return acc
        }, {}),
      },
    })
  } catch (error) {
    console.error("Ledger API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded || !["super_admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case "manual_adjustment": {
        const { walletId, amount, type, description, currency = "USD" } = body
        const wallet = await Wallet.findById(walletId).populate("userId")
        if (!wallet) {
          return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
        }

        const entry = await LedgerEngine.createEntry({
          tenantId: wallet.tenantId,
          debitAccount:
            type === "credit"
              ? { accountType: "system", accountName: "Manual Adjustments" }
              : { walletId, accountType: "player", accountName: "Player Wallet", userId: wallet.userId?._id },
          creditAccount:
            type === "credit"
              ? { walletId, accountType: "player", accountName: "Player Wallet", userId: wallet.userId?._id }
              : { accountType: "system", accountName: "Manual Adjustments" },
          amount: Math.abs(amount),
          currency,
          transactionType: type === "credit" ? "MANUAL_CREDIT" : "MANUAL_DEBIT",
          description: description || `Manual ${type} adjustment`,
          createdBy: decoded.userId,
        })

        return NextResponse.json({ success: true, entry })
      }

      case "reverse_entry": {
        const { entryId, reason } = body
        const reversalEntry = await LedgerEngine.reverseEntry({
          entryId,
          reversedBy: decoded.userId,
          reason,
        })
        return NextResponse.json({ success: true, entry: reversalEntry })
      }

      case "approve_entry": {
        const { entryId } = body
        const entry = await LedgerEntry.findByIdAndUpdate(
          entryId,
          {
            status: "completed",
            approvedBy: decoded.userId,
            approvedAt: new Date(),
          },
          { new: true },
        )
        return NextResponse.json({ success: true, entry })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Ledger action error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
