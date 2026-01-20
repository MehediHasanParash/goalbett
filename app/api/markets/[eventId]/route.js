import { NextResponse } from "next/server"
import { MOCK_MARKETS } from "@/lib/mock-data/sports"
import connectDB from "@/lib/db"
import Market from "@/lib/models/Market"

export async function GET(request, { params }) {
  try {
    const { eventId } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const useMock = searchParams.get("mock") !== "false"

    let markets = []

    if (useMock) {
      markets = MOCK_MARKETS.filter((market) => {
        if (market.eventId !== eventId) return false
        if (category && market.category !== category) return false
        return market.status === "open"
      })
    } else {
      await connectDB()
      const query = { eventId, status: "open" }
      if (category) query.category = category

      markets = await Market.find(query).sort({ order: 1 }).lean()
    }

    return NextResponse.json({
      success: true,
      data: markets,
      count: markets.length,
    })
  } catch (error) {
    console.error("[v0] Markets API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
