import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import CircuitBreaker from "@/lib/models/CircuitBreaker"
import Tenant from "@/lib/models/Tenant"

// GET - Get all circuit breakers for all tenants
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")

    const query = {}
    if (tenantId) {
      query.tenantId = tenantId
    }

    // Get all tenants
    const tenants = await Tenant.find(tenantId ? { _id: tenantId } : {}).lean()

    // Get or create circuit breakers for each tenant
    const circuitBreakers = await Promise.all(
      tenants.map(async (tenant) => {
        let cb = await CircuitBreaker.findOne({ tenantId: tenant._id })

        if (!cb) {
          // Create default circuit breaker for tenant
          cb = await CircuitBreaker.create({
            tenantId: tenant._id,
          })
        }

        // Check and reset periods if needed
        cb.checkAndResetPeriods()
        await cb.save()

        const statusPercentages = cb.getStatusPercentages()

        return {
          _id: cb._id,
          tenantId: tenant._id,
          tenantName: tenant.name || tenant.subdomain,
          tenantSubdomain: tenant.subdomain,
          status: cb.status,
          dailyNetLossLimit: cb.dailyNetLossLimit,
          weeklyNetLossLimit: cb.weeklyNetLossLimit,
          monthlyNetLossLimit: cb.monthlyNetLossLimit,
          currentDailyNetLoss: cb.currentDailyNetLoss,
          currentWeeklyNetLoss: cb.currentWeeklyNetLoss,
          currentMonthlyNetLoss: cb.currentMonthlyNetLoss,
          statusPercentages,
          alertThresholds: cb.alertThresholds,
          tripActions: cb.tripActions,
          autoReset: cb.autoReset,
          lastDailyReset: cb.lastDailyReset,
          lastWeeklyReset: cb.lastWeeklyReset,
          lastMonthlyReset: cb.lastMonthlyReset,
          tripHistory: cb.tripHistory.slice(-10), // Last 10 trips
          updatedAt: cb.updatedAt,
        }
      }),
    )

    // Get summary stats
    const totalTenants = circuitBreakers.length
    const activeBreakers = circuitBreakers.filter((cb) => cb.status === "active").length
    const trippedBreakers = circuitBreakers.filter((cb) => cb.status.startsWith("tripped")).length
    const warningBreakers = circuitBreakers.filter((cb) => {
      const { daily, weekly, monthly } = cb.statusPercentages
      return (
        daily.percentage >= cb.alertThresholds.warning ||
        weekly.percentage >= cb.alertThresholds.warning ||
        monthly.percentage >= cb.alertThresholds.warning
      )
    }).length

    return NextResponse.json({
      success: true,
      data: circuitBreakers,
      summary: {
        total: totalTenants,
        active: activeBreakers,
        tripped: trippedBreakers,
        warning: warningBreakers,
      },
    })
  } catch (error) {
    console.error("Circuit breaker GET error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Update circuit breaker settings
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { tenantId, action, ...settings } = body

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant ID required" }, { status: 400 })
    }

    let cb = await CircuitBreaker.findOne({ tenantId })

    if (!cb) {
      cb = await CircuitBreaker.create({ tenantId })
    }

    // Handle different actions
    if (action === "reset") {
      // Manually reset the circuit breaker
      const resetType = settings.resetType || "all"

      if (resetType === "daily" || resetType === "all") {
        cb.currentDailyNetLoss = 0
        cb.lastDailyReset = new Date()
      }
      if (resetType === "weekly" || resetType === "all") {
        cb.currentWeeklyNetLoss = 0
        cb.lastWeeklyReset = new Date()
      }
      if (resetType === "monthly" || resetType === "all") {
        cb.currentMonthlyNetLoss = 0
        cb.lastMonthlyReset = new Date()
      }

      if (cb.status.startsWith("tripped")) {
        // Record reset in history
        const lastTrip = cb.tripHistory[cb.tripHistory.length - 1]
        if (lastTrip && !lastTrip.resetAt) {
          lastTrip.resetAt = new Date()
        }
        cb.status = "active"
      }

      await cb.save()

      return NextResponse.json({
        success: true,
        message: `Circuit breaker ${resetType} reset successfully`,
        data: cb,
      })
    }

    if (action === "disable") {
      cb.status = "manually_disabled"
      await cb.save()
      return NextResponse.json({
        success: true,
        message: "Circuit breaker disabled",
        data: cb,
      })
    }

    if (action === "enable") {
      cb.status = "active"
      await cb.save()
      return NextResponse.json({
        success: true,
        message: "Circuit breaker enabled",
        data: cb,
      })
    }

    // Update settings
    if (settings.dailyNetLossLimit !== undefined) {
      cb.dailyNetLossLimit = settings.dailyNetLossLimit
    }
    if (settings.weeklyNetLossLimit !== undefined) {
      cb.weeklyNetLossLimit = settings.weeklyNetLossLimit
    }
    if (settings.monthlyNetLossLimit !== undefined) {
      cb.monthlyNetLossLimit = settings.monthlyNetLossLimit
    }
    if (settings.alertThresholds) {
      cb.alertThresholds = { ...cb.alertThresholds, ...settings.alertThresholds }
    }
    if (settings.tripActions) {
      cb.tripActions = { ...cb.tripActions, ...settings.tripActions }
    }
    if (settings.autoReset !== undefined) {
      cb.autoReset = settings.autoReset
    }

    await cb.save()

    return NextResponse.json({
      success: true,
      message: "Circuit breaker settings updated",
      data: cb,
    })
  } catch (error) {
    console.error("Circuit breaker POST error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
