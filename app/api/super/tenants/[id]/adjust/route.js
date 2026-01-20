import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/db"
import Tenant from "@/lib/models/Tenant"
import User from "@/lib/models/User"
import Transaction from "@/lib/models/Transaction"
import WalletService from "@/lib/services/wallet-service"

// POST /api/super/tenants/[id]/adjust - Super Admin manually adjusts tenant wallet balance
export async function POST(request, { params }) {
  try {
    const { id: tenantId } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    // Verify super admin
    const superAdmin = await User.findById(decoded.userId)
    console.log("[v0] User role check:", {
      userId: decoded.userId,
      userExists: !!superAdmin,
      userRole: superAdmin?.role,
      decodedRole: decoded.role,
    })

    if (!superAdmin || superAdmin.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { amount, adjustmentType, reason, reference } = body

    console.log("[v0] Adjust request body:", { amount, adjustmentType, reason, reference, fullBody: body })

    // Validate input
    if (!amount || amount === 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }

    if (!adjustmentType || !["CREDIT", "DEBIT"].includes(adjustmentType)) {
      return NextResponse.json({ success: false, error: "adjustmentType must be CREDIT or DEBIT" }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ success: false, error: "Reason is required for adjustments" }, { status: 400 })
    }

    // Get tenant
    const tenant = await Tenant.findById(tenantId)
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 })
    }

    // Get or create tenant wallet
    const tenantWallet = await WalletService.getTenantWallet(tenantId)

    // Record balance before
    const balanceBefore = tenantWallet.availableBalance

    // Calculate adjustment amount
    const adjustmentAmount = adjustmentType === "CREDIT" ? Math.abs(amount) : -Math.abs(amount)

    // Check for sufficient balance on debit
    if (adjustmentType === "DEBIT" && tenantWallet.availableBalance < Math.abs(amount)) {
      return NextResponse.json({ success: false, error: "Insufficient tenant balance" }, { status: 400 })
    }

    // Update wallet balance
    tenantWallet.availableBalance += adjustmentAmount
    await tenantWallet.save()

    // Create transaction record
    const transaction = await Transaction.create({
      walletId: tenantWallet._id,
      userId: superAdmin._id,
      tenantId: tenantId,
      type: "tenant_adjustment",
      amount: Math.abs(amount),
      currency: tenant.default_currency || "ETB",
      balanceBefore,
      balanceAfter: tenantWallet.availableBalance,
      status: "completed",
      paymentMethod: {
        type: "internal",
        reference: reference || `SA-ADJUST-${Date.now()}`,
      },
      toWalletId: adjustmentType === "CREDIT" ? tenantWallet._id : null,
      fromWalletId: adjustmentType === "DEBIT" ? tenantWallet._id : null,
      description: `Manual ${adjustmentType.toLowerCase()} adjustment: ${reason}`,
      externalRef: reference,
      processedBy: superAdmin._id,
      metadata: {
        adjustmentType,
        reason,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        superAdminEmail: superAdmin.email,
      },
    })

    console.log(
      `[v0] Super Admin ${superAdmin.email} adjusted ${tenant.name} wallet by ${adjustmentAmount} ${tenant.default_currency}`,
    )

    return NextResponse.json({
      success: true,
      message: `Successfully adjusted ${tenant.name} wallet`,
      data: {
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          type: transaction.type,
          adjustmentType,
          currency: transaction.currency,
          balanceBefore,
          balanceAfter: transaction.balanceAfter,
          reason,
          reference: transaction.paymentMethod.reference,
          createdAt: transaction.createdAt,
        },
        wallet: {
          availableBalance: tenantWallet.availableBalance,
          lockedBalance: tenantWallet.lockedBalance,
          totalBalance: tenantWallet.availableBalance + tenantWallet.lockedBalance,
          currency: tenant.default_currency || tenantWallet.currency || "USD",
        },
      },
    })
  } catch (error) {
    console.error("[v0] Super admin tenant adjustment error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
