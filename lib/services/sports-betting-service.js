import mongoose from "mongoose"
import { Bet, SportsEvent, MaxWinningLimit, SystemConfig, AuditLog } from "../models"
import { WalletService } from "./wallet-service"

export class SportsBettingService {
  static async placeBet({ userId, tenantId, selections, stake, type = "multiple", metadata = {} }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const config = await SystemConfig.findOne({ tenantId }).session(session)
      if (!config) {
        throw new Error("System configuration not found")
      }

      if (stake < config.betting.minStake) {
        throw new Error(`Minimum stake is ${config.betting.minStake}`)
      }

      if (stake > config.betting.maxStake) {
        throw new Error(`Maximum stake is ${config.betting.maxStake}`)
      }

      if (selections.length > config.betting.maxSelections) {
        throw new Error(`Maximum selections allowed is ${config.betting.maxSelections}`)
      }

      let totalOdds = 1
      const enrichedSelections = []

      for (const sel of selections) {
        const event = await SportsEvent.findOne({
          eventId: sel.eventId,
          tenantId,
        }).session(session)

        if (!event) {
          throw new Error(`Event ${sel.eventId} not found`)
        }

        if (event.status !== "upcoming" && event.status !== "live") {
          throw new Error(`Event ${sel.eventId} is not available for betting`)
        }

        const market = event.markets.find((m) => m.marketId === sel.marketId)
        if (!market || market.status !== "open") {
          throw new Error(`Market ${sel.marketId} is not available`)
        }

        const odds = market.odds.get(sel.selectionName)
        if (!odds) {
          throw new Error(`Selection ${sel.selectionName} not found in market`)
        }

        totalOdds *= odds

        enrichedSelections.push({
          eventId: event._id,
          marketId: sel.marketId,
          eventName: `${event.homeTeam} vs ${event.awayTeam}`,
          marketName: market.marketName,
          selectionName: sel.selectionName,
          odds,
          status: "pending",
        })
      }

      const potentialWin = stake * totalOdds

      const maxWinLimit = await this.getMaxWinningLimit(tenantId, userId)
      if (potentialWin > maxWinLimit) {
        throw new Error(`Potential win ${potentialWin} exceeds maximum winning limit of ${maxWinLimit}`)
      }

      await WalletService.debitWallet({
        userId,
        tenantId,
        amount: stake,
        type: "bet_placed",
        description: `Stake for ${type} bet`,
        referenceType: "bet",
        createdBy: userId,
        metadata: { betType: type },
      })

      const bet = await Bet.create(
        [
          {
            userId,
            tenantId,
            type,
            stake,
            totalOdds,
            potentialWin,
            selections: enrichedSelections,
            status: "pending",
            placedFrom: metadata,
          },
        ],
        { session },
      )

      await AuditLog.create(
        [
          {
            tenant_id: tenantId,
            actor: {
              userId,
              email: metadata.email || "unknown",
              role: "player",
              ipAddress: metadata.ip,
              userAgent: metadata.userAgent,
            },
            action: "bet.place",
            resource: {
              type: "bet",
              id: bet[0]._id.toString(),
              name: bet[0].ticketNumber,
            },
            metadata: {
              stake,
              potentialWin,
              totalOdds,
              selectionsCount: selections.length,
            },
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return bet[0]
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async settleBet(betId, tenantId, settledBy) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const bet = await Bet.findOne({ _id: betId, tenantId }).session(session)
      if (!bet) {
        throw new Error("Bet not found")
      }

      if (bet.status !== "pending") {
        throw new Error("Bet already settled")
      }

      let allWon = true
      let anyLost = false
      let hasVoid = false

      for (const selection of bet.selections) {
        const event = await SportsEvent.findById(selection.eventId).session(session)
        if (!event || event.status !== "finished") {
          continue
        }

        const market = event.markets.find((m) => m.marketId === selection.marketId)
        if (!market || !market.result) {
          continue
        }

        if (market.status === "void") {
          selection.status = "void"
          hasVoid = true
        } else if (market.result === selection.selectionName) {
          selection.status = "won"
        } else {
          selection.status = "lost"
          allWon = false
          anyLost = true
        }
      }

      if (anyLost) {
        bet.status = "lost"
        bet.actualWin = 0
      } else if (allWon && !hasVoid) {
        bet.status = "won"
        bet.actualWin = bet.potentialWin

        await WalletService.creditWallet({
          userId: bet.userId,
          tenantId,
          amount: bet.actualWin,
          type: "bet_won",
          description: `Winning for bet ${bet.ticketNumber}`,
          referenceType: "bet",
          referenceId: bet._id,
          createdBy: settledBy,
        })
      } else if (hasVoid) {
        bet.status = "void"
        bet.actualWin = bet.stake

        await WalletService.creditWallet({
          userId: bet.userId,
          tenantId,
          amount: bet.stake,
          type: "bet_refund",
          description: `Refund for voided bet ${bet.ticketNumber}`,
          referenceType: "bet",
          referenceId: bet._id,
          createdBy: settledBy,
        })
      }

      bet.settledAt = new Date()
      bet.settledBy = typeof settledBy === "string" ? settledBy : "manual"
      await bet.save({ session })

      await AuditLog.create(
        [
          {
            tenant_id: tenantId,
            actor: {
              userId: settledBy,
              email: "system",
              role: "system",
            },
            action: "bet.settle",
            resource: {
              type: "bet",
              id: bet._id.toString(),
              name: bet.ticketNumber,
            },
            metadata: {
              status: bet.status,
              actualWin: bet.actualWin,
            },
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return bet
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async getMaxWinningLimit(tenantId, userId) {
    const limit = await MaxWinningLimit.findOne({
      tenantId,
      limitType: "global",
      isActive: true,
    })

    if (limit) {
      return limit.maxWinAmount
    }

    const config = await SystemConfig.findOne({ tenantId })
    return config?.betting?.defaultMaxWinning || 500000
  }

  static async validateMultiBetMaxWin({ tenantId, userId, selections, stake }) {
    let totalOdds = 1
    for (const sel of selections) {
      totalOdds *= sel.odds || 1
    }

    const potentialWin = stake * totalOdds
    const maxWinLimit = await this.getMaxWinningLimit(tenantId, userId)

    return {
      isValid: potentialWin <= maxWinLimit,
      potentialWin,
      maxWinLimit,
      stake,
      totalOdds,
    }
  }
}
