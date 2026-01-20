import BonusTemplate from "@/lib/models/BonusTemplate"
import PlayerBonus from "@/lib/models/PlayerBonus"
import Wallet from "@/lib/models/Wallet"
import User from "@/lib/models/User"
import Transaction from "@/lib/models/Transaction"
import LedgerEntry from "@/lib/models/LedgerEntry"
import { connectToDatabase } from "@/lib/mongodb"

export class BonusEngine {
  constructor() {
    this.db = null
  }

  async init() {
    if (!this.db) {
      const connection = await connectToDatabase()
      this.db = connection.db
    }
    return this
  }

  // ====== BONUS CLAIMING ======

  async claimBonus(userId, bonusCode, depositAmount = 0, tenantId = null) {
    await this.init()

    // Find the bonus template
    const template = await BonusTemplate.findOne({
      code: bonusCode.toUpperCase(),
      status: "active",
      $or: [{ isGlobal: true }, { tenantId: tenantId }, { tenantId: null }],
    })

    if (!template) {
      throw new Error("Bonus code not found or not active")
    }

    // Check validity dates
    const now = new Date()
    if (template.validity.startDate > now) {
      throw new Error("This bonus is not yet available")
    }
    if (template.validity.endDate && template.validity.endDate < now) {
      throw new Error("This bonus has expired")
    }

    // Check eligibility
    await this.checkEligibility(userId, template, depositAmount, tenantId)

    // Calculate bonus amount
    const bonusAmount = this.calculateBonusAmount(template, depositAmount)

    // Create player bonus
    const playerBonus = await this.createPlayerBonus(userId, template, bonusAmount, depositAmount, tenantId)

    // Credit bonus to wallet
    if (template.type !== "combo_boost" && template.type !== "cashback") {
      await this.creditBonusToWallet(userId, tenantId, bonusAmount, playerBonus._id, template)
    }

    // Update template stats
    await BonusTemplate.findByIdAndUpdate(template._id, {
      $inc: {
        "stats.totalClaimed": 1,
        "stats.totalValueAwarded": bonusAmount,
      },
    })

    return playerBonus
  }

  async checkEligibility(userId, template, depositAmount, tenantId) {
    const { eligibility } = template

    // Check max claims per user
    const userClaims = await PlayerBonus.countDocuments({
      userId,
      bonusTemplateId: template._id,
      status: { $nin: ["cancelled", "expired"] },
    })
    if (eligibility.maxClaimsPerUser && userClaims >= eligibility.maxClaimsPerUser) {
      throw new Error("Maximum claims reached for this bonus")
    }

    // Check total claims
    if (eligibility.maxClaimsTotal && template.stats.totalClaimed >= eligibility.maxClaimsTotal) {
      throw new Error("This bonus is no longer available")
    }

    // Check minimum deposit
    if (template.value.minDeposit > 0 && depositAmount < template.value.minDeposit) {
      throw new Error(`Minimum deposit of ${template.value.minDeposit} required`)
    }

    // Check if new player only
    if (eligibility.newPlayersOnly) {
      const depositCount = await Transaction.countDocuments({
        userId,
        tenantId,
        type: "deposit",
        status: "completed",
      })
      if (depositCount > 0) {
        throw new Error("This bonus is for new players only")
      }
    }

    // Check min deposits
    if (eligibility.minDeposits > 0) {
      const depositCount = await Transaction.countDocuments({
        userId,
        tenantId,
        type: "deposit",
        status: "completed",
      })
      if (depositCount < eligibility.minDeposits) {
        throw new Error(`Requires at least ${eligibility.minDeposits} previous deposits`)
      }
    }

    // Check KYC if required
    if (eligibility.kycRequired) {
      const user = await User.findById(userId)
      if (!user || user.kyc_status !== "verified") {
        throw new Error("KYC verification required")
      }
    }

    return true
  }

  calculateBonusAmount(template, depositAmount) {
    switch (template.type) {
      case "deposit_match":
      case "reload_bonus":
        const matchAmount = (depositAmount * template.value.amount) / 100
        return template.value.maxAmount ? Math.min(matchAmount, template.value.maxAmount) : matchAmount

      case "free_bet":
        return template.freeBet.amountPerBet * template.freeBet.count

      case "free_spins":
        return template.freeSpins.valuePerSpin * template.freeSpins.count

      case "bonus_money":
      case "no_deposit":
      case "referral":
      case "loyalty":
        return template.value.amount

      case "cashback":
        return 0 // Calculated at end of period

      case "combo_boost":
        return 0 // Applied on bets

      default:
        return template.value.amount
    }
  }

