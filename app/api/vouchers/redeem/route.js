import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import User from "@/lib/models/User"
import Transaction from "@/lib/models/Transaction"
import Wallet from "@/lib/models/Wallet"
import { verifyToken } from "@/lib/jwt"
import mongoose from "mongoose"

// POST - Redeem a voucher (player endpoint)
export async function POST(request) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      await session.abortTransaction()
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      await session.abortTransaction()
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code || code.trim() === "") {
      await session.abortTransaction()
      return NextResponse.json({ success: false, error: "Voucher code is required" }, { status: 400 })
    }

    // Normalize code
    const normalizedCode = code.trim().toUpperCase()

    // Get player
    const player = await User.findById(decoded.userId).session(session)
    if (!player) {
      await session.abortTransaction()
      return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 })
    }

    // Step 1: Find voucher and check tenant
    const voucher = await Voucher.findOne({ code: normalizedCode }).session(session)
    if (!voucher) {
      await session.abortTransaction()
      return NextResponse.json({ success: false, error: "Invalid voucher code" }, { status: 404 })
    }

    // Check tenant match
    if (voucher.tenantId.toString() !== player.tenant_id?.toString()) {
      await session.abortTransaction()
      return NextResponse.json({ success: false, error: "This voucher is not valid for your account" }, { status: 400 })
    }

    // Step 2: Check status
    if (voucher.status !== "unused") {
      await session.abortTransaction()
      return NextResponse.json(
        {
          success: false,
          error:
            voucher.status === "redeemed"
              ? "This voucher has already been redeemed"
              : `This voucher is ${voucher.status}`,
        },
        { status: 400 },
      )
    }

    // Step 3: Check expiry
    if (new Date() > voucher.expiresAt) {
      // Update status to expired
      voucher.status = "expired"
      await voucher.save({ session })
      await session.abortTransaction()
      return NextResponse.json({ success: false, error: "This voucher has expired" }, { status: 400 })
    }

    // Step 4: Atomic transaction - Redeem voucher and credit player
    // Get or create player wallet
    let wallet = await Wallet.findOne({ userId: player._id }).session(session)
    if (!wallet) {
      wallet = await Wallet.create(
        [
          {
            userId: player._id,
            tenantId: player.tenant_id,
            availableBalance: 0,
            currency: voucher.currency || "USD",
          },
        ],
        { session },
      )
      wallet = wallet[0]
    }

    const balanceBefore = wallet.availableBalance || 0
    const balanceAfter = balanceBefore + voucher.amount

    // Update wallet availableBalance (correct field name)
    wallet.availableBalance = balanceAfter
    await wallet.save({ session })

    // Also update user balance for backwards compatibility
    player.balance = (player.balance || 0) + voucher.amount
    await player.save({ session })

    // Create transaction record
    await Transaction.create(
      [
        {
          walletId: wallet._id,
          userId: player._id,
          tenantId: player.tenant_id,
          type: "voucher_redemption",
          amount: voucher.amount,
          currency: voucher.currency || "USD",
          balanceBefore,
          balanceAfter,
          status: "completed",
          description: `Voucher redemption: ${voucher.code}`,
          externalRef: voucher._id.toString(),
          metadata: {
            voucherCode: voucher.code,
            voucherId: voucher._id.toString(),
            agentId: voucher.agentId.toString(),
          },
        },
      ],
      { session },
    )

    // Update voucher status
    voucher.status = "redeemed"
    voucher.redeemedBy = player._id
    voucher.redeemedAt = new Date()
    await voucher.save({ session })

    // Calculate and pay agent commission
    if (voucher.commissionRate > 0) {
      const commission = (voucher.amount * voucher.commissionRate) / 100
      const agent = await User.findById(voucher.agentId).session(session)
      if (agent) {
        agent.balance = (agent.balance || 0) + commission
        await agent.save({ session })
        voucher.commissionPaid = commission
        await voucher.save({ session })
      }
    }

    await session.commitTransaction()

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ${voucher.currency} ${voucher.amount}!`,
      data: {
        amount: voucher.amount,
        currency: voucher.currency,
        newBalance: balanceAfter,
      },
    })
  } catch (error) {
    await session.abortTransaction()
    console.error("[v0] Redeem voucher error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    session.endSession()
  }
}
