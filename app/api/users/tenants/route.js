import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { generateToken } from "@/lib/jwt"
import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

// GET /api/users/tenants - Super Admin gets all tenants
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    const tenants = await User.find({ role: "tenant_admin" }).select("-password")

    const tenantsWithCounts = await Promise.all(
      tenants.map(async (tenant) => {
        const agentCount = await User.countDocuments({ role: "agent", tenantId: tenant._id })
        const adminCount = await User.countDocuments({ role: "admin", tenantId: tenant._id })

        return {
          ...tenant.toJSON(),
          agentCount,
          adminCount,
          businessName: tenant.tenantConfig?.businessName || tenant.fullName,
          domain: tenant.tenantConfig?.domain || "",
          currency: tenant.tenantConfig?.currency || "USD",
          status: tenant.tenantConfig?.status || "pending",
          modules: tenant.tenantConfig?.enabledModules || [],
        }
      }),
    )

    return NextResponse.json({ tenants: tenantsWithCounts }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get tenants error:", error)
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}

// POST /api/users/tenants - Super Admin creates tenant
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden - Only Super Admin can create tenants" }, { status: 403 })
    }

    const { email, password, name, businessName, domain, currency, timezone } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    // Check if tenant already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Tenant with this email already exists" }, { status: 400 })
    }

    const tenant = await User.create({
      fullName: name,
      email,
      password: password,
      role: "tenant_admin",
      phone: "",
      isActive: true,
      tenantConfig: {
        businessName: businessName || name,
        domain: domain || "",
        currency: currency || "USD",
        timezone: timezone || "UTC",
        status: "active", // Changed from 'pending' to 'active'
        primaryColor: "#FFD700",
        secondaryColor: "#0A1A2F",
        enabledModules: ["sports", "casino"],
        paymentProviders: {
          bank: { enabled: true },
          mpesa: { enabled: true },
          orange: { enabled: true },
          card: { enabled: true },
        },
        riskSettings: {
          maxBetPerSlip: 10000,
          maxDailyExposure: 100000,
          autoLimitThreshold: 50000,
        },
      },
    })

    return NextResponse.json(
      {
        message: "Tenant created successfully",
        tenant: {
          id: tenant._id,
          email: tenant.email,
          fullName: tenant.fullName,
          role: tenant.role,
          businessName: businessName || name,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create tenant error:", error)
    return NextResponse.json({ error: error.message || "Failed to create tenant" }, { status: 500 })
  }
}
