import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Transaction from "@/lib/models/Transaction"

// GET /api/super/agents - Super admin gets all agents across all tenants
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
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized - Super admin only" }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    const query = {
      role: { $in: ["agent", "sub_agent"] },
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

    const agents = await User.find(query)
      .populate("tenant_id", "name businessName brandName domain status")
      .select(
        "fullName username email phone role tenant_id status balance commissionRate createdAt parentAgentId isActive creditLimit collateralDeposit collateralRatio usedCredit",
      )
      .sort({ createdAt: -1 })
      .lean()

    // Get player counts for each agent
    const agentIds = agents.map((a) => a._id)
    const playerCounts = await User.aggregate([
      { $match: { role: "player", parentAgentId: { $in: agentIds } } },
      { $group: { _id: "$parentAgentId", count: { $sum: 1 } } },
    ])

    const playerCountMap = {}
    playerCounts.forEach((pc) => {
      playerCountMap[pc._id.toString()] = pc.count
    })

    const commissionTransactions = await Transaction.aggregate([
      {
        $match: {
          type: { $in: ["commission", "agent_commission"] },
          status: "completed",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    // Also get commission per agent
    const agentCommissions = await Transaction.aggregate([
      {
        $match: {
          userId: { $in: agentIds },
          type: { $in: ["commission", "agent_commission"] },
          status: "completed",
        },
      },
      { $group: { _id: "$userId", total: { $sum: "$amount" } } },
    ])

    const commissionMap = {}
    agentCommissions.forEach((ac) => {
      commissionMap[ac._id.toString()] = ac.total
    })

    const totalCommission = commissionTransactions[0]?.total || 0

    // Calculate stats
    const activeAgents = agents.filter((a) => a.status === "active" || a.isActive).length
    const subAgents = agents.filter((a) => a.role === "sub_agent").length

    const formattedAgents = agents.map((agent) => ({
      ...agent,
      _id: agent._id.toString(),
      tenant_id: agent.tenant_id?._id?.toString() || agent.tenant_id?.toString() || null,
      playerCount: playerCountMap[agent._id.toString()] || 0,
      earnedCommission: commissionMap[agent._id.toString()] || 0,
      tenant: {
        name: agent.tenant_id?.name || agent.tenant_id?.businessName || agent.tenant_id?.brandName,
        brandName: agent.tenant_id?.brandName || agent.tenant_id?.name,
        domain: agent.tenant_id?.domain,
        status: agent.tenant_id?.status,
      },
      tenantName: agent.tenant_id?.name || agent.tenant_id?.businessName || "No Tenant",
      tenantDomain: agent.tenant_id?.domain || "-",
      tenantStatus: agent.tenant_id?.status || "unknown",
    }))

    return NextResponse.json({
      success: true,
      agents: formattedAgents,
      total: formattedAgents.length,
      stats: {
        totalAgents: agents.length,
        activeAgents,
        subAgents,
        totalCommission,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching agents for super admin:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch agents" }, { status: 500 })
  }
}

// POST /api/super/agents - Super admin creates a new agent
export async function POST(request) {
  try {
    let token = null

    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }

    if (!token) {
      token = request.cookies.get("token")?.value
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized - Super admin only" }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()
    console.log("[v0] POST Agent - Raw body received:", JSON.stringify(body, null, 2))
    console.log("[v0] POST Agent - tenant_id type:", typeof body.tenant_id, "value:", body.tenant_id)

    const {
      fullName,
      username,
      email,
      phone,
      password,
      role,
      tenant_id,
      commissionRate,
      parentAgentId,
      status,
      creditLimit,
      collateralDeposit,
      collateralRatio,
      usedCredit,
    } = body

    // Validate required fields
    if (!fullName || !email || !password || !role || !tenant_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: fullName, email, password, role, and tenant_id are required",
        },
        { status: 400 },
      )
    }

    // Validate role
    if (!["agent", "sub_agent"].includes(role)) {
      return NextResponse.json({ success: false, error: "Role must be 'agent' or 'sub_agent'" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username: username || null }, { phone: phone || null }],
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email, username, or phone already exists" },
        { status: 400 },
      )
    }

    // Create new agent
    const newAgent = await User.create({
      fullName,
      username,
      email,
      phone,
      password,
      role,
      tenant_id,
      commissionRate: commissionRate || 5,
      parentAgentId: parentAgentId || null,
      status: status || "active",
      isActive: true,
      creditLimit: creditLimit || 0,
      collateralDeposit: collateralDeposit || 0,
      collateralRatio: collateralRatio || 0,
      usedCredit: usedCredit || 0,
    })

    const agent = await User.findById(newAgent._id)
      .populate("tenant_id", "name businessName brandName domain status")
      .select("-password")
      .lean()

    return NextResponse.json({
      success: true,
      agent: {
        ...agent,
        _id: agent._id.toString(),
        tenant_id: agent.tenant_id?._id?.toString() || agent.tenant_id?.toString() || null,
        playerCount: 0,
        earnedCommission: 0,
        tenant: {
          name: agent.tenant_id?.name || agent.tenant_id?.businessName || agent.tenant_id?.brandName,
          brandName: agent.tenant_id?.brandName || agent.tenant_id?.name,
          domain: agent.tenant_id?.domain,
          status: agent.tenant_id?.status,
        },
        tenantName: agent.tenant_id?.name || agent.tenant_id?.businessName || "No Tenant",
        tenantDomain: agent.tenant_id?.domain || "-",
      },
    })
  } catch (error) {
    console.error("[v0] Error creating agent:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to create agent" }, { status: 500 })
  }
}
