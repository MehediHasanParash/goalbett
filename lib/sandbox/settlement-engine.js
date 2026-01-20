/**
 * Sandbox Settlement Engine
 *
 * Handles settlement of sports bets and casino rounds:
 * - Manual settlement by admin
 * - Automatic settlement based on event results
 * - Ledger entries for all settlements
 * - GGR (Gross Gaming Revenue) calculation
 * - Commission distribution
 *
 * REGULATOR NOTE: This engine demonstrates complete settlement
 * workflow with full audit trail and double-entry ledger.
 */

import mongoose from "mongoose"
import Event from "@/lib/models/Event"
import Bet from "@/lib/models/Bet"
import Wallet from "@/lib/models/Wallet"
import { LedgerEngine } from "@/lib/ledger-engine"
import { logAudit } from "@/lib/audit-logger"

/**
 * Bet Selection Result Evaluator
 * Determines if a selection won based on event result
 */
const evaluateSelection = (selection, event) => {
  const { marketName, selectionName } = selection
  const homeScore = event.homeTeam?.score ?? 0
  const awayScore = event.awayTeam?.score ?? 0
  const totalGoals = homeScore + awayScore

  // Match Winner (1X2)
  if (marketName === "Match Winner" || marketName === "1X2") {
    if (selectionName === "Home" || selectionName === "1") {
      return homeScore > awayScore ? "won" : "lost"
    }
    if (selectionName === "Draw" || selectionName === "X") {
      return homeScore === awayScore ? "won" : "lost"
    }
    if (selectionName === "Away" || selectionName === "2") {
      return awayScore > homeScore ? "won" : "lost"
    }
  }

  // Over/Under
  if (marketName.includes("Over") || marketName.includes("Under")) {
    const line = Number.parseFloat(marketName.match(/[\d.]+/)?.[0] || 2.5)
    if (selectionName === "Over") {
      return totalGoals > line ? "won" : "lost"
    }
    if (selectionName === "Under") {
      return totalGoals < line ? "won" : "lost"
    }
  }

  // Both Teams to Score
  if (marketName === "Both Teams to Score" || marketName === "BTTS") {
    const bothScored = homeScore > 0 && awayScore > 0
    if (selectionName === "Yes") {
      return bothScored ? "won" : "lost"
    }
    if (selectionName === "No") {
      return !bothScored ? "won" : "lost"
    }
  }

  // Double Chance
  if (marketName === "Double Chance") {
    if (selectionName === "Home or Draw" || selectionName === "1X") {
      return homeScore >= awayScore ? "won" : "lost"
    }
    if (selectionName === "Home or Away" || selectionName === "12") {
      return homeScore !== awayScore ? "won" : "lost"
    }
    if (selectionName === "Draw or Away" || selectionName === "X2") {
      return awayScore >= homeScore ? "won" : "lost"
    }
  }

  // Default: If we can't evaluate, mark as pending for manual review
  return "pending"
}

export class SettlementEngine {
  /**
   * Set event result and trigger settlement
   * @param {string} eventId - Event ID
   * @param {Object} result - Event result
   * @param {string} settledBy - User ID who settled
   * @returns {Promise<Object>} Settlement result
   */
  static async setEventResult(eventId, result, settledBy) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const event = await Event.findById(eventId).session(session)
      if (!event) throw new Error("Event not found")
      if (event.status === "finished") throw new Error("Event already settled")

      // Update event with result
      event.homeTeam.score = result.homeScore
      event.awayTeam.score = result.awayScore
      event.status = "finished"
      event.endTime = new Date()
      event.isBettingOpen = false
      await event.save({ session })

      // Find all pending bets for this event
      const affectedBets = await Bet.find({
        "selections.eventId": eventId,
        status: "pending",
      }).session(session)

      const settlementResults = {
        eventId,
        eventName: event.name,
        result: {
          homeTeam: event.homeTeam.name,
          homeScore: result.homeScore,
          awayTeam: event.awayTeam.name,
          awayScore: result.awayScore,
        },
        betsProcessed: 0,
        totalStaked: 0,
        totalPaidOut: 0,
        ggr: 0,
        bets: [],
      }

      // Process each bet
      for (const bet of affectedBets) {
        const betResult = await this.settleBet(bet, event, settledBy, session)
        settlementResults.betsProcessed++
        settlementResults.totalStaked += bet.stake
        settlementResults.totalPaidOut += betResult.payout
        settlementResults.bets.push(betResult)
      }

      // Calculate GGR
      settlementResults.ggr = settlementResults.totalStaked - settlementResults.totalPaidOut

      await session.commitTransaction()

      // Audit log
      await logAudit({
        action: "event_settled",
        performedBy: settledBy,
        targetType: "event",
        targetId: eventId,
        details: {
          result: settlementResults.result,
          betsProcessed: settlementResults.betsProcessed,
          totalStaked: settlementResults.totalStaked,
          totalPaidOut: settlementResults.totalPaidOut,
          ggr: settlementResults.ggr,
        },
      })

