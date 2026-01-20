import mongoose from "mongoose"
import connectDB from "../db"
import User from "../models/User"
import Bet from "../models/Bet"
import CasinoRound from "../models/CasinoRound"
import Settlement from "../models/Settlement"
import LedgerEntry from "../models/LedgerEntry"
import { WalletService } from "./wallet-service"

/**
 * Commission Settlement Service
 * Handles automated weekly commission calculations and settlements
 */
export class CommissionSettlementService {
  /**
   * Calculate Net GGR for an agent and their downline
   * GGR = Total Stakes - Total Payouts
   * Net GGR Commission = GGR * Commission Rate
   */
  static async calculateAgentGGR({ agentId, tenantId, periodStart, periodEnd }) {
    await connectDB()

    // Get agent's commission rate
    const agent = await User.findById(agentId)
    if (!agent) throw new Error("Agent not found")

    const commissionRate = agent.commissionRate || 0.05 // Default 5%

    // Get all bets settled in this period for this agent's players
    const bets = await Bet.find({
      tenantId,
      $or: [
        { agentId }, // Direct bets through agent
        { "metadata.referredBy": agentId }, // Referred players
      ],
      status: { $in: ["won", "lost", "settled"] },
      settledAt: { $gte: periodStart, $lte: periodEnd },
    })

    // Get casino rounds for this agent's players
    const playerIds = await User.find({
      $or: [{ referredBy: agentId }, { parentAgentId: agentId }],
      role: "player",
    }).distinct("_id")

    const casinoRounds = await CasinoRound.find({
      tenantId,
      userId: { $in: playerIds },
      status: "completed",
      createdAt: { $gte: periodStart, $lte: periodEnd },
    })

    // Calculate GGR
    const sportsTotalStake = bets.reduce((sum, bet) => sum + (bet.stake || 0), 0)
    const sportsTotalPayout = bets.reduce((sum, bet) => sum + (bet.actualWin || 0), 0)
    const sportsGGR = sportsTotalStake - sportsTotalPayout

    const casinoTotalStake = casinoRounds.reduce((sum, round) => sum + (round.stake || 0), 0)
    const casinoTotalPayout = casinoRounds.reduce((sum, round) => sum + (round.payout || 0), 0)
    const casinoGGR = casinoTotalStake - casinoTotalPayout

    const totalGGR = sportsGGR + casinoGGR
    const grossCommission = totalGGR * commissionRate

    // Calculate deductions
    const platformFee = grossCommission * 0.05 // 5% platform fee
    const taxDeduction = grossCommission * 0.0 // Tax handled separately

    const netCommission = Math.max(0, grossCommission - platformFee - taxDeduction)

    return {
      agentId,
      agentName: agent.fullName || agent.username,
      commissionRate,
      periodStart,
      periodEnd,
      sports: {
        betCount: bets.length,
        totalStake: sportsTotalStake,
        totalPayout: sportsTotalPayout,
        ggr: sportsGGR,
      },
      casino: {
        roundCount: casinoRounds.length,
        totalStake: casinoTotalStake,
        totalPayout: casinoTotalPayout,
        ggr: casinoGGR,
      },
      totalGGR,
      grossCommission,
      deductions: {
        platformFee,
        taxDeduction,
      },
      netCommission,
    }
  }

