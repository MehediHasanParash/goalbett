import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"

export async function POST(request) {
  console.log("[v0] [Setup] Creating test tenant XBet...")

  try {
    await connectDB()

    // Find provider tenant
    const providerTenant = await Tenant.findOne({ type: "provider" })

    if (!providerTenant) {
      return NextResponse.json(
        { success: false, error: "Provider tenant not found. Run /api/setup/provider-tenant first" },
        { status: 404 },
      )
    }

    // Check if XBet already exists
    let xbetTenant = await Tenant.findOne({ slug: "xbet" })

    if (xbetTenant) {
      console.log("[v0] [Setup] XBet tenant already exists")
      return NextResponse.json({
        success: true,
        message: "XBet tenant already exists",
        tenant: {
          _id: xbetTenant._id,
          name: xbetTenant.name,
          slug: xbetTenant.slug,
          theme: xbetTenant.theme,
        },
      })
    }

    // Create XBet admin user
    const xbetAdmin = await User.create({
      fullName: "XBet Admin",
      email: "admin@xbet.com",
      password: await bcrypt.hash("xbet123", 10),
      role: "tenant_admin",
      status: "active",
      isActive: true,
    })

    console.log("[v0] [Setup] Created XBet admin user")

    // Create XBet tenant
    xbetTenant = await Tenant.create({
      name: "XBet Casino",
      slug: "xbet",
      type: "client",
      status: "active",
      adminUserId: xbetAdmin._id,
      providerId: providerTenant._id,
      theme: {
        primaryColor: "#0066FF",
        secondaryColor: "#FFD700",
        accentColor: "#FF6B00",
        logoUrl: "https://via.placeholder.com/150x50/0066FF/FFFFFF?text=XBet",
        brandName: "XBet Casino",
      },
      domain_list: [
        { domain: "xbet.localhost:3000", isPrimary: true, isActive: true },
        { domain: "2xbet.localhost:3000", isPrimary: false, isActive: true },
      ],
      metadata: {
        businessName: "XBet Casino Company",
        contactEmail: "admin@xbet.com",
        timezone: "UTC",
      },
      revenueShare: {
        providerPercentage: 15,
        tenantPercentage: 85,
        isEnabled: true,
      },
      subscription: {
        plan: "pro",
        isActive: true,
      },
    })

    console.log("[v0] [Setup] ✓ Created XBet tenant")

    // Update XBet admin with tenant_id
    await User.updateOne({ _id: xbetAdmin._id }, { $set: { tenant_id: xbetTenant._id } })

    return NextResponse.json({
      success: true,
      message: "XBet tenant created successfully",
      tenant: {
        _id: xbetTenant._id,
        name: xbetTenant.name,
        slug: xbetTenant.slug,
        theme: xbetTenant.theme,
      },
      admin: {
        email: "admin@xbet.com",
        password: "xbet123",
      },
    })
  } catch (error) {
    console.error("[v0] [Setup] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create test tenant",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
