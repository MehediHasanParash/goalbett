import { WalletService } from "./wallet-service"
import LedgerEntry from "../models/LedgerEntry"
import User from "../models/User"
import connectDB from "../db"
import mongoose from "mongoose"

export class AgentTopupService {
  // Admin tops up agent float
  static async topupAgentFloat(request) {
    const { adminId, agentId, amount, currency, fundingType, tenantId, metadata = {} } = request

    await connectDB()

    // Start session for transaction
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // 1. Verify admin permissions
      const admin = await User.findById(adminId)
      if (!admin || !["admin", "tenant_admin", "superadmin", "super_admin"].includes(admin.role)) {
        throw new Error("Unauthorized: Admin access required")
      }

      // 2. Verify agent exists
      const agent = await User.findById(agentId)
      if (!agent || !["agent", "sub_agent"].includes(agent.role)) {
        throw new Error("Invalid agent")
      }

      // 3. Get wallets - Use tenant wallet instead of system wallet
      const tenantWallet = await WalletService.getTenantWallet(tenantId)
      const agentWallet = await WalletService.getAgentWallet(agentId, tenantId)

      // 4. Validate amount
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0")
      }

      if (tenantWallet.availableBalance < amount) {
        throw new Error(`Insufficient tenant balance. Available: ${tenantWallet.availableBalance}, Required: ${amount}`)
      }

      // 5. For cash deposits, require evidence
      if (fundingType === "CASH") {
        if (!metadata.cashReceiptPhotoUrl) {
          throw new Error("Cash deposits require receipt photo")
        }
        if (!metadata.witnessPhoneNumbers || metadata.witnessPhoneNumbers.length === 0) {
          throw new Error("Cash deposits require witness phone numbers")
        }
      }

      // 6. Determine status - use lowercase as per enum definition
      const entryStatus = amount > 100000 ? "pending" : "completed"

