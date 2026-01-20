import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import ComplianceReport from "@/lib/models/ComplianceReport"
import User from "@/lib/models/User"
import Bet from "@/lib/models/Bet"
import Transaction from "@/lib/models/Transaction"
import { verifyToken } from "@/lib/auth"
import { logAudit } from "@/lib/audit-logger"

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    const query = {}
    if (type) query.type = type
    if (status) query.status = status

    const reports = await ComplianceReport.find(query)
      .populate("generatedBy", "fullName")
      .populate("tenantId", "name")
      .sort({ createdAt: -1 })
      .limit(50)

    return NextResponse.json({ success: true, reports })
  } catch (error) {
    console.error("[v0] Compliance reports error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
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

    const { type, tenantId } = await request.json()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    let reportData = {}
    let title = ""

    switch (type) {
      case "monthly_ggr":
        title = `Monthly GGR Report - ${now.toLocaleString("default", { month: "long", year: "numeric" })}`
        const bets = await Bet.find({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        })
        const totalStakes = bets.reduce((sum, b) => sum + (b.stake || 0), 0)
        const totalPayouts = bets.filter((b) => b.status === "won").reduce((sum, b) => sum + (b.potentialWin || 0), 0)
        reportData = {
          totalBets: bets.length,
          totalStakes,
          totalPayouts,
          ggr: totalStakes - totalPayouts,
          period: { start: startOfMonth, end: endOfMonth },
        }
        break

      case "player_activity":
        title = `Player Activity Report - ${now.toLocaleString("default", { month: "long", year: "numeric" })}`
        const activePlayers = await User.countDocuments({
          role: "player",
          lastLogin: { $gte: startOfMonth },
        })
        const newPlayers = await User.countDocuments({
          role: "player",
          createdAt: { $gte: startOfMonth },
        })
        reportData = {
          activePlayers,
          newPlayers,
          totalPlayers: await User.countDocuments({ role: "player" }),
          period: { start: startOfMonth, end: endOfMonth },
        }
        break

      case "kyc_summary":
        title = `KYC Summary Report - ${now.toLocaleString("default", { month: "long", year: "numeric" })}`
        reportData = {
          verified: await User.countDocuments({ role: "player", kyc_status: { $in: ["approved", "verified"] } }),
          pending: await User.countDocuments({ role: "player", kyc_status: "pending" }),
          rejected: await User.countDocuments({ role: "player", kyc_status: "rejected" }),
          notSubmitted: await User.countDocuments({ role: "player", kyc_status: "not_submitted" }),
        }
        break

      case "transaction_summary":
        title = `Transaction Summary Report - ${now.toLocaleString("default", { month: "long", year: "numeric" })}`
        const transactions = await Transaction.find({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: "completed",
        })
        const deposits = transactions.filter((t) => t.type === "deposit")
        const withdrawals = transactions.filter((t) => t.type === "withdrawal")
        reportData = {
          totalTransactions: transactions.length,
          deposits: { count: deposits.length, amount: deposits.reduce((s, t) => s + t.amount, 0) },
          withdrawals: { count: withdrawals.length, amount: withdrawals.reduce((s, t) => s + Math.abs(t.amount), 0) },
        }
        break

      default:
        title = `Compliance Report - ${now.toLocaleDateString()}`
        reportData = {}
    }

    const report = await ComplianceReport.create({
      type,
      title,
      status: "generated",
      tenantId: tenantId || null,
      period: { startDate: startOfMonth, endDate: endOfMonth },
      generatedAt: now,
      generatedBy: decoded.userId,
      data: reportData,
    })

    await logAudit({
      action: "compliance_report_generated",
      performedBy: decoded.userId,
      targetType: "compliance_report",
      targetId: report._id,
      details: { type, title },
    })

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("[v0] Generate compliance report error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
