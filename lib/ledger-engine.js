import LedgerEntry from "@/lib/models/LedgerEntry"
import Wallet from "@/lib/models/Wallet"
import AccountBalance from "@/lib/models/AccountBalance"
import mongoose from "mongoose"

/**
 * Double-Entry Ledger Engine
 * Every transaction creates balanced debit and credit entries
 */
export class LedgerEngine {
  /**
   * Create a double-entry ledger record
   * @param {Object} params - Ledger entry parameters
   * @returns {Promise<Object>} Created ledger entry
   */
  static async createEntry({
    tenantId,
    debitAccount,
    creditAccount,
    amount,
    currency = "USD",
    transactionType,
    referenceType,
    referenceId,
    externalReference,
    description,
    createdBy,
    metadata = {},
    requiresApproval = false,
  }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // Get debit wallet balance before
      let debitBalanceBefore = 0
      let debitBalanceAfter = 0
      let creditBalanceBefore = 0
      let creditBalanceAfter = 0

      if (debitAccount.walletId) {
        const debitWallet = await Wallet.findById(debitAccount.walletId).session(session)
        if (debitWallet) {
          debitBalanceBefore = debitWallet.availableBalance
          // Deduct from debit account
          debitWallet.availableBalance -= amount
          debitBalanceAfter = debitWallet.availableBalance
          await debitWallet.save({ session })
        }
      }

      if (creditAccount.walletId) {
        const creditWallet = await Wallet.findById(creditAccount.walletId).session(session)
        if (creditWallet) {
          creditBalanceBefore = creditWallet.availableBalance
          // Add to credit account
          creditWallet.availableBalance += amount
          creditBalanceAfter = creditWallet.availableBalance
          await creditWallet.save({ session })
        }
      }

      // Create ledger entry
      const entry = new LedgerEntry({
        tenantId,
        debitAccount,
        creditAccount,
        amount,
        currency,
        debitBalanceBefore,
        debitBalanceAfter,
        creditBalanceBefore,
        creditBalanceAfter,
        transactionType,
        referenceType,
        referenceId,
        externalReference,
        description,
        createdBy,
        metadata,
        requiresApproval,
        status: requiresApproval ? "pending" : "completed",
      })

      await entry.save({ session })

      // Update account balances
      await this.updateAccountBalance(debitAccount, -amount, session)
      await this.updateAccountBalance(creditAccount, amount, session)

      await session.commitTransaction()
      return entry
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  /**
   * Update account balance tracking
   */
  static async updateAccountBalance(account, amount, session) {
    if (!account.walletId) return

    const update = {
      $inc: {
        transactionCount: 1,
        ...(amount > 0
          ? { totalCredits: amount, "periodStats.dailyCredits": amount }
          : { totalDebits: Math.abs(amount), "periodStats.dailyDebits": Math.abs(amount) }),
      },
      $set: {
        lastTransactionAt: new Date(),
      },
    }

    await AccountBalance.findOneAndUpdate(
      { walletId: account.walletId },
      {
        ...update,
        $setOnInsert: {
          accountType: account.accountType,
          accountName: account.accountName,
          userId: account.userId,
          tenantId: account.tenantId,
          currency: "USD",
        },
      },
      { upsert: true, session },
    )
  }

  /**
   * Record a deposit
   */
  static async recordDeposit({
    walletId,
    userId,
    tenantId,
    amount,
    currency,
    paymentMethod,
    externalReference,
    createdBy,
    metadata,
  }) {
    // System account (source) -> Player wallet (destination)
    return this.createEntry({
      tenantId,
      debitAccount: {
        accountType: "system",
        accountName: `${paymentMethod}_deposits`,
      },
      creditAccount: {
        walletId,
        accountType: "player",
        accountName: "Player Wallet",
        userId,
      },
      amount,
      currency,
      transactionType: "DEPOSIT",
      referenceType: "transaction",
      externalReference,
      description: `Deposit via ${paymentMethod}`,
      createdBy,
      metadata: { ...metadata, paymentMethod },
    })
  }

  /**
   * Record a withdrawal
   */
  static async recordWithdrawal({
    walletId,
    userId,
    tenantId,
    amount,
    currency,
    paymentMethod,
    externalReference,
    createdBy,
    metadata,
  }) {
    // Player wallet (source) -> System account (destination)
    return this.createEntry({
      tenantId,
      debitAccount: {
        walletId,
        accountType: "player",
        accountName: "Player Wallet",
        userId,
      },
      creditAccount: {
        accountType: "system",
        accountName: `${paymentMethod}_withdrawals`,
      },
      amount,
      currency,
      transactionType: "WITHDRAWAL",
      referenceType: "transaction",
      externalReference,
      description: `Withdrawal via ${paymentMethod}`,
      createdBy,
      metadata: { ...metadata, paymentMethod },
      requiresApproval: amount > 1000, // Large withdrawals need approval
    })
  }

  /**
   * Record a bet placement
   */
  static async recordBetPlacement({ walletId, userId, tenantId, betId, amount, currency, createdBy }) {
    return this.createEntry({
      tenantId,
      debitAccount: {
        walletId,
        accountType: "player",
        accountName: "Player Wallet",
        userId,
      },
      creditAccount: {
        accountType: "revenue",
        accountName: "Bet Stakes",
        tenantId,
      },
      amount,
      currency,
      transactionType: "BET_PLACEMENT",
      referenceType: "bet",
      referenceId: betId,
      description: `Bet placement - ${betId}`,
      createdBy,
    })
  }

  /**
   * Record a bet winning
   */
  static async recordBetWinning({ walletId, userId, tenantId, betId, stakeAmount, winAmount, currency, createdBy }) {
    return this.createEntry({
      tenantId,
      debitAccount: {
        accountType: "revenue",
        accountName: "Bet Payouts",
        tenantId,
      },
      creditAccount: {
        walletId,
        accountType: "player",
        accountName: "Player Wallet",
        userId,
      },
      amount: winAmount,
      currency,
      transactionType: "BET_WINNING",
      referenceType: "bet",
      referenceId: betId,
      description: `Bet winning - ${betId} (Stake: ${stakeAmount}, Win: ${winAmount})`,
      createdBy,
      metadata: { stakeAmount, winAmount, profit: winAmount - stakeAmount },
    })
  }

  /**
   * Record bonus credit
   */
  static async recordBonusCredit({ walletId, userId, tenantId, bonusId, amount, bonusType, currency, createdBy }) {
    return this.createEntry({
      tenantId,
      debitAccount: {
        accountType: "bonus",
        accountName: "Bonus Pool",
        tenantId,
      },
      creditAccount: {
        walletId,
        accountType: "player",
        accountName: "Player Bonus Balance",
        userId,
      },
      amount,
      currency,
      transactionType: "BONUS_CREDIT",
      referenceType: "bonus",
      referenceId: bonusId,
      description: `${bonusType} bonus credited`,
      createdBy,
      metadata: { bonusType, bonusId },
    })
  }

  /**
   * Record agent commission
   */
  static async recordAgentCommission({
    agentWalletId,
    agentId,
    tenantId,
    amount,
    sourceType,
    sourceId,
    currency,
    createdBy,
  }) {
    return this.createEntry({
      tenantId,
      debitAccount: {
        accountType: "commission",
        accountName: "Commission Pool",
        tenantId,
      },
      creditAccount: {
        walletId: agentWalletId,
        accountType: "agent",
        accountName: "Agent Commission",
        userId: agentId,
      },
      amount,
      currency,
      transactionType: "AGENT_COMMISSION",
      referenceType: "transaction",
      referenceId: sourceId,
      description: `Commission from ${sourceType}`,
      createdBy,
      metadata: { sourceType, sourceId },
    })
  }

  /**
   * Record agent settlement
   */
  static async recordAgentSettlement({ agentWalletId, agentId, tenantId, settlementId, amount, currency, createdBy }) {
    return this.createEntry({
      tenantId,
      debitAccount: {
        walletId: agentWalletId,
        accountType: "agent",
        accountName: "Agent Wallet",
        userId: agentId,
      },
      creditAccount: {
        accountType: "system",
        accountName: "Agent Settlements",
      },
      amount,
      currency,
      transactionType: "AGENT_SETTLEMENT",
      referenceType: "settlement",
      referenceId: settlementId,
      description: `Agent settlement payout`,
      createdBy,
    })
  }

  /**
   * Record operator revenue share
   */
  static async recordOperatorRevenueShare({
    operatorWalletId,
    operatorId,
    tenantId,
    amount,
    period,
    currency,
    createdBy,
  }) {
    return this.createEntry({
      tenantId,
      debitAccount: {
        accountType: "revenue",
        accountName: "Platform Revenue",
      },
      creditAccount: {
        walletId: operatorWalletId,
        accountType: "operator",
        accountName: "Operator Revenue",
        userId: operatorId,
      },
      amount,
      currency,
      transactionType: "OPERATOR_REVENUE_SHARE",
      description: `Revenue share for period ${period}`,
      createdBy,
      metadata: { period },
    })
  }

  /**
   * Reverse a ledger entry
   */
  static async reverseEntry({ entryId, reversedBy, reason }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const originalEntry = await LedgerEntry.findById(entryId).session(session)
      if (!originalEntry) throw new Error("Entry not found")
      if (originalEntry.status === "reversed") throw new Error("Entry already reversed")

      // Create reversal entry (swap debit and credit)
      const reversalEntry = new LedgerEntry({
        tenantId: originalEntry.tenantId,
        debitAccount: originalEntry.creditAccount,
        creditAccount: originalEntry.debitAccount,
        amount: originalEntry.amount,
        currency: originalEntry.currency,
        transactionType: `${originalEntry.transactionType}_REVERSAL` || "SYSTEM_ADJUSTMENT",
        referenceType: "transaction",
        referenceId: originalEntry._id,
        description: `Reversal: ${reason}`,
        createdBy: reversedBy,
        status: "completed",
        metadata: { originalEntryId: originalEntry._id, reversalReason: reason },
      })

      await reversalEntry.save({ session })

      // Update original entry
      originalEntry.status = "reversed"
      originalEntry.reversedBy = reversedBy
      originalEntry.reversedAt = new Date()
      originalEntry.reversalReason = reason
      originalEntry.reversalEntryId = reversalEntry._id
      await originalEntry.save({ session })

      // Reverse wallet balances
      if (originalEntry.debitAccount.walletId) {
        await Wallet.findByIdAndUpdate(
          originalEntry.debitAccount.walletId,
          { $inc: { availableBalance: originalEntry.amount } },
          { session },
        )
      }
      if (originalEntry.creditAccount.walletId) {
        await Wallet.findByIdAndUpdate(
          originalEntry.creditAccount.walletId,
          { $inc: { availableBalance: -originalEntry.amount } },
          { session },
        )
      }

      await session.commitTransaction()
      return reversalEntry
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  /**
   * Get account statement
   */
  static async getAccountStatement({ walletId, startDate, endDate, transactionTypes }) {
    const walletObjectId = new mongoose.Types.ObjectId(walletId)

    const query = {
      $or: [{ "debitAccount.walletId": walletObjectId }, { "creditAccount.walletId": walletObjectId }],
      status: { $in: ["completed", "reversed"] },
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    if (transactionTypes?.length) {
      query.transactionType = { $in: transactionTypes }
    }

    const entries = await LedgerEntry.find(query).sort({ createdAt: -1 }).limit(500)

    const wallet = await Wallet.findById(walletObjectId)

    // Calculate running balance
    const runningBalance = wallet?.availableBalance || 0

    const statement = entries.map((entry) => {
      const isDebit = entry.debitAccount.walletId?.toString() === walletId.toString()
      const amount = entry.amount

      return {
        _id: entry._id,
        entryNumber: entry.entryNumber,
        transactionType: entry.transactionType,
        description: entry.description,
        amount,
        isDebit,
        signedAmount: isDebit ? -amount : amount,
        runningBalance: isDebit ? entry.debitBalanceAfter : entry.creditBalanceAfter,
        status: entry.status,
        createdAt: entry.createdAt,
        referenceId: entry.referenceId,
        externalReference: entry.externalReference,
      }
    })

    return statement
  }

  /**
   * Get win-loss history for a player
   */
  static async getPlayerWinLossHistory({ userId, startDate, endDate }) {
    const query = {
      $or: [{ "debitAccount.userId": userId }, { "creditAccount.userId": userId }],
      transactionType: { $in: ["BET_PLACEMENT", "BET_WINNING", "BET_LOSS", "BET_REFUND"] },
      status: "completed",
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    const entries = await LedgerEntry.find(query).sort({ createdAt: -1 })

    const summary = {
      totalBets: 0,
      totalStaked: 0,
      totalWon: 0,
      totalLost: 0,
      netResult: 0,
      winRate: 0,
      entries: [],
    }

    entries.forEach((entry) => {
      summary.entries.push(entry)

      if (entry.transactionType === "BET_PLACEMENT") {
        summary.totalBets++
        summary.totalStaked += entry.amount
      } else if (entry.transactionType === "BET_WINNING") {
        summary.totalWon += entry.amount
      } else if (entry.transactionType === "BET_LOSS") {
        summary.totalLost += entry.amount
      }
    })

    summary.netResult = summary.totalWon - summary.totalStaked
    summary.winRate =
      summary.totalBets > 0
        ? ((summary.totalWon > 0 ? entries.filter((e) => e.transactionType === "BET_WINNING").length : 0) /
            summary.totalBets) *
          100
        : 0

    return summary
  }

  /**
   * Generate financial report
   */
  static async generateFinancialReport({ tenantId, startDate, endDate }) {
    const query = {
      status: "completed",
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }

    if (tenantId) {
      query.tenantId = tenantId
    }

    const entries = await LedgerEntry.find(query)

    const report = {
      period: { startDate, endDate },
      deposits: { count: 0, total: 0 },
      withdrawals: { count: 0, total: 0 },
      bets: { count: 0, stakes: 0, payouts: 0 },
      bonuses: { count: 0, total: 0 },
      commissions: { count: 0, total: 0 },
      revenue: { gross: 0, net: 0 },
      byType: {},
    }

    entries.forEach((entry) => {
      // Aggregate by type
      if (!report.byType[entry.transactionType]) {
        report.byType[entry.transactionType] = { count: 0, total: 0 }
      }
      report.byType[entry.transactionType].count++
      report.byType[entry.transactionType].total += entry.amount

      // Specific aggregations
      switch (entry.transactionType) {
        case "DEPOSIT":
          report.deposits.count++
          report.deposits.total += entry.amount
          break
        case "WITHDRAWAL":
          report.withdrawals.count++
          report.withdrawals.total += entry.amount
          break
        case "BET_PLACEMENT":
          report.bets.count++
          report.bets.stakes += entry.amount
          break
        case "BET_WINNING":
          report.bets.payouts += entry.amount
          break
        case "BONUS_CREDIT":
          report.bonuses.count++
          report.bonuses.total += entry.amount
          break
        case "AGENT_COMMISSION":
        case "OPERATOR_REVENUE_SHARE":
          report.commissions.count++
          report.commissions.total += entry.amount
          break
      }
    })

    // Calculate revenue
    report.revenue.gross = report.bets.stakes
    report.revenue.net = report.bets.stakes - report.bets.payouts - report.bonuses.total - report.commissions.total

    return report
  }
}

export default LedgerEngine
