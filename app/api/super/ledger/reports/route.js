import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { LedgerEngine } from "@/lib/ledger-engine"
import LedgerEntry from "@/lib/models/LedgerEntry"
import Wallet from "@/lib/models/Wallet"
import User from "@/lib/models/User"

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
    const reportType = searchParams.get("type") || "financial"
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get("endDate") || new Date().toISOString()
    const tenantId = searchParams.get("tenantId")

    switch (reportType) {
      case "financial": {
        const report = await LedgerEngine.generateFinancialReport({
          tenantId,
          startDate,
          endDate,
        })
        return NextResponse.json({ success: true, report })
      }

      case "win_loss": {
        const userId = searchParams.get("userId")
        if (!userId) {
          return NextResponse.json({ error: "userId required for win_loss report" }, { status: 400 })
        }
        const report = await LedgerEngine.getPlayerWinLossHistory({
          userId,
          startDate,
          endDate,
        })
        return NextResponse.json({ success: true, report })
      }

      case "reconciliation": {
        const entries = await LedgerEntry.find({
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        })
          .select("entryNumber amount transactionType status reconciliationStatus createdAt")
          .sort({ createdAt: -1 })

        const summary = {
          total: entries.length,
          matched: entries.filter((e) => e.reconciliationStatus === "matched").length,
          unmatched: entries.filter((e) => e.reconciliationStatus === "unmatched").length,
          disputed: entries.filter((e) => e.reconciliationStatus === "disputed").length,
          pending: entries.filter((e) => e.reconciliationStatus === "pending").length,
        }

        return NextResponse.json({ success: true, entries, summary })
      }

      case "agent_settlements": {
        const agents = await User.find({ role: { $in: ["agent", "sub_agent"] } }).select("name email")

        const settlements = await Promise.all(
          agents.map(async (agent) => {
            const wallet = await Wallet.findOne({ userId: agent._id })
            const commissions = await LedgerEntry.aggregate([
              {
                $match: {
                  "creditAccount.userId": agent._id,
                  transactionType: "AGENT_COMMISSION",
                  status: "completed",
                  createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                },
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
            ])

            return {
              agent: { _id: agent._id, name: agent.name, email: agent.email },
              wallet: wallet ? { balance: wallet.availableBalance, currency: wallet.currency } : null,
              commissions: commissions[0] || { total: 0, count: 0 },
            }
          }),
        )

        return NextResponse.json({ success: true, settlements })
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Reports API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
