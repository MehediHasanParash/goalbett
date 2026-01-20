import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"

// GET - List agent's vouchers
export async function GET(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent"].includes(decoded.role)) {
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

    console.log("[v0] Fetching vouchers for agent:", decoded.userId, "Query:", JSON.stringify(query))

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

    console.log("[v0] Found vouchers:", vouchers.length, "Total:", total)

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

// POST - Generate new vouchers
export async function POST(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, quantity = 1, prefix = "VCH", expiryDays = 30, description } = body

    // Validate
    if (!amount || amount < 1) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }
    if (quantity < 1 || quantity > 100) {
      return NextResponse.json({ success: false, error: "Quantity must be between 1 and 100" }, { status: 400 })
    }

    // Get agent info
    const agent = await User.findById(decoded.userId)
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    // Check if agent has enough credit/balance
    const totalCost = amount * quantity
    const availableCredit = (agent.creditLimit || 0) - (agent.usedCredit || 0)
    const totalAvailable = availableCredit + (agent.balance || 0)

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

    console.log("[v0] Creating vouchers - Agent:", agent._id, "Tenant:", agent.tenant_id, "Codes:", codes.length)

    // Create vouchers
    const vouchers = await Voucher.insertMany(
      codes.map((code) => ({
        tenantId: agent.tenant_id,
        agentId: agent._id,
        code,
        amount,
        currency: "USD",
        status: "unused",
        expiresAt,
        batchId,
        prefix,
        description,
        commissionRate: agent.commissionRate || 10,
      })),
    )

    console.log("[v0] Created vouchers:", vouchers.length)

    // Deduct from agent's credit/balance
    if (totalCost <= availableCredit) {
      agent.usedCredit = (agent.usedCredit || 0) + totalCost
    } else {
      // Use all available credit first, then balance
      const fromCredit = availableCredit
      const fromBalance = totalCost - fromCredit
      agent.usedCredit = (agent.usedCredit || 0) + fromCredit
      agent.balance = (agent.balance || 0) - fromBalance
    }
    await agent.save()

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
