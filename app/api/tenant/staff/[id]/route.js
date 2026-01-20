import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"

// GET - Get single staff member
export async function GET(request, { params }) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { id } = params

    const staff = await User.findById(id)
      .select("-password -otp")
      .populate("tenant_id", "name")
      .populate("createdBy", "fullName email")

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 })
    }

    // Check tenant access
    if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      if (staff.tenant_id?.toString() !== decoded.tenant_id?.toString()) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error("[v0] Error fetching staff:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update staff member
export async function PUT(request, { params }) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const allowedRoles = ["tenant_admin", "superadmin", "super_admin", "general_manager"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { fullName, email, phone, permissions, isActive, status, department, notes } = body

    const staff = await User.findById(id)
    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 })
    }

    // Check tenant access
    if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      if (staff.tenant_id?.toString() !== decoded.tenant_id?.toString()) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
      }
    }

    // Update fields
    if (fullName) staff.fullName = fullName
    if (email) staff.email = email.toLowerCase()
    if (phone !== undefined) staff.phone = phone
    if (permissions) staff.permissions = { ...staff.permissions, ...permissions }
    if (isActive !== undefined) staff.isActive = isActive
    if (status) staff.status = status
    if (department || notes) {
      staff.staffMetadata = {
        ...staff.staffMetadata,
        department: department || staff.staffMetadata?.department,
        notes: notes || staff.staffMetadata?.notes,
      }
    }

    await staff.save()

    const staffResponse = staff.toObject()
    delete staffResponse.password

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully",
      staff: staffResponse,
    })
  } catch (error) {
    console.error("[v0] Error updating staff:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete/Deactivate staff member
export async function DELETE(request, { params }) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const allowedRoles = ["tenant_admin", "superadmin", "super_admin"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { id } = params

    const staff = await User.findById(id)
    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 })
    }

    // Check tenant access
    if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      if (staff.tenant_id?.toString() !== decoded.tenant_id?.toString()) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
      }
    }

    // Soft delete - deactivate instead of hard delete
    staff.isActive = false
    staff.status = "blocked"
    await staff.save()

    return NextResponse.json({
      success: true,
      message: "Staff member deactivated successfully",
    })
  } catch (error) {
    console.error("[v0] Error deleting staff:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
