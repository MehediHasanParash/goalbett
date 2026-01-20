import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Wallet from "@/lib/models/Wallet"
import Transaction from "@/lib/models/Transaction"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth"

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, paymentMethod, accountDetails } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid withdrawal amount" }, { status: 400 })
    }

    const validPaymentMethods = ["card", "mobile", "airtime", "crypto", "bank"]
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 })
    }

    await connectDB()

    // Get user
    const user = await User.findById(decoded.userId).lean()
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId: decoded.userId })

    if (!wallet) {
      return NextResponse.json({ success: false, error: "Wallet not found" }, { status: 404 })
    }

    // Check balance
    if (wallet.balance < amount) {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 })
    }

    // Check daily withdrawal limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (wallet.usage?.lastResetDate < today) {
      wallet.usage = {
        dailyDeposit: 0,
        dailyWithdrawal: 0,
        dailyBet: 0,
        lastResetDate: today,
      }
    }

    if ((wallet.usage?.dailyWithdrawal || 0) + amount > wallet.limits?.dailyWithdrawal) {
      return NextResponse.json({ success: false, error: "Daily withdrawal limit exceeded" }, { status: 400 })
    }

    const balanceBefore = wallet.balance

    // Update wallet - set pending withdrawal
    wallet.balance -= amount
    wallet.pendingWithdrawal += amount
    wallet.usage = {
      ...wallet.usage,
      dailyWithdrawal: (wallet.usage?.dailyWithdrawal || 0) + amount,
    }
    await wallet.save()

    // Create transaction record (pending)
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: decoded.userId,
      tenantId: user.tenant_id,
      type: "withdrawal",
      amount: -amount,
      currency: wallet.currency,
      balanceBefore: balanceBefore,
      balanceAfter: wallet.balance,
      status: "pending", // Withdrawals need approval
      paymentMethod: {
        type: paymentMethod || "bank",
        accountNumber: accountDetails?.accountNumber,
      },
      description: `Withdrawal request of ${amount} ${wallet.currency} via ${paymentMethod || "bank"}`,
    })

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted",
      data: {
        transactionId: transaction._id,
        newBalance: wallet.balance,
        pendingAmount: wallet.pendingWithdrawal,
        status: "pending",
        currency: wallet.currency,
      },
    })
  } catch (error) {
    console.error("[v0] Withdrawal error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
