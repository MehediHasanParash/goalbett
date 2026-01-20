import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import PlayerKYC from "@/lib/models/PlayerKYC"
import PlayerLimits from "@/lib/models/PlayerLimits"
import PlayerExclusion from "@/lib/models/PlayerExclusion"
import PlayerSegment from "@/lib/models/PlayerSegment"
import RealityCheck from "@/lib/models/RealityCheck"
import Bet from "@/lib/models/Bet"
import Transaction from "@/lib/models/Transaction"
import Wallet from "@/lib/models/Wallet"

export async function GET(request) {
  try {
    let token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get("auth_token")?.value
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== "super_admin" && decoded.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("playerId")

    if (!playerId) {
      return NextResponse.json({ error: "Player ID required" }, { status: 400 })
    }

    const [player, kyc, limits, exclusions, segment, realityCheck, bets, transactions, wallet] = await Promise.all([
      User.findById(playerId).populate("tenant_id", "name subdomain primaryDomain metadata theme").lean(),
      PlayerKYC.findOne({ userId: playerId }).lean(),
      PlayerLimits.findOne({ userId: playerId }).lean(),
      PlayerExclusion.find({ userId: playerId, isActive: true }).lean(),
      PlayerSegment.findOne({ userId: playerId }).lean(),
      RealityCheck.findOne({ userId: playerId }).lean(),
      Bet.find({ userId: playerId }).sort({ createdAt: -1 }).limit(10).lean(),
      Transaction.find({ userId: playerId }).sort({ createdAt: -1 }).limit(20).lean(),
      Wallet.findOne({ userId: playerId }).lean(),
    ])

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    return NextResponse.json({
      player,
      kyc: kyc || null,
      limits: limits || null,
      exclusions: exclusions || [],
      segment: segment || null,
      realityCheck: realityCheck || null,
      bets: bets || [],
      transactions: transactions || [],
      wallet: wallet || null,
    })
  } catch (error) {
    console.error("[v0] Error fetching player PMS data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    let token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get("auth_token")?.value
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== "super_admin" && decoded.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()
    const { playerId, action, data } = body

    if (!playerId || !action) {
      return NextResponse.json({ error: "Player ID and action required" }, { status: 400 })
    }

    const player = await User.findById(playerId)
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    let result

    switch (action) {
      case "update_kyc_status":
        result = await PlayerKYC.findOneAndUpdate(
          { userId: playerId },
          {
            $set: {
              "documents.identity.status": data.identityStatus,
              "documents.identity.rejectionReason": data.identityRejection,
              "documents.proofOfAddress.status": data.addressStatus,
              "documents.proofOfAddress.rejectionReason": data.addressRejection,
              "documents.selfie.status": data.selfieStatus,
              "documents.selfie.rejectionReason": data.selfieRejection,
              overallStatus: data.overallStatus,
              verificationLevel: data.verificationLevel,
            },
          },
          { new: true, upsert: true },
        )

        await User.findByIdAndUpdate(playerId, { kyc_status: data.overallStatus })
        break

      case "suspend_account":
        await User.findByIdAndUpdate(playerId, { status: "suspended" })

        // Create exclusion record
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + (data.days || 365))

        result = await PlayerExclusion.create({
          userId: playerId,
          tenant_id: player.tenant_id,
          type: "admin_suspension",
          duration: "custom",
          startDate: new Date(),
          endDate,
          reason: data.reason || "Account suspended by admin",
          requestedBy: "admin",
          adminNotes: data.notes,
          canRevert: true,
        })
        break

      case "activate_account":
        await User.findByIdAndUpdate(playerId, { status: "active" })

        // Deactivate all exclusions
        await PlayerExclusion.updateMany({ userId: playerId, isActive: true }, { isActive: false })
        result = { message: "Account activated successfully" }
        break

      case "add_funds":
        const wallet = await Wallet.findOne({ userId: playerId })
        if (!wallet) {
          return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
        }

        const addAmount = Number.parseFloat(data.amount)
        const balanceBefore = wallet.availableBalance

        wallet.availableBalance += addAmount
        await wallet.save()

        await User.findByIdAndUpdate(playerId, {
          $inc: { balance: addAmount },
        })

        result = await Transaction.create({
          walletId: wallet._id,
          userId: playerId,
          tenantId: player.tenant_id,
          type: "adjustment",
          amount: addAmount,
          currency: wallet.currency,
          balanceBefore,
          balanceAfter: wallet.availableBalance,
          status: "completed",
          description: data.description || "Funds added by admin",
          processedBy: decoded.userId,
        })
        break

      case "withdraw_funds":
        const walletWithdraw = await Wallet.findOne({ userId: playerId })
        if (!walletWithdraw) {
          return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
        }

        const withdrawAmount = Number.parseFloat(data.amount)
        if (walletWithdraw.availableBalance < withdrawAmount) {
          return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
        }

        const balanceBeforeWithdraw = walletWithdraw.availableBalance

        walletWithdraw.availableBalance -= withdrawAmount
        await walletWithdraw.save()

        await User.findByIdAndUpdate(playerId, {
          $inc: { balance: -withdrawAmount },
        })

        result = await Transaction.create({
          walletId: walletWithdraw._id,
          userId: playerId,
          tenantId: player.tenant_id,
          type: "adjustment",
          amount: -withdrawAmount,
          currency: walletWithdraw.currency,
          balanceBefore: balanceBeforeWithdraw,
          balanceAfter: walletWithdraw.availableBalance,
          status: "completed",
          description: data.description || "Funds withdrawn by admin",
          processedBy: decoded.userId,
        })
        break

      case "set_limits":
        result = await PlayerLimits.findOneAndUpdate(
          { userId: playerId },
          {
            $set: {
              tenant_id: player.tenant_id,
              depositLimits: data.depositLimits,
              stakeLimits: data.stakeLimits,
              lossLimits: data.lossLimits,
            },
          },
          { new: true, upsert: true },
        )
        break

      case "set_exclusion":
        const durationMap = {
          "24_hours": 1,
          "48_hours": 2,
          "1_week": 7,
          "1_month": 30,
          "3_months": 90,
          "6_months": 180,
          "1_year": 365,
          permanent: 36500,
        }
        const days = durationMap[data.duration] || 7
        const exclusionEndDate = new Date()
        exclusionEndDate.setDate(exclusionEndDate.getDate() + days)

        result = await PlayerExclusion.create({
          userId: playerId,
          tenant_id: player.tenant_id,
          type: data.type || "admin_suspension",
          duration: data.duration,
          startDate: new Date(),
          endDate: exclusionEndDate,
          reason: data.reason,
          requestedBy: "admin",
          adminNotes: data.adminNotes,
          canRevert: data.canRevert || false,
        })

        await User.findByIdAndUpdate(playerId, { status: "suspended" })
        break

      case "remove_exclusion":
        result = await PlayerExclusion.findByIdAndUpdate(data.exclusionId, {
          isActive: false,
        })
        const activeExclusions = await PlayerExclusion.find({ userId: playerId, isActive: true })
        if (activeExclusions.length === 0) {
          await User.findByIdAndUpdate(playerId, { status: "active" })
        }
        break

      case "update_segments":
        result = await PlayerSegment.findOneAndUpdate(
          { userId: playerId },
          {
            $set: {
              tenant_id: player.tenant_id,
              segments: data.segments,
              tags: data.tags,
              vipLevel: data.vipLevel,
              riskScore: data.riskScore,
              responsibleGamblingFlags: data.responsibleGamblingFlags,
            },
          },
          { new: true, upsert: true },
        )
        break

      case "configure_reality_check":
        result = await RealityCheck.findOneAndUpdate(
          { userId: playerId },
          {
            $set: {
              tenant_id: player.tenant_id,
              frequency: data.frequency,
              enabled: data.enabled,
            },
          },
          { new: true, upsert: true },
        )
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] Error updating player PMS data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
