import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { generateToken } from "@/lib/jwt"
import { createAuditLog } from "@/lib/middleware/audit-middleware"
import { STAFF_ROLES } from "@/lib/staff-permissions"

// Staff roles that can login through this endpoint
const ALLOWED_STAFF_ROLES = [
  STAFF_ROLES.FINANCE_MANAGER,
  STAFF_ROLES.GENERAL_MANAGER,
  STAFF_ROLES.SUPPORT_MANAGER,
  STAFF_ROLES.SUPPORT_AGENT,
]

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password")

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Check if user has a staff role
    if (!ALLOWED_STAFF_ROLES.includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "This login portal is for staff members only. Please use the appropriate login page for your role.",
        },
        { status: 403 },
      )
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Check user status
    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, error: `Your account is ${user.status}. Please contact your administrator.` },
        { status: 403 },
      )
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken({
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      permissions: user.permissions,
    })

    // Create audit log
    await createAuditLog({
      tenant_id: user.tenant_id,
      actor: {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      action: "auth.staff_login",
      resource: {
        type: "user",
        id: user._id.toString(),
        name: user.fullName,
      },
      metadata: {
        loginMethod: "email",
        staffRole: user.role,
      },
      severity: "medium",
      request,
    })

    // Determine redirect URL based on role
    let redirectUrl = "/staff/support"
    if (user.role === STAFF_ROLES.FINANCE_MANAGER) {
      redirectUrl = "/staff/finance"
    } else if (user.role === STAFF_ROLES.GENERAL_MANAGER) {
      redirectUrl = "/staff/gm"
    }

    // Remove sensitive fields
    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      tenant_id: user.tenant_id,
      status: user.status,
      permissions: user.permissions,
      lastLogin: user.lastLogin,
    }

    return NextResponse.json(
      {
        success: true,
        user: userData,
        token,
        redirectUrl,
        message: "Staff login successful",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[Staff Login] Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Login failed" }, { status: 500 })
  }
}
