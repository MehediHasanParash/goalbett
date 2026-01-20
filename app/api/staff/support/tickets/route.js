import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import SupportTicket from "@/lib/models/SupportTicket"
import { verifyToken } from "@/lib/jwt"
import { hasPermission } from "@/lib/staff-permissions"

export async function GET(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !hasPermission(decoded.role, "view_tickets")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tenantId = decoded.tenant_id || decoded.tenantId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const query = { tenant_id: tenantId }
    if (status && status !== "all") query.status = status
    if (priority && priority !== "all") query.priority = priority

    const tickets = await SupportTicket.find(query)
      .populate("user_id", "firstName lastName fullName email username")
      .populate("assignedTo", "firstName lastName fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const total = await SupportTicket.countDocuments(query)

    // Get stats
    const stats = {
      total: await SupportTicket.countDocuments({ tenant_id: tenantId }),
      open: await SupportTicket.countDocuments({ tenant_id: tenantId, status: "open" }),
      inProgress: await SupportTicket.countDocuments({ tenant_id: tenantId, status: "in_progress" }),
      resolved: await SupportTicket.countDocuments({ tenant_id: tenantId, status: "resolved" }),
      urgent: await SupportTicket.countDocuments({
        tenant_id: tenantId,
        priority: "urgent",
        status: { $ne: "resolved" },
      }),
    }

    return NextResponse.json({
      tickets,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !hasPermission(decoded.role, "view_tickets")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tenantId = decoded.tenant_id || decoded.tenantId

    const body = await request.json()
    const { ticketId, status, note, assignedTo } = body

    const updateData = {}
    if (status) updateData.status = status
    if (assignedTo) updateData.assignedTo = assignedTo
    if (note) {
      updateData.$push = {
        notes: {
          content: note,
          createdBy: decoded.userId,
          createdAt: new Date(),
        },
      }
    }

    const ticket = await SupportTicket.findOneAndUpdate({ _id: ticketId, tenant_id: tenantId }, updateData, {
      new: true,
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
