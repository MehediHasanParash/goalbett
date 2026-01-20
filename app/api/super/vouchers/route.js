import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import { verifyToken } from "@/lib/jwt"

// GET - Super Admin view all vouchers
export async function GET(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const agentId = searchParams.get("agentId")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Build query
    const query = {}
    if (tenantId) query.tenantId = tenantId
    if (agentId) query.agentId = agentId
    if (status && status !== "all") query.status = status

    const [vouchers, total] = await Promise.all([
      Voucher.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("tenantId", "businessName domain name")
        .populate("agentId", "fullName username")
        .populate("redeemedBy", "fullName username phone firstName lastName")
        .lean(),
      Voucher.countDocuments(query),
    ])

    const statsAggregation = await Voucher.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ])

    const stats = {
      total: 0,
      unused: 0,
      redeemed: 0,
      expired: 0,
      redeemedValue: 0,
    }

    statsAggregation.forEach((item) => {
      stats.total += item.count
      if (item._id === "unused") {
        stats.unused = item.count
      } else if (item._id === "redeemed") {
        stats.redeemed = item.count
        stats.redeemedValue = item.totalAmount
      } else if (item._id === "expired") {
        stats.expired = item.count
      }
    })

    const transformedVouchers = vouchers.map((v) => ({
      ...v,
      tenantId: v.tenantId
        ? {
            ...v.tenantId,
            name: v.tenantId.name || v.tenantId.businessName || "Unknown",
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        vouchers: transformedVouchers,
        stats,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    console.error("[v0] Super get vouchers error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Super Admin generate vouchers for a tenant
export async function POST(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tenantId, amount, quantity = 1, prefix = "VCH", expiryDays = 30, description } = body

    // Validate
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant ID is required" }, { status: 400 })
    }
    if (!amount || amount < 1) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }
    if (quantity < 1 || quantity > 500) {
      return NextResponse.json({ success: false, error: "Quantity must be between 1 and 500" }, { status: 400 })
    }

    // Generate batch ID
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    // Generate unique codes
    const codes = await Voucher.generateBatchCodes(quantity, prefix)

    // Create vouchers
    const vouchers = await Voucher.insertMany(
      codes.map((code) => ({
        tenantId,
        agentId: decoded.userId, // Super admin as creator
        code,
        amount,
        currency: "USD",
        status: "unused",
        expiresAt,
        batchId,
        prefix,
        description,
        createdBy: "super_admin",
      })),
    )

    return NextResponse.json({
      success: true,
      data: {
        vouchers: vouchers.map((v) => ({
          id: v._id,
          code: v.code,
          amount: v.amount,
          expiresAt: v.expiresAt,
        })),
        batchId,
        totalValue: amount * quantity,
        quantity: vouchers.length,
      },
    })
  } catch (error) {
    console.error("[v0] Super create vouchers error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
