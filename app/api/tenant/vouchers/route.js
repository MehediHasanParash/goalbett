import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import { verifyToken } from "@/lib/jwt"

// GET - List tenant's vouchers
export async function GET(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "tenant") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    await Voucher.markExpiredVouchers()

    const mongoose = await import("mongoose")
    const tenantObjectId = new mongoose.Types.ObjectId(decoded.tenant_id)

    // Build query - filter by tenant
    const query = { tenantId: tenantObjectId }
    if (status && status !== "all") {
      query.status = status
    }

    // Get vouchers with pagination
    const [vouchers, total] = await Promise.all([
      Voucher.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("agentId", "fullName username")
        .populate("redeemedBy", "fullName username phone")
        .lean(),
      Voucher.countDocuments(query),
    ])

    // Get stats for this tenant
    const stats = await Voucher.aggregate([
      { $match: { tenantId: tenantObjectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ])

    const statsMap = {
      total: 0,
      unused: 0,
      redeemed: 0,
      expired: 0,
      cancelled: 0,
      totalValue: 0,
      redeemedValue: 0,
    }

    stats.forEach((s) => {
      statsMap[s._id] = s.count
      statsMap.total += s.count
      statsMap.totalValue += s.totalAmount
      if (s._id === "redeemed") {
        statsMap.redeemedValue = s.totalAmount
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        vouchers,
        stats: statsMap,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("[v0] Get vouchers error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Generate new vouchers (tenant)
export async function POST(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "tenant") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, quantity = 1, prefix = "VCH", expiryDays = 30, description } = body

    // Validate
    if (!amount || amount < 1) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }
    if (quantity < 1 || quantity > 200) {
      return NextResponse.json({ success: false, error: "Quantity must be between 1 and 200" }, { status: 400 })
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
        tenantId: decoded.tenant_id,
        agentId: decoded.userId, // Tenant as creator
        code,
        amount,
        currency: "USD",
        status: "unused",
        expiresAt,
        batchId,
        prefix,
        description,
        createdBy: "tenant",
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
    console.error("[v0] Create vouchers error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
