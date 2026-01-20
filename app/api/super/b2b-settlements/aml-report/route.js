import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import B2BSettlement from "@/lib/models/B2BSettlement"
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

// GET /api/super/b2b-settlements/aml-report - Generate AML compliance report
export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get("endDate") || new Date().toISOString()
    const format = searchParams.get("format") || "json"

    const report = await B2BSettlement.getAMLReport(new Date(startDate), new Date(endDate))

    // Calculate summary statistics
    const summary = {
      period: { startDate, endDate },
      totalTransactions: report.length,
      totalVolume: report.reduce((sum, t) => sum + (t.amount?.value || 0), 0),
      byStatus: {},
      byAMLStatus: {},
      flaggedTransactions: [],
      highRiskTransactions: [],
    }

    report.forEach((t) => {
      // Count by status
      summary.byStatus[t.status] = (summary.byStatus[t.status] || 0) + 1

      // Count by AML status
      const amlStatus = t.compliance?.amlScreeningStatus || "pending"
      summary.byAMLStatus[amlStatus] = (summary.byAMLStatus[amlStatus] || 0) + 1

      // Track flagged transactions
      if (["flagged", "manual_review", "failed"].includes(amlStatus)) {
        summary.flaggedTransactions.push({
          settlementId: t.settlementId,
          txHash: t.blockchain?.txHash,
          amount: t.amount?.value,
          amlStatus,
          date: t.createdAt,
        })
      }

      // Track high-risk transactions
      if (t.compliance?.riskScore > 70) {
        summary.highRiskTransactions.push({
          settlementId: t.settlementId,
          txHash: t.blockchain?.txHash,
          amount: t.amount?.value,
          riskScore: t.compliance.riskScore,
          date: t.createdAt,
        })
      }
    })

    if (format === "csv") {
      const csvRows = [
        [
          "Settlement ID",
          "Date",
          "Type",
          "Amount (USDT)",
          "TxHash",
          "From Wallet",
          "To Wallet",
          "AML Status",
          "Risk Score",
          "Status",
        ].join(","),
        ...report.map((t) =>
          [
            t.settlementId,
            new Date(t.createdAt).toISOString(),
            t.type,
            t.amount?.value,
            t.blockchain?.txHash,
            t.fromParty?.walletAddress || "",
            t.toParty?.walletAddress || "",
            t.compliance?.amlScreeningStatus,
            t.compliance?.riskScore || "",
            t.status,
          ].join(","),
        ),
      ]

      return new Response(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="aml-report-${startDate}-${endDate}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      report: {
        summary,
        transactions: report,
      },
    })
  } catch (error) {
    console.error("AML Report error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate AML report" }, { status: 500 })
  }
}
