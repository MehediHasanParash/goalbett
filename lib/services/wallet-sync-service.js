// Wallet Sync Service - 1:1 wallet sync between Web and Telegram
// Ensures real-time balance consistency across platforms

import Wallet from "@/lib/models/Wallet"
import Transaction from "@/lib/models/Transaction"

export class WalletSyncService {
  // Get user's wallet with real-time balance
  static async getWallet(userId, tenantId) {
    const wallet = await Wallet.findOne({
      userId,
      tenantId,
    }).lean()

    if (!wallet) {
      return null
    }

    return {
      id: wallet._id,
      userId: wallet.userId,
      balance: wallet.availableBalance || 0,
      lockedBalance: wallet.lockedBalance || 0,
      totalBalance: (wallet.availableBalance || 0) + (wallet.lockedBalance || 0),
      currency: wallet.currency || "ETB",
      lastUpdated: wallet.updatedAt,
    }
  }

  // Sync wallet balance (atomic operation)
  static async syncBalance(userId, tenantId, options = {}) {
    const { forceRefresh = false, source = "web" } = options

    // Get wallet with lock for atomic update
    const wallet = await Wallet.findOneAndUpdate(
      { userId, tenantId },
      { $set: { lastSyncedAt: new Date(), lastSyncSource: source } },
      { new: true },
    )

    if (!wallet) {
      return { success: false, error: "Wallet not found" }
    }

    // Calculate actual balance from transactions if force refresh
    if (forceRefresh) {
      const balanceFromTx = await this.calculateBalanceFromTransactions(userId, tenantId)

      if (Math.abs(wallet.availableBalance - balanceFromTx) > 0.01) {
        console.warn(
          `[WalletSync] Balance mismatch for user ${userId}: wallet=${wallet.availableBalance}, calculated=${balanceFromTx}`,
        )

        // Log discrepancy but don't auto-correct (requires manual review)
        await this.logBalanceDiscrepancy(userId, tenantId, wallet.availableBalance, balanceFromTx)
      }
    }

    return {
      success: true,
      wallet: {
        balance: wallet.availableBalance,
        lockedBalance: wallet.lockedBalance,
        currency: wallet.currency,
        lastSynced: wallet.lastSyncedAt,
        source,
      },
    }
  }

  // Calculate balance from transaction history
  static async calculateBalanceFromTransactions(userId, tenantId) {
    const result = await Transaction.aggregate([
      {
        $match: {
          userId,
          tenant_id: tenantId,
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalCredits: {
            $sum: {
              $cond: [{ $in: ["$type", ["deposit", "win", "bonus", "refund", "transfer_in"]] }, "$amount", 0],
            },
          },
          totalDebits: {
            $sum: {
              $cond: [{ $in: ["$type", ["withdraw", "bet", "fee", "transfer_out"]] }, "$amount", 0],
            },
          },
        },
      },
    ])

    if (result.length === 0) {
      return 0
    }

    return result[0].totalCredits - result[0].totalDebits
  }

  // Log balance discrepancy for audit
  static async logBalanceDiscrepancy(userId, tenantId, walletBalance, calculatedBalance) {
    const AuditLog = (await import("@/lib/models/AuditLog")).default

    await AuditLog.create({
      userId,
      action: "wallet_balance_discrepancy",
      resourceType: "Wallet",
      details: {
        walletBalance,
        calculatedBalance,
        difference: walletBalance - calculatedBalance,
        tenantId,
        timestamp: new Date(),
      },
      severity: "warning",
    })
  }

  // Subscribe to real-time balance updates (for WebSocket/SSE)
  static async subscribeToBalanceUpdates(userId, tenantId, callback) {
    // This would integrate with a real-time system like Redis pub/sub
    // For now, return a polling-based approach
    const pollInterval = setInterval(async () => {
      const wallet = await this.getWallet(userId, tenantId)
      if (wallet) {
        callback(wallet)
      }
    }, 5000) // Poll every 5 seconds

    return {
      unsubscribe: () => clearInterval(pollInterval),
    }
  }

  // Update balance (atomic with transaction record)
  static async updateBalance(userId, tenantId, amount, type, metadata = {}) {
    const session = await Wallet.startSession()
    session.startTransaction()

    try {
      const wallet = await Wallet.findOne({ userId, tenantId }).session(session)

      if (!wallet) {
        throw new Error("Wallet not found")
      }

      const isCredit = ["deposit", "win", "bonus", "refund", "transfer_in"].includes(type)
      const isDebit = ["withdraw", "bet", "fee", "transfer_out"].includes(type)

      if (isDebit && wallet.availableBalance < amount) {
        throw new Error("Insufficient balance")
      }

      // Update balance
      if (isCredit) {
        wallet.availableBalance += amount
      } else if (isDebit) {
        wallet.availableBalance -= amount
      }

      wallet.lastSyncedAt = new Date()
      wallet.lastSyncSource = metadata.source || "api"
      await wallet.save({ session })

      // Create transaction record
      const transaction = await Transaction.create(
        [
          {
            userId,
            tenant_id: tenantId,
            type,
            amount,
            balanceAfter: wallet.availableBalance,
            status: "completed",
            metadata: {
              ...metadata,
              syncedAt: new Date(),
            },
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return {
        success: true,
        newBalance: wallet.availableBalance,
        transactionId: transaction[0]._id,
      }
    } catch (error) {
      await session.abortTransaction()
      console.error("[WalletSync] Update failed:", error)
      return { success: false, error: error.message }
    } finally {
      session.endSession()
    }
  }

  // Telegram-specific: Get wallet for TMA user
  static async getTMAWallet(telegramUserId, tenantId) {
    const User = (await import("@/lib/models/User")).default

    // Find user by telegram ID
    const user = await User.findOne({ telegramId: telegramUserId, tenant_id: tenantId })

    if (!user) {
      return null
    }

    return this.getWallet(user._id, tenantId)
  }

  // Telegram-specific: Sync TMA wallet with web wallet
  static async syncTMAWallet(telegramUserId, tenantId) {
    const User = (await import("@/lib/models/User")).default

    const user = await User.findOne({ telegramId: telegramUserId, tenant_id: tenantId })

    if (!user) {
      return { success: false, error: "TMA user not found" }
    }

    return this.syncBalance(user._id, tenantId, { source: "telegram" })
  }
}

export default WalletSyncService
