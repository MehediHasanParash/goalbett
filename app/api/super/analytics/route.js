import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import AnalyticsEngine from "@/lib/analytics-engine"
import AnalyticsSnapshot from "@/lib/models/AnalyticsSnapshot"

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || "overview"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const tenantId = searchParams.get("tenantId")
    const groupBy = searchParams.get("groupBy") || "day"

    const options = { startDate, endDate, tenantId, groupBy }

    switch (reportType) {
      case "overview": {
        // Get comprehensive overview
        const [ngr, players, productSplit, turnoverTrend] = await Promise.all([
          AnalyticsEngine.calculateNGR(options),
          AnalyticsEngine.getPlayerMetrics(options),
          AnalyticsEngine.getProductSplit(options),
          AnalyticsEngine.getTurnover({ ...options, groupBy: "day" }),
        ])

        return NextResponse.json({
          success: true,
          ggr: ngr.ggr,
          ngr: ngr.ngr,
          totalStakes: ngr.totalStakes,
          totalPayouts: ngr.totalPayouts,
          totalBets: ngr.totalBets,
          houseEdge: ngr.houseEdge,
          bonusesPaid: ngr.bonusesPaid,
          players,
          productSplit,
          turnoverTrend,
        })
      }

      case "tenants": {
        const [tenants, trend] = await Promise.all([
          AnalyticsEngine.getGGRByTenant(options),
          AnalyticsEngine.getGGRTrendByTenant({ ...options, groupBy }),
        ])

        // Calculate totals
        const totals = {
          activeTenants: tenants.length,
          totalGGR: tenants.reduce((sum, t) => sum + (t.ggr || 0), 0),
          totalNGR: tenants.reduce((sum, t) => sum + (t.ngr || 0), 0),
          totalTurnover: tenants.reduce((sum, t) => sum + (t.turnover || 0), 0),
          totalProviderRevenue: tenants.reduce((sum, t) => sum + (t.revenueShare?.providerAmount || 0), 0),
          totalTenantRevenue: tenants.reduce((sum, t) => sum + (t.revenueShare?.tenantAmount || 0), 0),
        }

        return NextResponse.json({
          success: true,
          tenants,
          trend,
          totals,
        })
      }

      case "ggr": {
        const data = await AnalyticsEngine.calculateGGR(options)
        return NextResponse.json({ success: true, data })
      }

      case "ngr": {
        const data = await AnalyticsEngine.calculateNGR(options)
        return NextResponse.json({ success: true, data })
      }

      case "turnover": {
        const data = await AnalyticsEngine.getTurnover({ ...options, groupBy })
        return NextResponse.json({ success: true, data })
      }

      case "product_split": {
        const data = await AnalyticsEngine.getProductSplit(options)
        return NextResponse.json({ success: true, data })
      }

      case "agents": {
        const data = await AnalyticsEngine.getAgentProfits(options)
        return NextResponse.json({ success: true, agents: Array.isArray(data) ? data : [] })
      }

      case "players": {
        const [metrics, churn, retention, playerList] = await Promise.all([
          AnalyticsEngine.getPlayerMetrics(options),
          AnalyticsEngine.detectChurn(options),
          AnalyticsEngine.calculateRetention(options),
          AnalyticsEngine.getPlayerList(options),
        ])
        return NextResponse.json({
          success: true,
          ...metrics,
          churn,
          retention,
          playerList: playerList.players,
          totalPlayers: playerList.total,
        })
      }

      case "retention": {
        const data = await AnalyticsEngine.calculateRetention(options)
        return NextResponse.json({ success: true, data })
      }

      case "churn": {
        const data = await AnalyticsEngine.detectChurn(options)
        return NextResponse.json({ success: true, data })
      }

      case "financial_trends": {
        const data = await AnalyticsEngine.getFinancialTrends({ ...options, groupBy })
        return NextResponse.json({ success: true, trends: data })
      }

      case "snapshots": {
        const snapshots = await AnalyticsSnapshot.find(tenantId ? { tenantId } : {})
          .sort({ periodStart: -1 })
          .limit(30)
        return NextResponse.json({ success: true, data: snapshots })
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Generate a new snapshot
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
    const { type = "daily", tenantId, startDate, endDate } = body

    const snapshot = await AnalyticsEngine.generateSnapshot({
      type,
      tenantId,
      startDate,
      endDate,
    })

    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error("Generate snapshot error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
