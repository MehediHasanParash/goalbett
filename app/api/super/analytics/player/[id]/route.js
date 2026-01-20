import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import AnalyticsEngine from "@/lib/analytics-engine"
import PlayerAnalytics from "@/lib/models/PlayerAnalytics"
import User from "@/lib/models/User"

export async function GET(request, { params }) {
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

    const { id } = await params

    // Get or calculate player analytics
    let analytics = await PlayerAnalytics.findOne({ userId: id })

    // Calculate fresh data
    const ltvData = await AnalyticsEngine.calculatePlayerLTV(id)
    const user = await User.findById(id).select("fullName email createdAt lastLogin")

    if (!analytics) {
      // Create new analytics record
      analytics = await PlayerAnalytics.create({
        userId: id,
        tenantId: user?.tenant_id,
        ...ltvData,
        lastCalculated: new Date(),
      })
    } else {
      // Update existing
      analytics.ltv = ltvData.ltv
      analytics.betting = ltvData.betting
      analytics.financial = ltvData.financial
      analytics.lastCalculated = new Date()
      await analytics.save()
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user?._id,
          name: user?.fullName,
          email: user?.email,
          registeredAt: user?.createdAt,
          lastLogin: user?.lastLogin,
        },
        analytics,
      },
    })
  } catch (error) {
    console.error("Player analytics error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
