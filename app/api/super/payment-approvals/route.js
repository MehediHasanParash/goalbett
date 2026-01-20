import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import PaymentApproval from "@/lib/models/PaymentApproval"

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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"
    const type = searchParams.get("type")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const query = {}
    if (status !== "all") query.status = status
    if (type) query.type = type

    const [approvals, total] = await Promise.all([
      PaymentApproval.find(query)
        .populate("userId", "username email phone")
        .populate("tenantId", "name")
        .populate("gatewayId", "name displayName")
        .populate("reviewedBy", "username")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PaymentApproval.countDocuments(query),
    ])

    // Get stats
    const stats = await PaymentApproval.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          volume: { $sum: "$amount" },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      approvals,
      total,
      page,
      pages: Math.ceil(total / limit),
      stats: stats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, volume: s.volume }
        return acc
      }, {}),
    })
  } catch (error) {
    console.error("Error fetching payment approvals:", error)
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 })
  }
}
