import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import PlayerKYC from "@/lib/models/PlayerKYC"
import Transaction from "@/lib/models/Transaction"
import ComplianceAlert from "@/lib/models/ComplianceAlert"
import ComplianceReport from "@/lib/models/ComplianceReport"
import FraudScore from "@/lib/models/FraudScore"
import { verifyToken } from "@/lib/auth"

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
    const section = searchParams.get("section") || "overview"

    // Get KYC stats from User model
    const [kycVerified, kycPending, kycRejected, totalPlayers] = await Promise.all([
      User.countDocuments({ role: "player", kyc_status: { $in: ["approved", "verified"] } }),
      User.countDocuments({ role: "player", kyc_status: "pending" }),
      User.countDocuments({ role: "player", kyc_status: "rejected" }),
      User.countDocuments({ role: "player" }),
    ])

    // Get alerts stats
    const [newAlerts, investigatingAlerts, criticalAlerts, allAlerts] = await Promise.all([
      ComplianceAlert.countDocuments({ status: "new" }),
      ComplianceAlert.countDocuments({ status: "investigating" }),
      ComplianceAlert.countDocuments({ severity: "critical", status: { $ne: "resolved" } }),
      ComplianceAlert.find({ status: { $in: ["new", "investigating"] } })
        .populate("userId", "fullName email phone")
        .populate("tenantId", "name")
        .sort({ createdAt: -1 })
        .limit(50),
    ])

    // Get flagged accounts (users with high fraud scores or suspended status)
    const flaggedAccounts = await User.countDocuments({
      role: "player",
      $or: [{ status: "suspended" }, { status: "blocked" }],
    })

    // Get fraud scores summary
    const fraudScores = await FraudScore.aggregate([
      {
        $group: {
          _id: "$riskLevel",
          count: { $sum: 1 },
        },
      },
    ])

    const fraudSummary = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }
    fraudScores.forEach((f) => {
      if (f._id) fraudSummary[f._id] = f.count
    })

    // Get reports
    const [pendingReports, generatedReports, recentReports] = await Promise.all([
      ComplianceReport.countDocuments({ status: "pending" }),
      ComplianceReport.countDocuments({ status: "generated" }),
      ComplianceReport.find().sort({ createdAt: -1 }).limit(10),
    ])

    // Get large transactions (potential AML flags)
    const largeTransactionThreshold = 10000
    const largeTransactions = await Transaction.find({
      amount: { $gte: largeTransactionThreshold },
      status: "completed",
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .populate("userId", "fullName email phone")
      .populate("tenantId", "name")
      .sort({ amount: -1 })
      .limit(20)

    // Get suspicious activity (rapid deposits/withdrawals)
    const velocityAlerts = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          types: { $addToSet: "$type" },
        },
      },
      {
        $match: {
          count: { $gte: 10 }, // More than 10 transactions in 24 hours
        },
      },
      { $limit: 20 },
    ])

    // AML monitoring summary
    const amlSummary = {
      suspiciousActivityReports: await ComplianceAlert.countDocuments({
        type: "suspicious_activity",
        status: "new",
      }),
      largeTransactionAlerts: await ComplianceAlert.countDocuments({
        type: "large_transaction",
        status: { $in: ["new", "investigating"] },
      }),
      riskScoreReviews: await FraudScore.countDocuments({
        riskLevel: { $in: ["high", "critical"] },
        lastCalculated: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    }

    // Get recent KYC submissions for review
    const pendingKycReviews = await PlayerKYC.find({ overallStatus: "pending" })
      .populate("userId", "fullName email phone")
      .populate("tenant_id", "name")
      .sort({ createdAt: -1 })
      .limit(20)

    return NextResponse.json({
      success: true,
      stats: {
        kycVerified,
        kycPending,
        kycRejected,
        totalPlayers,
        flaggedAccounts,
        reportsGenerated: generatedReports,
        pendingReports,
        newAlerts,
        investigatingAlerts,
        criticalAlerts,
      },
      amlSummary,
      fraudSummary,
      alerts: allAlerts,
      largeTransactions,
      velocityAlerts,
      pendingKycReviews,
      reports: recentReports,
    })
  } catch (error) {
    console.error("[v0] Compliance API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
