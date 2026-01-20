import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Bet from "@/lib/models/Bet"
import User from "@/lib/models/User"
import SyndicateAlert from "@/lib/models/SyndicateAlert"

// GET /api/super/syndicate-alerts - Get syndicate betting alerts
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const timeWindow = Number.parseInt(searchParams.get("timeWindow") || "5") // seconds

    // Detect syndicate patterns - bets with identical event, odds, stake within time window
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const syndicatePatterns = await Bet.aggregate([
      { $match: { createdAt: { $gte: fiveMinutesAgo } } },
      {
        $group: {
          _id: {
            eventId: "$eventId",
            odds: "$odds",
            stake: "$stake",
            // Group by 5-second windows
            timeWindow: {
              $floor: { $divide: [{ $toLong: "$createdAt" }, timeWindow * 1000] },
            },
          },
          bets: { $push: "$$ROOT" },
          count: { $sum: 1 },
          totalAmount: { $sum: "$stake" },
          userIds: { $addToSet: "$userId" },
        },
      },
      { $match: { count: { $gte: 3 } } }, // At least 3 identical bets
      { $sort: { "_id.timeWindow": -1 } },
      { $limit: 50 },
    ])

    // Get user details for matched bets
    const alerts = []
    for (const pattern of syndicatePatterns) {
      const users = await User.find({ _id: { $in: pattern.userIds } })
        .select("fullName username email lastLoginIP deviceInfo")
        .lean()

      const userMap = {}
      users.forEach((u) => {
        userMap[u._id.toString()] = u
      })

      const matchedBets = pattern.bets.map((bet) => {
        const user = userMap[bet.userId?.toString()] || {}
        return {
          betId: bet._id.toString().slice(-6).toUpperCase(),
          playerId: bet.userId?.toString(),
          playerName: user.fullName || user.username || "Unknown",
          ip: user.lastLoginIP || bet.ipAddress || "N/A",
          device: user.deviceInfo?.device || bet.userAgent?.slice(0, 30) || "N/A",
        }
      })

      // Determine risk level
      let riskLevel = "low"
      if (pattern.count >= 5) riskLevel = "critical"
      else if (pattern.count >= 4) riskLevel = "high"
      else if (pattern.count >= 3) riskLevel = "medium"

      // Check for same IP addresses
      const ips = matchedBets.map((b) => b.ip)
      const uniqueIps = new Set(ips)
      if (uniqueIps.size < ips.length * 0.5) {
        riskLevel = "critical" // Many same IPs
      }

      alerts.push({
        _id: `${pattern._id.eventId}-${pattern._id.timeWindow}`,
        timestamp: pattern.bets[0]?.createdAt || new Date(),
        eventName: pattern.bets[0]?.eventName || pattern.bets[0]?.selection || "Unknown Event",
        odds: pattern._id.odds,
        stake: pattern._id.stake,
        matchedBets,
        status: "active",
        riskLevel,
        totalAmount: pattern.totalAmount,
      })
    }

    // Get stored alerts from database if model exists
    let storedAlerts = []
    try {
      storedAlerts = await SyndicateAlert.find({}).sort({ createdAt: -1 }).limit(50).lean()
    } catch (e) {
      // Model might not exist yet
    }

    // Combine real-time detected alerts with stored alerts
    const allAlerts = [...alerts, ...storedAlerts.map((a) => ({ ...a, _id: a._id.toString() }))]

    // Filter by status if specified
    const filteredAlerts = status === "all" ? allAlerts : allAlerts.filter((a) => a.status === status)

    // Calculate stats
    const totalAlerts = allAlerts.length
    const activeAlerts = allAlerts.filter((a) => a.status === "active").length
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const resolvedToday = allAlerts.filter(
      (a) => a.status === "resolved" && new Date(a.resolvedAt || a.timestamp) >= todayStart,
    ).length

    // Get blocked users count
    const blockedUsers = await User.countDocuments({
      status: "blocked",
      blockedReason: /syndicate/i,
    })

    return NextResponse.json({
      success: true,
      alerts: filteredAlerts,
      stats: {
        totalAlerts,
        activeAlerts,
        blockedUsers,
        resolvedToday,
      },
    })
  } catch (error) {
    console.error("Syndicate alerts API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/super/syndicate-alerts - Update alert status
export async function POST(request) {
  try {
    await dbConnect()

    const { alertId, action, userIds } = await request.json()

    if (action === "block" && userIds?.length) {
      // Block users involved in syndicate
      await User.updateMany(
        { _id: { $in: userIds } },
        {
          status: "blocked",
          blockedReason: "Syndicate betting detected",
          blockedAt: new Date(),
        },
      )
    }

    // Update alert status
    try {
      await SyndicateAlert.findByIdAndUpdate(alertId, {
        status: action === "resolve" ? "resolved" : action === "investigate" ? "investigating" : "active",
        resolvedAt: action === "resolve" ? new Date() : null,
      })
    } catch (e) {
      // Model might not exist
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Syndicate alert action error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
