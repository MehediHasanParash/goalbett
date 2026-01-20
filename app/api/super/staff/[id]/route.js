import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"
import bcrypt from "bcryptjs"

// GET - Get single staff member details
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

    if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params

    const staff = await User.findById(id)
      .select("-password -otp")
      .populate("tenant_id", "name slug")
      .populate("createdBy", "fullName email")

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error("[Super Admin Staff] Error fetching staff:", error)
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

    if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { fullName, email, phone, password, role, tenantId, permissions, department, notes, isActive } = body

    const staff = await User.findById(id)
    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 })
    }

    // Check if email is being changed and already exists
    if (email && email.toLowerCase() !== staff.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 })
      }
    }

    // Update fields
    if (fullName) staff.fullName = fullName
    if (email) staff.email = email.toLowerCase()
    if (phone !== undefined) staff.phone = phone
    if (role) staff.role = role
    if (tenantId) staff.tenant_id = tenantId
    if (permissions) staff.permissions = { ...staff.permissions, ...permissions }
    if (isActive !== undefined) staff.isActive = isActive

    // Update password if provided
    if (password) {
      staff.password = await bcrypt.hash(password, 12)
    }

    // Update staff metadata
    staff.staffMetadata = {
      ...staff.staffMetadata,
      department: department || staff.staffMetadata?.department,
      notes: notes || staff.staffMetadata?.notes,
      lastUpdatedBy: decoded.userId,
      lastUpdatedAt: new Date(),
    }

    await staff.save()

    // Populate for response
    await staff.populate("tenant_id", "name slug")
    await staff.populate("createdBy", "fullName email")

    const staffResponse = staff.toObject()
    delete staffResponse.password

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully",
      staff: staffResponse,
    })
  } catch (error) {
    console.error("[Super Admin Staff] Error updating staff:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Deactivate staff member
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

    if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params

    const staff = await User.findById(id)
    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 })
    }

    // Soft delete - just deactivate
    staff.isActive = false
    staff.status = "suspended"
    staff.staffMetadata = {
      ...staff.staffMetadata,
      deactivatedBy: decoded.userId,
      deactivatedAt: new Date(),
    }

    await staff.save()

    return NextResponse.json({
      success: true,
      message: "Staff member deactivated successfully",
    })
  } catch (error) {
    console.error("[Super Admin Staff] Error deactivating staff:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
