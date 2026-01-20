import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"

export async function POST(request) {
  console.log("\n[v0] =====")
  console.log("[v0] COMPLETE MULTI-TENANT SETUP STARTING")
  console.log("[v0] =====\n")

  try {
    await connectDB()

    // Step 1: Find or create Super Admin
    console.log("[v0] Step 1: Finding Super Admin...")
    let superAdmin = await User.findOne({ role: { $in: ["superadmin", "super_admin", "tenant_admin"] } })

    if (!superAdmin) {
      console.log("[v0] No super admin found, creating one...")
      const hashedPassword = await bcrypt.hash("admin123", 10)
      superAdmin = await User.create({
        username: "superadmin",
        email: "admin@goalbet.com",
        password: hashedPassword,
        role: "superadmin",
        status: "active",
      })
      console.log("[v0] ✓ Created super admin:", superAdmin.email)
    } else {
      console.log("[v0] ✓ Found existing super admin:", superAdmin.email)
    }

    // Step 2: Create or update GoalBet Provider Tenant
    console.log("\n[v0] Step 2: Setting up GoalBet Provider Tenant...")
    let providerTenant = await Tenant.findOne({ slug: "goalbet" })

    const providerData = {
      name: "GoalBet",
      slug: "goalbet",
      type: "provider",
      status: "active",
      adminUserId: superAdmin._id,
      domain_list: [
        {
          domain: "localhost:3000",
          isPrimary: true,
          isActive: true,
        },
      ],
      theme: {
        primaryColor: "#FFD700",
        secondaryColor: "#FFA500",
        accentColor: "#4A90E2",
        logoUrl: "/images/goal-betting-logo.png",
        brandName: "GoalBet",
      },
      subscription: {
        plan: "provider",
        status: "active",
      },
    }

    if (providerTenant) {
      await Tenant.updateOne({ _id: providerTenant._id }, { $set: providerData })
      providerTenant = await Tenant.findById(providerTenant._id)
      console.log("[v0] ✓ Updated GoalBet provider tenant")
    } else {
      providerTenant = await Tenant.create(providerData)
      console.log("[v0] ✓ Created GoalBet provider tenant")
    }

    // Update super admin with tenant_id
    await User.updateOne({ _id: superAdmin._id }, { $set: { tenant_id: providerTenant._id } })
    console.log("[v0] ✓ Linked super admin to provider tenant")

    // Step 3: Create XBet Client Tenant
    console.log("\n[v0] Step 3: Setting up XBet Client Tenant...")
    let xbetTenant = await Tenant.findOne({ slug: "xbet" })

    // Create XBet admin
    let xbetAdmin = await User.findOne({ email: "admin@xbet.com" })
    if (!xbetAdmin) {
      const hashedPassword = await bcrypt.hash("xbet123", 10)
      xbetAdmin = await User.create({
        username: "xbetadmin",
        email: "admin@xbet.com",
        password: hashedPassword,
        role: "tenant_admin",
        status: "active",
      })
      console.log("[v0] ✓ Created XBet admin:", xbetAdmin.email)
    }

    const xbetData = {
      name: "XBet Casino",
      slug: "xbet",
      type: "client",
      status: "active",
      adminUserId: xbetAdmin._id,
      parentProviderId: providerTenant._id,
      domain_list: [
        {
          domain: "xbet.localhost:3000",
          isPrimary: true,
          isActive: true,
        },
      ],
      theme: {
        primaryColor: "#0066FF",
        secondaryColor: "#FFD700",
        accentColor: "#00CC66",
        logoUrl: "https://via.placeholder.com/150x50/0066FF/FFD700?text=XBet",
        brandName: "XBet Casino",
      },
      revenueShare: {
        providerPercentage: 15,
        currency: "USD",
      },
      subscription: {
        plan: "premium",
        status: "active",
      },
      contact: {
        email: "support@xbet.com",
        phone: "+1-555-XBET-001",
      },
    }

    if (xbetTenant) {
      await Tenant.updateOne({ _id: xbetTenant._id }, { $set: xbetData })
      xbetTenant = await Tenant.findById(xbetTenant._id)
      console.log("[v0] ✓ Updated XBet client tenant")
    } else {
      xbetTenant = await Tenant.create(xbetData)
      console.log("[v0] ✓ Created XBet client tenant")
    }

    // Update XBet admin with tenant_id
    await User.updateOne({ _id: xbetAdmin._id }, { $set: { tenant_id: xbetTenant._id } })
    console.log("[v0] ✓ Linked XBet admin to XBet tenant")

    console.log("\n[v0] =====")
    console.log("[v0] SETUP COMPLETE! ✓")
    console.log("[v0] =====\n")

    console.log("GoalBet Provider:")
    console.log("  URL: http://localhost:3000")
    console.log("  Colors: Yellow (#FFD700) + Orange (#FFA500)")
    console.log("")
    console.log("XBet Casino (Client):")
    console.log("  URL: http://xbet.localhost:3000")
    console.log("  Colors: Blue (#0066FF) + Gold (#FFD700)")
    console.log("  Revenue Share: 15% to GoalBet")
    console.log("")

    return NextResponse.json({
      success: true,
      message: "Multi-tenant setup completed successfully!",
      tenants: {
        provider: {
          name: providerTenant.name,
          slug: providerTenant.slug,
          url: "http://localhost:3000",
          theme: providerTenant.theme,
        },
        clients: [
          {
            name: xbetTenant.name,
            slug: xbetTenant.slug,
            url: "http://xbet.localhost:3000",
            theme: xbetTenant.theme,
            revenueShare: xbetTenant.revenueShare,
          },
        ],
      },
    })
  } catch (error) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Setup failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
