import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Wallet from "@/lib/models/Wallet"

// GET /api/super/agent-hierarchy - Get agent hierarchy tree with real data
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")

    // Get all agents
    const agentQuery = { role: { $in: ["agent", "sub_agent"] } }
    if (tenantId) {
      agentQuery.tenant_id = tenantId
    }

    const agents = await User.find(agentQuery)
      .populate("tenant_id", "name brandName")
      .select("fullName username email phone role status balance commissionRate parentAgentId createdAt isActive")
      .lean()

    // Get wallet balances for all agents
    const agentIds = agents.map((a) => a._id)
    const wallets = await Wallet.find({ userId: { $in: agentIds } }).lean()

    const walletMap = {}
    wallets.forEach((w) => {
      walletMap[w.userId.toString()] = w.balance || 0
    })

    // Get player counts for each agent
    const playerCounts = await User.aggregate([
      { $match: { role: "player", parentAgentId: { $in: agentIds } } },
      { $group: { _id: "$parentAgentId", count: { $sum: 1 } } },
    ])

    const playerCountMap = {}
    playerCounts.forEach((pc) => {
      playerCountMap[pc._id.toString()] = pc.count
    })

    // Build hierarchy tree
    const agentMap = new Map()
    const rootAgents = []

    // First pass: create agent objects with wallet balance
    agents.forEach((agent) => {
      const agentObj = {
        _id: agent._id.toString(),
        name: agent.fullName || agent.username || agent.email,
        username: agent.username,
        email: agent.email,
        phone: agent.phone,
        role: agent.role,
        status: agent.status || (agent.isActive ? "active" : "inactive"),
        walletBalance: walletMap[agent._id.toString()] || agent.balance || 0,
        commissionRate: agent.commissionRate || 15,
        playersCount: playerCountMap[agent._id.toString()] || 0,
        parentAgentId: agent.parentAgentId?.toString() || null,
        tenant: agent.tenant_id?.name || agent.tenant_id?.brandName || "Unknown",
        createdAt: agent.createdAt,
        subAgents: [],
      }
      agentMap.set(agentObj._id, agentObj)
    })

    // Second pass: build tree structure
    agentMap.forEach((agent) => {
      if (agent.parentAgentId && agentMap.has(agent.parentAgentId)) {
        const parent = agentMap.get(agent.parentAgentId)
        parent.subAgents.push(agent)
      } else {
        rootAgents.push(agent)
      }
    })

    // Calculate totals
    const totalAgents = agents.length
    const activeAgents = agents.filter((a) => a.status === "active" || a.isActive).length
    const totalFloat = wallets.reduce((sum, w) => sum + (w.balance || 0), 0)
    const totalPlayers = Object.values(playerCountMap).reduce((sum, count) => sum + count, 0)

    return NextResponse.json({
      success: true,
      agents: rootAgents,
      total: totalAgents,
      active: activeAgents,
      totalFloat,
      totalPlayers,
    })
  } catch (error) {
    console.error("Agent hierarchy API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
