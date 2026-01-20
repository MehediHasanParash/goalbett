import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import Wallet from "@/lib/models/Wallet"
import Transaction from "@/lib/models/Transaction"
import Bet from "@/lib/models/Bet"

// GET /api/super/insolvency-alerts - Get tenant insolvency risk alerts
export async function GET(request) {
  try {
    await dbConnect()

    // Get all active tenants
    const tenants = await Tenant.find({ status: { $in: ["active", "pending", "trial"] } })
      .select("name brandName slug status wallet createdAt theme.brandName stats")
      .lean()

    console.log("[v0] Found tenants:", tenants.length)

    const tenantIds = tenants.map((t) => t._id)

    const wallets = await Wallet.find({
      tenantId: { $in: tenantIds },
      userId: null, // Tenant wallets have null userId
    }).lean()

    console.log("[v0] Found wallets:", wallets.length)

    const walletMap = {}
    wallets.forEach((w) => {
      const key = w.tenantId?.toString()
      if (key) {
        walletMap[key] = w.availableBalance || 0
        console.log(`[v0] Wallet for tenant ${key}: availableBalance=${w.availableBalance}`)
      }
    })

    // Get daily transaction data for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          tenantId: { $in: tenantIds },
          status: "completed",
        },
      },
      {
        $group: {
          _id: {
            tenantId: "$tenantId",
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          deposits: {
            $sum: { $cond: [{ $in: ["$type", ["deposit", "topup"]] }, "$amount", 0] },
          },
          withdrawals: {
            $sum: { $cond: [{ $in: ["$type", ["withdrawal", "payout"]] }, "$amount", 0] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
    ])

    // Get bet stats for win rate calculation
    const betStats = await Bet.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          tenantId: { $in: tenantIds },
          status: { $in: ["won", "lost", "settled"] },
        },
      },
      {
        $group: {
          _id: "$tenantId",
          totalBets: { $sum: 1 },
          wonBets: { $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] } },
          totalStake: { $sum: "$stake" },
          totalPayout: { $sum: { $cond: [{ $eq: ["$status", "won"] }, "$potentialWin", 0] } },
        },
      },
    ])

    const betStatsMap = {}
    betStats.forEach((b) => {
      betStatsMap[b._id?.toString()] = b
    })

    // Process each tenant
    const alerts = []

    for (const tenant of tenants) {
      const tenantIdStr = tenant._id.toString()
      let currentBalance = walletMap[tenantIdStr] || tenant.stats?.totalRevenue || 0

      // If no wallet found, try to get or create one
      if (currentBalance === 0) {
        // Check if there's any wallet for this tenant
        const anyWallet = await Wallet.findOne({ tenantId: tenant._id }).lean()
        if (anyWallet) {
          currentBalance = anyWallet.availableBalance || 0
        }
      }

      console.log(`[v0] Tenant ${tenant.name}: currentBalance=${currentBalance}`)

      // Get daily data for this tenant
      const tenantDailyStats = dailyStats.filter((d) => d._id.tenantId?.toString() === tenantIdStr)

      // Calculate daily burn rate (negative GGR)
      let totalNetLoss = 0
      let daysWithData = 0

      tenantDailyStats.forEach((d) => {
        const netFlow = d.withdrawals - d.deposits
        totalNetLoss += netFlow
        daysWithData++
      })

      const avgDailyBurnRate = daysWithData > 0 ? totalNetLoss / daysWithData : 0

      // Get bet statistics
      const bStats = betStatsMap[tenantIdStr] || { totalBets: 0, wonBets: 0, totalStake: 0, totalPayout: 0 }
      const winRate = bStats.totalBets > 0 ? (bStats.wonBets / bStats.totalBets) * 100 : 50
      const last7DaysGGR = bStats.totalStake - bStats.totalPayout

      let daysToInsolvency = null
      if (avgDailyBurnRate > 0 && currentBalance > 0) {
        daysToInsolvency = currentBalance / avgDailyBurnRate
      } else if (avgDailyBurnRate <= 0) {
        // Tenant is profitable or breaking even
        daysToInsolvency = null // Will show as "Profitable"
      }

      // Determine risk level
      let riskLevel = "healthy"
      if (daysToInsolvency !== null) {
        if (daysToInsolvency <= 2) riskLevel = "critical"
        else if (daysToInsolvency <= 7) riskLevel = "high"
        else if (daysToInsolvency <= 14) riskLevel = "medium"
      }

      // Calculate projected balance
      const projectedBalance = currentBalance - avgDailyBurnRate * 7

      // Build trend data
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      let runningBalance = currentBalance + avgDailyBurnRate * 6
      const trend = days.map((day, i) => {
        const balance = i === 6 ? currentBalance - avgDailyBurnRate : runningBalance
        runningBalance = balance - avgDailyBurnRate
        return {
          day: i === 6 ? `${day} (proj)` : day,
          balance: Math.max(0, Math.round(balance)),
        }
      })

      alerts.push({
        _id: tenantIdStr,
        tenantName: tenant.theme?.brandName || tenant.brandName || tenant.name,
        tenantSlug: tenant.slug,
        tenantId: tenantIdStr,
        currentBalance: Math.round(currentBalance),
        projectedBalance: Math.round(projectedBalance),
        burnRate: Math.round(avgDailyBurnRate),
        daysToInsolvency: daysToInsolvency ? Math.round(daysToInsolvency * 10) / 10 : null,
        riskLevel,
        winRate: Math.round(winRate),
        last7DaysGGR: Math.round(last7DaysGGR),
        trend,
      })
    }

    // Sort by risk level
    const riskOrder = { critical: 0, high: 1, medium: 2, healthy: 3 }
    alerts.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel])

    // Calculate stats
    const stats = {
      totalMonitored: tenants.length,
      critical: alerts.filter((a) => a.riskLevel === "critical").length,
      atRisk: alerts.filter((a) => ["critical", "high", "medium"].includes(a.riskLevel)).length,
      healthy: alerts.filter((a) => a.riskLevel === "healthy").length,
    }

    return NextResponse.json({
      success: true,
      alerts,
      stats,
    })
  } catch (error) {
    console.error("Insolvency alerts API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await dbConnect()
    const body = await request.json()
    const { tenantId, amount, note } = body

    if (!tenantId || !amount) {
      return NextResponse.json({ error: "tenantId and amount are required" }, { status: 400 })
    }

    // Find or create tenant wallet
    let wallet = await Wallet.findOne({ tenantId, userId: null })

    if (!wallet) {
      wallet = await Wallet.create({
        tenantId,
        userId: null,
        availableBalance: 0,
        currency: "USD",
      })
    }

    // Update wallet balance
    wallet.availableBalance += Number(amount)
    await wallet.save()

    // Create transaction record
    const Transaction = (await import("@/lib/models/Transaction")).default
    await Transaction.create({
      tenantId,
      type: "topup",
      amount: Number(amount),
      status: "completed",
      description: note || "Super Admin top up",
      metadata: { source: "super_admin" },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully topped up $${amount}`,
      newBalance: wallet.availableBalance,
    })
  } catch (error) {
    console.error("Top up error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
