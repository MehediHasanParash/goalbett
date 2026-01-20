import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"
import { verifyToken } from "@/lib/jwt"
import { DEFAULT_PERMISSIONS } from "@/lib/auth-service"

// GET - Fetch all staff members (super admin level - can see all tenants)
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

    // Only superadmin can access this endpoint
    if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized - Super Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant")
    const roleFilter = searchParams.get("role")

    const staffRoles = ["finance_manager", "general_manager", "support_manager", "support_agent"]

    const query = {
      role: { $in: staffRoles },
    }

    // Filter by specific tenant if provided
    if (tenantId && tenantId !== "all") {
      query.tenant_id = tenantId
    }

    // Filter by specific role if provided
    if (roleFilter && roleFilter !== "all") {
      query.role = roleFilter
    }

    const staff = await User.find(query)
      .select(
        "_id fullName email phone role tenant_id createdBy permissions staffMetadata isActive status createdAt updatedAt lastLogin avatar",
      )
      .populate("tenant_id", "name slug")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })

    // Get tenants for dropdown
    const tenants = await Tenant.find({
      status: { $in: ["active", "trial"] },
    })
      .select("_id name slug")
      .sort({ name: 1 })

    return NextResponse.json({
      success: true,
      staff,
      tenants,
      count: staff.length,
    })
  } catch (error) {
    console.error("[Super Admin Staff] Error fetching staff:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create a new staff member (super admin can assign to any tenant)
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

    // Only superadmin can access this endpoint
    if (decoded.role !== "superadmin" && decoded.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized - Super Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { fullName, email, phone, password, role, tenantId, permissions, department, notes } = body

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Full name, email, password, and role are required" },
        { status: 400 },
      )
    }

    // Validate tenant for tenant-level staff
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Please select a tenant for this staff member" },
        { status: 400 },
      )
    }

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId)
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Selected tenant not found" }, { status: 400 })
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
      password, // Pass plain password, not hashedPassword
      role,
      tenant_id: tenantId,
      createdBy: decoded.userId,
      permissions: finalPermissions,
      staffMetadata: {
        department,
        notes,
        hireDate: new Date(),
        createdBySuper: true,
      },
      isActive: true,
      status: "active",
    })

    await staffMember.save()

    // Populate tenant info for response
    await staffMember.populate("tenant_id", "name slug")

    // Remove password from response
    const staffResponse = staffMember.toObject()
    delete staffResponse.password

    return NextResponse.json({
      success: true,
      message: `${role.replace(/_/g, " ")} created successfully for ${tenant.name}`,
      staff: staffResponse,
    })
  } catch (error) {
    console.error("[Super Admin Staff] Error creating staff:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
