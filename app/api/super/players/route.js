import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import PlayerKYC from "@/lib/models/PlayerKYC"
import Wallet from "@/lib/models/Wallet"

// GET /api/super/players - Super admin gets all players across all tenants
export async function GET(request) {
  try {
    let token = null

    // Try Authorization header first
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }

    // Fallback to cookies
    if (!token) {
      token = request.cookies.get("token")?.value
    }

    if (!token) {
      console.log("[v0] No token found in header or cookies")
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] Super players API - decoded role:", decoded?.role)

    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      console.log("[v0] Unauthorized - role check failed, got:", decoded?.role)
      return NextResponse.json({ error: "Unauthorized - Super admin only" }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    const query = {
      role: "player",
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ]
    }

    if (status) {
      query.status = status
    }

    const players = await User.find(query)
      .populate("tenant_id", "name businessName domain status")
      .select("fullName username email phone role tenant_id status balance kyc_status createdAt isActive lastLogin")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    const totalPlayers = await User.countDocuments(query)

    const playerIds = players.map((p) => p._id)
    const [kycRecords, walletRecords] = await Promise.all([
      PlayerKYC.find({ userId: { $in: playerIds } })
        .select("userId overallStatus")
        .lean(),
      Wallet.find({ userId: { $in: playerIds } })
        .select("userId availableBalance")
        .lean(),
    ])

    const kycMap = kycRecords.reduce((acc, kyc) => {
      acc[kyc.userId.toString()] = kyc.overallStatus
      return acc
    }, {})

    const walletMap = walletRecords.reduce((acc, wallet) => {
      acc[wallet.userId.toString()] = wallet.availableBalance
      return acc
    }, {})

    const formattedPlayers = players.map((player) => {
      const playerId = player._id.toString()
      const kycStatus = kycMap[playerId] || player.kyc_status || "unknown"

      console.log("[v0] Player balance from DB:", player.username, player.balance)

      return {
        ...player,
        tenantName: player.tenant_id?.name || player.tenant_id?.businessName || "No Tenant",
        tenantDomain: player.tenant_id?.domain || "-",
        tenantStatus: player.tenant_id?.status || "unknown",
        kyc_status: kycStatus,
        balance: player.balance || 0,
      }
    })

    return NextResponse.json({
      players: formattedPlayers,
      total: totalPlayers,
      limit,
      skip,
    })
  } catch (error) {
    console.error("[v0] Error fetching players for super admin:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}
