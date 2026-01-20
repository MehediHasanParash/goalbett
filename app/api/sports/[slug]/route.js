import { NextResponse } from "next/server"
import { MOCK_SPORTS } from "@/lib/mock-data/sports"
import connectDB from "@/lib/db"
import Sport from "@/lib/models/Sport"

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const useMock = searchParams.get("mock") !== "false"

    let sport = null

    if (useMock) {
      sport = MOCK_SPORTS.find((s) => s.slug === slug)
    } else {
      await connectDB()
      sport = await Sport.findOne({ slug, isActive: true }).lean()
    }

    if (!sport) {
      return NextResponse.json({ success: false, error: "Sport not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: sport,
    })
  } catch (error) {
    console.error("[v0] Sport detail error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