  async createPlayerBonus(userId, template, bonusAmount, depositAmount, tenantId) {
    const wallet = await Wallet.findOne({ userId, tenantId })
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (template.validity.daysToExpire || 30))

    const wageringDeadline = new Date()
    wageringDeadline.setDate(wageringDeadline.getDate() + (template.validity.daysToWager || 30))

    const wageringRequirement = bonusAmount * (template.wagering.multiplier || 1)

    const contributionRates = new Map()
    if (template.wagering.contributionRates) {
      Object.entries(template.wagering.contributionRates).forEach(([key, value]) => {
        contributionRates.set(key, value)
      })
    }

    const playerBonus = new PlayerBonus({
      userId,
      tenantId: tenantId || wallet?.tenantId,
      bonusTemplateId: template._id,
      walletId: wallet?._id,
      bonusCode: template.code,
      bonusName: template.name,
      bonusType: template.type,
      category: template.category,
      depositAmount,
      bonusAmount,
      bonusRemaining: bonusAmount,
      freeBets: {
        total: template.freeBet?.count || 0,
        remaining: template.freeBet?.count || 0,
        amountPerBet: template.freeBet?.amountPerBet || 0,
        minOdds: template.freeBet?.minOdds || 1.5,
      },
      freeSpins: {
        total: template.freeSpins?.count || 0,
        remaining: template.freeSpins?.count || 0,
        valuePerSpin: template.freeSpins?.valuePerSpin || 0,
        validGames: template.freeSpins?.validGames || [],
      },
      cashback:
        template.type === "cashback"
          ? {
              periodStart: new Date(),
              periodEnd: this.getCashbackPeriodEnd(template.cashback.period),
              cashbackPercentage: template.cashback.percentage,
            }
          : undefined,
      comboBoost:
        template.type === "combo_boost"
          ? {
              isActive: true,
              boostPercentage: template.comboBoost.boostPerLeg,
              minLegs: template.comboBoost.minLegs,
            }
          : undefined,
      wagering: {
        requirement: wageringRequirement,
        completed: 0,
        remaining: wageringRequirement,
        progress: 0,
        contributionRates,
        minOdds: template.wagering.minOdds || 1.5,
      },
      expiresAt,
      wageringDeadline,
      status: template.type === "cashback" ? "pending" : "active",
      history: [
        {
          action: "claimed",
          amount: bonusAmount,
          details: { depositAmount, bonusCode: template.code },
          timestamp: new Date(),
        },
      ],
      source: "promo_code",
      promoCode: template.code,
    })

