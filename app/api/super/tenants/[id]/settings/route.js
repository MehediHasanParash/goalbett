import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Tenant from "@/lib/models/Tenant"
import { verifyToken } from "@/lib/auth"

export async function PUT(request, { params }) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { id } = params
    const { settings } = await request.json()

    const tenant = await Tenant.findByIdAndUpdate(id, { $set: { settings } }, { new: true, runValidators: false })

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, tenant })
  } catch (error) {
    console.error("Error updating tenant settings:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { id } = params
    const tenant = await Tenant.findById(id)

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, settings: tenant.settings })
  } catch (error) {
    console.error("Error fetching tenant settings:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
