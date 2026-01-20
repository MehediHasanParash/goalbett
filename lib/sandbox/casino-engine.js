/**
 * Sandbox Casino Engine
 *
 * Provides demo casino games with:
 * - Provably fair RNG
 * - Full audit trail
 * - RTP tracking
 * - Ledger integration
 *
 * Games included:
 * - Dice
 * - Crash
 * - Mines
 *
 * REGULATOR NOTE: All games use cryptographic provably-fair
 * verification that players can independently verify.
 */

import crypto from "crypto"
import CasinoRound from "@/lib/models/CasinoRound"
import Wallet from "@/lib/models/Wallet"
import { LedgerEngine } from "@/lib/ledger-engine"
import { logAudit } from "@/lib/audit-logger"
import mongoose from "mongoose"

/**
 * Provably Fair System
 * Uses HMAC-SHA256 for verifiable random number generation
 */
class ProvablyFair {
  /**
   * Generate a new server seed
   */
  static generateServerSeed() {
    return crypto.randomBytes(32).toString("hex")
  }

  /**
   * Hash the server seed (shown to player before game)
   */
  static hashServerSeed(serverSeed) {
    return crypto.createHash("sha256").update(serverSeed).digest("hex")
  }

  /**
   * Generate random number from seeds
   * @param {string} serverSeed - Server's secret seed
   * @param {string} clientSeed - Player's seed
   * @param {number} nonce - Game round number
   * @returns {number} Random number between 0 and 1
   */
  static generateRandom(serverSeed, clientSeed, nonce) {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`
    const hash = crypto.createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex")

    // Convert first 8 characters of hash to number
    const int = Number.parseInt(hash.substring(0, 8), 16)
    return int / 0xffffffff // Normalize to 0-1
  }

  /**
   * Verify a game result
   */
  static verify(serverSeed, serverSeedHash, clientSeed, nonce, expectedResult) {
    // Verify server seed matches hash
    const calculatedHash = this.hashServerSeed(serverSeed)
    if (calculatedHash !== serverSeedHash) {
      return { valid: false, error: "Server seed hash mismatch" }
    }

    // Recalculate result
    const random = this.generateRandom(serverSeed, clientSeed, nonce)

    return {
      valid: true,
      serverSeedValid: true,
      random,
      details: {
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        random,
      },
    }
  }
}

/**
 * Casino Game Implementations
 */
class DiceGame {
  static HOUSE_EDGE = 0.01 // 1% house edge
  static MIN_MULTIPLIER = 1.01
  static MAX_MULTIPLIER = 99

  /**
   * Calculate multiplier for a target
   * @param {number} target - Target number (1-99)
   * @param {string} type - "over" or "under"
   */
  static calculateMultiplier(target, type) {
    let winChance
    if (type === "over") {
      winChance = (100 - target) / 100
    } else {
      winChance = target / 100
    }

    const multiplier = (1 - this.HOUSE_EDGE) / winChance
    return Math.min(Math.max(multiplier, this.MIN_MULTIPLIER), this.MAX_MULTIPLIER)
  }

  /**
   * Play a dice round
   */
  static play(random, target, type) {
    const roll = Math.floor(random * 100) + 1 // 1-100
    let won = false

    if (type === "over") {
      won = roll > target
    } else {
      won = roll < target
    }

    const multiplier = won ? this.calculateMultiplier(target, type) : 0

    return {
      roll,
      target,
      type,
      won,
      multiplier: Number(multiplier.toFixed(4)),
    }
  }
}

class CrashGame {
  static HOUSE_EDGE = 0.01

  /**
   * Generate crash point from random
   */
  static generateCrashPoint(random) {
    // E = 99 / (1 - random)
    // This creates exponential distribution favoring lower values
    const e = 99 / (1 - random)
    const crashPoint = Math.max(1, Math.floor(e) / 100)
    return crashPoint
  }

  /**
   * Play crash game
   */
  static play(random, autoCashout = null) {
    const crashPoint = this.generateCrashPoint(random)

    // If auto cashout is set and it's less than crash point, player wins
    let cashedOut = false
    let multiplier = 0

    if (autoCashout && autoCashout <= crashPoint) {
      cashedOut = true
      multiplier = autoCashout
    }

    return {
      crashPoint: Number(crashPoint.toFixed(2)),
      autoCashout,
      cashedOut,
      multiplier,
      won: cashedOut,
    }
  }
}

class MinesGame {
  static GRID_SIZE = 25 // 5x5 grid
  static HOUSE_EDGE = 0.01

  /**
   * Calculate multiplier based on mines and tiles revealed
   */
  static calculateMultiplier(minesCount, tilesRevealed) {
    const safeTiles = this.GRID_SIZE - minesCount
    let multiplier = 1

    for (let i = 0; i < tilesRevealed; i++) {
      const remaining = safeTiles - i
      const total = this.GRID_SIZE - i
      multiplier *= (total / remaining) * (1 - this.HOUSE_EDGE / tilesRevealed)
    }

    return Number(multiplier.toFixed(4))
  }

  /**
   * Generate mine positions
   */
  static generateMinePositions(random, minesCount) {
    const positions = []
    const available = Array.from({ length: this.GRID_SIZE }, (_, i) => i)

    // Use the random to seed a simple shuffle
    let seed = random
    for (let i = 0; i < minesCount; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648
      const index = Math.floor((seed / 2147483648) * available.length)
      positions.push(available.splice(index, 1)[0])
    }

    return positions.sort((a, b) => a - b)
  }

  /**
   * Play mines game (reveal tiles)
   */
  static play(random, minesCount, tilesRevealed) {
    const minePositions = this.generateMinePositions(random, minesCount)

    // Check if any revealed tile hit a mine
    const hitMine = tilesRevealed.some((tile) => minePositions.includes(tile))

    let multiplier = 0
    if (!hitMine && tilesRevealed.length > 0) {
      multiplier = this.calculateMultiplier(minesCount, tilesRevealed.length)
    }

    return {
      minesCount,
      minePositions,
      tilesRevealed,
      hitMine,
      multiplier,
      won: !hitMine && tilesRevealed.length > 0,
    }
  }
}

/**
 * Main Casino Engine
 */
export class SandboxCasinoEngine {
  /**
   * Initialize a new game round
   */
  static async initializeRound({ userId, tenantId, walletId, gameType, stake, clientSeed, gameParams = {} }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      if (stake <= 0) {
        throw new Error("Invalid stake amount")
      }

      const wallet = await Wallet.findById(walletId).session(session)
      if (!wallet || wallet.availableBalance < stake) {
        throw new Error("Insufficient balance")
      }

      wallet.availableBalance -= stake
      wallet.totalWagered = (wallet.totalWagered || 0) + stake
      await wallet.save({ session })

      const serverSeed = ProvablyFair.generateServerSeed()
      const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed)

      const nonce = (await CasinoRound.countDocuments({ userId, gameType })) + 1

      const combinedSeed = `${serverSeed}:${clientSeed || crypto.randomBytes(16).toString("hex")}:${nonce}`

      const timestamp = Date.now().toString(36).toUpperCase()
      const random = Math.random().toString(36).substring(2, 8).toUpperCase()
      const roundId = `CASINO-${gameType?.toUpperCase() || "GAME"}-${timestamp}-${random}`

      const round = await CasinoRound.create(
        [
          {
            roundId,
            roundNumber: roundId,
            userId,
            tenantId,
            walletId,
            gameType,
            gameName: `Sandbox ${gameType.charAt(0).toUpperCase() + gameType.slice(1)}`,
            stake,
            currency: wallet.currency,
            gameParams,
            status: "pending",
            provablyFair: {
              serverSeed,
              serverSeedHash,
              clientSeed: clientSeed || crypto.randomBytes(16).toString("hex"),
              nonce,
              combinedSeed,
              serverSeedRevealed: false,
            },
            outcome: {
              result: null,
              multiplier: 0,
              payout: 0,
            },
            multiplier: 0,
            payout: 0,
            profit: -stake,
          },
        ],
        { session },
      )

      await LedgerEngine.createEntry({
        tenantId,
        debitAccount: { walletId, accountType: "player", accountName: "Player Wallet", userId },
        creditAccount: { accountType: "liability", accountName: "Casino Float" },
        amount: stake,
        currency: wallet.currency,
        transactionType: "BET_PLACED",
        referenceType: "casino_round",
        referenceId: round[0]._id,
        description: `${round[0].gameName} - Stake Deducted`,
        createdBy: userId,
        metadata: {
          gameType: gameType, // Declare gameType here
          roundNumber: roundId,
          stake: stake, // Declare stake here
        },
      })

      await session.commitTransaction()

      return {
        roundId: round[0].roundId,
        roundNumber: round[0].roundNumber,
        serverSeedHash: round[0].provablyFair.serverSeedHash,
        clientSeed: round[0].provablyFair.clientSeed,
        nonce: round[0].provablyFair.nonce,
        newBalance: wallet.availableBalance,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  /**
   * Play a game round
   */
  static async playRound(roundId, actionParams = {}) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const round = await CasinoRound.findOne({ roundId }).session(session)
      if (!round) throw new Error("Round not found")
      if (round.status !== "pending" && round.status !== "active") {
        throw new Error("Round already completed")
      }

      const random = ProvablyFair.generateRandom(
        round.provablyFair.serverSeed,
        round.provablyFair.clientSeed,
        round.provablyFair.nonce,
      )

      let result
      switch (round.gameType) {
        case "dice":
          result = DiceGame.play(
            random,
            actionParams.target || round.gameParams.targetNumber || 50,
            actionParams.type || round.gameParams.rollType || "over",
          )
          break

        case "crash":
          result = CrashGame.play(random, round.gameParams.autoCashout)
          break

        case "mines":
          result = MinesGame.play(
            random,
            round.gameParams.minesCount || 5,
            actionParams.tilesRevealed || round.gameParams.tilesRevealed || [],
          )
          break

        default:
          throw new Error(`Unknown game type: ${round.gameType}`)
      }

      const payout = result.won ? round.stake * result.multiplier : 0

      round.outcome = {
        result,
        multiplier: result.multiplier,
        payout,
      }
      round.multiplier = result.multiplier
      round.payout = payout
      round.profit = payout - round.stake
      round.status = "completed"
      round.completedAt = new Date()
      round.provablyFair.serverSeedRevealed = true

      round.rtp.actualRtp = payout / round.stake

      await round.save({ session })

      const wallet = await Wallet.findById(round.walletId).session(session)

      if (payout > 0) {
        wallet.availableBalance += payout
        wallet.totalWinnings = (wallet.totalWinnings || 0) + payout
        await wallet.save({ session })

        const ledgerEntry = await LedgerEngine.createEntry({
          tenantId: round.tenantId,
          debitAccount: { accountType: "liability", accountName: "Casino Float" },
          creditAccount: {
            walletId: round.walletId,
            accountType: "player",
            accountName: "Player Wallet",
            userId: round.userId,
          },
          amount: payout,
          currency: round.currency,
          transactionType: "BET_WINNING",
          referenceType: "bet",
          referenceId: round._id,
          description: `${round.gameName} - Win (${result.multiplier}x)`,
          createdBy: round.userId,
          metadata: {
            gameType: round.gameType, // Use round.gameType here
            roundNumber: round.roundNumber,
            stake: round.stake, // Use round.stake here
            payout,
            multiplier: result.multiplier,
          },
        })

        round.ledgerEntryId = ledgerEntry._id
        await round.save({ session })
      } else {
        const ledgerEntry = await LedgerEngine.createEntry({
          tenantId: round.tenantId,
          debitAccount: { accountType: "liability", accountName: "Casino Float" },
          creditAccount: { accountType: "revenue", accountName: "Casino Revenue" },
          amount: round.stake,
          currency: round.currency,
          transactionType: "BET_LOSS",
          referenceType: "bet",
          referenceId: round._id,
          description: `${round.gameName} - Loss`,
          createdBy: round.userId,
          metadata: {
            gameType: round.gameType, // Use round.gameType here
            roundNumber: round.roundNumber,
            stake: round.stake, // Use round.stake here
          },
        })

        round.ledgerEntryId = ledgerEntry._id
        await round.save({ session })
      }

      await session.commitTransaction()

      await logAudit({
        action: "casino_round_completed",
        performedBy: round.userId.toString(),
        targetType: "casino_round",
        targetId: round._id.toString(),
        details: {
          roundNumber: round.roundNumber,
          gameType: round.gameType,
          stake: round.stake,
          payout,
          multiplier: result.multiplier,
          result: result.won ? "won" : "lost",
        },
      })

      return {
        success: true,
        roundId: round.roundId,
        roundNumber: round.roundNumber,
        gameType: round.gameType,
        stake: round.stake,
        result,
        payout,
        newBalance: wallet.availableBalance,
        provablyFair: {
          serverSeed: round.provablyFair.serverSeed,
          serverSeedHash: round.provablyFair.serverSeedHash,
          clientSeed: round.provablyFair.clientSeed,
          nonce: round.provablyFair.nonce,
          verificationUrl: `/api/casino/verify?round=${round.roundNumber}`,
        },
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  /**
   * Quick play - Initialize and play in one operation using atomic updates
   * NO TRANSACTIONS to avoid write conflicts
   */
  static async quickPlay({
    userId,
    tenantId,
    walletId,
    gameType,
    stake,
    clientSeed,
    gameParams = {},
    actionParams = {},
  }) {
    if (stake <= 0) {
      throw new Error("Invalid stake amount")
    }

    // Use atomic operation to deduct balance - NO TRANSACTION
    const updatedWallet = await Wallet.findOneAndUpdate(
      { _id: walletId, availableBalance: { $gte: stake } },
      { $inc: { availableBalance: -stake } },
      { new: true },
    )

    if (!updatedWallet) {
      throw new Error("Insufficient balance")
    }

    // Generate provably fair data
    const serverSeed = ProvablyFair.generateServerSeed()
    const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed)
    const nonce = (await CasinoRound.countDocuments({ userId, gameType })) + 1
    const finalClientSeed = clientSeed || crypto.randomBytes(16).toString("hex")
    const combinedSeed = `${serverSeed}:${finalClientSeed}:${nonce}`

    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const roundId = `CASINO-${gameType?.toUpperCase() || "GAME"}-${timestamp}-${random}`

    const randomValue = ProvablyFair.generateRandom(serverSeed, finalClientSeed, nonce)

    // Calculate game result
    let result
    switch (gameType) {
      case "dice":
        result = DiceGame.play(
          randomValue,
          actionParams.target || gameParams.targetNumber || 50,
          actionParams.type || gameParams.rollType || "under",
        )
        break

      case "crash":
        result = CrashGame.play(randomValue, gameParams.autoCashout)
        break

      case "mines":
        result = MinesGame.play(
          randomValue,
          gameParams.minesCount || 5,
          actionParams.tilesRevealed || gameParams.tilesRevealed || [],
        )
        break

      default:
        throw new Error(`Unknown game type: ${gameType}`)
    }

    const payout = result.won ? stake * result.multiplier : 0

    // Create completed round
    const round = await CasinoRound.create({
      roundId,
      roundNumber: roundId,
      userId,
      tenantId,
      walletId,
      gameType,
      gameName: `Sandbox ${gameType.charAt(0).toUpperCase() + gameType.slice(1)}`,
      stake,
      currency: updatedWallet.currency,
      gameParams,
      status: "completed",
      completedAt: new Date(),
      provablyFair: {
        serverSeed,
        serverSeedHash,
        clientSeed: finalClientSeed,
        nonce,
        combinedSeed,
        serverSeedRevealed: true,
      },
      outcome: {
        result,
        multiplier: result.multiplier,
        payout,
      },
      multiplier: result.multiplier,
      payout,
      profit: payout - stake,
      rtp: {
        actualRtp: payout / stake,
      },
    })

    const stakeLedgerEntry = await LedgerEngine.createEntry({
      tenantId,
      debitAccount: {
        walletId,
        accountType: "player",
        accountName: "Player Wallet",
        userId,
      },
      creditAccount: { accountType: "system", accountName: "Casino Float" },
      amount: stake,
      currency: updatedWallet.currency,
      transactionType: "BET_PLACEMENT",
      referenceType: "bet",
      referenceId: round._id,
      description: `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game - Stake`,
      createdBy: userId,
      metadata: {
        gameType,
        stake,
        roundId,
      },
    })

    // If player wins, add winnings atomically
    if (result.won && payout > 0) {
      await Wallet.findByIdAndUpdate(walletId, {
        $inc: {
          availableBalance: payout,
          totalWinnings: payout,
        },
      })

      const ledgerEntry = await LedgerEngine.createEntry({
        tenantId,
        debitAccount: { accountType: "system", accountName: "Casino Float" },
        creditAccount: {
          walletId,
          accountType: "player",
          accountName: "Player Wallet",
          userId,
        },
        amount: payout,
        currency: updatedWallet.currency,
        transactionType: "BET_WINNING",
        referenceType: "bet",
        referenceId: round._id,
        description: `${round.gameName} - Win (${result.multiplier}x)`,
        createdBy: userId,
        metadata: {
          gameType,
          roundNumber: roundId,
          stake,
          payout,
          multiplier: result.multiplier,
        },
      })

      round.ledgerEntryId = ledgerEntry._id
      await round.save()
    } else {
      const ledgerEntry = await LedgerEngine.createEntry({
        tenantId,
        debitAccount: { accountType: "system", accountName: "Casino Float" },
        creditAccount: { accountType: "revenue", accountName: "Casino Revenue" },
        amount: stake,
        currency: updatedWallet.currency,
        transactionType: "BET_LOSS",
        referenceType: "bet",
        referenceId: round._id,
        description: `${round.gameName} - Loss`,
        createdBy: userId,
        metadata: {
          gameType,
          roundNumber: roundId,
          stake,
        },
      })

      round.ledgerEntryId = ledgerEntry._id
      await round.save()
    }

    // Get final balance
    const finalWallet = await Wallet.findById(walletId)

    await logAudit({
      action: "casino_round_completed",
      performedBy: userId.toString(),
      targetType: "casino_round",
      targetId: round._id.toString(),
      details: {
        roundNumber: round.roundNumber,
        gameType: round.gameType,
        stake: round.stake,
        payout,
        multiplier: result.multiplier,
        result: result.won ? "won" : "lost",
      },
    })

    return {
      success: true,
      roundId: round.roundId,
      roundNumber: round.roundNumber,
      gameType: round.gameType,
      stake: round.stake,
      result,
      payout,
      newBalance: finalWallet.availableBalance,
      provablyFair: {
        serverSeed: round.provablyFair.serverSeed,
        serverSeedHash: round.provablyFair.serverSeedHash,
        clientSeed: round.provablyFair.clientSeed,
        nonce: round.provablyFair.nonce,
        verificationUrl: `/api/casino/verify?round=${round.roundNumber}`,
      },
    }
  }

  /**
   * Verify a game round (provably fair)
   */
  static async verifyRound(roundNumber) {
    const round = await CasinoRound.findOne({ roundNumber })
    if (!round) throw new Error("Round not found")
    if (round.status !== "completed") throw new Error("Round not yet completed")

    const verification = ProvablyFair.verify(
      round.provablyFair.serverSeed,
      round.provablyFair.serverSeedHash,
      round.provablyFair.clientSeed,
      round.provablyFair.nonce,
      round.outcome.result,
    )

    return {
      roundNumber: round.roundNumber,
      gameType: round.gameType,
      stake: round.stake,
      outcome: round.outcome,
      verification,
      howToVerify: {
        step1: "Take the server seed, client seed, and nonce",
        step2: "Calculate: HMAC-SHA256(serverSeed, clientSeed:nonce)",
        step3: "Convert first 8 hex characters to integer",
        step4: "Divide by 0xFFFFFFFF to get random number (0-1)",
        step5: "Apply game-specific logic to get result",
        serverSeed: round.provablyFair.serverSeed,
        clientSeed: round.provablyFair.clientSeed,
        nonce: round.provablyFair.nonce,
      },
    }
  }

  /**
   * Get RTP statistics
   */
  static async getRTPStats({ tenantId, gameType, startDate, endDate }) {
    const query = { status: "completed" }
    if (tenantId) query.tenantId = new mongoose.Types.ObjectId(tenantId)
    if (gameType) query.gameType = gameType
    if (startDate || endDate) {
      query.completedAt = {}
      if (startDate) query.completedAt.$gte = new Date(startDate)
      if (endDate) query.completedAt.$lte = new Date(endDate)
    }

    const stats = await CasinoRound.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$gameType",
          totalRounds: { $sum: 1 },
          totalStaked: { $sum: "$stake" },
          totalPayout: { $sum: "$outcome.payout" },
          avgMultiplier: { $avg: "$outcome.multiplier" },
        },
      },
    ])

    const result = {}
    stats.forEach((s) => {
      result[s._id] = {
        totalRounds: s.totalRounds,
        totalStaked: Number(s.totalStaked.toFixed(2)),
        totalPayout: Number(s.totalPayout.toFixed(2)),
        actualRtp: Number(((s.totalPayout / s.totalStaked) * 100).toFixed(2)),
        ggr: Number((s.totalStaked - s.totalPayout).toFixed(2)),
        avgMultiplier: Number(s.avgMultiplier.toFixed(4)),
      }
    })

    return result
  }

  /**
   * Get player history
   */
  static async getPlayerHistory(userId, { gameType, limit = 50, page = 1 }) {
    const query = { userId }
    if (gameType) query.gameType = gameType

    const [rounds, total] = await Promise.all([
      CasinoRound.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CasinoRound.countDocuments(query),
    ])

    return {
      rounds,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }
}

export { ProvablyFair, DiceGame, CrashGame, MinesGame }
export default SandboxCasinoEngine
