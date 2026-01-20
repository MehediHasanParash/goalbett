import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Wallet from "@/lib/models/Wallet"

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
    const search = searchParams.get("search")
    const type = searchParams.get("type") // player, agent, tenant

    // Build query
    const query = {}
    if (status && status !== "all") query.status = status

    // Get wallets with pagination
    let wallets = await Wallet.find(query)
      .populate({
        path: "userId",
        select: "name email phone role",
      })
      .populate({
        path: "tenantId",
        select: "name",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    // Filter by type if specified
    if (type && type !== "all") {
      wallets = wallets.filter((w) => {
        if (type === "player") return w.userId?.role === "player"
        if (type === "agent") return ["agent", "sub_agent"].includes(w.userId?.role)
        if (type === "tenant") return !w.userId
        return true
      })
    }

    // Filter by search
    if (search) {
      wallets = wallets.filter(
        (w) =>
          w.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
          w.userId?.email?.toLowerCase().includes(search.toLowerCase()),
      )
    }

    const total = await Wallet.countDocuments(query)

    // Get aggregated stats
    const stats = await Wallet.aggregate([
      {
        $group: {
          _id: "$status",
          totalBalance: { $sum: "$availableBalance" },
          totalLocked: { $sum: "$lockedBalance" },
          totalBonus: { $sum: "$bonusBalance" },
          count: { $sum: 1 },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      wallets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats.reduce(
        (acc, item) => {
          acc.byStatus[item._id] = {
            count: item.count,
            totalBalance: item.totalBalance,
            totalLocked: item.totalLocked,
            totalBonus: item.totalBonus,
          }
          acc.totalBalance += item.totalBalance
          acc.totalLocked += item.totalLocked
          acc.totalBonus += item.totalBonus
          acc.totalWallets += item.count
          return acc
        },
        { byStatus: {}, totalBalance: 0, totalLocked: 0, totalBonus: 0, totalWallets: 0 },
      ),
    })
  } catch (error) {
    console.error("Wallets API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
