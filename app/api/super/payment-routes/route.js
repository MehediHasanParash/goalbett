import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import PaymentRoute from "@/lib/models/PaymentRoute"

export async function GET(request) {
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

    const routes = await PaymentRoute.find({})
      .populate("primaryGateway", "name displayName status")
      .populate("fallbackGateways", "name displayName status")
      .populate("tenantId", "name")
      .sort({ priority: -1, createdAt: -1 })
      .lean()

    return NextResponse.json({ success: true, routes })
  } catch (error) {
    console.error("Error fetching payment routes:", error)
    return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 })
  }
}

export async function POST(request) {
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
    const body = await request.json()

    const route = new PaymentRoute(body)
    await route.save()

    return NextResponse.json({ success: true, route })
  } catch (error) {
    console.error("Error creating payment route:", error)
    return NextResponse.json({ error: "Failed to create route" }, { status: 500 })
  }
}
