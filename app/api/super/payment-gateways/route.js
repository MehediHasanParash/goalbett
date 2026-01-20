import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import PaymentGateway from "@/lib/models/PaymentGateway"
import PaymentRoute from "@/lib/models/PaymentRoute"
import PaymentApproval from "@/lib/models/PaymentApproval"
import Transaction from "@/lib/models/Transaction"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    // Get all gateways
    const gateways = await PaymentGateway.find({})
      .populate("tenantId", "name")
      .sort({ priority: -1, createdAt: -1 })
      .lean()

    // Get stats
    const totalGateways = gateways.length
    const activeGateways = gateways.filter((g) => g.status === "active").length

    // Get pending approvals count
    const pendingApprovals = await PaymentApproval.countDocuments({ status: "pending" })

    // Get today's transactions
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayStats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          type: { $in: ["deposit", "withdrawal"] },
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          volume: { $sum: "$amount" },
        },
      },
    ])

    const depositStats = todayStats.find((s) => s._id === "deposit") || { count: 0, volume: 0 }
    const withdrawalStats = todayStats.find((s) => s._id === "withdrawal") || { count: 0, volume: 0 }

    // Get routing rules count
    const routingRules = await PaymentRoute.countDocuments({})

    // Calculate total volume this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthlyVolume = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart },
          type: { $in: ["deposit", "withdrawal"] },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $abs: "$amount" } },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      gateways,
      stats: {
        totalGateways,
        activeGateways,
        pendingApprovals,
        routingRules,
        todayDeposits: depositStats.count,
        todayDepositVolume: Math.round((depositStats.volume || 0) * 100) / 100,
        todayWithdrawals: withdrawalStats.count,
        todayWithdrawalVolume: Math.round((withdrawalStats.volume || 0) * 100) / 100,
        monthlyVolume: Math.round((monthlyVolume[0]?.total || 0) * 100) / 100,
      },
    })
  } catch (error) {
    console.error("Error fetching payment gateways:", error)
    return NextResponse.json({ error: "Failed to fetch payment gateways" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()

    // Check if gateway already exists
    const existing = await PaymentGateway.findOne({
      name: body.name,
      tenantId: body.tenantId || null,
    })

    if (existing) {
      return NextResponse.json({ error: "Gateway already exists" }, { status: 400 })
    }

    const gateway = new PaymentGateway(body)
    await gateway.save()

    return NextResponse.json({
      success: true,
      gateway,
    })
  } catch (error) {
    console.error("Error creating payment gateway:", error)
    return NextResponse.json({ error: "Failed to create payment gateway" }, { status: 500 })
  }
}
