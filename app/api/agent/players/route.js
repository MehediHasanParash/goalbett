import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import User from "@/lib/models/User"
import connectDB from "@/lib/db"

// GET - List agent's players with search
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const userRole = (decoded.role || "").toLowerCase().replace(/[_-]/g, "")
    const isAgent = userRole === "agent" || userRole === "subagent" || userRole.includes("agent")

    if (!isAgent) {
      return NextResponse.json(
        { success: false, error: `Agent access required. Current role: ${decoded.role}` },
        { status: 403 },
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const searchType = searchParams.get("searchType") || "phone"
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Get agent's tenant_id from database
    const agent = await User.findById(decoded.userId).select("tenant_id").lean()

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const agentTenantId = agent.tenant_id

    if (!agentTenantId) {
      return NextResponse.json({ success: false, error: "Agent must belong to a tenant" }, { status: 403 })
    }

    const query = {
      tenant_id: agentTenantId,
      role: "player",
    }

    if (search) {
      if (searchType === "phone") {
        query.phone = { $regex: search, $options: "i" }
      } else if (searchType === "email") {
        query.email = { $regex: search, $options: "i" }
      } else if (searchType === "username") {
        query.username = { $regex: search, $options: "i" }
      } else {
        // Search all fields
        query.$or = [
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ]
      }
    }

    const players = await User.find(query)
      .select("_id username email phone fullName firstName lastName tenant_id balance createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      data: players,
      total: players.length,
    })
  } catch (error) {
    console.error("[v0] Agent players list error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
