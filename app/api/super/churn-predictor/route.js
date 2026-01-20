import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import AnalyticsEngine from "@/lib/analytics-engine"
import mongoose from "mongoose"

// GET /api/super/churn-predictor - AI-powered churn prediction
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const inactiveDays = Number.parseInt(searchParams.get("inactiveDays")) || 3

    const options = {
      tenantId: tenantId ? new mongoose.Types.ObjectId(tenantId) : undefined,
      inactiveDays,
    }

    const churnData = await AnalyticsEngine.detectChurnAI(options)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      config: { inactiveDays },
      ...churnData,
    })
  } catch (error) {
    console.error("Churn Predictor API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
