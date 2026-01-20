import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"
import { DEFAULT_PERMISSIONS } from "@/lib/auth-service"
import { canCreateRole } from "@/lib/staff-permissions"

// GET - Fetch all staff members for a tenant
export async function GET(request) {
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

    // Only tenant_admin, general_manager, and superadmin can view staff
    const allowedRoles = ["tenant_admin", "superadmin", "super_admin", "general_manager"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const staffRoles = ["finance_manager", "general_manager", "support_manager", "support_agent"]

    let query = {}

    // General managers can only see support staff they created
    if (decoded.role === "general_manager") {
      query = {
        tenant_id: decoded.tenant_id,
        $or: [
          { createdBy: decoded.userId, role: { $in: staffRoles } },
          { role: { $in: ["support_manager", "support_agent"] } },
        ],
      }
    } else if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      // Regular tenant admin - see all staff for their tenant
      query = {
        tenant_id: decoded.tenant_id,
        role: { $in: staffRoles },
      }
    } else {
      // Superadmin - see all staff
      query = {
        role: { $in: staffRoles },
      }
    }

    const staff = await User.find(query)
      .select(
        "fullName email phone role tenant_id createdBy permissions staffMetadata isActive status createdAt updatedAt lastLogin",
      )
      .populate("tenant_id", "name")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      staff,
      count: staff.length,
    })
  } catch (error) {
    console.error("[Tenant Staff API] Error fetching staff:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create a new staff member
export async function POST(request) {
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

    const body = await request.json()
    const { fullName, email, phone, password, role, permissions, department, notes } = body

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Full name, email, password, and role are required" },
        { status: 400 },
      )
    }

    // Check if creator can create this role
    if (!canCreateRole(decoded.role, role)) {
      return NextResponse.json(
        { success: false, error: `You don't have permission to create ${role} users` },
        { status: 403 },
      )
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 })
    }

    // Get default permissions for role and merge with custom permissions
    const defaultPerms = DEFAULT_PERMISSIONS[role] || {}
    const finalPermissions = { ...defaultPerms, ...permissions }

    // Create staff member
    const staffMember = new User({
      fullName,
      email: email.toLowerCase(),
      phone,
      password,
      role,
      tenant_id: decoded.tenant_id,
      createdBy: decoded.userId,
      permissions: finalPermissions,
      staffMetadata: {
        department,
        notes,
        hireDate: new Date(),
      },
      isActive: true,
      status: "active",
    })

    await staffMember.save()

    // Remove password from response
    const staffResponse = staffMember.toObject()
    delete staffResponse.password

    return NextResponse.json({
      success: true,
      message: `${role.replace("_", " ")} created successfully`,
      staff: staffResponse,
    })
  } catch (error) {
    console.error("[v0] Error creating staff:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
