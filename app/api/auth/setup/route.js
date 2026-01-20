import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { generateToken } from "@/lib/jwt"

export async function POST(request) {
  try {
    const { setupKey, email, password, fullName } = await request.json()

    // Security: Check setup key (you should set this in your .env)
    if (setupKey !== process.env.SETUP_KEY) {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 403 })
    }

    await connectDB()

    // Check if any super admin already exists
    const existingSuperAdmin = await User.findOne({ role: "superadmin" })
    if (existingSuperAdmin) {
      return NextResponse.json({ error: "Super Admin already exists. Use normal login." }, { status: 400 })
    }

    // Create the first Super Admin
    const superAdmin = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
      role: "superadmin",
      isActive: true,
      balance: 0,
      permissions: {
        canManageTenants: true,
        canManageGames: true,
        canManageProviders: true,
        canViewAllReports: true,
        canManageSystem: true,
      },
    })

    const token = generateToken({
      userId: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role,
    })

    // Return user data without password
    const userData = superAdmin.toJSON()

    return NextResponse.json({
      success: true,
      message: "Super Admin created successfully",
      token,
      user: userData,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Setup failed: " + error.message }, { status: 500 })
  }
}
