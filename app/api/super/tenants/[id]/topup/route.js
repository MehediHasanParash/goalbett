import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/db"
import Tenant from "@/lib/models/Tenant"
import User from "@/lib/models/User"
import Transaction from "@/lib/models/Transaction"
import WalletService from "@/lib/services/wallet-service"

// POST /api/super/tenants/[id]/topup - Super Admin tops up tenant wallet
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
    const { amount, fundingType, reference, description } = body

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }

    if (!fundingType || !["PREPAID", "CREDIT_LINE"].includes(fundingType)) {
      return NextResponse.json({ success: false, error: "fundingType must be PREPAID or CREDIT_LINE" }, { status: 400 })
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

    // Update wallet balance
    tenantWallet.availableBalance += amount
    await tenantWallet.save()

    // Create transaction record
    const transactionType = fundingType === "PREPAID" ? "tenant_topup" : "tenant_credit_line"
    const paymentMethodType = fundingType === "PREPAID" ? "wire_transfer" : "credit_line"

    const transaction = await Transaction.create({
      walletId: tenantWallet._id,
      userId: superAdmin._id,
      tenantId: tenantId,
      type: transactionType,
      amount,
      currency: tenant.default_currency || "ETB",
      balanceBefore,
      balanceAfter: tenantWallet.availableBalance,
      status: "completed",
      paymentMethod: {
        type: paymentMethodType,
        reference: reference || `SA-TOPUP-${Date.now()}`,
      },
      toWalletId: tenantWallet._id,
      description:
        description ||
        `${fundingType === "PREPAID" ? "Prepaid deposit" : "Credit line"} from Super Admin to ${tenant.name}`,
      externalRef: reference,
      processedBy: superAdmin._id,
      metadata: {
        fundingType,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        superAdminEmail: superAdmin.email,
      },
    })

    console.log(
      `[v0] Super Admin ${superAdmin.email} topped up ${tenant.name} with ${amount} ${tenant.default_currency}`,
    )

    return NextResponse.json({
      success: true,
      message: `Successfully topped up ${tenant.name}`,
      data: {
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          type: transaction.type,
          currency: transaction.currency,
          balanceBefore,
          balanceAfter: transaction.balanceAfter,
          reference: transaction.paymentMethod.reference,
          createdAt: transaction.createdAt,
        },
        wallet: {
          availableBalance: tenantWallet.availableBalance,
          lockedBalance: tenantWallet.lockedBalance,
          totalBalance: tenantWallet.availableBalance + tenantWallet.lockedBalance,
          currency: tenantWallet.currency,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Super admin tenant topup error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
