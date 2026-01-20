import mongoose from "mongoose"
import { Bet, CasinoRound, Settlement, LedgerEntry, Wallet, Transaction, SystemConfig, AuditLog } from "../models"

export class SettlementService {
  static async generateAgentCommissionSettlement({ tenantId, agentId, periodStart, periodEnd, preparedBy }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const config = await SystemConfig.findOne({ tenantId }).session(session)
      if (!config) {
        throw new Error("System configuration not found")
      }

      const bets = await Bet.find({
        tenantId,
        agentId,
        status: { $in: ["won", "lost"] },
        settledAt: { $gte: periodStart, $lte: periodEnd },
      }).session(session)

      const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0)
      const totalPayout = bets.reduce((sum, bet) => sum + bet.actualWin, 0)
      const ggr = totalStake - totalPayout

      const commissionRate = config.commissions.agentCommission / 100
      const grossAmount = ggr * commissionRate

      const deductions = {
        platformFee: grossAmount * (config.commissions.platformFee / 100),
        taxes: 0,
        chargebacks: 0,
        adjustments: 0,
      }

      const netAmount = grossAmount - Object.values(deductions).reduce((sum, val) => sum + val, 0)

      const settlement = await Settlement.create(
        [
          {
            tenantId,
            settlementType: "agent_commission",
            beneficiaryType: "agent",
            beneficiaryId: agentId,
            periodStart,
            periodEnd,
            grossAmount,
            deductions,
            netAmount,
            currency: "USD",
            status: "draft",
            preparedBy,
            sourceTransactions: bets.map((bet) => ({
              transactionId: bet._id,
              type: "bet",
              amount: bet.stake,
            })),
            totalTransactions: bets.length,
            metadata: {
              totalStake,
              totalPayout,
              ggr,
              commissionRate: config.commissions.agentCommission,
            },
          },
        ],
        { session },
      )

      await AuditLog.create(
        [
          {
            tenant_id: tenantId,
            actor: {
              userId: preparedBy,
              email: "system",
              role: "admin",
            },
            action: "settlement.create",
            resource: {
              type: "settlement",
              id: settlement[0]._id.toString(),
              name: settlement[0].settlementNumber,
            },
            metadata: {
              settlementType: "agent_commission",
              netAmount,
            },
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return settlement[0]
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async approveSettlement(settlementId, approvedBy) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const settlement = await Settlement.findById(settlementId).session(session)
      if (!settlement) {
        throw new Error("Settlement not found")
      }

      if (settlement.status !== "draft") {
        throw new Error("Settlement is not in draft status")
      }

      settlement.status = "approved"
      settlement.approvedBy = approvedBy
      settlement.approvedAt = new Date()
      await settlement.save({ session })

      const agentWallet = await Wallet.findOne({
        userId: settlement.beneficiaryId,
        tenantId: settlement.tenantId,
      }).session(session)

      if (!agentWallet) {
        throw new Error("Agent wallet not found")
      }

      const balanceBefore = agentWallet.availableBalance
      agentWallet.availableBalance += settlement.netAmount
      await agentWallet.save({ session })

      const transaction = await Transaction.create(
        [
          {
            walletId: agentWallet._id,
            userId: settlement.beneficiaryId,
            tenantId: settlement.tenantId,
            type: "commission",
            amount: settlement.netAmount,
            currency: settlement.currency,
            balanceBefore,
            balanceAfter: agentWallet.availableBalance,
            status: "completed",
            description: `Commission settlement ${settlement.settlementNumber}`,
            metadata: {
              settlementId: settlement._id,
            },
          },
        ],
        { session },
      )

      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId: settlement.tenantId,
            debitAccount: {
              accountType: "system",
              accountName: "Commission Account",
            },
            creditAccount: {
              walletId: agentWallet._id,
              accountType: "agent",
              accountName: `Agent ${settlement.beneficiaryId}`,
              userId: settlement.beneficiaryId,
            },
            amount: settlement.netAmount,
            currency: settlement.currency,
            creditBalanceBefore: balanceBefore,
            creditBalanceAfter: agentWallet.availableBalance,
            transactionType: "AGENT_COMMISSION",
            referenceType: "settlement",
            referenceId: settlement._id,
            description: `Commission settlement ${settlement.settlementNumber}`,
            status: "completed",
            createdBy: approvedBy,
          },
        ],
        { session },
      )

      settlement.ledgerEntryIds.push(ledgerEntry[0]._id)
      settlement.processedAt = new Date()
      settlement.processedBy = approvedBy
      settlement.status = "completed"
      await settlement.save({ session })

      await AuditLog.create(
        [
          {
            tenant_id: settlement.tenantId,
            actor: {
              userId: approvedBy,
              email: "system",
              role: "admin",
            },
            action: "settlement.approve",
            resource: {
              type: "settlement",
              id: settlement._id.toString(),
              name: settlement.settlementNumber,
            },
            metadata: {
              netAmount: settlement.netAmount,
            },
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return settlement
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async calculateGGR({ tenantId, startDate, endDate }) {
    const bets = await Bet.find({
      tenantId,
      status: { $in: ["won", "lost"] },
      settledAt: { $gte: startDate, $lte: endDate },
    })

    const casinoRounds = await CasinoRound.find({
      tenantId,
      status: "completed",
      createdAt: { $gte: startDate, $lte: endDate },
    })

    const sportsTotalStake = bets.reduce((sum, bet) => sum + bet.stake, 0)
    const sportsTotalPayout = bets.reduce((sum, bet) => sum + bet.actualWin, 0)
    const sportsGGR = sportsTotalStake - sportsTotalPayout

    const casinoTotalStake = casinoRounds.reduce((sum, round) => sum + round.stake, 0)
    const casinoTotalPayout = casinoRounds.reduce((sum, round) => sum + round.payout, 0)
    const casinoGGR = casinoTotalStake - casinoTotalPayout

    const totalGGR = sportsGGR + casinoGGR

    return {
      sportsGGR,
      casinoGGR,
      totalGGR,
      sportsTotalStake,
      sportsTotalPayout,
      sportsBetCount: bets.length,
      casinoTotalStake,
      casinoTotalPayout,
      casinoRoundCount: casinoRounds.length,
      startDate,
      endDate,
    }
  }
}
