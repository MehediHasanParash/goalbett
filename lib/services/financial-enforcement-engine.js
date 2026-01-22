import { connectDB } from "../db"
import JurisdictionRule from "../models/JurisdictionRule"
import LedgerEntry from "../models/LedgerEntry"
import SystemAccount from "../models/SystemAccount"
import Wallet from "../models/Wallet"
import Tenant from "../models/Tenant"

export class FinancialEnforcementEngine {
  constructor() {
    this.ledgerEntries = []
  }

  async enforceRules(betData) {
    await connectDB()

    const { userId, tenantId, stake, potentialPayout, betType = "sports", countryCode } = betData

    const tenant = await Tenant.findById(tenantId)
    if (!tenant) {
      throw new Error("Tenant not found")
    }

    const baseCurrency = tenant.currency || "USD"

    if (betData.currency && betData.currency !== baseCurrency) {
      throw new Error(
        `Currency mismatch: Bet currency ${betData.currency} does not match tenant currency ${baseCurrency}`
      )
    }

    const activeRule = await this.getActiveRule(countryCode || tenant.countryCode, baseCurrency)

    return {
      baseCurrency,
      activeRule,
      ruleId: activeRule?._id,
      ruleVersion: activeRule?.version,
    }
  }

  async settleBetWithRules(settlement) {
    await connectDB()

    const {
      betId,
      userId,
      tenantId,
      stake,
      payout,
      countryCode,
      result,
      ruleId,
      ruleVersion,
    } = settlement

    const tenant = await Tenant.findById(tenantId)
    if (!tenant) {
      throw new Error("Tenant not found")
    }

    const baseCurrency = tenant.currency || "USD"

    let rule = null
    if (ruleId) {
      rule = await JurisdictionRule.findById(ruleId)
    } else {
      rule = await this.getActiveRule(countryCode || tenant.countryCode, baseCurrency)
    }

    if (result === "lost") {
      await this.recordLedgerEntry({
        userId,
        tenantId,
        betId,
        type: "bet_lost",
        amount: 0,
        currency: baseCurrency,
        description: "Bet lost, no payout",
        metadata: { stake, result },
      })

      return {
        netPayout: 0,
        breakdown: {
          stake,
          payout: 0,
          grossWin: 0,
          deductions: [],
          netAmount: 0,
        },
      }
    }

    const grossWin = payout - stake
    const deductions = []
    let totalDeductions = 0

    if (rule && rule.playerDeductions && grossWin > 0) {
      for (const deduction of rule.playerDeductions) {
        if (!deduction.enabled) continue

        const threshold = deduction.threshold || 0
        const calculationBase = this.getCalculationBase(deduction.calculationBase, {
          stake,
          payout,
          grossWin,
        })

        if (calculationBase >= threshold) {
          let deductedAmount = (calculationBase * deduction.percentage) / 100

          switch (deduction.rounding) {
            case "floor":
              deductedAmount = Math.floor(deductedAmount)
              break
            case "ceil":
              deductedAmount = Math.ceil(deductedAmount)
              break
            default:
              deductedAmount = Math.round(deductedAmount * 100) / 100
          }

          if (deductedAmount > 0) {
            deductions.push({
              name: deduction.name,
              percentage: deduction.percentage,
              amount: deductedAmount,
              calculationBase: deduction.calculationBase,
              threshold,
              appliesTo: "player",
              destinationAccount: deduction.destinationAccount || "tax_payable",
            })
            totalDeductions += deductedAmount

            await this.transferToSystemAccount(
              deduction.destinationAccount || "tax_payable",
              deductedAmount,
              baseCurrency,
              tenantId,
              {
                betId,
                userId,
                deductionType: deduction.name,
                ruleId: rule._id,
                ruleVersion: rule.version,
              }
            )
          }
        }
      }
    }

    const netAmount = grossWin - totalDeductions

    await this.recordLedgerEntry({
      userId,
      tenantId,
      betId,
      type: "bet_won",
      amount: netAmount,
      currency: baseCurrency,
      description: `Bet won - Net payout after deductions`,
      metadata: {
        stake,
        payout,
        grossWin,
        totalDeductions,
        netAmount,
        deductions,
        ruleId: rule?._id,
        ruleVersion: rule?.version,
      },
    })

    return {
      netPayout: netAmount,
      breakdown: {
        stake,
        payout,
        grossWin,
        deductions,
        totalDeductions,
        netAmount,
        currency: baseCurrency,
        appliedRule: {
          id: rule?._id,
          version: rule?.version,
          countryCode: rule?.countryCode,
        },
      },
    }
  }

