import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Banner from "@/lib/models/Banner"

// GET - Fetch active banners for public display (no auth required)
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const scope = searchParams.get("scope") // "platform" or "tenant"

    const query = {
      isActive: true,
      $or: [{ startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }, { startDate: null }],
    }

    // If tenantId is provided, fetch tenant-specific banners
    if (tenantId && scope === "tenant") {
      query.tenantId = tenantId
      query.scope = "tenant"
    } else {
      // Otherwise, fetch platform banners
      query.scope = "platform"
      query.tenantId = null
    }

    const banners = await Banner.find(query).sort({ position: 1, createdAt: -1 }).select("-createdBy").lean()

    return NextResponse.json({ success: true, data: banners })
  } catch (error) {
    console.error("[v0] Fetch public banners error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
