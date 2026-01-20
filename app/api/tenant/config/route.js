import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

export async function GET(request) {
  try {
    console.log("[v0] Tenant config GET: Starting request")
    await connectDB()

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    console.log("[v0] Tenant config GET: Token exists:", !!token)

    if (!token) {
      console.log("[v0] Tenant config GET: No token found in Authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    console.log("[v0] Tenant config GET: Decoded token:", JSON.stringify(decoded))

    if (!decoded) {
      console.log("[v0] Tenant config GET: Token verification failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = decoded?.tenant_id || decoded?.tenantId
    console.log("[v0] Tenant config GET: Extracted tenant ID:", tenantId)

    if (!tenantId) {
      console.log("[v0] Tenant config GET: No tenant ID in token, decoded keys:", Object.keys(decoded))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Tenant config GET: Fetching tenant with ID:", tenantId)
    const { default: Tenant } = await import("@/lib/models/Tenant")

    const tenant = await Tenant.findById(tenantId).lean()

    if (!tenant) {
      console.log("[v0] Tenant config GET: Tenant not found")
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    console.log("[v0] Tenant config GET: Success - returning tenant:", tenant.name)
    return NextResponse.json({
      success: true,
      tenant: {
        ...tenant,
        theme: {
          ...tenant.theme,
          jackpot: tenant.theme?.jackpot || {
            megaLabel: "MEGA JACKPOT",
            megaAmount: "2847392",
            dailyLabel: "DAILY JACKPOT",
            dailyAmount: "47293",
            hourlyLabel: "HOURLY JACKPOT",
            hourlyAmount: "3847",
          },
        },
      },
    })
  } catch (error) {
    console.error("[v0] Tenant config GET: Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    console.log("[v0] Tenant config PUT: Starting request")
    await connectDB()

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const tenantId = decoded?.tenant_id || decoded?.tenantId

    if (!decoded || !tenantId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { config } = body

    console.log("[v0] Tenant config PUT: Updating tenant with config:", Object.keys(config))

    const { default: Tenant } = await import("@/lib/models/Tenant")

    const updateData = {
      name: config.brandName,
      email: config.companySupportEmail,
      phone: config.companyPhone,
      legalName: config.companyName,
      address: config.companyAddress,
      primaryDomain: config.primaryDomain,
      subdomain: config.subdomain,
      currency: config.currency,
      theme: {
        brandName: config.brandName,
        brandSlogan: config.brandSlogan,
        logoUrl: config.logo,
        faviconUrl: config.favicon,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
        errorColor: config.errorColor,
        successColor: config.successColor,
        fontFamily: config.fontFamily,
        headingFont: config.headingFont,
        fontSize: config.fontSize,
        emailLogoUrl: config.emailBrand?.logoUrl,
        emailSenderName: config.emailBrand?.senderName,
        emailSenderEmail: config.emailBrand?.senderEmail,
        bannerTitle: config.bannerTitle,
        bannerSubtitle: config.bannerSubtitle,
        bannerImage: config.bannerImage,
        jackpot: config.jackpot || {
          megaLabel: "MEGA JACKPOT",
          megaAmount: "2847392",
          dailyLabel: "DAILY JACKPOT",
          dailyAmount: "47293",
          hourlyLabel: "HOURLY JACKPOT",
          hourlyAmount: "3847",
        },
      },
      socialMedia: config.socialMedia,
      config: {
        termsUrl: config.tosUrl,
        privacyUrl: config.privacyUrl,
        kycUrl: config.kycUrl,
        enableSocialLogin: config.enableSocialLogin,
        enableLiveChat: config.enableLiveChat,
        enableNewsletterSignup: config.enableNewsletterSignup,
        maintenanceMode: config.maintenanceMode,
      },
    }

    const tenant = await Tenant.findByIdAndUpdate(tenantId, updateData, { new: true })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    console.log("[v0] Tenant config PUT: Update successful")
    return NextResponse.json({
      success: true,
      tenant,
    })
  } catch (error) {
    console.error("[v0] Tenant config PUT: Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
