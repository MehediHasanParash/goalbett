import { connectDB } from "../db"
import Bet from "../models/Bet"
import Wallet from "../models/Wallet"
import { financialEngine } from "./financial-enforcement-engine"
import { logAudit } from "../audit-logger"

export async function settleBetWithFinancialEnforcement(betId, result, finalOdds = null) {
  await connectDB()

  const bet = await Bet.findById(betId).populate("userId tenantId")
  if (!bet) {
    throw new Error("Bet not found")
  }

  if (bet.status === "settled") {
    throw new Error("Bet already settled")
  }

  const tenant = bet.tenantId
  const user = bet.userId

  bet.result = result
  bet.finalOdds = finalOdds || bet.odds
  bet.potentialPayout = result === "won" ? bet.stake * bet.finalOdds : 0

  const settlementData = {
    betId: bet._id.toString(),
    userId: user._id.toString(),
    tenantId: tenant._id.toString(),
    stake: bet.stake,
    payout: bet.potentialPayout,
    countryCode: tenant.countryCode || tenant.metadata?.country || "US",
    result: result,
    ruleId: bet.ruleId,
    ruleVersion: bet.ruleVersion,
  }

  let financialResult
  try {
    financialResult = await financialEngine.settleBetWithRules(settlementData)
  } catch (error) {
    console.error("[Settlement] Financial enforcement error:", error)
    throw new Error(`Settlement failed: ${error.message}`)
  }

  const netAmount = financialResult.netPayout

  if (result === "won" && netAmount > 0) {
    const wallet = await Wallet.findOne({ userId: user._id, tenantId: tenant._id })
    if (!wallet) {
      throw new Error("Wallet not found")
    }

    const previousBalance = wallet.balance
    wallet.balance += netAmount
    wallet.totalWinnings = (wallet.totalWinnings || 0) + netAmount
    await wallet.save()

    await logAudit({
      action: "wallet_credit",
      performedBy: user._id,
      targetType: "wallet",
      targetId: wallet._id.toString(),
      details: {
        amount: netAmount,
        previousBalance,
        newBalance: wallet.balance,
        reason: "Bet settlement",
        betId: bet._id,
        deductions: financialResult.breakdown.deductions,
      },
    })
  }

  bet.status = "settled"
  bet.settledAt = new Date()
  bet.settlementMetadata = {
    breakdown: financialResult.breakdown,
    settledBy: "system",
    settlementMethod: "automatic",
  }

  await bet.save()

  await logAudit({
    action: "bet_settled",
    performedBy: user._id,
    targetType: "bet",
    targetId: bet._id.toString(),
    details: {
      result,
      stake: bet.stake,
      payout: bet.potentialPayout,
      netPayout: netAmount,
      deductions: financialResult.breakdown.deductions,
      totalDeductions: financialResult.breakdown.totalDeductions,
    },
  })

  return {
    bet,
    settlement: financialResult,
    message: result === "won" ? `Bet won! You received ${netAmount} ${bet.currency}` : "Bet lost",
  }
}

export async function placeBetWithValidation(betData) {
  await connectDB()

  const { userId, tenantId, stake, currency, selections, betType } = betData

  const ruleCheck = await financialEngine.enforceRules({
    userId,
    tenantId,
    stake,
    currency,
    potentialPayout: stake * 2,
    betType,
  })

  const bet = new Bet({
    userId,
    tenantId,
    stake,
    currency: ruleCheck.baseCurrency,
    selections,
    betType,
    odds: 2.0,
    potentialPayout: stake * 2.0,
    status: "pending",
    ruleId: ruleCheck.ruleId,
    ruleVersion: ruleCheck.ruleVersion,
  })

  await bet.save()

  await logAudit({
    action: "bet_placed",
    performedBy: userId,
    targetType: "bet",
    targetId: bet._id.toString(),
    details: {
      stake,
      currency: ruleCheck.baseCurrency,
      selections: selections.length,
      ruleId: ruleCheck.ruleId,
      ruleVersion: ruleCheck.ruleVersion,
    },
  })

  return bet
}
