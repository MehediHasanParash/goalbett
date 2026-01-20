import mongoose from "mongoose"
import crypto from "crypto"
import { CasinoRound, SystemConfig, AuditLog } from "../models"
import { WalletService } from "./wallet-service"

export class CasinoService {
  static async playDice({ userId, tenantId, stake, target, overUnder, metadata = {} }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const config = await SystemConfig.findOne({ tenantId }).session(session)
      if (!config) {
        throw new Error("System configuration not found")
      }

      if (stake < config.casino.minBet || stake > config.casino.maxBet) {
        throw new Error(`Stake must be between ${config.casino.minBet} and ${config.casino.maxBet}`)
      }

      await WalletService.debitWallet({
        userId,
        tenantId,
        amount: stake,
        type: "bet_placed",
        description: "Casino Dice bet",
        referenceType: "casino",
        createdBy: userId,
        metadata,
      })

      const provablyFairData = this.generateProvablyFair(userId.toString())
      const roll = this.calculateDiceRoll(provablyFairData.combinedSeed)

      let won = false
      if (overUnder === "over" && roll > target) won = true
      if (overUnder === "under" && roll < target) won = true

      const houseEdge = 1 - config.casino.targetRTP.dice / 100
      const winChance = overUnder === "over" ? (100 - target) / 100 : target / 100
      const multiplier = won ? (1 - houseEdge) / winChance : 0
      const payout = won ? stake * multiplier : 0
      const profit = payout - stake

      const round = await CasinoRound.create(
        [
          {
            tenantId,
            userId,
            gameType: "dice",
            stake,
            outcome: {
              roll,
              target,
              overUnder,
              won,
            },
            multiplier,
            payout,
            profit,
            status: "completed",
            provablyFair: provablyFairData,
            metadata,
          },
        ],
        { session },
      )

      if (won) {
        await WalletService.creditWallet({
          userId,
          tenantId,
          amount: payout,
          type: "bet_won",
          description: `Casino Dice win - Round ${round[0].roundId}`,
          referenceType: "casino",
          referenceId: round[0]._id,
          createdBy: userId,
          metadata,
        })
      }

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
            action: "casino.play",
            resource: {
              type: "casino",
              id: round[0]._id.toString(),
              name: round[0].roundId,
            },
            metadata: {
              gameType: "dice",
              stake,
              payout,
              won,
            },
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return round[0]
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async playCrash({ userId, tenantId, stake, targetMultiplier, metadata = {} }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const config = await SystemConfig.findOne({ tenantId }).session(session)

      if (stake < config.casino.minBet || stake > config.casino.maxBet) {
        throw new Error(`Stake must be between ${config.casino.minBet} and ${config.casino.maxBet}`)
      }

      await WalletService.debitWallet({
        userId,
        tenantId,
        amount: stake,
        type: "bet_placed",
        description: "Casino Crash bet",
        referenceType: "casino",
        createdBy: userId,
        metadata,
      })

      const provablyFairData = this.generateProvablyFair(userId.toString())
      const crashPoint = this.calculateCrashPoint(provablyFairData.combinedSeed)

      const won = targetMultiplier <= crashPoint
      const multiplier = won ? targetMultiplier : 0
      const payout = won ? stake * multiplier : 0
      const profit = payout - stake

      const round = await CasinoRound.create(
        [
          {
            tenantId,
            userId,
            gameType: "crash",
            stake,
            outcome: {
              crashPoint,
              targetMultiplier,
              won,
            },
            multiplier,
            payout,
            profit,
            status: "completed",
            provablyFair: provablyFairData,
            metadata,
          },
        ],
        { session },
      )

      if (won) {
        await WalletService.creditWallet({
          userId,
          tenantId,
          amount: payout,
          type: "bet_won",
          description: `Casino Crash win - Round ${round[0].roundId}`,
          referenceType: "casino",
          referenceId: round[0]._id,
          createdBy: userId,
          metadata,
        })
      }

      await session.commitTransaction()

      return round[0]
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async playMines({ userId, tenantId, stake, minesCount, revealedTiles, metadata = {} }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const config = await SystemConfig.findOne({ tenantId }).session(session)

      if (stake < config.casino.minBet || stake > config.casino.maxBet) {
        throw new Error(`Stake must be between ${config.casino.minBet} and ${config.casino.maxBet}`)
      }

      await WalletService.debitWallet({
        userId,
        tenantId,
        amount: stake,
        type: "bet_placed",
        description: "Casino Mines bet",
        referenceType: "casino",
        createdBy: userId,
        metadata,
      })

      const provablyFairData = this.generateProvablyFair(userId.toString())
      const minePositions = this.generateMinePositions(provablyFairData.combinedSeed, minesCount)

      const hitMine = revealedTiles.some((tile) => minePositions.includes(tile))
      const won = !hitMine && revealedTiles.length > 0

      let multiplier = 0
      if (won) {
        const safeSquares = 25 - minesCount
        const revealedCount = revealedTiles.length
        multiplier = Math.pow((25 - minesCount) / (25 - revealedCount), revealedCount) * 0.95
      }

      const payout = won ? stake * multiplier : 0
      const profit = payout - stake

      const round = await CasinoRound.create(
        [
          {
            tenantId,
            userId,
            gameType: "mines",
            stake,
            outcome: {
              minePositions,
              revealedTiles,
              hitMine,
              won,
            },
            multiplier,
            payout,
            profit,
            status: "completed",
            provablyFair: provablyFairData,
            metadata,
          },
        ],
        { session },
      )

      if (won) {
        await WalletService.creditWallet({
          userId,
          tenantId,
          amount: payout,
          type: "bet_won",
          description: `Casino Mines win - Round ${round[0].roundId}`,
          referenceType: "casino",
          referenceId: round[0]._id,
          createdBy: userId,
          metadata,
        })
      }

      await session.commitTransaction()

      return round[0]
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static generateProvablyFair(userId) {
    const serverSeed = crypto.randomBytes(32).toString("hex")
    const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex")
    const clientSeed = crypto.randomBytes(16).toString("hex")
    const nonce = Date.now()
    const combinedSeed = crypto
      .createHash("sha256")
      .update(serverSeed + clientSeed + nonce + userId)
      .digest("hex")

    return {
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      combinedSeed,
    }
  }

  static calculateDiceRoll(seed) {
    const hash = crypto.createHash("sha256").update(seed).digest("hex")
    const value = Number.parseInt(hash.substring(0, 8), 16)
    return (value % 100) + 1
  }

  static calculateCrashPoint(seed) {
    const hash = crypto.createHash("sha256").update(seed).digest("hex")
    const value = Number.parseInt(hash.substring(0, 8), 16)
    const crashPoint = Math.max(1, (value % 10000) / 100)
    return Number(crashPoint.toFixed(2))
  }

  static generateMinePositions(seed, count) {
    const positions = []
    let currentSeed = seed

    while (positions.length < count) {
      const hash = crypto.createHash("sha256").update(currentSeed).digest("hex")
      const position = Number.parseInt(hash.substring(0, 8), 16) % 25

      if (!positions.includes(position)) {
        positions.push(position)
      }

      currentSeed = hash
    }

    return positions
  }
}
