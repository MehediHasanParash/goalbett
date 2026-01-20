import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Bet from "@/lib/models/Bet"
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"
import AuditLog from "@/lib/models/AuditLog"
import { verifyToken } from "@/lib/jwt"
import mongoose from "mongoose"

export async function GET(request) {
  try {
    await connectDB()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || !["tenant_admin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const adminUserId = decoded.userId
    const tenantIdFromToken = decoded.tenant_id || decoded.tenantId

    // Find tenant
    let tenant = await Tenant.findById(tenantIdFromToken).lean()
    if (!tenant) {
      tenant = await Tenant.findOne({ adminUserId }).lean()
    }

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 })
    }

    const tenantId = tenant._id
    const adminUserIdObj = mongoose.Types.ObjectId.isValid(adminUserId)
      ? new mongoose.Types.ObjectId(adminUserId)
      : adminUserId

    // Get all players for this tenant
    const playerQuery = {
      role: "player",
      $or: [
        { tenant_id: tenantId.toString() },
        { tenant_id: tenantId },
        { tenantId: tenantId },
        { tenantId: adminUserIdObj },
      ],
    }
    const players = await User.find(playerQuery).select("_id fullName username").lean()
    const playerIds = players.map((p) => p._id)
    const playerMap = {}
    players.forEach((p) => {
      playerMap[p._id.toString()] = p.fullName || p.username || "Player"
    })

    // Get recent bets
    const recentBets = await Bet.find({
      userId: { $in: playerIds },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    const liveBets = recentBets.map((bet) => {
      const playerName = playerMap[bet.userId?.toString()] || "Unknown Player"
      const timeDiff = Date.now() - new Date(bet.createdAt).getTime()
      const minutes = Math.floor(timeDiff / 60000)
      const timeAgo = minutes < 1 ? "Just now" : minutes === 1 ? "1 min ago" : `${minutes} mins ago`

      return {
        id: bet._id,
        player: playerName.split(" ")[0] + " " + (playerName.split(" ")[1]?.charAt(0) || "") + ".",
        game: bet.eventName || bet.matchName || "Sports Bet",
        bet: bet.selection || bet.outcome || "Win",
        odds: bet.odds?.toFixed(2) || "1.50",
        stake: bet.stake || bet.amount || 0,
        time: timeAgo,
        type: bet.betType || "sports",
        status: bet.status,
      }
    })

    // Get recent activity from AuditLog
    const recentActivity = await AuditLog.find({
      tenantId: { $in: [tenantId, tenantId.toString()] },
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean()

    const activityLog = recentActivity.map((log) => {
      const timeDiff = Date.now() - new Date(log.timestamp || log.createdAt).getTime()
      const minutes = Math.floor(timeDiff / 60000)
      const hours = Math.floor(minutes / 60)
      let timeAgo = "Just now"
      if (hours > 0) {
        timeAgo = hours === 1 ? "1 hour ago" : `${hours} hours ago`
      } else if (minutes > 0) {
        timeAgo = minutes === 1 ? "1 min ago" : `${minutes} mins ago`
      }

      let type = "settings"
      let icon = "Settings"
      let color = "text-[#FFD700]"

      if (log.action?.includes("player") || log.action?.includes("user") || log.action?.includes("register")) {
        type = "user"
        icon = log.action?.includes("delete") || log.action?.includes("deactivate") ? "UserMinus" : "UserPlus"
        color = log.action?.includes("delete") || log.action?.includes("deactivate") ? "text-red-400" : "text-green-400"
      } else if (
        log.action?.includes("transaction") ||
        log.action?.includes("withdraw") ||
        log.action?.includes("deposit")
      ) {
        type = "transaction"
        icon = "DollarSign"
        color = "text-blue-400"
      } else if (log.action?.includes("security") || log.action?.includes("password") || log.action?.includes("2fa")) {
        type = "security"
        icon = "Shield"
        color = "text-purple-400"
      } else if (log.action?.includes("bet") || log.action?.includes("alert") || log.action?.includes("high")) {
        type = "alert"
        icon = "AlertCircle"
        color = "text-yellow-400"
      }

      return {
        id: log._id,
        type,
        action: log.action || "Activity",
        user: log.performedBy?.fullName || log.performedBy?.email || "System",
        details: log.details || log.description || "",
        time: timeAgo,
        icon,
        color,
      }
    })

    // If no real data, return empty arrays (not mock data)
    return NextResponse.json({
      success: true,
      liveBets: liveBets.length > 0 ? liveBets : [],
      activityLog: activityLog.length > 0 ? activityLog : [],
    })
  } catch (error) {
    console.error("[v0] Live feed error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
