import JurisdictionRule from "../models/JurisdictionRule"
import Tenant from "../models/Tenant"
import { logAudit } from "../audit-logger"

export class JurisdictionRulesService {
  static ruleCache = new Map()
  static CACHE_TTL = 5 * 60 * 1000

  static async getActiveRule(countryCode, profileName = "standard") {
    const cacheKey = `${countryCode.toUpperCase()}_${profileName}`
    const cached = this.ruleCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.rule
    }

    const rule = await JurisdictionRule.getActiveRule(countryCode, profileName)

    if (rule) {
      this.ruleCache.set(cacheKey, { rule, timestamp: Date.now() })
    }

    return rule
  }

  static async getRuleForTenant(tenantId) {
    const tenant = await Tenant.findById(tenantId)
    if (!tenant) {
      return null
    }

    const countryCode = tenant.countryCode || tenant.country || "US"
    const profileName = tenant.jurisdictionProfile || "standard"

    return this.getActiveRule(countryCode, profileName)
  }

  static async validateBetPlacement({ tenantId, stake, potentialWin, betType = "sports", isLive = false }) {
    const rule = await this.getRuleForTenant(tenantId)

    const result = {
      valid: true,
      errors: [],
      warnings: [],
      adjustedStake: stake,
      bettingTaxAmount: 0,
      bettingTaxRate: 0,
      ruleId: rule?._id,
      ruleVersion: rule?.version,
      countryCode: rule?.countryCode,
    }

    if (!rule) {
      result.warnings.push("No jurisdiction rule found - using system defaults")
      return result
    }

    if (rule.limits?.minBetAmount && stake < rule.limits.minBetAmount) {
      result.valid = false
      result.errors.push(`Minimum bet amount is ${rule.limits.minBetAmount} ${rule.baseCurrency}`)
    }

    if (rule.limits?.maxBetAmount && stake > rule.limits.maxBetAmount) {
      result.valid = false
      result.errors.push(`Maximum bet amount is ${rule.limits.maxBetAmount} ${rule.baseCurrency}`)
    }

    if (rule.limits?.maxWinPerBet && potentialWin > rule.limits.maxWinPerBet) {
      result.valid = false
      result.errors.push(`Maximum potential win is ${rule.limits.maxWinPerBet} ${rule.baseCurrency}`)
    }

    if (isLive && rule.featuresAllowed?.liveBettingEnabled === false) {
      result.valid = false
      result.errors.push("Live betting is not allowed in this jurisdiction")
    }

    if (betType === "casino" && rule.featuresAllowed?.casinoEnabled === false) {
      result.valid = false
      result.errors.push("Casino games are not allowed in this jurisdiction")
    }

    if (betType === "virtual" && rule.featuresAllowed?.virtualSportsEnabled === false) {
      result.valid = false
      result.errors.push("Virtual sports are not allowed in this jurisdiction")
    }

    const bettingTaxDeduction = rule.playerDeductions?.find(
      (d) => d.enabled && d.name === "betting_tax" && d.calculationBase === "stake"
    )

    if (bettingTaxDeduction) {
      result.bettingTaxRate = bettingTaxDeduction.percentage
      result.bettingTaxAmount = this.calculateDeduction(stake, bettingTaxDeduction)
    }

    return result
  }

  static async calculateWinDeductions({ tenantId, grossWin, stake, payout }) {
    const rule = await this.getRuleForTenant(tenantId)

    const result = {
      grossWin,
      stake,
      payout,
      deductions: [],
      totalDeducted: 0,
      netWin: grossWin,
      ruleId: rule?._id,
      ruleVersion: rule?.version,
      countryCode: rule?.countryCode,
      appliedAt: new Date(),
    }

    if (!rule || !rule.playerDeductions || rule.playerDeductions.length === 0) {
      return result
    }

    const sortedDeductions = rule.playerDeductions
      .filter((d) => d.enabled && d.calculationBase !== "stake")
      .sort((a, b) => a.applicationOrder - b.applicationOrder)

    for (const deduction of sortedDeductions) {
      if (deduction.threshold && grossWin < deduction.threshold) {
        continue
      }

      let baseAmount = grossWin
      switch (deduction.calculationBase) {
        case "payout":
          baseAmount = payout
          break
        case "net_profit":
          baseAmount = Math.max(0, payout - stake)
          break
        case "gross_win":
        default:
          baseAmount = grossWin
      }

      const amount = this.calculateDeduction(baseAmount, deduction)

      result.deductions.push({
        name: deduction.name,
        label: this.getDeductionLabel(deduction.name),
        percentage: deduction.percentage,
        baseAmount,
        calculationBase: deduction.calculationBase,
        amount,
        rounding: deduction.rounding,
        description: deduction.description,
        destinationAccount: deduction.destinationAccount,
      })

      result.totalDeducted += amount
    }

    result.netWin = Math.max(0, grossWin - result.totalDeducted)

    return result
  }

  static async calculateOperatorDeductions({ tenantId, ggr, turnover, netProfit, periodStart, periodEnd }) {
    const rule = await this.getRuleForTenant(tenantId)

    const result = {
      ggr,
      turnover,
      netProfit,
      periodStart,
      periodEnd,
      deductions: [],
      totalDeducted: 0,
      netRevenue: ggr,
      ruleId: rule?._id,
      ruleVersion: rule?.version,
      countryCode: rule?.countryCode,
      calculatedAt: new Date(),
    }

    if (!rule || !rule.operatorDeductions || rule.operatorDeductions.length === 0) {
      return result
    }

    const sortedDeductions = rule.operatorDeductions
      .filter((d) => d.enabled)
      .sort((a, b) => a.applicationOrder - b.applicationOrder)

    for (const deduction of sortedDeductions) {
      let baseAmount = ggr
      switch (deduction.calculationBase) {
        case "turnover":
          baseAmount = turnover
          break
        case "net_profit":
          baseAmount = netProfit
          break
        case "ggr":
        default:
          baseAmount = ggr
      }

      const amount = this.calculateDeduction(baseAmount, deduction)

      result.deductions.push({
        name: deduction.name,
        label: this.getDeductionLabel(deduction.name),
        percentage: deduction.percentage,
        baseAmount,
        calculationBase: deduction.calculationBase,
        amount,
        description: deduction.description,
        destinationAccount: deduction.destinationAccount,
      })

      result.totalDeducted += amount
    }

    result.netRevenue = Math.max(0, ggr - result.totalDeducted)

    return result
  }

  static calculateDeduction(baseAmount, deduction) {
    let amount = (baseAmount * deduction.percentage) / 100

    switch (deduction.rounding) {
      case "floor":
        amount = Math.floor(amount)
        break
      case "ceil":
        amount = Math.ceil(amount)
        break
      default:
        amount = Math.round(amount * 100) / 100
    }

    return amount
  }

  static getDeductionLabel(name) {
    const labels = {
      win_tax: "Win Tax",
      betting_tax: "Betting Tax",
      charity: "Charity",
      withholding_tax: "Withholding Tax",
      vat: "VAT",
      excise_duty: "Excise Duty",
      social_responsibility: "Social Responsibility",
      gaming_levy: "Gaming Levy",
      other: "Other Deduction",
    }
    return labels[name] || name
  }

  static async checkFeatureAllowed(tenantId, feature) {
    const rule = await this.getRuleForTenant(tenantId)

    if (!rule || !rule.featuresAllowed) {
      return { allowed: true, reason: "No restrictions" }
    }

    const featureMap = {
      cashback: "cashbackEnabled",
      bonus: "bonusesEnabled",
      bonuses: "bonusesEnabled",
      live_betting: "liveBettingEnabled",
      live: "liveBettingEnabled",
      casino: "casinoEnabled",
      virtual: "virtualSportsEnabled",
      virtual_sports: "virtualSportsEnabled",
    }

    const featureKey = featureMap[feature.toLowerCase()]
    if (!featureKey) {
      return { allowed: true, reason: "Unknown feature" }
    }

    const isAllowed = rule.featuresAllowed[featureKey] !== false

    return {
      allowed: isAllowed,
      reason: isAllowed ? "Feature enabled" : `${feature} is not allowed in ${rule.countryName}`,
      countryCode: rule.countryCode,
      ruleVersion: rule.version,
    }
  }

  static async checkDailyWinLimit(tenantId, userId, todayWinnings, newWin) {
    const rule = await this.getRuleForTenant(tenantId)

    if (!rule || !rule.limits?.maxWinPerDay) {
      return { allowed: true, limit: null }
    }

    const totalWithNew = todayWinnings + newWin
    const allowed = totalWithNew <= rule.limits.maxWinPerDay

    return {
      allowed,
      limit: rule.limits.maxWinPerDay,
      currentTotal: todayWinnings,
      projectedTotal: totalWithNew,
      remaining: Math.max(0, rule.limits.maxWinPerDay - todayWinnings),
      currency: rule.baseCurrency,
    }
  }

  static async getSettlementBreakdown({ tenantId, grossWin, stake, payout, betId, playerId }) {
    const deductions = await this.calculateWinDeductions({ tenantId, grossWin, stake, payout })

    const breakdown = {
      betId,
      playerId,
      tenantId,
      timestamp: new Date(),
      amounts: {
        stake,
        grossWin,
        payout,
        netPayout: payout - deductions.totalDeducted,
      },
      jurisdiction: {
        ruleId: deductions.ruleId,
        ruleVersion: deductions.ruleVersion,
        countryCode: deductions.countryCode,
      },
      taxBreakdown: deductions.deductions.map((d) => ({
        type: d.name,
        label: d.label,
        rate: d.percentage,
        base: d.baseAmount,
        amount: d.amount,
        account: d.destinationAccount,
      })),
      totals: {
        totalTax: deductions.totalDeducted,
        playerReceives: payout - deductions.totalDeducted,
      },
    }

    return breakdown
  }

  static clearCache(countryCode = null) {
    if (countryCode) {
      for (const key of this.ruleCache.keys()) {
        if (key.startsWith(countryCode.toUpperCase())) {
          this.ruleCache.delete(key)
        }
      }
    } else {
      this.ruleCache.clear()
    }
  }

  static async logRuleApplication(details) {
    try {
      await logAudit({
        action: "jurisdiction_rule_applied",
        performedBy: "system",
        targetType: "bet",
        targetId: details.betId?.toString() || "unknown",
        details: {
          ...details,
          appliedAt: new Date(),
        },
      })
    } catch (error) {
      console.error("Failed to log rule application:", error)
    }
  }
}

export default JurisdictionRulesService
