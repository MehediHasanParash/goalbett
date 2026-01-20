import { NextResponse } from "next/server"
import { MOCK_LEAGUES } from "@/lib/mock-data/sports"
import connectDB from "@/lib/db"
import League from "@/lib/models/League"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get("sportId")
    const sportSlug = searchParams.get("sport")
    const featured = searchParams.get("featured")
    const country = searchParams.get("country")
    const useMock = searchParams.get("mock") !== "false"

    let leagues = []

    if (useMock) {
      leagues = MOCK_LEAGUES.filter((league) => {
        if (sportId && league.sportId !== sportId) return false
        if (sportSlug) {
          // Map sport slug to sport ID
          const sportIdFromSlug = `sport_${sportSlug.replace(/-/g, "_")}`
          if (league.sportId !== sportIdFromSlug) return false
        }
        if (featured === "true" && !league.isFeatured) return false
        if (country && league.country !== country) return false
        return league.isActive
      })
    } else {
      await connectDB()
      const query = { isActive: true }
      if (sportId) query.sportId = sportId
      if (featured === "true") query.isFeatured = true
      if (country) query.country = country

      leagues = await League.find(query).populate("sportId", "name slug").sort({ order: 1 }).lean()
    }

    return NextResponse.json({
      success: true,
      data: leagues,
      count: leagues.length,
    })
  } catch (error) {
    console.error("[v0] Leagues API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