  /**
   * Process commission settlement for a single agent
   * Creates settlement record and credits commission wallet
   */
  static async processAgentSettlement({ agentId, tenantId, periodStart, periodEnd, processedBy }) {
    await connectDB()

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // Calculate GGR and commission
      const ggrData = await this.calculateAgentGGR({ agentId, tenantId, periodStart, periodEnd })

      if (ggrData.netCommission <= 0) {
        await session.abortTransaction()
        return {
          success: true,
          skipped: true,
          reason: "No positive commission to settle",
          agentId,
          netCommission: 0,
        }
      }

      // Get or create commission wallet for agent
      const commissionWallet = await WalletService.getOrCreateCommissionWallet(agentId, tenantId)

      // Create settlement record
      const settlement = await Settlement.create(
        [
          {
            tenantId,
            settlementType: "agent_commission",
            beneficiaryType: "agent",
            beneficiaryId: agentId,
            beneficiaryWalletId: commissionWallet._id,
            periodStart,
            periodEnd,
            grossAmount: ggrData.grossCommission,
            deductions: ggrData.deductions,
            netAmount: ggrData.netCommission,
            currency: "USD",
            status: "completed", // Auto-approve weekly settlements
            preparedBy: processedBy,
            approvedBy: processedBy,
            approvedAt: new Date(),
            processedBy,
            processedAt: new Date(),
            totalTransactions: ggrData.sports.betCount + ggrData.casino.roundCount,
            metadata: {
              sportsGGR: ggrData.sports.ggr,
              casinoGGR: ggrData.casino.ggr,
              totalGGR: ggrData.totalGGR,
              commissionRate: ggrData.commissionRate,
              automated: true,
              settlementType: "weekly_commission",
            },
          },
        ],
        { session },
      )

      // Create ledger entry to credit commission wallet
      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId,
            debitAccount: {
              accountType: "system",
              accountName: "Commission Pool",
            },
            creditAccount: {
              walletId: commissionWallet._id,
              accountType: "agent_commission",
              accountName: `${ggrData.agentName} Commission Wallet`,
              userId: agentId,
            },
            amount: ggrData.netCommission,
            currency: "USD",
            transactionType: "AGENT_COMMISSION",
            referenceType: "settlement",
            referenceId: settlement[0]._id,
            description: `Weekly commission settlement for ${periodStart.toDateString()} - ${periodEnd.toDateString()}`,
            status: "completed",
            createdBy: processedBy,
            creditBalanceBefore: commissionWallet.availableBalance,
            creditBalanceAfter: commissionWallet.availableBalance + ggrData.netCommission,
            metadata: {
              settlementId: settlement[0]._id,
              settlementNumber: settlement[0].settlementNumber,
              automated: true,
            },
          },
        ],
        { session },
      )

      // Update commission wallet balance
      commissionWallet.availableBalance += ggrData.netCommission
      commissionWallet.totalCredits = (commissionWallet.totalCredits || 0) + ggrData.netCommission
      await commissionWallet.save({ session })

      // Update settlement with ledger entry ID
      settlement[0].ledgerEntryIds = [ledgerEntry[0]._id]
      await settlement[0].save({ session })

      await session.commitTransaction()

      return {
        success: true,
        skipped: false,
        settlementId: settlement[0]._id,
        settlementNumber: settlement[0].settlementNumber,
        agentId,
        agentName: ggrData.agentName,
        netCommission: ggrData.netCommission,
        newCommissionBalance: commissionWallet.availableBalance,
        ggrData,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  /**
   * Run weekly commission settlement for all agents
   * Should be called every Monday at 00:00
   */
  static async runWeeklySettlement({ tenantId, processedBy = "system" }) {
    await connectDB()

    // Calculate period (last Monday to last Sunday)
    const now = new Date()
    const lastMonday = new Date(now)
    lastMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7)
    lastMonday.setHours(0, 0, 0, 0)

    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastMonday.getDate() + 6)
    lastSunday.setHours(23, 59, 59, 999)

    console.log(
      `[v0] Running weekly commission settlement for period: ${lastMonday.toISOString()} - ${lastSunday.toISOString()}`,
    )

    // Get all active agents for this tenant (or all tenants if not specified)
    const agentQuery = {
      role: { $in: ["agent", "master_agent", "sub_agent"] },
      status: { $ne: "suspended" },
    }
    if (tenantId) {
      agentQuery.tenant_id = tenantId
    }

    const agents = await User.find(agentQuery).select("_id tenant_id fullName username")

    const results = {
      totalAgents: agents.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      totalCommissionPaid: 0,
      agentsProcessed: 0,
      totalCommission: 0,
      settlements: [],
      errors: [],
    }

    // Process each agent
    for (const agent of agents) {
      try {
        const result = await this.processAgentSettlement({
          agentId: agent._id.toString(),
          tenantId: agent.tenant_id,
          periodStart: lastMonday,
          periodEnd: lastSunday,
          processedBy,
        })

        if (result.skipped) {
          results.skipped++
        } else {
          results.processed++
          results.totalCommissionPaid += result.netCommission
          results.agentsProcessed++
          results.totalCommission += result.netCommission
          results.settlements.push({
            agentId: agent._id,
            agentName: result.agentName,
            settlementNumber: result.settlementNumber,
            netCommission: result.netCommission,
          })
        }
      } catch (error) {
        results.failed++
        results.errors.push({
          agentId: agent._id,
          agentName: agent.fullName || agent.username,
          error: error.message,
        })
        console.error(`[v0] Commission settlement failed for agent ${agent._id}:`, error)
      }
    }

    console.log(
      `[v0] Weekly settlement complete. Processed: ${results.processed}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
    )

    return results
  }

  /**
   * Preview weekly commission settlement without processing
   * Returns estimated payouts for all agents
   */
  static async previewWeeklySettlement({ tenantId, periodStart, periodEnd }) {
    await connectDB()

    // Use provided period or calculate last week
    if (!periodStart || !periodEnd) {
      const now = new Date()
      periodStart = new Date(now)
      periodStart.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7)
      periodStart.setHours(0, 0, 0, 0)

      periodEnd = new Date(periodStart)
      periodEnd.setDate(periodStart.getDate() + 6)
      periodEnd.setHours(23, 59, 59, 999)
    }

    // Get all active agents
    const agentQuery = {
      role: { $in: ["agent", "master_agent", "sub_agent"] },
      status: { $ne: "suspended" },
    }
    if (tenantId) {
      agentQuery.tenant_id = tenantId
    }

    const agents = await User.find(agentQuery).select("_id tenant_id fullName username commissionRate")

    const breakdown = []
    let totalGGR = 0
    let totalCommission = 0

    for (const agent of agents) {
      try {
        const ggrData = await this.calculateAgentGGR({
          agentId: agent._id.toString(),
          tenantId: agent.tenant_id,
          periodStart,
          periodEnd,
        })

        breakdown.push({
          agentId: agent._id,
          agentName: ggrData.agentName,
          commissionRate: ggrData.commissionRate,
          ggr: ggrData.totalGGR,
          grossCommission: ggrData.grossCommission,
          netCommission: ggrData.netCommission,
          sports: ggrData.sports,
          casino: ggrData.casino,
        })

        totalGGR += ggrData.totalGGR
        totalCommission += ggrData.netCommission
      } catch (error) {
        console.error(`[v0] Preview calculation failed for agent ${agent._id}:`, error)
      }
    }

    return {
      periodStart,
      periodEnd,
      totalAgents: agents.length,
      agentsWithCommission: breakdown.filter((b) => b.netCommission > 0).length,
      totalGGR,
      totalCommission,
      breakdown,
    }
  }

  /**
   * Get commission wallet balance for an agent
   */
  static async getCommissionWalletBalance(agentId, tenantId) {
    await connectDB()
    const wallet = await WalletService.getOrCreateCommissionWallet(agentId, tenantId)
    return {
      availableBalance: wallet.availableBalance || 0,
      lockedBalance: wallet.lockedBalance || 0,
      totalCredits: wallet.totalCredits || 0,
      totalDebits: wallet.totalDebits || 0,
    }
  }

  /**
   * Withdraw from commission wallet to main agent wallet
   */
  static async withdrawCommission({ agentId, amount, tenantId }) {
    await connectDB()

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const agent = await User.findById(agentId)
      if (!agent) throw new Error("Agent not found")

      const commissionWallet = await WalletService.getOrCreateCommissionWallet(agentId, tenantId)
      const mainWallet = await WalletService.getAgentWallet(agentId, tenantId)

      if (commissionWallet.availableBalance < amount) {
        throw new Error(`Insufficient commission balance. Available: ${commissionWallet.availableBalance}`)
      }

      // Create ledger entry
      await LedgerEntry.create(
        [
          {
            tenantId,
            debitAccount: {
              walletId: commissionWallet._id,
              accountType: "agent_commission",
              accountName: `${agent.fullName || agent.username} Commission`,
              userId: agentId,
            },
            creditAccount: {
              walletId: mainWallet._id,
              accountType: "agent",
              accountName: agent.fullName || agent.username,
              userId: agentId,
            },
            amount,
            currency: "USD",
            transactionType: "COMMISSION_WITHDRAWAL",
            description: `Commission withdrawal to main wallet`,
            status: "completed",
            createdBy: mongoose.Types.ObjectId.createFromHexString(agentId),
            debitBalanceBefore: commissionWallet.availableBalance,
            debitBalanceAfter: commissionWallet.availableBalance - amount,
            creditBalanceBefore: mainWallet.availableBalance,
            creditBalanceAfter: mainWallet.availableBalance + amount,
          },
        ],
        { session },
      )

      // Update balances
      commissionWallet.availableBalance -= amount
      commissionWallet.totalDebits = (commissionWallet.totalDebits || 0) + amount
      await commissionWallet.save({ session })

      mainWallet.availableBalance += amount
      await mainWallet.save({ session })

      await session.commitTransaction()

      return {
        success: true,
        newCommissionBalance: commissionWallet.availableBalance,
        newMainBalance: mainWallet.availableBalance,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }
}

export default CommissionSettlementService
