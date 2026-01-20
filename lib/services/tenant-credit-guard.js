// Tenant Credit Guard Service
// Hard-coded logic to block all games when Tenant_Balance <= 0

import Wallet from "@/lib/models/Wallet"

export class TenantCreditGuard {
  // Check if tenant has sufficient credit to allow games
  static async canPlayGames(tenantId) {
    if (!tenantId) {
      console.error("[TenantCreditGuard] No tenant ID provided")
      return { allowed: false, reason: "No tenant ID", balance: 0 }
    }

    try {
      // Get tenant wallet
      const wallet = await Wallet.findOne({
        owner: tenantId,
        ownerType: "Tenant",
      }).lean()

      if (!wallet) {
        console.error("[TenantCreditGuard] Tenant wallet not found:", tenantId)
        return { allowed: false, reason: "Tenant wallet not found", balance: 0 }
      }

      const balance = wallet.availableBalance || 0

      // HARD-CODED RULE: If balance <= 0, block ALL games
      if (balance <= 0) {
        console.warn(`[TenantCreditGuard] CREDIT STOP: Tenant ${tenantId} balance is ${balance}`)
        return {
          allowed: false,
          reason: "Tenant credit exhausted. Please contact support.",
          balance,
          creditStop: true,
        }
      }

      // Optional: Warning threshold at 10% of initial credit or $1000
      const warningThreshold = 1000
      const isLowBalance = balance < warningThreshold

      return {
        allowed: true,
        balance,
        isLowBalance,
        warningThreshold,
      }
    } catch (error) {
      console.error("[TenantCreditGuard] Error checking tenant credit:", error)
      // Fail closed - block games if we can't verify credit
      return { allowed: false, reason: "Unable to verify tenant credit", balance: 0 }
    }
  }

  // Middleware-style check for API routes
  static async guardRoute(tenantId) {
    const result = await this.canPlayGames(tenantId)

    if (!result.allowed) {
      return {
        blocked: true,
        status: 402, // Payment Required
        response: {
          success: false,
          error: result.reason,
          code: "TENANT_CREDIT_STOP",
          creditStop: result.creditStop || false,
        },
      }
    }

    return { blocked: false, balance: result.balance, isLowBalance: result.isLowBalance }
  }

  // Get all tenants with credit stop
  static async getTenantsWithCreditStop() {
    const wallets = await Wallet.find({
      ownerType: "Tenant",
      availableBalance: { $lte: 0 },
    })
      .populate("owner", "name code status")
      .lean()

    return wallets.map((w) => ({
      tenantId: w.owner?._id,
      tenantName: w.owner?.name,
      tenantCode: w.owner?.code,
      balance: w.availableBalance,
      status: w.owner?.status,
    }))
  }

  // Deduct from tenant credit (called after player wins)
  static async deductCredit(tenantId, amount, description = "Player payout") {
    const wallet = await Wallet.findOne({
      owner: tenantId,
      ownerType: "Tenant",
    })

    if (!wallet) {
      throw new Error("Tenant wallet not found")
    }

    wallet.availableBalance -= amount
    wallet.totalBalance -= amount
    await wallet.save()

    console.log(
      `[TenantCreditGuard] Deducted ${amount} from tenant ${tenantId}. New balance: ${wallet.availableBalance}`,
    )

    return wallet.availableBalance
  }

  // Add to tenant credit (called when player loses or tenant tops up)
  static async addCredit(tenantId, amount, description = "Player loss") {
    const wallet = await Wallet.findOne({
      owner: tenantId,
      ownerType: "Tenant",
    })

    if (!wallet) {
      throw new Error("Tenant wallet not found")
    }

    wallet.availableBalance += amount
    wallet.totalBalance += amount
    await wallet.save()

    console.log(`[TenantCreditGuard] Added ${amount} to tenant ${tenantId}. New balance: ${wallet.availableBalance}`)

    return wallet.availableBalance
  }
}

export default TenantCreditGuard
