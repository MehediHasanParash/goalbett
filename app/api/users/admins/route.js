import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"
import { NextResponse } from "next/server"

// GET /api/users/admins - Tenant gets their admins
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("[v0] GET admins - token exists:", !!token)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] GET admins - decoded token:", decoded)

    if (!decoded || decoded.role !== "tenant_admin") {
      console.log("[v0] GET admins - forbidden, role:", decoded?.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const admins = await User.find({
      role: "admin",
      tenantId: decoded.userId,
    }).select("-password")

    console.log("[v0] GET admins - found:", admins.length)
    return NextResponse.json({ admins }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get admins error:", error)
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 })
  }
}

// POST /api/users/admins - Tenant creates admin
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "tenant_admin") {
      return NextResponse.json({ error: "Forbidden - Only Tenant can create admins" }, { status: 403 })
    }

    const { email, password, name, phone, permissions } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    const admin = await User.create({
      email,
      password, // Don't hash manually - let the User model's pre-save hook do it
      fullName: name, // Use fullName to match User model
      role: "admin",
      phone,
      permissions: permissions || {},
      status: "active",
      createdBy: decoded.userId,
      tenantId: decoded.userId,
    })

    return NextResponse.json(
      {
        message: "Admin created successfully",
        admin: {
          id: admin._id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create admin error:", error)
    return NextResponse.json({ error: error.message || "Failed to create admin" }, { status: 500 })
  }
}
