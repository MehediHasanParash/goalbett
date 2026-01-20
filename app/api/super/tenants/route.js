import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import TenantConfig from "@/lib/models/TenantConfig"
import User from "@/lib/models/User"
import WalletOwner from "@/lib/models/WalletOwner"
import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { addJob, QUEUES } from "@/lib/queue"
import { cacheFlushPattern } from "@/lib/redis"
import { createAuditLog } from "@/lib/middleware/audit-middleware"

// POST /api/super/tenants - Create tenant
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden - Only Super Admin can create tenants" }, { status: 403 })
    }

    const {
      name,
      slug,
      email,
      password,
      subdomain,
      primaryDomain,
      domain, // legacy support
      currency,
      timezone,
      businessName,
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      revenueSharePercentage,
      contactPhone,
      address,
      type = "client",
      theme,
      status,
    } = await request.json()

    if (!name || !slug || !email || !password) {
      return NextResponse.json({ error: "Missing required fields: name, slug, email, password" }, { status: 400 })
    }

    await connectDB()

    const existingTenant = await Tenant.findOne({ slug })
    if (existingTenant) {
      return NextResponse.json({ error: "Tenant with this slug already exists" }, { status: 400 })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    const adminUser = await User.create({
      fullName: name,
      email,
      password,
      role: "tenant_admin",
      isActive: true,
      status: "active",
    })

    let providerId = null
    if (type === "client") {
      const providerTenant = await Tenant.findOne({ type: "provider" })
      if (providerTenant) {
        providerId = providerTenant._id
      }
    }

    const tenantTheme = theme || {
      primaryColor: primaryColor || "#FFD700",
      secondaryColor: secondaryColor || "#0A1A2F",
      accentColor: accentColor || "#4A90E2",
      logoUrl: logoUrl || "",
      brandName: name,
      customCSS: "",
    }

    const tenantStatus = status || (type === "provider" ? "active" : "active")

    const tenant = await Tenant.create({
      name,
      slug,
      subdomain: subdomain || slug,
      primaryDomain: primaryDomain || null,
      type: type || "client",
      status: tenantStatus,
      providerId,
      subscription:
        type === "client"
          ? {
              plan: tenantStatus === "trial" ? "trial" : "basic",
              startDate: new Date(),
              endDate:
                tenantStatus === "trial"
                  ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              isActive: true,
            }
          : undefined,
      revenueShare:
        type === "client" && revenueSharePercentage
          ? {
              providerPercentage: revenueSharePercentage,
              tenantPercentage: 100 - revenueSharePercentage,
              isEnabled: true,
            }
          : undefined,
      default_currency: currency || "USD",
      theme: tenantTheme,
      domain_list: [
        subdomain || slug
          ? {
              domain: `${subdomain || slug}.goalbett.com`,
              isPrimary: false,
              isActive: true,
              type: "subdomain",
            }
          : null,
        primaryDomain
          ? {
              domain: primaryDomain,
              isPrimary: true,
              isActive: true,
              type: "primary",
            }
          : null,
        domain
          ? {
              domain,
              isPrimary: !primaryDomain,
              isActive: true,
              type: "custom",
            }
          : null,
      ].filter(Boolean),
      adminUserId: adminUser._id,
      metadata: {
        businessName: businessName || name,
        contactEmail: email,
        contactPhone: contactPhone || "",
        address: address || "",
        timezone: timezone || "UTC",
      },
      stats: {
        totalUsers: 0,
        totalRevenue: 0,
        totalProviderRevenue: 0,
      },
      domainVerification: {
        isVerified: false,
        verificationToken: "",
        verifiedAt: null,
        dnsRecords: [],
      },
    })

    await User.findByIdAndUpdate(adminUser._id, {
      tenant_id: tenant._id,
      tenantId: tenant._id,
    })

    createAuditLog({
      tenant_id: tenant._id,
      actor: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      action: "tenant.create",
      resource: {
        type: "tenant",
        id: tenant._id.toString(),
        name: tenant.name,
      },
      changes: {
        after: {
          name: tenant.name,
          slug: tenant.slug,
          email,
          domain,
          currency,
        },
      },
      request,
    }).catch((err) => console.error("[v0] Audit log error:", err))

    addJob(QUEUES.TENANT, "create-tenant", {
      tenantId: tenant._id,
      adminUserId: adminUser._id,
    }).catch((err) => console.error("[v0] Queue job error:", err))

    cacheFlushPattern("tenant:*").catch((err) => console.error("[v0] Cache flush error:", err))

    return NextResponse.json(
      {
        message: "Tenant created successfully",
        tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          subdomain: tenant.subdomain,
          primaryDomain: tenant.primaryDomain,
          subdomainURL: `https://${tenant.subdomain}.goalbett.com`,
          primaryDomainURL: tenant.primaryDomain ? `https://${tenant.primaryDomain}` : null,
          status: tenant.status,
          adminEmail: email,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create tenant error:", error)
    return NextResponse.json({ error: error.message || "Failed to create tenant" }, { status: 500 })
  }
}

// GET /api/super/tenants - List all tenants
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const allAgents = await User.find({
      role: { $in: ["agent", "sub_agent"] },
    })
      .select("email role tenant_id tenantId createdBy fullName")
      .lean()

    console.log("[v0] ALL AGENTS IN DATABASE (role=agent/sub_agent):", allAgents.length)
    console.log(
      "[v0] Agent details:",
      allAgents.map((a) => ({
        email: a.email,
        fullName: a.fullName,
        role: a.role,
        tenant_id: a.tenant_id?.toString(),
        tenantId: a.tenantId?.toString(),
        createdBy: a.createdBy?.toString(),
      })),
    )

    const amnenTenant = await Tenant.findOne({ name: "Amnen Bet" }).populate("adminUserId").lean()
    if (amnenTenant) {
      console.log("[v0] AMNEN BET TENANT:", {
        _id: amnenTenant._id.toString(),
        adminUserId: amnenTenant.adminUserId?._id?.toString(),
        adminEmail: amnenTenant.adminUserId?.email,
      })

      // Find ALL users created by Amnen admin
      const amnenCreatedUsers = await User.find({
        createdBy: amnenTenant.adminUserId?._id,
      })
        .select("email role tenant_id tenantId fullName")
        .lean()

      console.log("[v0] USERS CREATED BY AMNEN ADMIN:", amnenCreatedUsers.length)
      console.log(
        "[v0] Amnen created users:",
        amnenCreatedUsers.map((u) => ({
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          tenant_id: u.tenant_id?.toString(),
          tenantId: u.tenantId?.toString(),
        })),
      )

      // Find ALL users with Amnen tenant_id
      const amnenTenantUsers = await User.find({
        tenant_id: amnenTenant._id,
      })
        .select("email role tenant_id fullName")
        .lean()

      console.log("[v0] ALL USERS WITH AMNEN TENANT_ID:", amnenTenantUsers.length)
      console.log(
        "[v0] Amnen tenant users:",
        amnenTenantUsers.map((u) => ({
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          tenant_id: u.tenant_id?.toString(),
        })),
      )
    }

    const tenants = await Tenant.find().populate("adminUserId", "email fullName tenant_id").lean()

    console.log(
      "[v0] Raw tenants from DB:",
      tenants.map((t) => ({
        _id: t._id,
        _idType: typeof t._id,
        _idString: t._id?.toString?.(),
        name: t.name,
        adminUserId: t.adminUserId?._id,
        adminTenantId: t.adminUserId?.tenant_id,
      })),
    )

    const tenantsWithDetails = await Promise.all(
      tenants.map(async (tenant) => {
        const configs = await TenantConfig.getAllConfigs(tenant._id)

        console.log(`[v0] Tenant: ${tenant.name}`, {
          tenantId: tenant._id.toString(),
          adminUserId: tenant.adminUserId?._id?.toString(),
          adminTenantId: tenant.adminUserId?.tenant_id?.toString(),
          match: tenant.adminUserId?.tenant_id?.toString() === tenant._id.toString(),
        })

        console.log(`[v0] Counting agents for tenant: ${tenant.name}`, {
          tenantId: tenant._id.toString(),
        })

        const adminTenantId = tenant.adminUserId?.tenant_id
        if (adminTenantId) {
          const agentsWithAdminTenantId = await User.find({
            role: { $in: ["agent", "sub_agent"] },
            tenant_id: adminTenantId,
          })
            .limit(5)
            .select("email role tenant_id createdBy")
            .lean()

          console.log(
            `[v0] Agents with tenant_id=${adminTenantId.toString()} (admin's tenant_id):`,
            agentsWithAdminTenantId.length,
            agentsWithAdminTenantId,
          )
        }

        const agentsWithTenantId = await User.find({
          role: { $in: ["agent", "sub_agent"] },
          tenant_id: tenant._id,
        })
          .limit(5)
          .select("email role tenant_id createdBy")
          .lean()

        console.log(
          `[v0] Agents with tenant_id=${tenant._id.toString()} (tenant._id):`,
          agentsWithTenantId.length,
          agentsWithTenantId,
        )

        const agentCount = await User.countDocuments({
          role: { $in: ["agent", "sub_agent"] },
          $or: [{ tenant_id: tenant._id }, { tenant_id: adminTenantId }, { tenantId: tenant._id }],
        })

        console.log(`[v0] Agent count for ${tenant.name}:`, agentCount, {
          tenantId: tenant._id.toString(),
          adminTenantId: adminTenantId?.toString(),
        })

        const adminCount = await User.countDocuments({
          role: { $in: ["admin", "tenant_admin"] },
          tenant_id: tenant._id,
        })
        const playerCount = await User.countDocuments({
          role: "player",
          tenant_id: tenant._id,
        })

        const walletOwner = await WalletOwner.findOne({
          ownerId: tenant._id,
          ownerType: "TENANT",
        })
          .populate("walletId")
          .lean()

        const wallet = walletOwner?.walletId

        const tenantIdString = tenant._id?.toString?.() || tenant._id

        return {
          id: tenantIdString,
          _id: tenantIdString,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          default_currency: tenant.default_currency,
          domain_list: tenant.domain_list,
          created_at: tenant.createdAt,
          adminEmail: tenant.adminUserId?.email,
          adminName: tenant.adminUserId?.fullName,
          wallet: wallet
            ? {
                balance: wallet.availableBalance || 0,
                availableBalance: wallet.availableBalance || 0,
                currency: wallet.currency || tenant.default_currency,
              }
            : {
                balance: 0,
                availableBalance: 0,
                currency: tenant.default_currency,
              },
          theme: tenant.theme || {},
          configs: {
            enabledModules: configs.enabledModules || configs.enabled_modules || [],
            paymentProviders: configs.paymentProviders || configs.payment_providers || {},
            riskSettings: configs.riskSettings || configs.risk_settings || {},
            domain: configs.domain || tenant.domain_list?.[0]?.domain,
            subdomain: configs.subdomain || "",
            timezone: configs.timezone || "UTC",
            businessName: configs.businessName || tenant.name,
            oddsProviders: configs.oddsProviders || configs.odds_providers || {},
          },
          stats: {
            agents: agentCount,
            admins: adminCount,
            players: playerCount,
          },
        }
      }),
    )

    console.log(
      "[v0] Tenants response IDs:",
      tenantsWithDetails.map((t) => ({
        id: t.id,
        _id: t._id,
        name: t.name,
      })),
    )

    return NextResponse.json({ tenants: tenantsWithDetails }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get tenants error:", error)
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}
