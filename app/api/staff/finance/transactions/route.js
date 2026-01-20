import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Transaction from "@/lib/models/Transaction"
import { verifyToken } from "@/lib/jwt"
import { hasPermission } from "@/lib/staff-permissions"

export async function GET(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !hasPermission(decoded.role, "view_deposits")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const tenantId = decoded.tenant_id || decoded.tenantId

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    // Calculate date range
    const startDate = new Date()
    switch (range) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24)
        break
      case "7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    const query = {
      tenant_id: tenantId,
      createdAt: { $gte: startDate },
    }

    if (type) query.type = type
    if (status) query.status = status

    const transactions = await Transaction.find(query)
      .populate("user_id", "fullName email phone")
      .sort({ createdAt: -1 })
      .limit(100)

    // Map to include player info
    const formattedTransactions = transactions.map((tx) => ({
      _id: tx._id,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      player: tx.user_id
        ? {
            fullName: tx.user_id.fullName,
            email: tx.user_id.email,
          }
        : null,
      createdAt: tx.createdAt,
    }))

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
