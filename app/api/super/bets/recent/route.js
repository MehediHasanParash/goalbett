import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Bet from "@/lib/models/Bet"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"

export async function GET(request) {
  try {
    await dbConnect()

    let token = null

    // First check Authorization header
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }

    // Fallback to cookie
    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get("token")?.value
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Only allow superadmin, admin, tenant_admin roles
    const allowedRoles = ["superadmin", "super_admin", "admin", "tenant_admin"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status") || "pending"
    const tenantId = decoded.tenant_id

    // Build query - for superadmin show all, for tenant admin show only their tenant
    const query = { status }
    if (tenantId && decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      query.tenantId = tenantId
    }

    // Fetch recent bets within the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    query.createdAt = { $gte: twentyFourHoursAgo }

    const bets = await Bet.find(query)
      .populate("userId", "username email fullName phone")
      .populate("agentId", "username fullName")
      .populate("tenantId", "name subdomain")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // Calculate deletion eligibility (4 minute window)
    const DELETION_WINDOW_MS = 4 * 60 * 1000
    const formattedBets = bets.map((bet) => {
      const createdAtMs = new Date(bet.createdAt).getTime()
      const timeSinceCreation = Date.now() - createdAtMs
      const canDelete = timeSinceCreation < DELETION_WINDOW_MS
      const timeRemaining = canDelete ? Math.ceil((DELETION_WINDOW_MS - timeSinceCreation) / 60000) : 0

      return {
        id: bet._id,
        ticketNumber: bet.ticketNumber,
        user: bet.userId
          ? {
              id: bet.userId._id,
              username: bet.userId.username,
              fullName: bet.userId.fullName,
              email: bet.userId.email,
              phone: bet.userId.phone,
            }
          : null,
        agent: bet.agentId
          ? {
              id: bet.agentId._id,
              username: bet.agentId.username,
              fullName: bet.agentId.fullName,
            }
          : null,
        tenant: bet.tenantId
          ? {
              id: bet.tenantId._id,
              name: bet.tenantId.name,
              subdomain: bet.tenantId.subdomain,
            }
          : null,
        type: bet.type,
        stake: bet.stake,
        currency: bet.currency,
        totalOdds: bet.totalOdds,
        potentialWin: bet.potentialWin,
        selectionsCount: bet.selections?.length || 0,
        selections: bet.selections?.map((s) => ({
          eventName: s.eventName,
          marketName: s.marketName,
          selectionName: s.selectionName,
          odds: s.odds,
          status: s.status,
        })),
        status: bet.status,
        createdAt: bet.createdAt,
        canDelete,
        timeRemaining,
      }
    })

    // Get stats
    const [totalPending, totalToday, totalAmount] = await Promise.all([
      Bet.countDocuments({ ...query, status: "pending" }),
      Bet.countDocuments({ createdAt: { $gte: twentyFourHoursAgo }, ...(tenantId ? { tenantId } : {}) }),
      Bet.aggregate([
        { $match: { createdAt: { $gte: twentyFourHoursAgo }, ...(tenantId ? { tenantId: tenantId } : {}) } },
        { $group: { _id: null, total: { $sum: "$stake" } } },
      ]),
    ])

    return NextResponse.json({
      success: true,
      bets: formattedBets,
      stats: {
        pendingBets: totalPending,
        betsToday: totalToday,
        totalStakeToday: totalAmount[0]?.total || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Recent bets error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
