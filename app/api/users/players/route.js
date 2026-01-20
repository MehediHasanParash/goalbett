import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"
import { verifyToken } from "@/lib/jwt"
import { NextResponse } from "next/server"
import { createAuditLog } from "@/lib/middleware/audit-middleware"

// GET /api/users/players - Get players based on role
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("[v0] GET players - User role:", decoded.role, "User ID:", decoded.userId)

    await connectDB()

    let players = []
    let stats = {
      totalPlayers: 0,
      verifiedPlayers: 0,
      pendingKYC: 0,
      activePlayers: 0,
    }

    if (decoded.role === "tenant_admin") {
      let tenantId = decoded.tenant_id || decoded.tenantId
      const tenant = await Tenant.findOne({ adminUserId: decoded.userId }).lean()
      if (tenant) {
        tenantId = tenant._id
        console.log("[v0] GET players - found tenant by adminUserId:", tenant._id.toString())
      }

      players = await User.find({
        role: "player",
        $or: [{ tenant_id: tenantId }, { tenantId: tenantId }, { createdBy: decoded.userId }],
      })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean()

      stats = {
        totalPlayers: players.length,
        verifiedPlayers: players.filter((p) => ["approved", "verified"].includes(p.kyc_status)).length,
        pendingKYC: players.filter((p) => p.kyc_status === "pending").length,
        activePlayers: players.filter((p) => p.status === "active").length,
      }

      console.log("[v0] GET players - tenant_admin found", players.length, "players")
    } else if (decoded.role === "agent" || decoded.role === "sub_agent") {
      const mongoose = require("mongoose")
      const userObjectId = new mongoose.Types.ObjectId(decoded.userId)

      const query = {
        role: "player",
        $or: [
          { createdBy: userObjectId },
          { createdBy: decoded.userId },
          { subAgentId: userObjectId },
          { subAgentId: decoded.userId },
          { parentAgentId: userObjectId },
          { parentAgentId: decoded.userId },
        ],
      }

      players = await User.find(query).select("-password").sort({ createdAt: -1 }).lean()

      stats = {
        totalPlayers: players.length,
        verifiedPlayers: players.filter((p) => ["approved", "verified"].includes(p.kyc_status)).length,
        pendingKYC: players.filter((p) => p.kyc_status === "pending").length,
        activePlayers: players.filter((p) => p.status === "active").length,
      }

      console.log("[v0] GET players - agent found", players.length, "players")
    } else if (decoded.role === "tenant" || decoded.role === "admin") {
      players = await User.find({
        role: "player",
        tenant_id: decoded.role === "tenant" ? decoded.userId : decoded.tenant_id,
      })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean()

      stats = {
        totalPlayers: players.length,
        verifiedPlayers: players.filter((p) => ["approved", "verified"].includes(p.kyc_status)).length,
        pendingKYC: players.filter((p) => p.kyc_status === "pending").length,
        activePlayers: players.filter((p) => p.status === "active").length,
      }
    }

    return NextResponse.json({ data: players, players, stats, success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get players error:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}

// POST /api/users/players - Create player
export async function POST(request) {
  try {
    console.log("[v0] Player creation request received")

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] Decoded token:", { userId: decoded?.userId, role: decoded?.role })

    if (!decoded || !["agent", "sub_agent", "tenant_admin", "admin"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Forbidden - Only Agent, Sub-Agent, or Tenant Admin can create players" },
        { status: 403 },
      )
    }

    const body = await request.json()
    console.log("[v0] Request body:", body)

    const { email, password, name, phone, username } = body

    if (!name) {
      return NextResponse.json({ error: "Missing required fields: name is required" }, { status: 400 })
    }

    await connectDB()

    const normalizedUsername = username
      ? username.toLowerCase().trim()
      : email
        ? email.split("@")[0].toLowerCase()
        : `player${Date.now()}`

    if (!/^[a-z0-9_-]+$/.test(normalizedUsername)) {
      return NextResponse.json(
        {
          error: "Username can only contain lowercase letters, numbers, underscores, and hyphens",
        },
        { status: 400 },
      )
    }

    const existingUsername = await User.findOne({ username: normalizedUsername })
    if (existingUsername) {
      console.log("[v0] Username already exists:", normalizedUsername)
      return NextResponse.json({ error: "Username already taken" }, { status: 400 })
    }

    if (email) {
      const existingEmail = await User.findOne({ email })
      if (existingEmail) {
        console.log("[v0] Email already exists:", email)
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
    }

    let tenantId = decoded.tenant_id || decoded.tenantId
    let parentAgentId = null
    let subAgentId = null

    if (decoded.role === "tenant_admin") {
      const tenant = await Tenant.findOne({ adminUserId: decoded.userId }).lean()
      if (tenant) {
        tenantId = tenant._id
        console.log("[v0] tenant_admin creating player for tenant:", tenant._id.toString())
      }
    } else {
      const creator = await User.findById(decoded.userId)
      if (creator) {
        tenantId = creator.tenant_id || creator.tenantId || tenantId
        parentAgentId = decoded.role === "sub_agent" ? creator.parentAgentId : decoded.userId
        subAgentId = decoded.role === "sub_agent" ? decoded.userId : null
      }
    }

    if (!tenantId) {
      console.error("[v0] Could not determine tenant_id - cannot create player")
      return NextResponse.json(
        {
          error: "Unable to determine tenant context. Please contact your administrator.",
        },
        { status: 400 },
      )
    }

    const finalPassword = password || `Player${Date.now().toString().slice(-6)}`

    const playerData = {
      password: finalPassword,
      fullName: name,
      username: normalizedUsername,
      role: "player",
      balance: 0,
      status: "active",
      kyc_status: "not_submitted",
      createdBy: decoded.userId,
      tenant_id: tenantId,
      tenantId: tenantId,
    }

    if (parentAgentId) playerData.parentAgentId = parentAgentId
    if (subAgentId) playerData.subAgentId = subAgentId
    if (email && email.trim()) playerData.email = email.trim()
    if (phone && phone.trim()) playerData.phone = phone.trim()

    const player = await User.create(playerData)

    console.log("[v0] Player created successfully:", {
      id: player._id,
      username: player.username,
      fullName: player.fullName,
      tenant_id: player.tenant_id,
      tenantId: player.tenantId,
    })

    try {
      await createAuditLog({
        tenant_id: tenantId,
        actor: {
          userId: decoded.userId,
          email: decoded.email || "unknown",
          role: decoded.role,
        },
        action: "player.create",
        resource: {
          type: "player",
          id: player._id.toString(),
          name: player.fullName,
        },
        changes: {
          before: {},
          after: {
            username: player.username,
            balance: player.balance,
            status: player.status,
          },
        },
        request,
      })
    } catch (auditError) {
      console.error("[v0] Audit log creation failed (non-blocking):", auditError.message)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Player created successfully",
        player: {
          id: player._id,
          email: player.email,
          name: player.fullName,
          username: player.username,
          role: player.role,
          balance: player.balance,
          tempPassword: finalPassword,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create player error:", error)
    return NextResponse.json({ error: "Failed to create player", details: error.message }, { status: 500 })
  }
}
