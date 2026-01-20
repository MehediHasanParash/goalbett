import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import JackpotConfig from "@/lib/models/JackpotConfig"
import { verifyToken } from "@/lib/auth"

const ALLOWED_ROLES = ["superadmin", "super_admin"]

// Helper to normalize config from DB to frontend format
function normalizeConfigForFrontend(config) {
  if (!config) return getDefaultJackpotTicker()
  return {
    enabled: config.enabled ?? true,
    megaJackpot: {
      label: config.megaJackpot?.label || "MEGA JACKPOT",
      amount: config.megaJackpot?.amount || 2847392,
      isActive: config.megaJackpot?.active ?? config.megaJackpot?.isActive ?? true,
    },
    dailyJackpot: {
      label: config.dailyJackpot?.label || "DAILY JACKPOT",
      amount: config.dailyJackpot?.amount || 47293,
      isActive: config.dailyJackpot?.active ?? config.dailyJackpot?.isActive ?? true,
    },
    hourlyJackpot: {
      label: config.hourlyJackpot?.label || "HOURLY JACKPOT",
      amount: config.hourlyJackpot?.amount || 3847,
      isActive: config.hourlyJackpot?.active ?? config.hourlyJackpot?.isActive ?? true,
    },
    autoIncrement: {
      enabled: config.autoIncrement?.enabled ?? true,
      megaRate: config.autoIncrement?.megaRate || 50,
      dailyRate: config.autoIncrement?.dailyRate || 10,
      hourlyRate: config.autoIncrement?.hourlyRate || 5,
      intervalSeconds: config.autoIncrement?.interval
        ? config.autoIncrement.interval / 1000
        : config.autoIncrement?.intervalSeconds || 3,
    },
  }
}

// GET - Fetch jackpot ticker settings for all tenants or specific tenant
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !ALLOWED_ROLES.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")

    if (tenantId) {
      const tenant = await Tenant.findById(tenantId).select("name slug type").lean()
      if (!tenant) {
        return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 })
      }

      const jackpotConfig = await JackpotConfig.findOne({ tenant_id: tenantId }).lean()

      return NextResponse.json({
        success: true,
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          isProvider: tenant.type === "provider",
          jackpotTicker: normalizeConfigForFrontend(jackpotConfig),
        },
      })
    }

    // Get provider tenant
    const provider = await Tenant.findOne({ type: "provider" }).select("name slug type").lean()
    let providerConfig = null
    if (provider) {
      const config = await JackpotConfig.findOne({ tenant_id: provider._id }).lean()
      providerConfig = normalizeConfigForFrontend(config)
    }

    // Get other tenants
    const otherTenants = await Tenant.find({ type: { $ne: "provider" } })
      .select("name slug type status")
      .sort({ name: 1 })
      .lean()

    // Get all jackpot configs for other tenants
    const tenantIds = otherTenants.map((t) => t._id)
    const jackpotConfigs = await JackpotConfig.find({ tenant_id: { $in: tenantIds } }).lean()
    const configMap = {}
    jackpotConfigs.forEach((config) => {
      configMap[config.tenant_id.toString()] = normalizeConfigForFrontend(config)
    })

    const allTenants = otherTenants.map((t) => ({
      _id: t._id,
      name: t.name,
      slug: t.slug,
      isProvider: false,
      jackpotTicker: configMap[t._id.toString()] || getDefaultJackpotTicker(),
    }))

    return NextResponse.json({
      success: true,
      tenants: allTenants,
      provider: provider
        ? {
            _id: provider._id,
            name: provider.name,
            slug: provider.slug,
            jackpotTicker: providerConfig || getDefaultJackpotTicker(),
          }
        : null,
    })
  } catch (error) {
    console.error("[Jackpot Ticker] Error fetching:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update jackpot ticker settings
export async function PUT(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !ALLOWED_ROLES.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { tenantId, jackpotTicker } = body

    console.log("[v0] Jackpot Ticker PUT - tenantId:", tenantId)
    console.log("[v0] Jackpot Ticker PUT - incoming data:", JSON.stringify(jackpotTicker, null, 2))

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant ID is required" }, { status: 400 })
    }

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId).select("_id name").lean()
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 })
    }

    const updateData = {
      tenant_id: tenantId,
      enabled: jackpotTicker.enabled ?? true,
      megaJackpot: {
        label: jackpotTicker.megaJackpot?.label || "MEGA JACKPOT",
        amount: Number(jackpotTicker.megaJackpot?.amount) || 2847392,
        active: jackpotTicker.megaJackpot?.isActive ?? jackpotTicker.megaJackpot?.active ?? true,
      },
      dailyJackpot: {
        label: jackpotTicker.dailyJackpot?.label || "DAILY JACKPOT",
        amount: Number(jackpotTicker.dailyJackpot?.amount) || 47293,
        active: jackpotTicker.dailyJackpot?.isActive ?? jackpotTicker.dailyJackpot?.active ?? true,
      },
      hourlyJackpot: {
        label: jackpotTicker.hourlyJackpot?.label || "HOURLY JACKPOT",
        amount: Number(jackpotTicker.hourlyJackpot?.amount) || 3847,
        active: jackpotTicker.hourlyJackpot?.isActive ?? jackpotTicker.hourlyJackpot?.active ?? true,
      },
      autoIncrement: {
        enabled: jackpotTicker.autoIncrement?.enabled ?? true,
        megaRate: Number(jackpotTicker.autoIncrement?.megaRate) || 50,
        dailyRate: Number(jackpotTicker.autoIncrement?.dailyRate) || 10,
        hourlyRate: Number(jackpotTicker.autoIncrement?.hourlyRate) || 5,
        interval: jackpotTicker.autoIncrement?.intervalSeconds
          ? jackpotTicker.autoIncrement.intervalSeconds * 1000
          : jackpotTicker.autoIncrement?.interval || 3000,
      },
    }

    console.log("[v0] Jackpot Ticker PUT - updateData:", JSON.stringify(updateData, null, 2))

    // Use findOneAndUpdate with upsert to create or update
    const updatedConfig = await JackpotConfig.findOneAndUpdate({ tenant_id: tenantId }, updateData, {
      new: true,
      upsert: true,
      runValidators: true,
    }).lean()

    console.log("[v0] Jackpot Ticker PUT - saved config:", JSON.stringify(updatedConfig, null, 2))

    return NextResponse.json({
      success: true,
      message: "Jackpot ticker updated successfully",
      jackpotTicker: normalizeConfigForFrontend(updatedConfig),
    })
  } catch (error) {
    console.error("[Jackpot Ticker] Error updating:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function getDefaultJackpotTicker() {
  return {
    enabled: true,
    megaJackpot: { label: "MEGA JACKPOT", amount: 2847392, isActive: true },
    dailyJackpot: { label: "DAILY JACKPOT", amount: 47293, isActive: true },
    hourlyJackpot: { label: "HOURLY JACKPOT", amount: 3847, isActive: true },
    autoIncrement: { enabled: true, megaRate: 50, dailyRate: 10, hourlyRate: 5, intervalSeconds: 3 },
  }
}
