import connectDB from "@/lib/db"
import CircuitBreaker from "@/lib/models/CircuitBreaker"

const CircuitBreakerService = {
  /**
   * Check if betting is allowed for a tenant
   * @param {string} tenantId - The tenant ID
   * @returns {Promise<{allowed: boolean, reason: string|null}>}
   */
  async canPlaceBet(tenantId) {
    try {
      await connectDB()

      const cb = await CircuitBreaker.findOne({ tenantId })

      if (!cb) {
        // No circuit breaker = betting allowed
        return { allowed: true, reason: null }
      }

      // Check and reset periods if needed
      cb.checkAndResetPeriods()
      await cb.save()

      if (cb.status === "manually_disabled") {
        return { allowed: true, reason: null } // Disabled = no restrictions
      }

      if (cb.status.startsWith("tripped") && cb.tripActions.blockNewBets) {
        return {
          allowed: false,
          reason: `Circuit breaker tripped: ${cb.status.replace("tripped_", "")} net loss limit exceeded`,
        }
      }

      return { allowed: true, reason: null }
    } catch (error) {
      console.error("Circuit breaker check error:", error)
      // On error, allow betting to avoid blocking business
      return { allowed: true, reason: null }
    }
  },

  /**
   * Record a bet settlement result
   * @param {string} tenantId - The tenant ID
   * @param {number} netChange - Positive = house lost (player won), Negative = house won
   * @returns {Promise<{tripped: boolean, type: string|null}>}
   */
  async recordSettlement(tenantId, netChange) {
    try {
      await connectDB()

      let cb = await CircuitBreaker.findOne({ tenantId })

      if (!cb) {
        cb = await CircuitBreaker.create({ tenantId })
      }

      // Check and reset periods
      cb.checkAndResetPeriods()

      // Record the net change
      const result = cb.recordNetChange(netChange)

      await cb.save()

      if (result.tripped) {
        // Could trigger notifications here
        console.log(`[CircuitBreaker] TRIPPED for tenant ${tenantId}: ${result.type} limit exceeded`)
      }

      return result
    } catch (error) {
      console.error("Circuit breaker record error:", error)
      return { tripped: false }
    }
  },

  /**
   * Get circuit breaker status for a tenant
   * @param {string} tenantId - The tenant ID
   * @returns {Promise<Object>}
   */
  async getStatus(tenantId) {
    try {
      await connectDB()

      const cb = await CircuitBreaker.findOne({ tenantId })

      if (!cb) {
        return {
          status: "not_configured",
          dailyNetLossLimit: 50000,
          currentDailyNetLoss: 0,
          percentage: 0,
        }
      }

      cb.checkAndResetPeriods()
      await cb.save()

      return {
        status: cb.status,
        ...cb.getStatusPercentages(),
        limits: {
          daily: cb.dailyNetLossLimit,
          weekly: cb.weeklyNetLossLimit,
          monthly: cb.monthlyNetLossLimit,
        },
      }
    } catch (error) {
      console.error("Circuit breaker status error:", error)
      return { status: "error" }
    }
  },
}

export default CircuitBreakerService
