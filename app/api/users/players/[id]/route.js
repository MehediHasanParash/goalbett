import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"

// GET - Get single player details
export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["tenant_admin", "agent", "sub_agent"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const { id } = await params
    const player = await User.findById(id).select("-password")

    if (!player || player.role !== "player") {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Verify player belongs to tenant
    const adminUserId = decoded.userId
    const tenantIdFromToken = decoded.tenant_id

    let tenant = await Tenant.findOne({ adminUserId })
    if (!tenant && tenantIdFromToken) {
      tenant = await Tenant.findById(tenantIdFromToken)
    }

    const tenantId = tenant?._id?.toString()
    const playerTenantId = player.tenantId?.toString() || player.tenant_id?.toString()

    if (playerTenantId !== tenantId && playerTenantId !== adminUserId) {
      return NextResponse.json({ error: "Player not found in your tenant" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: player })
  } catch (error) {
    console.error("Get player error:", error)
    return NextResponse.json({ error: "Failed to get player" }, { status: 500 })
  }
}

// PUT - Update player
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["tenant_admin", "agent", "sub_agent"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const { id } = await params
    const body = await request.json()
    const { fullName, email, phone, status, isActive, balance, username } = body

    const player = await User.findById(id)

    if (!player || player.role !== "player") {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Verify player belongs to tenant
    const adminUserId = decoded.userId
    const tenantIdFromToken = decoded.tenant_id

    let tenant = await Tenant.findOne({ adminUserId })
    if (!tenant && tenantIdFromToken) {
      tenant = await Tenant.findById(tenantIdFromToken)
    }

    const tenantId = tenant?._id?.toString()
    const playerTenantId = player.tenantId?.toString() || player.tenant_id?.toString()

    if (playerTenantId !== tenantId && playerTenantId !== adminUserId) {
      return NextResponse.json({ error: "Player not found in your tenant" }, { status: 404 })
    }

    // Update fields
    if (fullName) player.fullName = fullName
    if (email) player.email = email
    if (phone !== undefined) player.phone = phone
    if (username) player.username = username
    if (status) player.status = status
    if (typeof isActive === "boolean") player.isActive = isActive
    if (typeof balance === "number") player.balance = balance

    await player.save()

    return NextResponse.json({
      success: true,
      message: "Player updated successfully",
      data: player,
    })
  } catch (error) {
    console.error("Update player error:", error)
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 })
  }
}

// DELETE - Delete player
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["tenant_admin", "agent", "sub_agent"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const { id } = await params
    const player = await User.findById(id)

    if (!player || player.role !== "player") {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Verify player belongs to tenant
    const adminUserId = decoded.userId
    const tenantIdFromToken = decoded.tenant_id

    let tenant = await Tenant.findOne({ adminUserId })
    if (!tenant && tenantIdFromToken) {
      tenant = await Tenant.findById(tenantIdFromToken)
    }

    const tenantId = tenant?._id?.toString()
    const playerTenantId = player.tenantId?.toString() || player.tenant_id?.toString()

    if (playerTenantId !== tenantId && playerTenantId !== adminUserId) {
      return NextResponse.json({ error: "Player not found in your tenant" }, { status: 404 })
    }

    await User.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: "Player deleted successfully",
    })
  } catch (error) {
    console.error("Delete player error:", error)
    return NextResponse.json({ error: "Failed to delete player" }, { status: 500 })
  }
}
