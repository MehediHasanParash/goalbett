import mongoose from "mongoose"
import Wallet from "../models/Wallet"
import WalletOwner from "../models/WalletOwner"
import Transaction from "../models/Transaction"
import LedgerEntry from "../models/LedgerEntry"
import { connectDB } from "../mongodb"

const walletLocks = new Map()

async function acquireLock(walletId, timeout = 5000) {
  const lockKey = walletId.toString()
  const startTime = Date.now()

  while (walletLocks.get(lockKey)) {
    if (Date.now() - startTime > timeout) {
      throw new Error("LOCK_TIMEOUT: Could not acquire wallet lock")
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  walletLocks.set(lockKey, { lockedAt: Date.now(), lockId: Math.random().toString(36) })
  return walletLocks.get(lockKey).lockId
}

function releaseLock(walletId, lockId) {
  const lockKey = walletId.toString()
  const currentLock = walletLocks.get(lockKey)
  if (currentLock && currentLock.lockId === lockId) {
    walletLocks.delete(lockKey)
  }
}

export class WalletService {
  // Get or create wallet for any entity
  static async getOrCreateWallet(ownerId, ownerType, tenantId, currency = "USD") {
    await connectDB()

    // Check if wallet owner exists
    const walletOwner = await WalletOwner.findOne({ ownerId, ownerType }).populate("walletId")

    if (walletOwner && walletOwner.walletId) {
      return walletOwner.walletId
    }

    let wallet = await Wallet.findOne({
      userId: ownerType !== "SYSTEM" && ownerType !== "TENANT" ? ownerId : null,
      tenantId,
    })

    // If wallet exists but no WalletOwner mapping, create the mapping
    if (wallet) {
      await WalletOwner.create({
        walletId: wallet._id,
        ownerType,
        ownerId,
        tenantId,
      })
      return wallet
    }

    // Create new wallet if it doesn't exist
    wallet = await Wallet.create({
      userId: ownerType !== "SYSTEM" && ownerType !== "TENANT" ? ownerId : null,
      tenantId,
      currency,
      availableBalance: 0,
      lockedBalance: 0,
      status: "ACTIVE",
      metadata: { ownerType, ownerId },
    })

    // Create wallet owner mapping
    await WalletOwner.create({
      walletId: wallet._id,
      ownerType,
      ownerId,
      tenantId,
    })

    return wallet
  }

  // Get wallet balance
  static async getBalance(ownerId, ownerType) {
    await connectDB()

    const walletOwner = await WalletOwner.findOne({ ownerId, ownerType }).populate("walletId")

    if (!walletOwner || !walletOwner.walletId) {
      return {
        availableBalance: 0,
        lockedBalance: 0,
        totalBalance: 0,
        currency: "USD",
      }
    }

    const wallet = walletOwner.walletId
    return {
      availableBalance: wallet.availableBalance,
      lockedBalance: wallet.lockedBalance,
      totalBalance: wallet.availableBalance + wallet.lockedBalance,
      currency: wallet.currency,
      status: wallet.status,
    }
  }

  // Update wallet balance (internal use only - always use ledger)
  static async _updateBalance(walletId, amount, isDebit = false) {
    const wallet = await Wallet.findById(walletId)
    if (!wallet) throw new Error("Wallet not found")

    if (isDebit) {
      if (wallet.availableBalance < Math.abs(amount)) {
        throw new Error("Insufficient balance")
      }
      wallet.availableBalance -= Math.abs(amount)
    } else {
      wallet.availableBalance += Math.abs(amount)
    }

    await wallet.save()
    return wallet
  }

  // Lock balance (for pending bets)
  static async lockBalance(walletId, amount) {
    const wallet = await Wallet.findById(walletId)
    if (!wallet) throw new Error("Wallet not found")

    if (wallet.availableBalance < amount) {
      throw new Error("Insufficient balance to lock")
    }

    wallet.availableBalance -= amount
    wallet.lockedBalance += amount
    await wallet.save()

    return wallet
  }

  // Unlock balance (cancel bet or payout)
  static async unlockBalance(walletId, amount, returnToAvailable = true) {
    const wallet = await Wallet.findById(walletId)
    if (!wallet) throw new Error("Wallet not found")

    if (wallet.lockedBalance < amount) {
      throw new Error("Insufficient locked balance")
    }

    wallet.lockedBalance -= amount
    if (returnToAvailable) {
      wallet.availableBalance += amount
    }
    await wallet.save()

    return wallet
  }

  // Get system wallet (house wallet)
  static async getSystemWallet(tenantId) {
    return await this.getOrCreateWallet(tenantId, "SYSTEM", tenantId)
  }

  // Get agent wallet
  static async getAgentWallet(agentId, tenantId) {
    return await this.getOrCreateWallet(agentId, "AGENT_REGULAR", tenantId)
  }

  // Get player wallet
  static async getPlayerWallet(playerId, tenantId) {
    return await this.getOrCreateWallet(playerId, "PLAYER", tenantId)
  }

  // Get tenant wallet (for super admin topups)
  static async getTenantWallet(tenantId) {
    return await this.getOrCreateWallet(tenantId, "TENANT", tenantId)
  }

  // Get or create commission wallet for agent (separate from main float wallet)
  static async getOrCreateCommissionWallet(agentId, tenantId) {
    await connectDB()

    // Check if commission wallet owner exists
    const commissionOwnerId = `${agentId}_commission`
    const walletOwner = await WalletOwner.findOne({
      ownerId: commissionOwnerId,
      ownerType: "AGENT_COMMISSION",
    }).populate("walletId")

    if (walletOwner && walletOwner.walletId) {
      return walletOwner.walletId
    }

    // Create new commission wallet
    const wallet = await Wallet.create({
      userId: agentId,
      tenantId,
      currency: "USD",
      availableBalance: 0,
      lockedBalance: 0,
      status: "ACTIVE",
      metadata: {
        ownerType: "AGENT_COMMISSION",
        ownerId: commissionOwnerId,
        walletType: "commission",
        agentId,
      },
    })

    // Create wallet owner mapping
    await WalletOwner.create({
      walletId: wallet._id,
      ownerType: "AGENT_COMMISSION",
      ownerId: commissionOwnerId,
      tenantId,
    })

    return wallet
  }

  static async debitWallet({
    userId,
    tenantId,
    amount,
    type,
    description,
    referenceType,
    referenceId,
    createdBy,
    metadata = {},
  }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      await connectDB()

      const wallet = await Wallet.findOne({ userId, tenantId }).session(session)
      if (!wallet) {
        throw new Error("Wallet not found")
      }

      if (wallet.availableBalance < amount) {
        throw new Error("Insufficient balance")
      }

      const balanceBefore = wallet.availableBalance
      wallet.availableBalance -= amount
      await wallet.save({ session })

      const transaction = await Transaction.create(
        [
          {
            walletId: wallet._id,
            userId,
            tenantId,
            type,
            amount,
            currency: wallet.currency,
            balanceBefore,
            balanceAfter: wallet.availableBalance,
            status: "completed",
            description,
            metadata,
          },
        ],
        { session },
      )

      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId,
            debitAccount: {
              walletId: wallet._id,
              accountType: "player",
              accountName: `Player ${userId}`,
              userId,
            },
            creditAccount: {
              accountType: "system",
              accountName: "System Account",
            },
            amount,
            currency: wallet.currency,
            debitBalanceBefore: balanceBefore,
            debitBalanceAfter: wallet.availableBalance,
            transactionType: type.toUpperCase().replace(/_/g, "_"),
            referenceType,
            referenceId,
            description,
            status: "completed",
            createdBy,
            metadata,
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return { wallet, transaction: transaction[0], ledgerEntry: ledgerEntry[0] }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async creditWallet({
    userId,
    tenantId,
    amount,
    type,
    description,
    referenceType,
    referenceId,
    createdBy,
    metadata = {},
  }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      await connectDB()

      const wallet = await Wallet.findOne({ userId, tenantId }).session(session)
      if (!wallet) {
        throw new Error("Wallet not found")
      }

      const balanceBefore = wallet.availableBalance
      wallet.availableBalance += amount
      await wallet.save({ session })

      const transaction = await Transaction.create(
        [
          {
            walletId: wallet._id,
            userId,
            tenantId,
            type,
            amount,
            currency: wallet.currency,
            balanceBefore,
            balanceAfter: wallet.availableBalance,
            status: "completed",
            description,
            metadata,
          },
        ],
        { session },
      )

      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId,
            debitAccount: {
              accountType: "system",
              accountName: "System Account",
            },
            creditAccount: {
              walletId: wallet._id,
              accountType: "player",
              accountName: `Player ${userId}`,
              userId,
            },
            amount,
            currency: wallet.currency,
            creditBalanceBefore: balanceBefore,
            creditBalanceAfter: wallet.availableBalance,
            transactionType: type.toUpperCase().replace(/_/g, "_"),
            referenceType,
            referenceId,
            description,
            status: "completed",
            createdBy,
            metadata,
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return { wallet, transaction: transaction[0], ledgerEntry: ledgerEntry[0] }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async atomicTransfer({
    fromWalletId,
    toWalletId,
    amount,
    type,
    description,
    referenceType,
    referenceId,
    createdBy,
    metadata = {},
  }) {
    // Acquire locks in consistent order to prevent deadlocks
    const sortedWalletIds = [fromWalletId, toWalletId].sort()
    const lockId1 = await acquireLock(sortedWalletIds[0])
    const lockId2 = await acquireLock(sortedWalletIds[1])

    const session = await mongoose.startSession()

    try {
      session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      })

      await connectDB()

      // Read both wallets within transaction
      const fromWallet = await Wallet.findById(fromWalletId).session(session)
      const toWallet = await Wallet.findById(toWalletId).session(session)

      if (!fromWallet || !toWallet) {
        throw new Error("WALLET_NOT_FOUND: One or both wallets not found")
      }

      if (fromWallet.availableBalance < amount) {
        throw new Error("INSUFFICIENT_BALANCE: Source wallet has insufficient funds")
      }

      // Record balances before
      const fromBalanceBefore = fromWallet.availableBalance
      const toBalanceBefore = toWallet.availableBalance

      // Debit source wallet
      fromWallet.availableBalance -= amount
      fromWallet.lastTransactionAt = new Date()
      await fromWallet.save({ session })

      // Credit destination wallet
      toWallet.availableBalance += amount
      toWallet.lastTransactionAt = new Date()
      await toWallet.save({ session })

      // Create transaction records
      const [debitTx, creditTx] = await Transaction.create(
        [
          {
            walletId: fromWallet._id,
            userId: fromWallet.userId,
            tenantId: fromWallet.tenantId,
            type: `${type}_debit`,
            amount,
            currency: fromWallet.currency,
            balanceBefore: fromBalanceBefore,
            balanceAfter: fromWallet.availableBalance,
            status: "completed",
            description: `${description} (debit)`,
            metadata: { ...metadata, counterpartyWallet: toWalletId },
          },
          {
            walletId: toWallet._id,
            userId: toWallet.userId,
            tenantId: toWallet.tenantId,
            type: `${type}_credit`,
            amount,
            currency: toWallet.currency,
            balanceBefore: toBalanceBefore,
            balanceAfter: toWallet.availableBalance,
            status: "completed",
            description: `${description} (credit)`,
            metadata: { ...metadata, counterpartyWallet: fromWalletId },
          },
        ],
        { session },
      )

      // Create double-entry ledger record
      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId: fromWallet.tenantId,
            debitAccount: {
              walletId: fromWallet._id,
              accountType: fromWallet.metadata?.ownerType || "unknown",
              accountName: `Wallet ${fromWallet._id}`,
              userId: fromWallet.userId,
            },
            creditAccount: {
              walletId: toWallet._id,
              accountType: toWallet.metadata?.ownerType || "unknown",
              accountName: `Wallet ${toWallet._id}`,
              userId: toWallet.userId,
            },
            amount,
            currency: fromWallet.currency,
            debitBalanceBefore: fromBalanceBefore,
            debitBalanceAfter: fromWallet.availableBalance,
            creditBalanceBefore: toBalanceBefore,
            creditBalanceAfter: toWallet.availableBalance,
            transactionType: type.toUpperCase(),
            referenceType,
            referenceId,
            description,
            status: "completed",
            createdBy,
            metadata: {
              ...metadata,
              atomicTransfer: true,
              debitTransactionId: debitTx._id,
              creditTransactionId: creditTx._id,
            },
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return {
        success: true,
        fromWallet: {
          id: fromWallet._id,
          balanceBefore: fromBalanceBefore,
          balanceAfter: fromWallet.availableBalance,
        },
        toWallet: {
          id: toWallet._id,
          balanceBefore: toBalanceBefore,
          balanceAfter: toWallet.availableBalance,
        },
        transactions: [debitTx, creditTx],
        ledgerEntry: ledgerEntry[0],
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
      releaseLock(sortedWalletIds[0], lockId1)
      releaseLock(sortedWalletIds[1], lockId2)
    }
  }
}

export default WalletService
