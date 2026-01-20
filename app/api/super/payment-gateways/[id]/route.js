import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import PaymentGateway from "@/lib/models/PaymentGateway"

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()
    const { id } = await params

    const gateway = await PaymentGateway.findById(id).populate("tenantId", "name")

    if (!gateway) {
      return NextResponse.json({ error: "Gateway not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, gateway })
  } catch (error) {
    console.error("Error fetching gateway:", error)
    return NextResponse.json({ error: "Failed to fetch gateway" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()
    const { id } = await params
    const body = await request.json()

    const gateway = await PaymentGateway.findByIdAndUpdate(id, { $set: body }, { new: true })

    if (!gateway) {
      return NextResponse.json({ error: "Gateway not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, gateway })
  } catch (error) {
    console.error("Error updating gateway:", error)
    return NextResponse.json({ error: "Failed to update gateway" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()
    const { id } = await params

    const gateway = await PaymentGateway.findByIdAndDelete(id)

    if (!gateway) {
      return NextResponse.json({ error: "Gateway not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Gateway deleted" })
  } catch (error) {
    console.error("Error deleting gateway:", error)
    return NextResponse.json({ error: "Failed to delete gateway" }, { status: 500 })
  }
}
