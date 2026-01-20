import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import User from "@/lib/models/User"

export async function POST(request) {
  try {
    console.log("[v0] Starting provider tenant setup...")

    await connectDB()
    console.log("[v0] Connected to database")

    // Check if provider tenant already exists
    const existingProvider = await Tenant.findOne({ type: "provider" })

    if (existingProvider) {
      console.log("[v0] Provider tenant already exists:", existingProvider.name)
      return NextResponse.json({
        success: true,
        message: "Provider tenant already exists",
        tenant: {
          id: existingProvider._id,
          name: existingProvider.name,
          slug: existingProvider.slug,
          type: existingProvider.type,
        },
      })
    }

    const superAdmin = await User.findOne({
      $or: [{ role: "superadmin" }, { role: "super_admin" }, { role: "tenant_admin" }],
    })

    if (!superAdmin) {
      console.error("[v0] No super admin found in database")
      return NextResponse.json(
        { success: false, error: "No super admin user found. Please create super admin first." },
        { status: 400 },
      )
    }

    console.log("[v0] Found super admin:", superAdmin.email || superAdmin.username)

    const providerTenant = await Tenant.create({
      name: "GoalBet",
      slug: "goalbet",
      type: "provider",
      status: "active",
      providerId: null,
      domain_list: [
        {
          domain: "localhost:3000",
          isPrimary: true,
          isActive: true,
        },
      ],
      theme: {
        primaryColor: "#FFD700",
        secondaryColor: "#0A1A2F",
        accentColor: "#4A90E2",
        brandName: "GoalBet",
        logoUrl: "/images/goal-betting-logo.png",
      },
      subscription: {
        plan: "enterprise",
        isActive: true,
      },
      revenueShare: {
        providerPercentage: 0,
        tenantPercentage: 100,
        isEnabled: false,
      },
      adminUserId: superAdmin._id,
      metadata: {
        businessName: "GoalBet Inc.",
        contactEmail: superAdmin.email,
        timezone: "UTC",
      },
    })

    console.log("[v0] Provider tenant created successfully:", providerTenant._id)

    await User.updateOne({ _id: superAdmin._id }, { $set: { tenant_id: providerTenant._id } })

    console.log("[v0] Super admin linked to provider tenant")

    return NextResponse.json({
      success: true,
      message: "Provider tenant created successfully",
      tenant: {
        id: providerTenant._id,
        name: providerTenant.name,
        slug: providerTenant.slug,
        type: providerTenant.type,
        theme: providerTenant.theme,
        adminEmail: superAdmin.email,
      },
    })
  } catch (error) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create provider tenant",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