  async processOperatorDeductions(tenantId, ggr, currency) {
    await connectDB()

    const tenant = await Tenant.findById(tenantId)
    if (!tenant) {
      throw new Error("Tenant not found")
    }

    const rule = await this.getActiveRule(tenant.countryCode, currency)
    const deductions = []
    let totalDeductions = 0

    if (rule && rule.operatorDeductions) {
      for (const deduction of rule.operatorDeductions) {
        if (!deduction.enabled) continue

        const threshold = deduction.threshold || 0
        if (ggr >= threshold) {
          let deductedAmount = (ggr * deduction.percentage) / 100

          switch (deduction.rounding) {
            case "floor":
              deductedAmount = Math.floor(deductedAmount)
              break
            case "ceil":
              deductedAmount = Math.ceil(deductedAmount)
              break
            default:
              deductedAmount = Math.round(deductedAmount * 100) / 100
          }

          if (deductedAmount > 0) {
            deductions.push({
              name: deduction.name,
              percentage: deduction.percentage,
              amount: deductedAmount,
              appliesTo: "operator",
              destinationAccount: deduction.destinationAccount || "operator_revenue",
            })
            totalDeductions += deductedAmount

            await this.transferToSystemAccount(
              deduction.destinationAccount || "operator_revenue",
              deductedAmount,
              currency,
              tenantId,
              {
                deductionType: deduction.name,
                ggr,
                ruleId: rule._id,
                ruleVersion: rule.version,
              }
            )
          }
        }
      }
    }

    return {
      grossRevenue: ggr,
      deductions,
      totalDeductions,
      netRevenue: ggr - totalDeductions,
    }
  }

  async recordLedgerEntry(entry) {
    const {
      userId,
      tenantId,
      betId,
      type,
      amount,
      currency,
      description,
      metadata = {},
      transactionId,
    } = entry

    let beforeBalance = 0
    let afterBalance = 0

    if (userId && type !== "system_account") {
      const wallet = await Wallet.findOne({ userId, tenantId })
      if (wallet) {
        beforeBalance = wallet.balance
        afterBalance = beforeBalance + amount
      }
    }

    const ledgerEntry = new LedgerEntry({
      userId,
      tenantId,
      betId,
      transactionId,
      type,
      amount,
      currency,
      beforeBalance,
      afterBalance,
      description,
      metadata,
      timestamp: new Date(),
    })

    await ledgerEntry.save()

    return ledgerEntry
  }

  async transferToSystemAccount(accountName, amount, currency, tenantId, metadata = {}) {
    await connectDB()

    let systemAccount = await SystemAccount.findOne({ accountName, currency, tenantId })

    if (!systemAccount) {
      systemAccount = new SystemAccount({
        accountName,
        currency,
        tenantId,
        balance: 0,
        description: `System account for ${accountName}`,
      })
    }

    systemAccount.balance += amount
    systemAccount.lastUpdated = new Date()
    await systemAccount.save()

    await this.recordLedgerEntry({
      userId: null,
      tenantId,
      type: "system_account",
      amount,
      currency,
      description: `Transfer to ${accountName}`,
      metadata: {
        ...metadata,
        accountName,
        previousBalance: systemAccount.balance - amount,
        newBalance: systemAccount.balance,
      },
    })

    return systemAccount
  }

  async getActiveRule(countryCode, currency) {
    if (!countryCode) return null

    const rule = await JurisdictionRule.findOne({
      countryCode: countryCode.toUpperCase(),
      status: "active",
      baseCurrency: currency,
    }).sort({ version: -1 })

    return rule
  }

  getCalculationBase(baseType, amounts) {
    const { stake, payout, grossWin } = amounts

    switch (baseType) {
      case "gross_win":
        return grossWin
      case "stake":
        return stake
      case "payout":
        return payout
      case "net_profit":
        return grossWin
      default:
        return grossWin
    }
  }

  async validateCurrency(tenantId, currency) {
    const tenant = await Tenant.findById(tenantId)
    if (!tenant) {
      throw new Error("Tenant not found")
    }

    const baseCurrency = tenant.currency || "USD"

    if (currency !== baseCurrency) {
      throw new Error(
        `Currency validation failed: Expected ${baseCurrency}, got ${currency}`
      )
    }

    return true
  }

  async getSystemAccountBalance(accountName, tenantId, currency) {
    const account = await SystemAccount.findOne({ accountName, tenantId, currency })
    return account ? account.balance : 0
  }

  async getLedgerEntries(filters = {}, limit = 100, offset = 0) {
    const query = {}

    if (filters.userId) query.userId = filters.userId
    if (filters.tenantId) query.tenantId = filters.tenantId
    if (filters.betId) query.betId = filters.betId
    if (filters.type) query.type = filters.type
    if (filters.startDate || filters.endDate) {
      query.timestamp = {}
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate)
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate)
    }

    const entries = await LedgerEntry.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean()

    const total = await LedgerEntry.countDocuments(query)

    return {
      entries,
      total,
      limit,
      offset,
    }
  }
}

export const financialEngine = new FinancialEnforcementEngine()
