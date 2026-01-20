import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"

// GET - List sub-agent's vouchers
export async function GET(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "sub_agent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    await Voucher.markExpiredVouchers()

    const mongoose = await import("mongoose")
    const agentObjectId = new mongoose.Types.ObjectId(decoded.userId)

    // Build query
    const query = { agentId: agentObjectId }
    if (status && status !== "all") {
      query.status = status
    }

    // Get vouchers with pagination
    const [vouchers, total] = await Promise.all([
      Voucher.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("redeemedBy", "fullName username phone")
        .lean(),
      Voucher.countDocuments(query),
    ])

    // Get stats
    const stats = await Voucher.aggregate([
      { $match: { agentId: agentObjectId } },
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

// POST - Generate new vouchers (sub-agent)
export async function POST(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "sub_agent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, quantity = 1, prefix = "VCH", expiryDays = 30, description } = body

    // Validate
    if (!amount || amount < 1) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }
    if (quantity < 1 || quantity > 50) {
      return NextResponse.json({ success: false, error: "Quantity must be between 1 and 50" }, { status: 400 })
    }

    // Get sub-agent info
    const subAgent = await User.findById(decoded.userId)
    if (!subAgent) {
      return NextResponse.json({ success: false, error: "Sub-agent not found" }, { status: 404 })
    }

    // Check if sub-agent has enough credit/balance
    const totalCost = amount * quantity
    const availableCredit = (subAgent.creditLimit || 0) - (subAgent.usedCredit || 0)
    const totalAvailable = availableCredit + (subAgent.balance || 0)

    if (totalCost > totalAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient funds. Need $${totalCost}, available: $${totalAvailable.toFixed(2)}`,
        },
        { status: 400 },
      )
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
        tenantId: subAgent.tenant_id,
        agentId: subAgent._id,
        code,
        amount,
        currency: "USD",
        status: "unused",
        expiresAt,
        batchId,
        prefix,
        description,
        commissionRate: subAgent.commissionRate || 5,
        createdBy: "sub_agent",
      })),
    )

    // Deduct from sub-agent's credit/balance
    if (totalCost <= availableCredit) {
      subAgent.usedCredit = (subAgent.usedCredit || 0) + totalCost
    } else {
      const fromCredit = availableCredit
      const fromBalance = totalCost - fromCredit
      subAgent.usedCredit = (subAgent.usedCredit || 0) + fromCredit
      subAgent.balance = (subAgent.balance || 0) - fromBalance
    }
    await subAgent.save()

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
        totalCost,
        quantity: vouchers.length,
      },
    })
  } catch (error) {
    console.error("[v0] Create vouchers error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
