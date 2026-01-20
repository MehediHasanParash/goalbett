import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import AnalyticsEngine from "@/lib/analytics-engine"

export async function POST(request) {
  try {
    await connectDB()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

    if (!["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { reportType, format = "json", startDate, endDate, tenantId } = body

    const options = { startDate, endDate, tenantId }

    let data = {}

    switch (reportType) {
      case "ggr_report":
        data = {
          title: "GGR Report",
          generatedAt: new Date().toISOString(),
          period: { startDate, endDate },
          metrics: await AnalyticsEngine.calculateNGR(options),
        }
        break

      case "player_report":
        const playerMetrics = await AnalyticsEngine.getPlayerMetrics(options)
        const churnData = await AnalyticsEngine.detectChurn({ tenantId })
        const retentionData = await AnalyticsEngine.calculateRetention({ tenantId })
        data = {
          title: "Player Report",
          generatedAt: new Date().toISOString(),
          period: { startDate, endDate },
          metrics: playerMetrics,
          retention: retentionData,
          churn: churnData,
        }
        break

      case "agent_report":
        data = {
          title: "Agent Performance Report",
          generatedAt: new Date().toISOString(),
          period: { startDate, endDate },
          agents: await AnalyticsEngine.getAgentProfits(options),
        }
        break

      case "financial_report":
        data = {
          title: "Financial Report",
          generatedAt: new Date().toISOString(),
          period: { startDate, endDate },
          trends: await AnalyticsEngine.getFinancialTrends(options),
          summary: await AnalyticsEngine.calculateNGR(options),
        }
        break

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    if (format === "csv") {
      // Convert to CSV format
      let csv = ""
      const flattenObject = (obj, prefix = "") => {
        let result = {}
        for (const key in obj) {
          if (typeof obj[key] === "object" && !Array.isArray(obj[key]) && obj[key] !== null) {
            result = { ...result, ...flattenObject(obj[key], prefix + key + "_") }
          } else {
            result[prefix + key] = obj[key]
          }
        }
        return result
      }

      const flatData = flattenObject(data)
      csv = Object.keys(flatData).join(",") + "\n"
      csv += Object.values(flatData)
        .map((v) => (typeof v === "string" ? `"${v}"` : v))
        .join(",")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${reportType}_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Export report error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
