import { NextResponse } from "next/server"
import { MOCK_SPORTS } from "@/lib/mock-data/sports"
import connectDB from "@/lib/db"
import Sport from "@/lib/models/Sport"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get("featured")
    const category = searchParams.get("category")
    const useMock = searchParams.get("mock") === "true" // Default to database

    let sports = []

    if (useMock) {
      // Use mock data
      sports = MOCK_SPORTS.filter((sport) => {
        if (featured === "true" && !sport.isFeatured) return false
        if (category && sport.category !== category) return false
        return sport.isActive
      })
    } else {
      // Use database
      await connectDB()
      const query = { isActive: true }
      if (featured === "true") query.isFeatured = true
      if (category) query.category = category

      sports = await Sport.find(query).sort({ order: 1 }).lean()
    }

    return NextResponse.json({
      success: true,
      data: sports,
      count: sports.length,
    })
  } catch (error) {
    console.error("[v0] Sports API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Seed sports to database
export async function POST(request) {
  try {
    await connectDB()

    const { action } = await request.json()

    if (action === "seed") {
      // Clear existing and seed mock data
      await Sport.deleteMany({})

      const sportsToInsert = MOCK_SPORTS.map((sport) => ({
        ...sport,
        _id: undefined, // Let MongoDB generate IDs
      }))

      const inserted = await Sport.insertMany(sportsToInsert)

      return NextResponse.json({
        success: true,
        message: `Seeded ${inserted.length} sports`,
        data: inserted,
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Sports seed error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
