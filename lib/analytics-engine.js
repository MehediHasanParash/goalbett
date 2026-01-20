import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Bet from "@/lib/models/Bet"
import Transaction from "@/lib/models/Transaction"
import AnalyticsSnapshot from "@/lib/models/AnalyticsSnapshot"
import mongoose from "mongoose"
import Tenant from "@/lib/models/Tenant"

class AnalyticsEngine {
  // Calculate GGR (Gross Gaming Revenue) = Total Stakes - Total Payouts
  static async calculateGGR(options = {}) {
    await connectDB()
    const { startDate, endDate, tenantId } = options

    const matchStage = {}
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }
    if (tenantId) {
      matchStage.tenantId = new mongoose.Types.ObjectId(tenantId)
    }

    // Get total stakes
    const stakesResult = await Bet.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalStakes: { $sum: "$stake" },
          totalBets: { $sum: 1 },
        },
      },
    ])

    // Get total payouts (won bets)
    const payoutsResult = await Bet.aggregate([
      { $match: { ...matchStage, status: "won" } },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: "$actualWin" },
          wonBets: { $sum: 1 },
        },
      },
    ])

    const totalStakes = stakesResult[0]?.totalStakes || 0
    const totalPayouts = payoutsResult[0]?.totalPayouts || 0
    const ggr = totalStakes - totalPayouts

    return {
      ggr,
      totalStakes,
      totalPayouts,
      totalBets: stakesResult[0]?.totalBets || 0,
      wonBets: payoutsResult[0]?.wonBets || 0,
      houseEdge: totalStakes > 0 ? ((ggr / totalStakes) * 100).toFixed(2) : 0,
    }
  }

  // Calculate NGR (Net Gaming Revenue) = GGR - Provider Fees - Gateway Fees - Bonuses - Taxes
  static async calculateNGR(options = {}) {
    await connectDB()
    const { startDate, endDate, tenantId, providerFeeRate = 0.12, gatewayFeeRate = 0.025, taxRate = 0.15 } = options

    const ggrData = await this.calculateGGR(options)

    // Get bonuses paid
    const matchStage = {
      type: { $in: ["bonus", "bonus_credit", "free_bet", "cashback"] },
    }
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }
    if (tenantId) {
      matchStage.tenantId = new mongoose.Types.ObjectId(tenantId)
    }

    const bonusResult = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBonuses: { $sum: "$amount" },
          bonusCount: { $sum: 1 },
        },
      },
    ])

    // Get payment gateway transaction volume for fee calculation
    const gatewayMatch = {
      type: { $in: ["deposit", "withdrawal"] },
      status: "completed",
    }
    if (startDate && endDate) {
      gatewayMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }
    if (tenantId) {
      gatewayMatch.tenantId = new mongoose.Types.ObjectId(tenantId)
    }

    const gatewayResult = await Transaction.aggregate([
      { $match: gatewayMatch },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
    ])

    const bonusesPaid = bonusResult[0]?.totalBonuses || 0
    const bonusCount = bonusResult[0]?.bonusCount || 0
    const gatewayVolume = gatewayResult[0]?.totalVolume || 0
    const transactionCount = gatewayResult[0]?.transactionCount || 0

    // Calculate fees
    const providerFees = ggrData.ggr * providerFeeRate // 12-15% of GGR goes to game providers
    const gatewayFees = gatewayVolume * gatewayFeeRate // 2.5% of transaction volume
    const taxes = ggrData.ggr * taxRate // Gaming tax

    // NGR = GGR - Provider Fees - Gateway Fees - Bonuses
    const ngr = ggrData.ggr - providerFees - gatewayFees - bonusesPaid

    // True Net Profit = NGR - Taxes - Operational Costs (estimated at 10% of GGR)
    const operationalCosts = ggrData.ggr * 0.1
    const trueNetProfit = ngr - taxes - operationalCosts

    return {
      ...ggrData,
      // Fee breakdown
      providerFees: Math.round(providerFees * 100) / 100,
      providerFeeRate: providerFeeRate * 100,
      gatewayFees: Math.round(gatewayFees * 100) / 100,
      gatewayFeeRate: gatewayFeeRate * 100,
      gatewayVolume,
      transactionCount,
      // Bonus data
      bonusesPaid: Math.round(bonusesPaid * 100) / 100,
      bonusCount,
      // Tax data
      taxes: Math.round(taxes * 100) / 100,
      taxRate: taxRate * 100,
      // Operational costs
      operationalCosts: Math.round(operationalCosts * 100) / 100,
      // Final calculations
      ngr: Math.round(ngr * 100) / 100,
      trueNetProfit: Math.round(trueNetProfit * 100) / 100,
      // Profit margin
      profitMargin: ggrData.ggr > 0 ? Math.round((trueNetProfit / ggrData.ggr) * 10000) / 100 : 0,
    }
  }

  // Get turnover (total wagered amount)
  static async getTurnover(options = {}) {
    await connectDB()
    const { startDate, endDate, tenantId, groupBy } = options

    const matchStage = {}
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }
    if (tenantId) {
      matchStage.tenantId = new mongoose.Types.ObjectId(tenantId)
    }

    const groupStage = {
      _id: null,
      turnover: { $sum: "$stake" },
      betCount: { $sum: 1 },
      avgStake: { $avg: "$stake" },
      avgOdds: { $avg: "$totalOdds" },
    }

    if (groupBy === "day") {
      groupStage._id = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
    } else if (groupBy === "week") {
      groupStage._id = { $dateToString: { format: "%Y-W%V", date: "$createdAt" } }
    } else if (groupBy === "month") {
      groupStage._id = { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
    }

    const result = await Bet.aggregate([{ $match: matchStage }, { $group: groupStage }, { $sort: { _id: 1 } }])

    return result
  }

  // Get product split (Sportsbook vs Casino vs Virtual)
  static async getProductSplit(options = {}) {
    await connectDB()
    const { startDate, endDate, tenantId } = options

    // For now, all bets are sportsbook. In future, add product type to Bet model
    const ggrData = await this.calculateGGR(options)

    return {
      sportsbook: {
        ggr: ggrData.ggr,
        turnover: ggrData.totalStakes,
        betCount: ggrData.totalBets,
        percentage: 100,
      },
      casino: {
        ggr: 0,
        turnover: 0,
        betCount: 0,
        percentage: 0,
      },
      virtual: {
        ggr: 0,
        turnover: 0,
        betCount: 0,
        percentage: 0,
      },
    }
  }

  // Get agent profit breakdown
  static async getAgentProfits(options = {}) {
    await connectDB()
    const { startDate, endDate, tenantId, limit = 20 } = options

    const matchStage = {
      role: { $in: ["agent", "sub_agent"] },
    }
    if (tenantId) {
      matchStage.tenant_id = new mongoose.Types.ObjectId(tenantId)
    }

    const agents = await User.find(matchStage).select("_id fullName email commissionRate")

    const agentProfits = await Promise.all(
      agents.map(async (agent) => {
        // Get players under this agent
        const players = await User.find({
          $or: [{ parentAgentId: agent._id }, { subAgentId: agent._id }],
          role: "player",
        }).select("_id")

        const playerIds = players.map((p) => p._id)

        // Calculate turnover and GGR from these players
        const betMatch = { userId: { $in: playerIds } }
        if (startDate && endDate) {
          betMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
        }

        const [stakesData, winsData] = await Promise.all([
          Bet.aggregate([
            { $match: betMatch },
            { $group: { _id: null, total: { $sum: "$stake" }, count: { $sum: 1 } } },
          ]),
          Bet.aggregate([
            { $match: { ...betMatch, status: "won" } },
            { $group: { _id: null, total: { $sum: "$actualWin" } } },
          ]),
        ])

        const turnover = stakesData[0]?.total || 0
        const payouts = winsData[0]?.total || 0
        const ggr = turnover - payouts
        const commission = ggr * (agent.commissionRate / 100)
        const profit = ggr - commission

        return {
          agentId: agent._id,
          agentName: agent.fullName,
          email: agent.email,
          playerCount: players.length,
          turnover,
          ggr,
          commission,
          profit,
          commissionRate: agent.commissionRate,
        }
      }),
    )

    return agentProfits.sort((a, b) => b.profit - a.profit).slice(0, limit)
  }

  // Get player metrics
  static async getPlayerMetrics(options = {}) {
    await connectDB()
    const { startDate, endDate, tenantId } = options

    const now = new Date()
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

    const matchStage = { role: "player" }
    if (tenantId) {
      matchStage.tenant_id = new mongoose.Types.ObjectId(tenantId)
    }

    // Total registered
    const totalRegistered = await User.countDocuments(matchStage)

    // Active players (players with status: "active")
    const activeAccountsMatch = { ...matchStage, status: "active" }
    const activePlayers = await User.countDocuments(activeAccountsMatch)

    // New registrations in period
    const newRegMatch = { ...matchStage }
    if (startDate && endDate) {
      newRegMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }
    const newRegistrations = await User.countDocuments(newRegMatch)

    // Get users who placed bets in different periods
    const betMatchBase = {}
    if (tenantId) {
      betMatchBase.tenantId = new mongoose.Types.ObjectId(tenantId)
    }

    const [dau, wau, mau] = await Promise.all([
      Bet.distinct("userId", { ...betMatchBase, createdAt: { $gte: dayAgo } }),
      Bet.distinct("userId", { ...betMatchBase, createdAt: { $gte: weekAgo } }),
      Bet.distinct("userId", { ...betMatchBase, createdAt: { $gte: monthAgo } }),
    ])

    // Depositing players
    const depositMatch = { type: "deposit", status: "completed" }
    if (tenantId) {
      depositMatch.tenantId = new mongoose.Types.ObjectId(tenantId)
    }
    if (startDate && endDate) {
      depositMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }
    const depositingPlayers = await Transaction.distinct("userId", depositMatch)

    // First time depositors
    const firstTimeDepositors = await Transaction.aggregate([
      { $match: { type: "deposit", status: "completed" } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: "$userId", firstDeposit: { $first: "$createdAt" } } },
      ...(startDate && endDate
        ? [{ $match: { firstDeposit: { $gte: new Date(startDate), $lte: new Date(endDate) } } }]
        : []),
      { $count: "count" },
    ])

    return {
      totalRegistered,
      activePlayers,
      newRegistrations,
      dailyActiveUsers: dau.length,
      weeklyActiveUsers: wau.length,
      monthlyActiveUsers: mau.length,
      depositingPlayers: depositingPlayers.length,
      firstTimeDepositors: firstTimeDepositors[0]?.count || 0,
    }
  }

  // Calculate LTV for a player
  static async calculatePlayerLTV(userId) {
    await connectDB()

    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Get all bets for the player
    const betStats = await Bet.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalStake: { $sum: "$stake" },
          totalBets: { $sum: 1 },
          avgStake: { $avg: "$stake" },
          avgOdds: { $avg: "$totalOdds" },
        },
      },
    ])

    const winStats = await Bet.aggregate([
      { $match: { userId: userObjectId, status: "won" } },
      {
        $group: {
          _id: null,
          totalWinnings: { $sum: "$actualWin" },
          wonBets: { $sum: 1 },
        },
      },
    ])

    // Get deposit/withdrawal history
    const financialStats = await Transaction.aggregate([
      { $match: { userId: userObjectId, status: "completed" } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    const deposits = financialStats.find((f) => f._id === "deposit")
    const withdrawals = financialStats.find((f) => f._id === "withdrawal")

    const totalStake = betStats[0]?.totalStake || 0
    const totalWinnings = winStats[0]?.totalWinnings || 0
    const totalBets = betStats[0]?.totalBets || 0
    const wonBets = winStats[0]?.wonBets || 0

    // LTV = Total stake - Total winnings (from house perspective)
    const ltv = totalStake - totalWinnings

    // Determine segment based on LTV
    let segment = "casual"
    if (ltv > 10000) segment = "whale"
    else if (ltv > 5000) segment = "vip"
    else if (ltv > 1000) segment = "high_value"
    else if (ltv > 100) segment = "regular"
    else if (ltv > 0) segment = "casual"
    else segment = "low_value"

    return {
      userId,
      ltv: {
        totalValue: ltv,
        projectedValue: ltv * 1.2, // Simple projection
        segment,
        score: Math.min(100, Math.max(0, ltv / 100)),
      },
      betting: {
        totalBets,
        totalStake,
        totalWinnings,
        netPosition: ltv,
        winRate: totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(2) : 0,
        averageStake: betStats[0]?.avgStake || 0,
        averageOdds: betStats[0]?.avgOdds || 0,
      },
      financial: {
        totalDeposits: deposits?.total || 0,
        depositCount: deposits?.count || 0,
        totalWithdrawals: withdrawals?.total || 0,
        withdrawalCount: withdrawals?.count || 0,
      },
    }
  }

  // Detect churned players
  static async detectChurn(options = {}) {
    await connectDB()
    const { tenantId, inactiveDays = 30 } = options

    const cutoffDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000)

    const matchStage = { role: "player" }
    if (tenantId) {
      matchStage.tenant_id = new mongoose.Types.ObjectId(tenantId)
    }

    // Get all players
    const players = await User.find(matchStage).select("_id fullName email lastLogin createdAt")

    const churnedPlayers = []
    const atRiskPlayers = []

    for (const player of players) {
      // Get last bet date
      const lastBet = await Bet.findOne({ userId: player._id }).sort({ createdAt: -1 }).select("createdAt")

      const lastActivity = lastBet?.createdAt || player.lastLogin || player.createdAt
      const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity)) / (24 * 60 * 60 * 1000))

      if (daysSinceActivity >= inactiveDays) {
        churnedPlayers.push({
          userId: player._id,
          name: player.fullName,
          email: player.email,
          lastActivity,
          daysSinceActivity,
          status: "churned",
        })
      } else if (daysSinceActivity >= inactiveDays / 2) {
        atRiskPlayers.push({
          userId: player._id,
          name: player.fullName,
          email: player.email,
          lastActivity,
          daysSinceActivity,
          churnProbability: Math.min(100, (daysSinceActivity / inactiveDays) * 100),
          status: "at_risk",
        })
      }
    }

    return {
      churnedPlayers,
      atRiskPlayers,
      churnRate: players.length > 0 ? ((churnedPlayers.length / players.length) * 100).toFixed(2) : 0,
      atRiskCount: atRiskPlayers.length,
    }
  }

  static async detectChurnAI(options = {}) {
    await connectDB()
    const { tenantId, inactiveDays = 3 } = options

    const matchStage = { role: "player" }
    if (tenantId) {
      matchStage.tenant_id = new mongoose.Types.ObjectId(tenantId)
    }

    // Get all players
    const players = await User.find(matchStage).select("_id fullName email lastLogin createdAt phone").lean()

    const atRiskPlayers = []
    const churned = []
    const healthy = []

    for (const player of players) {
      // Get betting history for the last 14 days
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      const threeDaysAgo = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000)

      const recentBets = await Bet.find({
        userId: player._id,
        createdAt: { $gte: twoWeeksAgo },
      })
        .select("createdAt stake")
        .sort({ createdAt: -1 })
        .lean()

      if (recentBets.length === 0) {
        // No bets in 2 weeks - already churned
        churned.push({
          userId: player._id,
          name: player.fullName || player.email,
          email: player.email,
          phone: player.phone,
          lastActivity: player.lastLogin || player.createdAt,
          daysSinceActivity: Math.floor(
            (Date.now() - new Date(player.lastLogin || player.createdAt)) / (24 * 60 * 60 * 1000),
          ),
          status: "churned",
          reason: "No activity in 14+ days",
          churnProbability: 100,
        })
        continue
      }

      // Check if they were active daily before but inactive now
      const lastBetDate = new Date(recentBets[0].createdAt)
      const daysSinceLastBet = Math.floor((Date.now() - lastBetDate) / (24 * 60 * 60 * 1000))

      // Get unique active days in the week before their last bet
      const weekBeforeLastBet = new Date(lastBetDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      const betsBeforeInactivity = recentBets.filter(
        (b) => new Date(b.createdAt) >= weekBeforeLastBet && new Date(b.createdAt) <= lastBetDate,
      )

      const uniqueActiveDays = new Set(
        betsBeforeInactivity.map((b) => new Date(b.createdAt).toISOString().split("T")[0]),
      ).size

      // Calculate total wagered
      const totalWagered = recentBets.reduce((sum, b) => sum + (b.stake || 0), 0)

      // AI Churn Detection Logic:
      // Flag if: was active 4+ days/week AND now inactive 3+ days
      if (daysSinceLastBet >= inactiveDays && uniqueActiveDays >= 4) {
        const churnProbability = Math.min(100, 50 + daysSinceLastBet * 5 + uniqueActiveDays * 3)

        atRiskPlayers.push({
          userId: player._id,
          name: player.fullName || player.email,
          email: player.email,
          phone: player.phone,
          lastActivity: lastBetDate,
          daysSinceActivity: daysSinceLastBet,
          previousActivityLevel: uniqueActiveDays,
          previousActivityDesc: `${uniqueActiveDays} days active in week before`,
          totalWageredRecently: totalWagered,
          status: "at_risk",
          reason: `Was active ${uniqueActiveDays}/7 days, now inactive ${daysSinceLastBet} days`,
          churnProbability,
          suggestedAction:
            churnProbability > 80
              ? "Urgent: Send personalized bonus offer"
              : churnProbability > 60
                ? "Send re-engagement email with free bet"
                : "Add to re-engagement campaign",
        })
      } else if (daysSinceLastBet >= 7) {
        // Inactive 7+ days regardless of previous activity
        churned.push({
          userId: player._id,
          name: player.fullName || player.email,
          email: player.email,
          lastActivity: lastBetDate,
          daysSinceActivity: daysSinceLastBet,
          status: "churned",
          reason: `Inactive for ${daysSinceLastBet} days`,
          churnProbability: Math.min(100, 70 + daysSinceLastBet),
        })
      } else {
        healthy.push({
          userId: player._id,
          name: player.fullName || player.email,
          lastActivity: lastBetDate,
          daysSinceActivity: daysSinceLastBet,
        })
      }
    }

    // Sort at-risk by churn probability (highest first)
    atRiskPlayers.sort((a, b) => b.churnProbability - a.churnProbability)

    return {
      atRiskPlayers,
      churnedPlayers: churned,
      healthyPlayers: healthy.length,
      totalPlayers: players.length,
      atRiskCount: atRiskPlayers.length,
      churnedCount: churned.length,
      churnRate: players.length > 0 ? ((churned.length / players.length) * 100).toFixed(2) : 0,
      atRiskRate: players.length > 0 ? ((atRiskPlayers.length / players.length) * 100).toFixed(2) : 0,
      summary: {
        urgent: atRiskPlayers.filter((p) => p.churnProbability > 80).length,
        warning: atRiskPlayers.filter((p) => p.churnProbability > 60 && p.churnProbability <= 80).length,
        watch: atRiskPlayers.filter((p) => p.churnProbability <= 60).length,
      },
    }
  }

  // Calculate retention rate
  static async calculateRetention(options = {}) {
    await connectDB()
    const { tenantId, cohortMonth } = options

    // Get players who registered in the cohort month
    const cohortStart = cohortMonth ? new Date(cohortMonth) : new Date(new Date().setMonth(new Date().getMonth() - 1))
    const cohortEnd = new Date(cohortStart)
    cohortEnd.setMonth(cohortEnd.getMonth() + 1)

    const matchStage = {
      role: "player",
      createdAt: { $gte: cohortStart, $lt: cohortEnd },
    }
    if (tenantId) {
      matchStage.tenant_id = new mongoose.Types.ObjectId(tenantId)
    }

    const cohortPlayers = await User.find(matchStage).select("_id")
    const cohortPlayerIds = cohortPlayers.map((p) => p._id)

    if (cohortPlayerIds.length === 0) {
      return { cohortSize: 0, retained: 0, retentionRate: 0 }
    }

    // Check how many are still active (placed bet in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activePlayers = await Bet.distinct("userId", {
      userId: { $in: cohortPlayerIds },
      createdAt: { $gte: thirtyDaysAgo },
    })

    return {
      cohortSize: cohortPlayerIds.length,
      retained: activePlayers.length,
      retentionRate: ((activePlayers.length / cohortPlayerIds.length) * 100).toFixed(2),
      cohortPeriod: `${cohortStart.toISOString().slice(0, 7)}`,
    }
  }

  // Get deposit/withdrawal trends
  static async getFinancialTrends(options = {}) {
    await connectDB()
    const { startDate, endDate, tenantId, groupBy = "day" } = options

    const matchStage = { status: "completed" }
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }
    if (tenantId) {
      matchStage.tenantId = new mongoose.Types.ObjectId(tenantId)
    }

    let dateFormat = "%Y-%m-%d"
    if (groupBy === "week") dateFormat = "%Y-W%V"
    else if (groupBy === "month") dateFormat = "%Y-%m"

    const trends = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ])

    // Reorganize data
    const result = {}
    trends.forEach((t) => {
      const date = t._id.date
      if (!result[date]) {
        result[date] = { date, deposits: 0, depositCount: 0, withdrawals: 0, withdrawalCount: 0 }
      }
      if (t._id.type === "deposit") {
        result[date].deposits = t.total
        result[date].depositCount = t.count
      } else if (t._id.type === "withdrawal") {
        result[date].withdrawals = t.total
        result[date].withdrawalCount = t.count
      }
    })

    return Object.values(result)
  }

  // Generate comprehensive snapshot
  static async generateSnapshot(options = {}) {
    await connectDB()
    const { type = "daily", tenantId, startDate, endDate } = options

    // Calculate date range based on type
    let periodStart, periodEnd
    const now = new Date()

    if (startDate && endDate) {
      periodStart = new Date(startDate)
      periodEnd = new Date(endDate)
    } else {
      switch (type) {
        case "daily":
          periodStart = new Date(now.setHours(0, 0, 0, 0))
          periodEnd = new Date()
          break
        case "weekly":
          periodStart = new Date(now.setDate(now.getDate() - 7))
          periodEnd = new Date()
          break
        case "monthly":
          periodStart = new Date(now.setMonth(now.getMonth() - 1))
          periodEnd = new Date()
          break
        default:
          periodStart = new Date(now.setDate(now.getDate() - 1))
          periodEnd = new Date()
      }
    }

    const dateOptions = { startDate: periodStart, endDate: periodEnd, tenantId }

    // Gather all metrics
    const [ngrData, playerMetrics, agentProfits, financialTrends, churnData, retentionData] = await Promise.all([
      this.calculateNGR(dateOptions),
      this.getPlayerMetrics(dateOptions),
      this.getAgentProfits(dateOptions),
      this.getFinancialTrends(dateOptions),
      this.detectChurn({ tenantId }),
      this.calculateRetention({ tenantId }),
    ])

    // Calculate financial totals
    const totalDeposits = financialTrends.reduce((sum, t) => sum + (t.deposits || 0), 0)
    const totalWithdrawals = financialTrends.reduce((sum, t) => sum + (t.withdrawals || 0), 0)

    const snapshot = {
      type,
      periodStart,
      periodEnd,
      tenantId: tenantId ? new mongoose.Types.ObjectId(tenantId) : undefined,
      revenue: {
        ggr: ngrData.ggr,
        ngr: ngrData.ngr,
        turnover: ngrData.totalStakes,
        totalStakes: ngrData.totalStakes,
        totalPayouts: ngrData.totalPayouts,
        totalBonusesPaid: ngrData.bonusesPaid,
        houseEdge: ngrData.houseEdge,
        sportsbookGGR: ngrData.ggr, // All sportsbook for now
      },
      betting: {
        totalBets: ngrData.totalBets,
        wonBets: ngrData.wonBets,
        winRate: ngrData.totalBets > 0 ? ((ngrData.wonBets / ngrData.totalBets) * 100).toFixed(2) : 0,
      },
      players: {
        ...playerMetrics,
        retentionRate: retentionData.retentionRate,
        churnRate: churnData.churnRate,
        churnedPlayers: churnData.churnedPlayers.length,
      },
      financial: {
        totalDeposits,
        totalWithdrawals,
        netDeposits: totalDeposits - totalWithdrawals,
      },
      agents: {
        totalAgents: agentProfits.length,
        activeAgents: agentProfits.filter((a) => a.turnover > 0).length,
        totalCommissionPaid: agentProfits.reduce((sum, a) => sum + a.commission, 0),
        agentPerformance: agentProfits.slice(0, 10),
      },
      generatedBy: "system",
      status: "completed",
    }

    // Save snapshot
    const savedSnapshot = await AnalyticsSnapshot.create(snapshot)

    return savedSnapshot
  }

  static async getGGRByTenant(options = {}) {
    await connectDB()
    const { startDate, endDate } = options

    // Get all tenants
    const tenants = await Tenant.find({ status: { $in: ["active", "trial"] } }).select(
      "_id name slug status revenueShare theme.brandName stats",
    )

    const tenantGGRData = await Promise.all(
      tenants.map(async (tenant) => {
        const matchStage = { tenantId: tenant._id }
        if (startDate && endDate) {
          matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
        }

        // Get stakes
        const stakesResult = await Bet.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalStakes: { $sum: "$stake" },
              totalBets: { $sum: 1 },
            },
          },
        ])

        // Get payouts (won bets)
        const payoutsResult = await Bet.aggregate([
          { $match: { ...matchStage, status: "won" } },
          {
            $group: {
              _id: null,
              totalPayouts: { $sum: "$actualWin" },
              wonBets: { $sum: 1 },
            },
          },
        ])

        // Get deposits and withdrawals
        const depositMatch = { tenantId: tenant._id, type: "deposit", status: "completed" }
        const withdrawMatch = { tenantId: tenant._id, type: "withdrawal", status: "completed" }
        if (startDate && endDate) {
          depositMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
          withdrawMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
        }

        const [depositsResult, withdrawalsResult] = await Promise.all([
          Transaction.aggregate([{ $match: depositMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
          Transaction.aggregate([{ $match: withdrawMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
        ])

        // Get active players count
        const playerMatch = { tenant_id: tenant._id, role: "player" }
        const activePlayers = await User.countDocuments(playerMatch)

        const totalStakes = stakesResult[0]?.totalStakes || 0
        const totalPayouts = payoutsResult[0]?.totalPayouts || 0
        const ggr = totalStakes - totalPayouts
        const deposits = depositsResult[0]?.total || 0
        const withdrawals = withdrawalsResult[0]?.total || 0

        // Calculate NGR (GGR - bonuses - taxes - fees)
        const bonusMatch = {
          tenantId: tenant._id,
          type: { $in: ["bonus", "bonus_credit", "free_bet", "cashback"] },
        }
        if (startDate && endDate) {
          bonusMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
        const bonusResult = await Transaction.aggregate([
          { $match: bonusMatch },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
        const bonusesPaid = bonusResult[0]?.total || 0

        const taxRate = 0.15
        const feeRate = 0.02
        const taxes = ggr * taxRate
        const fees = ggr * feeRate
        const ngr = ggr - bonusesPaid - taxes - fees

        // Calculate provider revenue share
        const providerShare = (ggr * (tenant.revenueShare?.providerPercentage || 10)) / 100
        const tenantShare = ggr - providerShare

        return {
          tenantId: tenant._id,
          tenantName: tenant.theme?.brandName || tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          ggr,
          ngr,
          turnover: totalStakes,
          totalBets: stakesResult[0]?.totalBets || 0,
          totalPayouts,
          deposits,
          withdrawals,
          netDeposits: deposits - withdrawals,
          activePlayers,
          bonusesPaid,
          houseEdge: totalStakes > 0 ? ((ggr / totalStakes) * 100).toFixed(2) : 0,
          revenueShare: {
            providerPercentage: tenant.revenueShare?.providerPercentage || 10,
            tenantPercentage: tenant.revenueShare?.tenantPercentage || 90,
            providerAmount: providerShare,
            tenantAmount: tenantShare,
          },
        }
      }),
    )

    // Sort by GGR descending
    return tenantGGRData.sort((a, b) => b.ggr - a.ggr)
  }

  static async getGGRTrendByTenant(options = {}) {
    await connectDB()
    const { startDate, endDate, groupBy = "day" } = options

    let dateFormat = "%Y-%m-%d"
    if (groupBy === "week") dateFormat = "%Y-W%V"
    else if (groupBy === "month") dateFormat = "%Y-%m"

    const matchStage = {}
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    // Get stakes grouped by tenant and date
    const stakesData = await Bet.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            tenantId: "$tenantId",
            date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          },
          totalStakes: { $sum: "$stake" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ])

    // Get payouts grouped by tenant and date
    const payoutsData = await Bet.aggregate([
      { $match: { ...matchStage, status: "won" } },
      {
        $group: {
          _id: {
            tenantId: "$tenantId",
            date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          },
          totalPayouts: { $sum: "$actualWin" },
        },
      },
    ])

    // Get tenant names
    const tenantIds = [...new Set(stakesData.map((s) => s._id.tenantId?.toString()).filter(Boolean))]
    const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select("_id name theme.brandName")
    const tenantMap = {}
    tenants.forEach((t) => {
      tenantMap[t._id.toString()] = t.theme?.brandName || t.name
    })

    // Combine data
    const result = {}
    stakesData.forEach((s) => {
      const key = `${s._id.tenantId}-${s._id.date}`
      result[key] = {
        tenantId: s._id.tenantId,
        tenantName: tenantMap[s._id.tenantId?.toString()] || "Unknown",
        date: s._id.date,
        stakes: s.totalStakes,
        payouts: 0,
        ggr: s.totalStakes,
      }
    })

    payoutsData.forEach((p) => {
      const key = `${p._id.tenantId}-${p._id.date}`
      if (result[key]) {
        result[key].payouts = p.totalPayouts
        result[key].ggr = result[key].stakes - p.totalPayouts
      }
    })

    return Object.values(result).sort((a, b) => a.date.localeCompare(b.date))
  }

  // Get player list with analytics data
  static async getPlayerList(options = {}) {
    await connectDB()
    const { startDate, endDate, tenantId, limit = 100, skip = 0 } = options

    const matchStage = { role: "player" }
    if (tenantId) {
      matchStage.tenant_id = new mongoose.Types.ObjectId(tenantId)
    }

    // Get players with their stats
    const players = await User.find(matchStage)
      .select("fullName username email phone status kycStatus createdAt lastActive tenant_id")
      .populate("tenant_id", "name theme.brandName slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get betting stats for each player
    const playerIds = players.map((p) => p._id)

    const betMatch = { userId: { $in: playerIds } }
    if (startDate && endDate) {
      betMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    const betStats = await Bet.aggregate([
      { $match: betMatch },
      {
        $group: {
          _id: "$userId",
          totalBets: { $sum: 1 },
          totalStakes: { $sum: "$stake" },
          totalWon: {
            $sum: { $cond: [{ $eq: ["$status", "won"] }, "$potentialWin", 0] },
          },
          lastBet: { $max: "$createdAt" },
        },
      },
    ])

    const betStatsMap = new Map(betStats.map((s) => [s._id.toString(), s]))

    // Get deposit/withdrawal stats
    const txMatch = { userId: { $in: playerIds } }
    if (startDate && endDate) {
      txMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    const txStats = await Transaction.aggregate([
      { $match: { ...txMatch, status: "completed" } },
      {
        $group: {
          _id: { userId: "$userId", type: "$type" },
          total: { $sum: "$amount" },
        },
      },
    ])

    const txStatsMap = new Map()
    txStats.forEach((s) => {
      const key = s._id.userId.toString()
      if (!txStatsMap.has(key)) {
        txStatsMap.set(key, { deposits: 0, withdrawals: 0 })
      }
      if (s._id.type === "deposit") {
        txStatsMap.get(key).deposits = s.total
      } else if (s._id.type === "withdrawal") {
        txStatsMap.get(key).withdrawals = s.total
      }
    })

    // Combine data
    const playersWithStats = players.map((player) => {
      const playerId = player._id.toString()
      const bets = betStatsMap.get(playerId) || { totalBets: 0, totalStakes: 0, totalWon: 0, lastBet: null }
      const tx = txStatsMap.get(playerId) || { deposits: 0, withdrawals: 0 }
      const ggr = bets.totalStakes - bets.totalWon
      const ltv = tx.deposits - tx.withdrawals + ggr

      return {
        _id: player._id,
        name: player.username || player.fullName || "Unknown",
        email: player.email,
        phone: player.phone,
        status: player.status,
        kycStatus: player.kycStatus,
        createdAt: player.createdAt,
        lastActive: player.lastActive || bets.lastBet,
        tenant: player.tenant_id,
        totalBets: bets.totalBets,
        totalStakes: bets.totalStakes,
        totalWon: bets.totalWon,
        ggr,
        deposits: tx.deposits,
        withdrawals: tx.withdrawals,
        ltv,
      }
    })

    const total = await User.countDocuments(matchStage)

    return {
      players: playersWithStats,
      total,
      limit,
      skip,
    }
  }
}

export default AnalyticsEngine
