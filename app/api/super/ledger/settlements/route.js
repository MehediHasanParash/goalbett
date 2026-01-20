import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Settlement from "@/lib/models/Settlement"
import User from "@/lib/models/User"
import Wallet from "@/lib/models/Wallet"
import { LedgerEngine } from "@/lib/ledger-engine"

export async function GET(request) {
  try {
    await connectDB()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded || !["super_admin", "superadmin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 50
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    const query = {}
    if (status && status !== "all") query.status = status
    if (type && type !== "all") query.settlementType = type

    const [settlements, total] = await Promise.all([
      Settlement.find(query)
        .populate("beneficiaryId", "name email")
        .populate("preparedBy", "name")
        .populate("approvedBy", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Settlement.countDocuments(query),
    ])

    // Stats
    const stats = await Settlement.aggregate([
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$netAmount" },
          count: { $sum: 1 },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      settlements,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: stats.reduce((acc, item) => {
        acc[item._id] = { amount: item.totalAmount, count: item.count }
        return acc
      }, {}),
    })
  } catch (error) {
    console.error("Settlements API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded || !["super_admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case "create": {
        const { beneficiaryId, settlementType, periodStart, periodEnd, grossAmount, deductions, currency } = body

        const beneficiary = await User.findById(beneficiaryId)
        if (!beneficiary) {
          return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 })
        }

        const wallet = await Wallet.findOne({ userId: beneficiaryId })

        const netAmount =
          grossAmount -
          (deductions?.platformFee || 0) -
          (deductions?.taxes || 0) -
          (deductions?.chargebacks || 0) -
          (deductions?.adjustments || 0)

        const settlement = new Settlement({
          settlementType,
          beneficiaryType:
            beneficiary.role === "agent" ? "agent" : beneficiary.role === "sub_agent" ? "subagent" : "operator",
          beneficiaryId,
          beneficiaryWalletId: wallet?._id,
          periodStart,
          periodEnd,
          grossAmount,
          deductions: deductions || {},
          netAmount,
          currency: currency || "USD",
          status: "pending_approval",
          preparedBy: decoded.userId,
        })

        await settlement.save()
        return NextResponse.json({ success: true, settlement })
      }

      case "approve": {
        const { settlementId } = body
        const settlement = await Settlement.findById(settlementId)
        if (!settlement) {
          return NextResponse.json({ error: "Settlement not found" }, { status: 404 })
        }

        settlement.status = "approved"
        settlement.approvedBy = decoded.userId
        settlement.approvedAt = new Date()
        await settlement.save()

        return NextResponse.json({ success: true, settlement })
      }

      case "process": {
        const { settlementId, paymentMethod, paymentReference } = body
        const settlement = await Settlement.findById(settlementId)
        if (!settlement) {
          return NextResponse.json({ error: "Settlement not found" }, { status: 404 })
        }

        // Create ledger entry for the settlement
        const entry = await LedgerEngine.recordAgentSettlement({
          agentWalletId: settlement.beneficiaryWalletId,
          agentId: settlement.beneficiaryId,
          tenantId: settlement.tenantId,
          settlementId: settlement._id,
          amount: settlement.netAmount,
          currency: settlement.currency,
          createdBy: decoded.userId,
        })

        settlement.status = "completed"
        settlement.processedBy = decoded.userId
        settlement.processedAt = new Date()
        settlement.paymentMethod = paymentMethod
        settlement.paymentReference = paymentReference
        settlement.ledgerEntryIds = [entry._id]
        await settlement.save()

        return NextResponse.json({ success: true, settlement })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Settlement action error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