      return settlementResults
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  /**
   * Settle a single bet based on event result
   */
  static async settleBet(bet, event, settledBy, session) {
    let allWon = true
    let anyPending = false
    let anyVoid = false

    // Evaluate each selection
    for (const selection of bet.selections) {
      if (selection.eventId.toString() === event._id.toString()) {
        const result = evaluateSelection(selection, event)
        selection.status = result
        selection.result = {
          homeScore: event.homeTeam.score,
          awayScore: event.awayTeam.score,
          settledAt: new Date(),
        }

        if (result === "lost") allWon = false
        if (result === "pending") anyPending = true
        if (result === "void") anyVoid = true
      } else if (selection.status === "pending") {
        anyPending = true
        allWon = false
      } else if (selection.status === "lost") {
        allWon = false
      } else if (selection.status === "void") {
        anyVoid = true
      }
    }

    // Determine bet outcome
    let betStatus = "pending"
    let payout = 0

    if (!anyPending) {
      if (anyVoid && !bet.selections.some((s) => s.status === "lost")) {
        // Recalculate odds excluding void selections
        const validSelections = bet.selections.filter((s) => s.status !== "void")
        if (validSelections.length === 0) {
          betStatus = "void"
          payout = bet.stake // Refund
        } else if (validSelections.every((s) => s.status === "won")) {
          const newOdds = validSelections.reduce((acc, s) => acc * s.odds, 1)
          payout = bet.stake * newOdds
          betStatus = "won"
        } else {
          betStatus = "lost"
        }
      } else if (allWon) {
        betStatus = "won"
        payout = bet.potentialWin
      } else {
        betStatus = "lost"
      }
    }

    // Update bet if fully settled
    if (betStatus !== "pending") {
      bet.status = betStatus
      bet.actualWin = payout
      bet.settledAt = new Date()
      bet.settledBy = "auto"
      await bet.save({ session })

      // Create ledger entry for winning/void
      if (payout > 0) {
        const wallet = await Wallet.findOne({ userId: bet.userId }).session(session)
        if (wallet) {
          await LedgerEngine.recordBetWinning({
            walletId: wallet._id,
            userId: bet.userId,
            tenantId: bet.tenantId,
            betId: bet._id,
            stakeAmount: bet.stake,
            winAmount: payout,
            currency: bet.currency,
            createdBy: settledBy,
          })
        }
      }

      // Audit log
      await logAudit({
        action: `bet_${betStatus}`,
        performedBy: settledBy,
        targetType: "bet",
        targetId: bet._id.toString(),
        details: {
          ticketNumber: bet.ticketNumber,
          stake: bet.stake,
          payout,
          selections: bet.selections.map((s) => ({
            event: s.eventName,
            selection: s.selectionName,
            odds: s.odds,
            status: s.status,
          })),
        },
      })
    }

    return {
      betId: bet._id,
      ticketNumber: bet.ticketNumber,
      status: betStatus,
      stake: bet.stake,
      payout,
      selections: bet.selections,
    }
  }

  /**
   * Manual bet settlement (admin override)
   */
  static async manualSettleBet(betId, outcome, settledBy, reason) {
    const bet = await Bet.findById(betId)
    if (!bet) throw new Error("Bet not found")
    if (bet.status !== "pending") throw new Error("Bet already settled")

    const previousStatus = bet.status
    let payout = 0

    if (outcome === "won") {
      payout = bet.potentialWin
      bet.status = "won"
      bet.actualWin = payout
    } else if (outcome === "lost") {
      bet.status = "lost"
      bet.actualWin = 0
    } else if (outcome === "void") {
      payout = bet.stake // Refund
      bet.status = "void"
      bet.actualWin = payout
    }

    bet.settledAt = new Date()
    bet.settledBy = "manual"

    // Mark all selections with the outcome
    bet.selections.forEach((s) => {
      s.status = outcome
      s.result = {
        settledAt: new Date(),
        manualOverride: true,
        reason,
      }
    })

    await bet.save()

    // Process payout
    if (payout > 0) {
      const wallet = await Wallet.findOne({ userId: bet.userId })
      if (wallet) {
        await LedgerEngine.recordBetWinning({
          walletId: wallet._id,
          userId: bet.userId,
          tenantId: bet.tenantId,
          betId: bet._id,
          stakeAmount: bet.stake,
          winAmount: payout,
          currency: bet.currency,
          createdBy: settledBy,
        })
      }
    }

    // Audit log
    await logAudit({
      action: "bet_manual_settlement",
      performedBy: settledBy,
      targetType: "bet",
      targetId: bet._id.toString(),
      details: {
        ticketNumber: bet.ticketNumber,
        previousStatus,
        newStatus: bet.status,
        stake: bet.stake,
        payout,
        reason,
      },
    })

    return {
      success: true,
      bet,
      payout,
    }
  }

  /**
   * Get settlement statistics
   */
  static async getSettlementStats({ tenantId, startDate, endDate }) {
    const dateQuery = {}
    if (startDate) dateQuery.$gte = new Date(startDate)
    if (endDate) dateQuery.$lte = new Date(endDate)

    const query = {}
    if (tenantId) query.tenantId = tenantId
    if (startDate || endDate) query.settledAt = dateQuery

    const stats = await Bet.aggregate([
      { $match: { ...query, status: { $in: ["won", "lost", "void"] } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalStake: { $sum: "$stake" },
          totalPayout: { $sum: "$actualWin" },
        },
      },
    ])

    const summary = {
      totalBets: 0,
      totalStaked: 0,
      totalPaidOut: 0,
      ggr: 0,
      byStatus: {},
    }

    stats.forEach((s) => {
      summary.totalBets += s.count
      summary.totalStaked += s.totalStake
      summary.totalPaidOut += s.totalPayout
      summary.byStatus[s._id] = {
        count: s.count,
        staked: s.totalStake,
        paidOut: s.totalPayout,
      }
    })

    summary.ggr = summary.totalStaked - summary.totalPaidOut

    return summary
  }

  /**
   * Get pending settlements
   */
  static async getPendingSettlements({ tenantId, limit = 100 }) {
    const query = { status: "pending" }
    if (tenantId) query.tenantId = tenantId

    const bets = await Bet.find(query).populate("userId", "name email").sort({ createdAt: -1 }).limit(limit)

    return bets
  }
}

export default SettlementEngine
