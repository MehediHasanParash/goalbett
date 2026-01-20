import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import JackpotConfig from "@/lib/models/JackpotConfig"
import Tenant from "@/lib/models/Tenant"

// GET - Public API to fetch jackpot ticker for display
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const tenantSlug = searchParams.get("tenant")

    let tenantId = null

    if (tenantSlug) {
      const tenant = await Tenant.findOne({ slug: tenantSlug }).select("_id")
      tenantId = tenant?._id
    } else {
      // Get default/provider tenant
      const providerTenant = await Tenant.findOne({ type: "provider" }).select("_id")
      tenantId = providerTenant?._id
    }

    let jackpotConfig = null
    if (tenantId) {
      jackpotConfig = await JackpotConfig.findOne({ tenant_id: tenantId }).lean()
    }

    const defaultTicker = {
      enabled: true,
      megaJackpot: { label: "MEGA JACKPOT", amount: 2847392, isActive: true },
      dailyJackpot: { label: "DAILY JACKPOT", amount: 47293, isActive: true },
      hourlyJackpot: { label: "HOURLY JACKPOT", amount: 3847, isActive: true },
      autoIncrement: { enabled: true, megaRate: 50, dailyRate: 10, hourlyRate: 5, intervalSeconds: 3 },
    }

    if (jackpotConfig) {
      const ticker = {
        enabled: jackpotConfig.enabled !== false,
        megaJackpot: {
          label: jackpotConfig.megaJackpot?.label || "MEGA JACKPOT",
          amount: jackpotConfig.megaJackpot?.amount || 2847392,
          isActive: jackpotConfig.megaJackpot?.active !== false,
        },
        dailyJackpot: {
          label: jackpotConfig.dailyJackpot?.label || "DAILY JACKPOT",
          amount: jackpotConfig.dailyJackpot?.amount || 47293,
          isActive: jackpotConfig.dailyJackpot?.active !== false,
        },
        hourlyJackpot: {
          label: jackpotConfig.hourlyJackpot?.label || "HOURLY JACKPOT",
          amount: jackpotConfig.hourlyJackpot?.amount || 3847,
          isActive: jackpotConfig.hourlyJackpot?.active !== false,
        },
        autoIncrement: {
          enabled: jackpotConfig.autoIncrement?.enabled !== false,
          megaRate: jackpotConfig.autoIncrement?.megaRate || 50,
          dailyRate: jackpotConfig.autoIncrement?.dailyRate || 10,
          hourlyRate: jackpotConfig.autoIncrement?.hourlyRate || 5,
          intervalSeconds: jackpotConfig.autoIncrement?.interval || 3,
        },
      }

      return NextResponse.json({
        success: true,
        jackpotTicker: ticker,
      })
    }

    return NextResponse.json({
      success: true,
      jackpotTicker: defaultTicker,
    })
  } catch (error) {
    console.error("[Jackpot Ticker Public] Error:", error)
    return NextResponse.json({
      success: true,
      jackpotTicker: {
        enabled: true,
        megaJackpot: { label: "MEGA JACKPOT", amount: 2847392, isActive: true },
        dailyJackpot: { label: "DAILY JACKPOT", amount: 47293, isActive: true },
        hourlyJackpot: { label: "HOURLY JACKPOT", amount: 3847, isActive: true },
        autoIncrement: { enabled: true, megaRate: 50, dailyRate: 10, hourlyRate: 5, intervalSeconds: 3 },
      },
    })
  }
}
