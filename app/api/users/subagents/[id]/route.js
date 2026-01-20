import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"

// GET single sub-agent
export async function GET(request, { params }) {
  try {
    console.log("[v0] GET sub-agent - Starting")
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      console.log("[v0] GET sub-agent - No token provided")
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] GET sub-agent - Decoded userId:", decoded?.userId, "role:", decoded?.role)

    if (!decoded || decoded.role !== "agent") {
      console.log("[v0] GET sub-agent - Forbidden: not an agent")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()
    const { id: subAgentId } = await params
    console.log("[v0] GET sub-agent - Fetching subAgentId:", subAgentId)

    const subAgent = await User.findById(subAgentId).select("-password")
    console.log("[v0] GET sub-agent - Found subAgent:", subAgent ? "YES" : "NO")

    if (subAgent) {
      console.log("[v0] GET sub-agent - subAgent.parentAgentId:", subAgent.parentAgentId?.toString())
      console.log("[v0] GET sub-agent - decoded.userId:", decoded.userId)
      console.log("[v0] GET sub-agent - Match?", subAgent.parentAgentId?.toString() === decoded.userId)
    }

    if (!subAgent || subAgent.parentAgentId?.toString() !== decoded.userId) {
      console.log("[v0] GET sub-agent - Sub-agent not found or not owned by agent")
      return NextResponse.json({ error: "Sub-agent not found" }, { status: 404 })
    }

    console.log("[v0] GET sub-agent - Success, returning sub-agent")
    return NextResponse.json({ subAgent }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get sub-agent error:", error)
    return NextResponse.json({ error: "Failed to fetch sub-agent" }, { status: 500 })
  }
}

// PUT (update) sub-agent
export async function PUT(request, { params }) {
  try {
    console.log("[v0] PUT sub-agent - Starting")
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      console.log("[v0] PUT sub-agent - No token provided")
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] PUT sub-agent - Decoded userId:", decoded?.userId)

    if (!decoded || decoded.role !== "agent") {
      console.log("[v0] PUT sub-agent - Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    console.log("[v0] PUT sub-agent - Body:", body)

    await connectToDatabase()

    const { id: subAgentId } = await params
    console.log("[v0] PUT sub-agent - Updating subAgentId:", subAgentId)

    const subAgent = await User.findById(subAgentId)
    console.log("[v0] PUT sub-agent - Found subAgent:", subAgent ? "YES" : "NO")

    if (!subAgent || subAgent.parentAgentId?.toString() !== decoded.userId) {
      console.log("[v0] PUT sub-agent - Sub-agent not found or not owned")
      return NextResponse.json({ error: "Sub-agent not found" }, { status: 404 })
    }

    if (body.fullName) subAgent.fullName = body.fullName
    if (body.email) subAgent.email = body.email
    if (body.phone) subAgent.phone = body.phone
    if (body.location !== undefined) subAgent.location = body.location
    if (body.commissionRate !== undefined) subAgent.commissionRate = body.commissionRate
    if (body.isActive !== undefined) subAgent.isActive = body.isActive

    await subAgent.save()
    console.log("[v0] PUT sub-agent - Updated successfully")

    return NextResponse.json({ message: "Sub-agent updated successfully", subAgent }, { status: 200 })
  } catch (error) {
    console.error("[v0] Update sub-agent error:", error)
    return NextResponse.json({ error: "Failed to update sub-agent" }, { status: 500 })
  }
}

// DELETE sub-agent
export async function DELETE(request, { params }) {
  try {
    console.log("[v0] DELETE sub-agent - Starting")
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "agent") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()
    const { id: subAgentId } = await params
    console.log("[v0] DELETE sub-agent - Deleting subAgentId:", subAgentId)

    const subAgent = await User.findById(subAgentId)
    if (!subAgent || subAgent.parentAgentId?.toString() !== decoded.userId) {
      console.log("[v0] DELETE sub-agent - Not found or not owned")
      return NextResponse.json({ error: "Sub-agent not found" }, { status: 404 })
    }

    await User.findByIdAndDelete(subAgentId)
    console.log("[v0] DELETE sub-agent - Deleted successfully")

    return NextResponse.json({ message: "Sub-agent deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Delete sub-agent error:", error)
    return NextResponse.json({ error: "Failed to delete sub-agent" }, { status: 500 })
  }
}