    await playerBonus.save()
    return playerBonus
  }

  getCashbackPeriodEnd(period) {
    const end = new Date()
    switch (period) {
      case "daily":
        end.setDate(end.getDate() + 1)
        break
      case "weekly":
        end.setDate(end.getDate() + 7)
        break
      case "monthly":
        end.setMonth(end.getMonth() + 1)
        break
    }
    return end
  }

  async creditBonusToWallet(userId, tenantId, amount, playerBonusId, template) {
    const wallet = await Wallet.findOne({ userId, tenantId })
    if (!wallet) {
      throw new Error("Wallet not found")
    }

    // Update bonus balance
    wallet.bonusBalance = (wallet.bonusBalance || 0) + amount
    await wallet.save()

    // Create transaction
    const transaction = new Transaction({
      userId,
      tenantId,
      walletId: wallet._id,
      type: "bonus_credit",
      amount,
      description: `${template.name} - Bonus Credit`,
      status: "completed",
      metadata: {
        playerBonusId,
        bonusCode: template.code,
        bonusType: template.type,
      },
    })
    await transaction.save()

    // Create ledger entry
    await this.createBonusLedgerEntry(userId, tenantId, wallet._id, amount, template, "credit")

    return wallet
  }

  async createBonusLedgerEntry(userId, tenantId, walletId, amount, template, type = "credit") {
    const entry = new LedgerEntry({
      entryNumber: `LE-BONUS-${Date.now().toString(36).toUpperCase()}`,
      type: type === "credit" ? "BONUS_CREDIT" : "BONUS_WAGERING",
      amount,
      currency: template.value?.currency || "ETB",
      debitAccount: {
        accountType: "system",
        accountName: "Bonus Reserve",
      },
      creditAccount: {
        accountType: "player",
        userId,
        walletId,
        accountName: "Player Bonus Wallet",
      },
      description: `${template.name} - ${type === "credit" ? "Bonus Credit" : "Wagering Progress"}`,
      status: "completed",
      metadata: {
        bonusCode: template.code,
        bonusType: template.type,
      },
      tenantId,
    })

    await entry.save()
    return entry
  }

  // ====== FREE BETS ======

  async getAvailableFreeBets(userId, tenantId) {
    return PlayerBonus.find({
      userId,
      tenantId,
      bonusType: "free_bet",
      status: "active",
      "freeBets.remaining": { $gt: 0 },
      expiresAt: { $gt: new Date() },
    })
  }

  async applyFreeBet(userId, bonusId, betId, betAmount) {
    const bonus = await PlayerBonus.findOne({
      _id: bonusId,
      userId,
      bonusType: "free_bet",
      status: "active",
      "freeBets.remaining": { $gt: 0 },
    })

    if (!bonus) {
      throw new Error("Free bet not available")
    }

    if (betAmount > bonus.freeBets.amountPerBet) {
      throw new Error(`Free bet maximum is ${bonus.freeBets.amountPerBet}`)
    }

    await bonus.consumeFreeBet(betId)
    return bonus
  }

  // ====== COMBO BOOST ======

  calculateComboBoost(legs, minLegs = 3, boostPerLeg = 5, maxBoost = 100) {
    if (legs < minLegs) {
      return 0
    }
    const boost = (legs - minLegs + 1) * boostPerLeg
    return Math.min(boost, maxBoost)
  }

  async applyComboBoost(userId, tenantId, betId, legs, potentialWin) {
    const bonus = await PlayerBonus.findOne({
      userId,
      tenantId,
      bonusType: "combo_boost",
      status: "active",
      "comboBoost.isActive": true,
      expiresAt: { $gt: new Date() },
    })

    if (!bonus || legs < bonus.comboBoost.minLegs) {
      return { boost: 0, boostedWin: potentialWin }
    }

    const boostPercentage = this.calculateComboBoost(
      legs,
      bonus.comboBoost.minLegs,
      bonus.comboBoost.boostPercentage,
      100,
    )

    const boostAmount = (potentialWin * boostPercentage) / 100
    const boostedWin = potentialWin + boostAmount

    // Track applied boost
    bonus.comboBoost.appliedBets.push(betId)
    bonus.history.push({
      action: "bet_placed",
      amount: boostAmount,
      details: { betId, legs, boostPercentage },
      timestamp: new Date(),
    })
    await bonus.save()

    return { boost: boostPercentage, boostAmount, boostedWin }
  }

  // ====== CASHBACK ======

  async calculateCashback(userId, tenantId) {
    // Find active cashback bonus
    const cashbackBonus = await PlayerBonus.findOne({
      userId,
      tenantId,
      bonusType: "cashback",
      status: "pending",
      "cashback.periodEnd": { $lte: new Date() },
      "cashback.credited": false,
    })

    if (!cashbackBonus) {
      return null
    }

    // Calculate total losses in period
    const { db } = await connectToDatabase()
    const bets = await db
      .collection("bets")
      .aggregate([
        {
          $match: {
            userId: cashbackBonus.userId,
            tenantId: cashbackBonus.tenantId,
            status: "lost",
            createdAt: {
              $gte: cashbackBonus.cashback.periodStart,
              $lte: cashbackBonus.cashback.periodEnd,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalLoss: { $sum: "$stake" },
          },
        },
      ])
      .toArray()

    const totalLoss = bets[0]?.totalLoss || 0
    const cashbackAmount = (totalLoss * cashbackBonus.cashback.cashbackPercentage) / 100

    return {
      bonus: cashbackBonus,
      totalLoss,
      cashbackAmount,
    }
  }

  async creditCashback(userId, tenantId, bonusId) {
    const result = await this.calculateCashback(userId, tenantId)
    if (!result || result.cashbackAmount <= 0) {
      return null
    }

    const { bonus, cashbackAmount } = result

    // Get cashback level limits
    const template = await BonusTemplate.findById(bonus.bonusTemplateId)
    const maxAmount = template?.cashback?.maxAmount || 1000
    const finalAmount = Math.min(cashbackAmount, maxAmount)

    // Credit to wallet
    await this.creditBonusToWallet(userId, tenantId, finalAmount, bonus._id, template)

    // Update bonus
    bonus.cashback.totalLosses = result.totalLoss
    bonus.cashback.cashbackAmount = finalAmount
    bonus.cashback.credited = true
    bonus.bonusAmount = finalAmount
    bonus.bonusRemaining = finalAmount
    bonus.status = "active"
    bonus.history.push({
      action: "credited",
      amount: finalAmount,
      details: { totalLoss: result.totalLoss, percentage: bonus.cashback.cashbackPercentage },
      timestamp: new Date(),
    })
    await bonus.save()

    return bonus
  }

  // ====== WAGERING ======

  async processWager(userId, tenantId, betAmount, gameType = "sports", odds = 1.0) {
    // Find active bonuses with wagering requirements
    const activeBonuses = await PlayerBonus.find({
      userId,
      tenantId,
      status: { $in: ["active", "wagering"] },
      "wagering.remaining": { $gt: 0 },
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: 1 }) // Process oldest first

    for (const bonus of activeBonuses) {
      // Check minimum odds
      if (odds < bonus.wagering.minOdds) {
        continue
      }

      await bonus.updateWageringProgress(betAmount, gameType)

      // Check if completed
      if (bonus.wagering.progress >= 100) {
        await this.convertBonusToReal(bonus)
      }
    }

    return activeBonuses
  }

  async convertBonusToReal(bonus) {
    const wallet = await Wallet.findById(bonus.walletId)
    if (!wallet) return

    const conversionAmount = bonus.bonusRemaining

    // Move from bonus to available balance
    wallet.bonusBalance = Math.max(0, (wallet.bonusBalance || 0) - conversionAmount)
    wallet.availableBalance = (wallet.availableBalance || 0) + conversionAmount
    await wallet.save()

    // Update bonus
    bonus.convertedToReal = conversionAmount
    bonus.bonusRemaining = 0
    bonus.status = "completed"
    bonus.history.push({
      action: "converted",
      amount: conversionAmount,
      timestamp: new Date(),
    })
    await bonus.save()

    // Update template stats
    await BonusTemplate.findByIdAndUpdate(bonus.bonusTemplateId, {
      $inc: { "stats.totalConverted": conversionAmount },
    })

    // Create transaction
    const transaction = new Transaction({
      userId: bonus.userId,
      tenantId: bonus.tenantId,
      walletId: wallet._id,
      type: "bonus_conversion",
      amount: conversionAmount,
      description: `${bonus.bonusName} - Wagering Complete`,
      status: "completed",
    })
    await transaction.save()

    return bonus
  }

  // ====== EXPIRATION ======

  async processExpiredBonuses() {
    const now = new Date()

    const expiredBonuses = await PlayerBonus.find({
      status: { $in: ["active", "wagering", "pending"] },
      expiresAt: { $lte: now },
    })

    for (const bonus of expiredBonuses) {
      // Remove remaining bonus from wallet
      if (bonus.bonusRemaining > 0) {
        const wallet = await Wallet.findById(bonus.walletId)
        if (wallet) {
          wallet.bonusBalance = Math.max(0, (wallet.bonusBalance || 0) - bonus.bonusRemaining)
          await wallet.save()
        }
      }

      bonus.status = "expired"
      bonus.history.push({
        action: "expired",
        amount: bonus.bonusRemaining,
        timestamp: now,
      })
      await bonus.save()
    }

    return expiredBonuses.length
  }

  // ====== ADMIN FUNCTIONS ======

  async getPlayerBonuses(userId, tenantId, status = null) {
    const query = { userId }
    if (tenantId) query.tenantId = tenantId
    if (status) query.status = status

    return PlayerBonus.find(query).populate("bonusTemplateId", "name code type").sort({ createdAt: -1 })
  }

  async cancelBonus(bonusId, adminId, reason = "") {
    const bonus = await PlayerBonus.findById(bonusId)
    if (!bonus) {
      throw new Error("Bonus not found")
    }

    // Remove from wallet
    if (bonus.bonusRemaining > 0) {
      const wallet = await Wallet.findById(bonus.walletId)
      if (wallet) {
        wallet.bonusBalance = Math.max(0, (wallet.bonusBalance || 0) - bonus.bonusRemaining)
        await wallet.save()
      }
    }

    bonus.status = "cancelled"
    bonus.adminNotes = reason
    bonus.history.push({
      action: "cancelled",
      amount: bonus.bonusRemaining,
      details: { adminId, reason },
      timestamp: new Date(),
    })
    await bonus.save()

    return bonus
  }

  async creditManualBonus(userId, tenantId, bonusTemplateId, amount, adminId) {
    const template = await BonusTemplate.findById(bonusTemplateId)
    if (!template) {
      throw new Error("Bonus template not found")
    }

    const playerBonus = await this.createPlayerBonus(userId, template, amount, 0, tenantId)

    playerBonus.source = "manual"
    playerBonus.createdBy = adminId
    await playerBonus.save()

    await this.creditBonusToWallet(userId, tenantId, amount, playerBonus._id, template)

    return playerBonus
  }
}

export const bonusEngine = new BonusEngine()