      // 7. Create ledger entry with correct schema fields
      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId,
            debitAccount: {
              walletId: tenantWallet._id,
              accountType: "tenant",
              accountName: "Tenant Float",
              userId: adminId,
            },
            creditAccount: {
              walletId: agentWallet._id,
              accountType: "agent",
              accountName: agent.fullName || agent.username || "Agent",
              userId: mongoose.Types.ObjectId.createFromHexString(agentId),
            },
            amount,
            currency: currency || "USD",
            transactionType: "AGENT_FLOAT_TOPUP",
            // Required description field
            description: `Admin ${admin.fullName || admin.email} topped up agent ${agent.fullName || agent.username} with ${currency || "USD"} ${amount} via ${fundingType}`,
            // Use lowercase status enum values
            status: entryStatus,
            requiresApproval: amount > 100000,
            createdBy: mongoose.Types.ObjectId.createFromHexString(adminId),
            debitBalanceBefore: tenantWallet.availableBalance,
            debitBalanceAfter: tenantWallet.availableBalance - amount,
            creditBalanceBefore: agentWallet.availableBalance,
            creditBalanceAfter: agentWallet.availableBalance + amount,
            metadata: {
              fundingType,
              adminId,
              agentId,
              ...metadata,
            },
          },
        ],
        { session },
      )

      // 8. Update wallet balances if approved
      if (entryStatus === "completed") {
        await WalletService._updateBalance(tenantWallet._id, amount, true) // Debit tenant
        await WalletService._updateBalance(agentWallet._id, amount, false) // Credit agent
      }

      await session.commitTransaction()

      return {
        success: true,
        transactionId: ledgerEntry[0]._id,
        newAgentBalance: agentWallet.availableBalance + (entryStatus === "completed" ? amount : 0),
        newTenantBalance: tenantWallet.availableBalance - (entryStatus === "completed" ? amount : 0),
        requiresApproval: entryStatus === "pending",
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  // Agent tops up player
  static async topupPlayer(request) {
    const { agentId, playerIdentifier, amount, currency, tenantId, metadata = {} } = request

    await connectDB()

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // 1. Get agent
      const agent = await User.findById(agentId)
      if (!agent || !["agent", "sub_agent"].includes(agent.role)) {
        throw new Error("Invalid agent")
      }

      console.log("[v0] Searching for player:", { playerIdentifier, tenantId, agentTenantId: agent.tenant_id })

      // 2. Find player by phone, email, or username within the same tenant
      const player = await User.findOne({
        tenant_id: tenantId,
        role: "player",
        $or: [{ phone: playerIdentifier }, { email: playerIdentifier }, { username: playerIdentifier }],
      })

      console.log("[v0] Player search result:", player ? `found - ${player.fullName}` : "not found")
      if (player) {
        console.log(
          "[v0] Player tenant_id:",
          player.tenant_id,
          "matches tenantId:",
          tenantId,
          "equal:",
          String(player.tenant_id) === String(tenantId),
        )
      }

      if (!player) {
        throw new Error(`Player not found with identifier: ${playerIdentifier}`)
      }

      // 3. Get wallets
      const agentWallet = await WalletService.getAgentWallet(agentId, tenantId)
      const playerWallet = await WalletService.getPlayerWallet(player._id, tenantId)

      // 4. Validate agent has sufficient balance
      if (agentWallet.availableBalance < amount) {
        throw new Error("Insufficient agent balance")
      }

      // 5. Create ledger entry
      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId,
            debitAccount: {
              walletId: agentWallet._id,
              accountType: "agent",
              accountName: agent.fullName || agent.username,
              userId: agentId,
            },
            creditAccount: {
              walletId: playerWallet._id,
              accountType: "player",
              accountName: player.fullName || player.username,
              userId: player._id,
            },
            amount,
            currency,
            transactionType: "AGENT_PLAYER_TOPUP",
            description: `Agent ${agent.fullName || agent.username} topped up player ${player.fullName || player.username} with ${currency} ${amount}`,
            status: "completed",
            createdBy: agentId,
            metadata: {
              agentId,
              playerId: player._id,
              playerPhone: player.phone,
              ...metadata,
            },
          },
        ],
        { session },
      )

      // 6. Update wallet balances
      await WalletService._updateBalance(agentWallet._id, amount, true)
      await WalletService._updateBalance(playerWallet._id, amount, false)

      await session.commitTransaction()

      return {
        success: true,
        transactionId: ledgerEntry[0]._id,
        playerName: player.fullName,
        newPlayerBalance: playerWallet.availableBalance + amount,
        newAgentBalance: agentWallet.availableBalance - amount,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  // Player withdraws cash from agent
  static async withdrawFromAgent(request) {
    const { playerId, agentId, amount, currency, tenantId, metadata = {} } = request

    await connectDB()

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // 1. Get player and agent
      const player = await User.findById(playerId)
      const agent = await User.findById(agentId)

      if (!player || player.role !== "player") throw new Error("Invalid player")
      if (!agent || !["agent", "sub_agent"].includes(agent.role)) throw new Error("Invalid agent")

      // 2. Get wallets
      const playerWallet = await WalletService.getPlayerWallet(playerId, tenantId)
      const agentWallet = await WalletService.getAgentWallet(agentId, tenantId)

      // 3. Validate player has sufficient balance
      if (playerWallet.availableBalance < amount) {
        throw new Error("Insufficient player balance")
      }

      // 4. Create ledger entry
      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId,
            debitAccount: {
              walletId: playerWallet._id,
              accountType: "player",
              accountName: player.fullName || player.username,
              userId: playerId,
            },
            creditAccount: {
              walletId: agentWallet._id,
              accountType: "agent",
              accountName: agent.fullName || agent.username,
              userId: agentId,
            },
            amount,
            currency,
            transactionType: "PLAYER_WITHDRAWAL",
            description: `Player ${player.fullName || player.username} withdrew ${currency} ${amount} from agent ${agent.fullName || agent.username}`,
            status: "completed",
            createdBy: playerId,
            metadata: {
              playerId,
              agentId,
              ...metadata,
            },
          },
        ],
        { session },
      )

      // 5. Update wallet balances
      await WalletService._updateBalance(playerWallet._id, amount, true)
      await WalletService._updateBalance(agentWallet._id, amount, false)

      await session.commitTransaction()

      return {
        success: true,
        transactionId: ledgerEntry[0]._id,
        newPlayerBalance: playerWallet.availableBalance - amount,
        newAgentBalance: agentWallet.availableBalance + amount,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  static async getAgentFloatStatus(agentId, tenantId) {
    await connectDB()

    try {
      const agentWallet = await WalletService.getAgentWallet(agentId, tenantId)

      // Calculate float health based on balance
      let floatHealth = "healthy"
      const minThreshold = 1000 // Default minimum threshold

      if (agentWallet.availableBalance <= 0) {
        floatHealth = "empty"
      } else if (agentWallet.availableBalance < minThreshold) {
        floatHealth = "low"
      }

      return {
        availableBalance: agentWallet.availableBalance || 0,
        lockedBalance: agentWallet.lockedBalance || 0,
        totalBalance: (agentWallet.availableBalance || 0) + (agentWallet.lockedBalance || 0),
        minThreshold,
        floatHealth,
      }
    } catch (error) {
      console.error("[v0] getAgentFloatStatus error:", error)
      // Return default values if wallet doesn't exist yet
      return {
        availableBalance: 0,
        lockedBalance: 0,
        totalBalance: 0,
        minThreshold: 1000,
        floatHealth: "empty",
      }
    }
  }

  // Agent-to-subagent float transfer
  static async transferToSubAgent(request) {
    const { parentAgentId, subAgentId, amount, currency, tenantId, metadata = {} } = request

    await connectDB()

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // 1. Verify parent agent
      const parentAgent = await User.findById(parentAgentId)
      if (!parentAgent || !["agent", "master_agent"].includes(parentAgent.role)) {
        throw new Error("Invalid parent agent")
      }

      // 2. Verify sub-agent exists and belongs to parent
      const subAgent = await User.findById(subAgentId)
      if (!subAgent || subAgent.role !== "sub_agent") {
        throw new Error("Invalid sub-agent")
      }

      // Verify hierarchy - sub-agent should have this agent as parent
      if (subAgent.parentAgentId?.toString() !== parentAgentId) {
        throw new Error("Sub-agent does not belong to this agent")
      }

      // 3. Get wallets
      const parentWallet = await WalletService.getAgentWallet(parentAgentId, tenantId)
      const subAgentWallet = await WalletService.getAgentWallet(subAgentId, tenantId)

      // 4. Validate parent has sufficient balance
      if (parentWallet.availableBalance < amount) {
        throw new Error(`Insufficient balance. Available: ${parentWallet.availableBalance}, Required: ${amount}`)
      }

      // 5. Create ledger entry
      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId,
            debitAccount: {
              walletId: parentWallet._id,
              accountType: "agent",
              accountName: parentAgent.fullName || parentAgent.username,
              userId: parentAgentId,
            },
            creditAccount: {
              walletId: subAgentWallet._id,
              accountType: "agent",
              accountName: subAgent.fullName || subAgent.username,
              userId: subAgentId,
            },
            amount,
            currency: currency || "USD",
            transactionType: "SUBAGENT_TRANSFER",
            description: `Agent ${parentAgent.fullName || parentAgent.username} transferred float to sub-agent ${subAgent.fullName || subAgent.username}`,
            status: "completed",
            createdBy: mongoose.Types.ObjectId.createFromHexString(parentAgentId),
            debitBalanceBefore: parentWallet.availableBalance,
            debitBalanceAfter: parentWallet.availableBalance - amount,
            creditBalanceBefore: subAgentWallet.availableBalance,
            creditBalanceAfter: subAgentWallet.availableBalance + amount,
            metadata: {
              transferType: "agent_to_subagent",
              parentAgentId,
              subAgentId,
              ...metadata,
            },
          },
        ],
        { session },
      )

      // 6. Update wallet balances
      await WalletService._updateBalance(parentWallet._id, amount, true) // Debit parent
      await WalletService._updateBalance(subAgentWallet._id, amount, false) // Credit sub-agent

      await session.commitTransaction()

      return {
        success: true,
        transactionId: ledgerEntry[0]._id,
        newParentBalance: parentWallet.availableBalance - amount,
        newSubAgentBalance: subAgentWallet.availableBalance + amount,
        subAgentName: subAgent.fullName || subAgent.username,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  // Sub-agent to parent agent transfer (return float)
  static async returnFloatToParent(request) {
    const { subAgentId, amount, currency, tenantId, metadata = {} } = request

    await connectDB()

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // 1. Get sub-agent
      const subAgent = await User.findById(subAgentId)
      if (!subAgent || subAgent.role !== "sub_agent") {
        throw new Error("Invalid sub-agent")
      }

      // 2. Get parent agent
      const parentAgent = await User.findById(subAgent.parentAgentId)
      if (!parentAgent) {
        throw new Error("Parent agent not found")
      }

      // 3. Get wallets
      const subAgentWallet = await WalletService.getAgentWallet(subAgentId, tenantId)
      const parentWallet = await WalletService.getAgentWallet(subAgent.parentAgentId, tenantId)

      // 4. Validate sub-agent has sufficient balance
      if (subAgentWallet.availableBalance < amount) {
        throw new Error(`Insufficient balance. Available: ${subAgentWallet.availableBalance}, Required: ${amount}`)
      }

      // 5. Create ledger entry
      const ledgerEntry = await LedgerEntry.create(
        [
          {
            tenantId,
            debitAccount: {
              walletId: subAgentWallet._id,
              accountType: "agent",
              accountName: subAgent.fullName || subAgent.username,
              userId: subAgentId,
            },
            creditAccount: {
              walletId: parentWallet._id,
              accountType: "agent",
              accountName: parentAgent.fullName || parentAgent.username,
              userId: subAgent.parentAgentId,
            },
            amount,
            currency: currency || "USD",
            transactionType: "SUBAGENT_RETURN",
            description: `Sub-agent ${subAgent.fullName || subAgent.username} returned float to agent ${parentAgent.fullName || parentAgent.username}`,
            status: "completed",
            createdBy: mongoose.Types.ObjectId.createFromHexString(subAgentId),
            metadata: {
              transferType: "subagent_to_agent",
              subAgentId,
              parentAgentId: subAgent.parentAgentId,
              ...metadata,
            },
          },
        ],
        { session },
      )

      // 6. Update wallet balances
      await WalletService._updateBalance(subAgentWallet._id, amount, true) // Debit sub-agent
      await WalletService._updateBalance(parentWallet._id, amount, false) // Credit parent

      await session.commitTransaction()

      return {
        success: true,
        transactionId: ledgerEntry[0]._id,
        newSubAgentBalance: subAgentWallet.availableBalance - amount,
        newParentBalance: parentWallet.availableBalance + amount,
        parentAgentName: parentAgent.fullName || parentAgent.username,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }
}

export const agentTopupService = AgentTopupService
