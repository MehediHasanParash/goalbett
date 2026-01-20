import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import User from "@/lib/models/User"
import TenantConfig from "@/lib/models/TenantConfig"
import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

// POST /api/provider/tenants - Create new client tenant (white-label)
export async function POST(request) {
  try {
    console.log("[v0] [Provider API] Creating new client tenant...")

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.log("[v0] [Provider API] ✗ No auth token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] [Provider API] Decoded token:", { userId: decoded.userId, role: decoded.role })

    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      console.log("[v0] [Provider API] ✗ Insufficient permissions")
      return NextResponse.json({ error: "Forbidden - Only Provider Admin can create tenants" }, { status: 403 })
    }

    const body = await request.json()
    console.log("[v0] [Provider API] Request body:", JSON.stringify(body, null, 2))

    const {
      companyName,
      slug,
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      customDomain,
      adminEmail,
      adminPassword,
      revenueSharePercentage = 10,
      currency = "USD",
      timezone = "UTC",
      contactPhone,
      address,
    } = body

    // Validation
    if (!companyName || !slug || !adminEmail || !adminPassword) {
      console.log("[v0] [Provider API] ✗ Missing required fields")
      return NextResponse.json(
        {
          error: "Missing required fields: companyName, slug, adminEmail, adminPassword",
        },
        { status: 400 },
      )
    }

    await connectDB()

    // Check if slug exists
    const existingTenant = await Tenant.findOne({ slug })
    if (existingTenant) {
      console.log("[v0] [Provider API] ✗ Slug already exists:", slug)
      return NextResponse.json({ error: "A tenant with this slug already exists" }, { status: 400 })
    }

    // Check if admin email exists
    const existingUser = await User.findOne({ email: adminEmail })
    if (existingUser) {
      console.log("[v0] [Provider API] ✗ Email already exists:", adminEmail)
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
    }

    // Get provider tenant (GoalBet)
    const providerTenant = await Tenant.findOne({ type: "provider" })
    if (!providerTenant) {
      console.log("[v0] [Provider API] ✗ Provider tenant not found")
      return NextResponse.json({ error: "Provider tenant not found. Please setup GoalBet first." }, { status: 500 })
    }

    console.log("[v0] [Provider API] Provider tenant found:", providerTenant.name)

    // Create tenant admin user
    console.log("[v0] [Provider API] Creating admin user...")
    const adminUser = await User.create({
      fullName: `${companyName} Admin`,
      email: adminEmail,
      password: adminPassword,
      role: "tenant_admin",
      isActive: true,
      status: "active",
    })
    console.log("[v0] [Provider API] ✓ Admin user created:", adminUser._id)

    // Create client tenant
    console.log("[v0] [Provider API] Creating tenant...")
    const tenant = await Tenant.create({
      name: companyName,
      slug: slug.toLowerCase(),
      type: "client",
      status: "trial",
      providerId: providerTenant._id,
      subscription: {
        plan: "trial",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        isActive: true,
      },
      revenueShare: {
        providerPercentage: revenueSharePercentage,
        tenantPercentage: 100 - revenueSharePercentage,
        isEnabled: true,
      },
      default_currency: currency,
      theme: {
        primaryColor: primaryColor || "#FFD700",
        secondaryColor: secondaryColor || "#0A1A2F",
        accentColor: accentColor || "#4A90E2",
        logoUrl: logoUrl || "",
        brandName: companyName,
        customCSS: "",
      },
      domain_list: customDomain
        ? [
            {
              domain: customDomain,
              isPrimary: true,
              isActive: true,
            },
          ]
        : [],
      adminUserId: adminUser._id,
      metadata: {
        businessName: companyName,
        contactEmail: adminEmail,
        contactPhone: contactPhone || "",
        address: address || "",
        timezone: timezone,
      },
      stats: {
        totalUsers: 0,
        totalRevenue: 0,
        totalProviderRevenue: 0,
      },
    })

    console.log("[v0] [Provider API] ✓ Tenant created:", tenant._id)

    // Link admin user to tenant
    await User.findByIdAndUpdate(adminUser._id, {
      tenant_id: tenant._id,
      tenantId: tenant._id,
    })
    console.log("[v0] [Provider API] ✓ Admin user linked to tenant")

    // Create default tenant configs
    console.log("[v0] [Provider API] Creating default configs...")
    await TenantConfig.create([
      {
        tenant_id: tenant._id,
        key: "payment_providers",
        value: {
          bank: { enabled: false },
          mpesa: { enabled: false },
          card: { enabled: false },
        },
      },
      {
        tenant_id: tenant._id,
        key: "enabled_modules",
        value: ["sports", "casino"],
      },
      {
        tenant_id: tenant._id,
        key: "risk_settings",
        value: {
          maxBetPerSlip: 10000,
          maxDailyExposure: 100000,
          autoLimitThreshold: 50000,
        },
      },
    ])
    console.log("[v0] [Provider API] ✓ Default configs created")

    const response = {
      message: "Client tenant created successfully!",
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        status: tenant.status,
        providerId: tenant.providerId,
        revenueShare: tenant.revenueShare,
        theme: tenant.theme,
        customDomain: customDomain || null,
        subscriptionEndDate: tenant.subscription.endDate,
        adminEmail: adminEmail,
        accessUrl: customDomain || `https://${slug}.goalbet.com`,
      },
    }

    console.log("[v0] [Provider API] ✓ Tenant creation complete!")
    console.log("[v0] [Provider API] Response:", JSON.stringify(response, null, 2))

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error("[v0] [Provider API] ✗ Error creating tenant:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to create tenant",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}

// GET /api/provider/tenants - List all client tenants
export async function GET(request) {
  try {
    console.log("[v0] [Provider API] Fetching all client tenants...")

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    // Get provider tenant
    const providerTenant = await Tenant.findOne({ type: "provider" })

    // Get all client tenants under this provider
    const tenants = await Tenant.find({
      providerId: providerTenant._id,
      type: "client",
    })
      .populate("adminUserId", "email fullName")
      .sort({ createdAt: -1 })
      .lean()

    console.log("[v0] [Provider API] Found", tenants.length, "client tenants")

    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        // Count users for each tenant
        const userCounts = await User.aggregate([
          { $match: { tenant_id: tenant._id } },
          { $group: { _id: "$role", count: { $sum: 1 } } },
        ])

        const stats = userCounts.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {})

        return {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          type: tenant.type,
          status: tenant.status,
          subscription: tenant.subscription,
          revenueShare: tenant.revenueShare,
          theme: tenant.theme,
          domain: tenant.domain_list?.[0]?.domain || null,
          adminEmail: tenant.adminUserId?.email,
          adminName: tenant.adminUserId?.fullName,
          createdAt: tenant.createdAt,
          stats: {
            ...tenant.stats,
            players: stats.player || 0,
            agents: stats.agent || 0,
            subAgents: stats.sub_agent || 0,
            admins: stats.admin || 0,
          },
        }
      }),
    )

    return NextResponse.json({ tenants: tenantsWithStats }, { status: 200 })
  } catch (error) {
    console.error("[v0] [Provider API] Error fetching tenants:", error)
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}
