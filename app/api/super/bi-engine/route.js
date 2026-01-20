import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import AnalyticsEngine from "@/lib/analytics-engine"
import Tenant from "@/lib/models/Tenant"
import mongoose from "mongoose"

// GET /api/super/bi-engine - Get comprehensive BI metrics with True Net Profit
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get("endDate") || new Date().toISOString()
    const tenantId = searchParams.get("tenantId")
    const type = searchParams.get("type") || "summary"

    // Configurable fee rates (can be overridden per request)
    const providerFeeRate = Number.parseFloat(searchParams.get("providerFeeRate")) || 0.12 // 12% default
    const gatewayFeeRate = Number.parseFloat(searchParams.get("gatewayFeeRate")) || 0.025 // 2.5% default
    const taxRate = Number.parseFloat(searchParams.get("taxRate")) || 0.15 // 15% default

    const options = {
      startDate,
      endDate,
      tenantId: tenantId ? new mongoose.Types.ObjectId(tenantId) : undefined,
      providerFeeRate,
      gatewayFeeRate,
      taxRate,
    }

    if (type === "summary") {
      // Get comprehensive NGR breakdown with True Net Profit
      const ngrData = await AnalyticsEngine.calculateNGR(options)

      return NextResponse.json({
        success: true,
        period: { startDate, endDate },
        feeRates: {
          providerFeeRate: providerFeeRate * 100,
          gatewayFeeRate: gatewayFeeRate * 100,
          taxRate: taxRate * 100,
        },
        revenue: {
          // Gross Revenue
          grossGamingRevenue: ngrData.ggr,
          totalStakes: ngrData.totalStakes,
          totalPayouts: ngrData.totalPayouts,
          totalBets: ngrData.totalBets,
          houseEdge: ngrData.houseEdge,

          // Deductions Breakdown
          deductions: {
            providerFees: {
              amount: ngrData.providerFees,
              rate: ngrData.providerFeeRate,
              description: "Game provider licensing fees (12-15% of GGR)",
            },
            gatewayFees: {
              amount: ngrData.gatewayFees,
              rate: ngrData.gatewayFeeRate,
              volume: ngrData.gatewayVolume,
              transactions: ngrData.transactionCount,
              description: "Payment gateway processing fees (2-3% of volume)",
            },
            bonusesPaid: {
              amount: ngrData.bonusesPaid,
              count: ngrData.bonusCount,
              description: "Player bonuses, free bets, and cashback",
            },
            taxes: {
              amount: ngrData.taxes,
              rate: ngrData.taxRate,
              description: "Gaming taxes and regulatory fees",
            },
            operationalCosts: {
              amount: ngrData.operationalCosts,
              rate: 10,
              description: "Estimated operational costs (staff, infrastructure)",
            },
          },
          totalDeductions:
            ngrData.providerFees + ngrData.gatewayFees + ngrData.bonusesPaid + ngrData.taxes + ngrData.operationalCosts,

          // Net Revenue
          netGamingRevenue: ngrData.ngr,
          trueNetProfit: ngrData.trueNetProfit,
          profitMargin: ngrData.profitMargin,
        },
      })
    }

    if (type === "by_tenant") {
      // Get NGR breakdown by tenant
      const tenants = await Tenant.find({ status: { $in: ["active", "trial"] } })
        .select("_id name brandName slug")
        .lean()

      const tenantMetrics = await Promise.all(
        tenants.map(async (tenant) => {
          const tenantOptions = {
            ...options,
            tenantId: tenant._id,
          }
          const ngrData = await AnalyticsEngine.calculateNGR(tenantOptions)

          return {
            tenantId: tenant._id,
            tenantName: tenant.brandName || tenant.name,
            tenantSlug: tenant.slug,
            ggr: ngrData.ggr,
            ngr: ngrData.ngr,
            trueNetProfit: ngrData.trueNetProfit,
            profitMargin: ngrData.profitMargin,
            deductions: {
              providerFees: ngrData.providerFees,
              gatewayFees: ngrData.gatewayFees,
              bonusesPaid: ngrData.bonusesPaid,
              taxes: ngrData.taxes,
            },
          }
        }),
      )

      // Sort by True Net Profit
      tenantMetrics.sort((a, b) => b.trueNetProfit - a.trueNetProfit)

      const totals = tenantMetrics.reduce(
        (acc, t) => ({
          totalGGR: acc.totalGGR + t.ggr,
          totalNGR: acc.totalNGR + t.ngr,
          totalTrueNetProfit: acc.totalTrueNetProfit + t.trueNetProfit,
          totalProviderFees: acc.totalProviderFees + t.deductions.providerFees,
          totalGatewayFees: acc.totalGatewayFees + t.deductions.gatewayFees,
          totalBonuses: acc.totalBonuses + t.deductions.bonusesPaid,
          totalTaxes: acc.totalTaxes + t.deductions.taxes,
        }),
        {
          totalGGR: 0,
          totalNGR: 0,
          totalTrueNetProfit: 0,
          totalProviderFees: 0,
          totalGatewayFees: 0,
          totalBonuses: 0,
          totalTaxes: 0,
        },
      )

      return NextResponse.json({
        success: true,
        period: { startDate, endDate },
        tenants: tenantMetrics,
        totals,
      })
    }

    if (type === "trend") {
      // Get daily NGR trend
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000))
      const trend = []

      for (let i = 0; i < Math.min(days, 30); i++) {
        const dayEnd = new Date(endDate)
        dayEnd.setDate(dayEnd.getDate() - i)
        const dayStart = new Date(dayEnd)
        dayStart.setDate(dayStart.getDate() - 1)

        const dayData = await AnalyticsEngine.calculateNGR({
          ...options,
          startDate: dayStart.toISOString(),
          endDate: dayEnd.toISOString(),
        })

        trend.unshift({
          date: dayStart.toISOString().split("T")[0],
          ggr: dayData.ggr,
          ngr: dayData.ngr,
          trueNetProfit: dayData.trueNetProfit,
          providerFees: dayData.providerFees,
          gatewayFees: dayData.gatewayFees,
          bonusesPaid: dayData.bonusesPaid,
        })
      }

      return NextResponse.json({
        success: true,
        period: { startDate, endDate },
        trend,
      })
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
  } catch (error) {
    console.error("BI Engine API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
