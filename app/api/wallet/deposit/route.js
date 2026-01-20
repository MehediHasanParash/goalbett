import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Wallet from "@/lib/models/Wallet"
import Transaction from "@/lib/models/Transaction"
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"
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
    const { amount, paymentMethod, reference } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid deposit amount" }, { status: 400 })
    }

    const validPaymentMethods = ["card", "mobile", "airtime", "crypto", "bank", "internal", "mpesa", "orange"]
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 })
    }

    await connectDB()

    // Get user
    const user = await User.findById(decoded.userId).lean()
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ userId: decoded.userId })

    if (!wallet) {
      wallet = await Wallet.create({
        userId: decoded.userId,
        tenantId: user.tenant_id,
        availableBalance: 0,
        currency: "USD",
      })
    }

    // Check daily deposit limit
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

    if ((wallet.usage?.dailyDeposit || 0) + amount > wallet.limits?.dailyDeposit) {
      return NextResponse.json({ success: false, error: "Daily deposit limit exceeded" }, { status: 400 })
    }

    const balanceBefore = wallet.availableBalance || 0

    // Card payments would integrate with payment gateway in production
    // For now, all external payments require manual verification
    const requiresApproval = ["bank", "crypto", "card", "mobile", "mpesa", "orange"].includes(paymentMethod)

    // Get tenant payment details for manual verification methods
    let paymentDetails = null
    if (requiresApproval) {
      const tenant = await Tenant.findById(user.tenant_id).lean()
      if (tenant) {
        if (paymentMethod === "bank") {
          paymentDetails = {
            bankName: tenant.bankDetails?.bankName || "First National Bank",
            accountName: tenant.bankDetails?.accountName || tenant.businessName || "GoalBett Ltd",
            accountNumber: tenant.bankDetails?.accountNumber || "1234567890",
            routingNumber: tenant.bankDetails?.routingNumber || "987654321",
            swiftCode: tenant.bankDetails?.swiftCode || "FNBKUS33",
            reference: `DEP-${decoded.userId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          }
        } else if (paymentMethod === "crypto") {
          paymentDetails = {
            network: tenant.cryptoDetails?.network || "Bitcoin (BTC)",
            walletAddress: tenant.cryptoDetails?.walletAddress || "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            memo: tenant.cryptoDetails?.memo || null,
            reference: `DEP-${decoded.userId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          }
        } else if (paymentMethod === "card") {
          // Card payments - in production would integrate with Stripe/etc
          paymentDetails = {
            provider: "Manual Verification",
            reference: `CARD-${decoded.userId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
            note: "Card payment requires verification. In production, this would integrate with a payment gateway.",
          }
        } else if (["mobile", "mpesa", "orange"].includes(paymentMethod)) {
          // Mobile money payments
          paymentDetails = {
            provider:
              paymentMethod === "mpesa" ? "M-Pesa" : paymentMethod === "orange" ? "Orange Money" : "Mobile Money",
            paymentNumber: tenant.mobileMoneyDetails?.number || "+254700000000",
            businessName: tenant.mobileMoneyDetails?.businessName || tenant.businessName || "GoalBett",
            reference: `MOB-${decoded.userId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          }
        }
      }
    }

    if (requiresApproval) {
      // Create PENDING transaction - funds NOT added yet
      const transaction = await Transaction.create({
        walletId: wallet._id,
        userId: decoded.userId,
        tenantId: user.tenant_id,
        type: "deposit",
        amount: amount,
        currency: wallet.currency,
        balanceBefore: balanceBefore,
        balanceAfter: balanceBefore, // Balance unchanged until approved
        status: "pending",
        paymentMethod: {
          type: paymentMethod,
          reference: paymentDetails?.reference || reference,
        },
        description: `Pending deposit of ${amount} ${wallet.currency} via ${paymentMethod}`,
        metadata: {
          paymentDetails,
          requiresApproval: true,
          submittedAt: new Date(),
        },
      })

      // Determine instructions based on payment method
      let instructions = ""
      if (paymentMethod === "bank") {
        instructions =
          "Please transfer the exact amount to the bank account below. Include the reference number in your transfer description. Your funds will be credited after verification (usually within 24 hours)."
      } else if (paymentMethod === "crypto") {
        instructions =
          "Please send the exact amount to the wallet address below. Your funds will be credited after blockchain confirmation (usually within 1 hour)."
      } else if (paymentMethod === "card") {
        instructions =
          "Your card payment is being processed. Please wait for verification. You will receive a confirmation once approved."
      } else if (["mobile", "mpesa", "orange"].includes(paymentMethod)) {
        instructions =
          "Please send the exact amount to the mobile money number below. Include the reference in the description. Your funds will be credited after verification."
      }

      return NextResponse.json({
        success: true,
        message: "Deposit request submitted",
        requiresApproval: true,
        data: {
          transactionId: transaction._id,
          status: "pending",
          amount: amount,
          currency: wallet.currency,
          paymentMethod,
          paymentDetails,
          instructions,
        },
      })
    }

    // For instant methods (airtime, internal), add funds immediately
    wallet.availableBalance = (wallet.availableBalance || 0) + amount
    wallet.usage = {
      ...wallet.usage,
      dailyDeposit: (wallet.usage?.dailyDeposit || 0) + amount,
    }
    await wallet.save()

    // Create completed transaction record
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: decoded.userId,
      tenantId: user.tenant_id,
      type: "deposit",
      amount: amount,
      currency: wallet.currency,
      balanceBefore: balanceBefore,
      balanceAfter: wallet.availableBalance,
      status: "completed",
      paymentMethod: {
        type: paymentMethod || "internal",
        reference: reference,
      },
      description: `Deposit of ${amount} ${wallet.currency} via ${paymentMethod || "internal"}`,
    })

    return NextResponse.json({
      success: true,
      message: "Deposit successful",
      requiresApproval: false,
      data: {
        transactionId: transaction._id,
        newBalance: wallet.availableBalance,
        amount: amount,
        currency: wallet.currency,
      },
    })
  } catch (error) {
    console.error("[v0] Deposit error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
