import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import GeoAccessLog from "@/lib/models/GeoAccessLog"
import CountryRuleHistory from "@/lib/models/CountryRuleHistory"
import { verifyToken } from "@/lib/auth"

// GET - Fetch geo access logs
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "access" or "history"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const decision = searchParams.get("decision")
    const countryCode = searchParams.get("countryCode")

    if (type === "history") {
      // Return rule change history
      const query = {}
      if (countryCode) query.countryCode = countryCode.toUpperCase()

      const history = await CountryRuleHistory.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()

      const total = await CountryRuleHistory.countDocuments(query)

      return NextResponse.json({
        success: true,
        logs: history,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    }

    // Default: return access logs
    const query = {}
    if (decision) query.decision = decision
    if (countryCode) query.countryCode = countryCode.toUpperCase()

    const logs = await GeoAccessLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const total = await GeoAccessLog.countDocuments(query)

    // Get stats
    const stats = await GeoAccessLog.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: "$decision",
          count: { $sum: 1 },
        },
      },
    ])

    const blockedToday = stats.find((s) => s._id === "BLOCKED")?.count || 0
    const allowedToday = stats.find((s) => s._id === "ALLOWED")?.count || 0

    // Top blocked countries
    const topBlocked = await GeoAccessLog.aggregate([
      {
        $match: {
          decision: "BLOCKED",
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { countryCode: "$countryCode", countryName: "$countryName" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        blockedToday,
        allowedToday,
        topBlocked: topBlocked.map((t) => ({
          countryCode: t._id.countryCode,
          countryName: t._id.countryName,
          count: t.count,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching geo access logs:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
