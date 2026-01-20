import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { cacheFlushPattern } from "@/lib/redis"
import { createAuditLog, trackChanges } from "@/lib/middleware/audit-middleware"
import connectDB from "@/lib/mongodb"
import mongoose from "mongoose"

let Tenant, TenantConfig, User

async function loadModels() {
  await connectDB()
  if (!Tenant) {
    Tenant = (await import("@/lib/models/Tenant")).default
    TenantConfig = (await import("@/lib/models/TenantConfig")).default
    User = (await import("@/lib/models/User")).default
  }
}

// PUT /api/super/tenants/[id] - Update tenant configuration
export async function PUT(request, { params }) {
  console.log("[v0] ========= UPDATE TENANT CONFIG =========")

  try {
    await connectDB()
    await loadModels()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized - Super Admin access required" }, { status: 403 })
    }

    const { id } = await params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid tenant ID" }, { status: 400 })
    }

    const body = await request.json()
    const { config } = body

    console.log("[v0] Tenant ID:", id)
    console.log("[v0] Config received:", JSON.stringify(config, null, 2))

    const updatedTenant = await Tenant.findById(id)
    if (!updatedTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    if (config.designId) {
      console.log("[v0] Updating designId:", config.designId)
      updatedTenant.designId = config.designId
    }

    const beforeState = {
      name: updatedTenant.name,
      domain_list: updatedTenant.domain_list,
      subdomain: updatedTenant.subdomain,
      primaryDomain: updatedTenant.primaryDomain,
      default_currency: updatedTenant.default_currency,
      theme: updatedTenant.theme,
      designId: updatedTenant.designId,
    }

    if (config.businessName) {
      console.log("[v0] Updating name:", config.businessName)
      updatedTenant.name = config.businessName
    }

    if (config.subdomain !== undefined) {
      console.log("[v0] Updating subdomain:", config.subdomain)
      updatedTenant.subdomain = config.subdomain

      const subdomainEntry = updatedTenant.domain_list.find((d) => d.type === "subdomain")
      if (subdomainEntry) {
        subdomainEntry.domain = `${config.subdomain}.goalbett.com`
      } else if (config.subdomain) {
        updatedTenant.domain_list.push({
          domain: `${config.subdomain}.goalbett.com`,
          isPrimary: !config.primaryDomain,
          isActive: true,
          type: "subdomain",
        })
      }
    }

    if (config.primaryDomain !== undefined) {
      console.log("[v0] Updating primaryDomain:", config.primaryDomain)
      updatedTenant.primaryDomain = config.primaryDomain

      if (config.primaryDomain) {
        const primaryEntry = updatedTenant.domain_list.find((d) => d.type === "primary")
        if (primaryEntry) {
          primaryEntry.domain = config.primaryDomain
          primaryEntry.isActive = true
          primaryEntry.isPrimary = true
        } else {
          updatedTenant.domain_list.push({
            domain: config.primaryDomain,
            isPrimary: true,
            isActive: true,
            type: "primary",
          })
        }

        updatedTenant.domain_list.forEach((d) => {
          if (d.type === "subdomain") {
            d.isPrimary = false
          }
        })
      } else {
        updatedTenant.domain_list = updatedTenant.domain_list.filter((d) => d.type !== "primary")
        const subdomainEntry = updatedTenant.domain_list.find((d) => d.type === "subdomain")
        if (subdomainEntry) {
          subdomainEntry.isPrimary = true
        }
      }
    }

    if (config.currency) {
      console.log("[v0] Updating currency:", config.currency)
      updatedTenant.default_currency = config.currency
    }

    if (config.timezone) {
      console.log("[v0] Updating timezone:", config.timezone)
      updatedTenant.metadata = {
        ...updatedTenant.metadata,
        timezone: config.timezone,
      }
    }

    if (
      config.primaryColor ||
      config.secondaryColor ||
      config.logoUrl !== undefined ||
      config.brandName ||
      config.accentColor ||
      config.megaJackpotLabel ||
      config.dailyJackpotLabel ||
      config.hourlyJackpotLabel
    ) {
      console.log("[v0] Updating theme")
      console.log("[v0] Primary color from config:", config.primaryColor)
      console.log("[v0] Accent color from config:", config.accentColor)

      const existingTheme = updatedTenant.theme || {}
      const existingJackpotTicker = existingTheme.jackpotTicker || {}

      const autoIncrementDefaults = {
        enabled: true,
        megaRate: 50,
        dailyRate: 10,
        hourlyRate: 5,
        intervalSeconds: 3,
      }

      const existingAutoIncrement = existingJackpotTicker.autoIncrement || {}
      const safeAutoIncrement = {
        enabled:
          typeof existingAutoIncrement.enabled === "boolean"
            ? existingAutoIncrement.enabled
            : autoIncrementDefaults.enabled,
        megaRate:
          typeof existingAutoIncrement.megaRate === "number"
            ? existingAutoIncrement.megaRate
            : autoIncrementDefaults.megaRate,
        dailyRate:
          typeof existingAutoIncrement.dailyRate === "number"
            ? existingAutoIncrement.dailyRate
            : autoIncrementDefaults.dailyRate,
        hourlyRate:
          typeof existingAutoIncrement.hourlyRate === "number"
            ? existingAutoIncrement.hourlyRate
            : autoIncrementDefaults.hourlyRate,
        intervalSeconds:
          typeof existingAutoIncrement.intervalSeconds === "number"
            ? existingAutoIncrement.intervalSeconds
            : autoIncrementDefaults.intervalSeconds,
      }

      updatedTenant.theme = {
        primaryColor: config.primaryColor || existingTheme.primaryColor || "#FFD700",
        secondaryColor: config.secondaryColor || existingTheme.secondaryColor || "#0A1A2F",
        accentColor: config.accentColor || existingTheme.accentColor || "#4A90E2",
        logoUrl: config.logoUrl !== undefined ? config.logoUrl : existingTheme.logoUrl || "",
        faviconUrl: existingTheme.faviconUrl || "",
        brandName: config.brandName || config.businessName || existingTheme.brandName || updatedTenant.name,
        customCSS: existingTheme.customCSS || "",
        jackpotTicker: {
          enabled: typeof existingJackpotTicker.enabled === "boolean" ? existingJackpotTicker.enabled : true,
          megaJackpot: {
            label: config.megaJackpotLabel || existingJackpotTicker.megaJackpot?.label || "MEGA JACKPOT",
            amount:
              typeof existingJackpotTicker.megaJackpot?.amount === "number"
                ? existingJackpotTicker.megaJackpot.amount
                : 2847392,
            isActive:
              typeof existingJackpotTicker.megaJackpot?.isActive === "boolean"
                ? existingJackpotTicker.megaJackpot.isActive
                : true,
          },
          dailyJackpot: {
            label: config.dailyJackpotLabel || existingJackpotTicker.dailyJackpot?.label || "DAILY JACKPOT",
            amount:
              typeof existingJackpotTicker.dailyJackpot?.amount === "number"
                ? existingJackpotTicker.dailyJackpot.amount
                : 47293,
            isActive:
              typeof existingJackpotTicker.dailyJackpot?.isActive === "boolean"
                ? existingJackpotTicker.dailyJackpot.isActive
                : true,
          },
          hourlyJackpot: {
            label: config.hourlyJackpotLabel || existingJackpotTicker.hourlyJackpot?.label || "HOURLY JACKPOT",
            amount:
              typeof existingJackpotTicker.hourlyJackpot?.amount === "number"
                ? existingJackpotTicker.hourlyJackpot.amount
                : 3847,
            isActive:
              typeof existingJackpotTicker.hourlyJackpot?.isActive === "boolean"
                ? existingJackpotTicker.hourlyJackpot.isActive
                : true,
          },
          autoIncrement: safeAutoIncrement,
        },
      }
    }

    console.log("[v0] Saving tenant to database...")
    await updatedTenant.save()
    console.log("[v0] Tenant saved successfully")

    const configUpdates = [
      { key: "domain", value: config.domain },
      { key: "subdomain", value: config.subdomain },
      { key: "primaryDomain", value: config.primaryDomain },
      { key: "timezone", value: config.timezone },
      { key: "status", value: config.status },
      { key: "enabledModules", value: config.enabledModules },
      { key: "paymentProviders", value: config.paymentProviders },
      { key: "oddsProviders", value: config.oddsProviders },
      { key: "riskSettings", value: config.riskSettings },
    ]

    for (const { key, value } of configUpdates) {
      if (value !== undefined) {
        await TenantConfig.setConfig(updatedTenant._id, key, value)
      }
    }

    console.log("[v0] TenantConfig values saved")

    const afterState = {
      name: updatedTenant.name,
      domain_list: updatedTenant.domain_list,
      subdomain: updatedTenant.subdomain,
      primaryDomain: updatedTenant.primaryDomain,
      default_currency: updatedTenant.default_currency,
      theme: updatedTenant.theme,
      designId: updatedTenant.designId,
    }

    await createAuditLog({
      tenant_id: updatedTenant._id,
      actor: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      action: "tenant.config.update",
      resource: {
        type: "tenant",
        id: updatedTenant._id.toString(),
        name: updatedTenant.name,
      },
      changes: trackChanges(beforeState, afterState),
      request,
    })

    await cacheFlushPattern(`tenant:*${updatedTenant.slug}*`)

    const configs = await TenantConfig.getAllConfigs(updatedTenant._id)
    const finalTenant = await Tenant.findById(id).lean()

    const agentCount = await User.countDocuments({ role: "agent", tenant_id: updatedTenant.adminUserId })
    const adminCount = await User.countDocuments({ role: "admin", tenant_id: updatedTenant.adminUserId })

    console.log("[v0] Returning updated tenant with configs:", {
      tenantId: finalTenant._id,
      configKeys: Object.keys(configs),
      theme: finalTenant.theme,
      primaryDomain: finalTenant.primaryDomain,
      subdomain: finalTenant.subdomain,
      designId: finalTenant.designId,
    })

    return NextResponse.json(
      {
        message: "Tenant configuration updated successfully",
        tenant: {
          _id: finalTenant._id,
          fullName: finalTenant.name,
          email: configs.domain || "",
          designId: finalTenant.designId || "classic",
          tenantConfig: {
            businessName: finalTenant.name,
            domain: configs.domain,
            subdomain: configs.subdomain || finalTenant.subdomain,
            primaryDomain: configs.primaryDomain || finalTenant.primaryDomain,
            currency: finalTenant.default_currency,
            timezone: configs.timezone || finalTenant.metadata?.timezone,
            primaryColor: finalTenant.theme?.primaryColor,
            secondaryColor: finalTenant.theme?.secondaryColor,
            accentColor: finalTenant.theme?.accentColor,
            logoUrl: finalTenant.theme?.logoUrl,
            brandName: finalTenant.theme?.brandName,
            designId: finalTenant.designId || "classic",
            status: configs.status || finalTenant.status,
            megaJackpotLabel: finalTenant.theme?.jackpotTicker?.megaJackpot?.label || "MEGA JACKPOT",
            dailyJackpotLabel: finalTenant.theme?.jackpotTicker?.dailyJackpot?.label || "DAILY JACKPOT",
            hourlyJackpotLabel: finalTenant.theme?.jackpotTicker?.hourlyJackpot?.label || "HOURLY JACKPOT",
            enabledModules: configs.enabledModules || [],
            paymentProviders: configs.paymentProviders || {},
            oddsProviders: configs.oddsProviders || {},
            riskSettings: configs.riskSettings || {},
          },
          stats: {
            agents: agentCount,
            admins: adminCount,
          },
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Update tenant config error:", error)
    return NextResponse.json(
      { error: "Failed to update tenant configuration", details: error.message },
      { status: 500 },
    )
  }
}

// PATCH /api/super/tenants/[id] - Suspend/Enable tenant
export async function PATCH(request, { params }) {
  try {
    const { id } = await params

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { action } = await request.json()

    await loadModels()

    const tenant = await Tenant.findById(id)
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const beforeStatus = tenant.status

    if (action === "suspend") {
      tenant.status = "suspended"
    } else if (action === "deactivate") {
      tenant.status = "inactive"
    } else if (action === "enable" || action === "activate") {
      tenant.status = "active"
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await tenant.save()

    await createAuditLog({
      tenant_id: tenant._id,
      actor: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      action: `tenant.${action}`,
      resource: {
        type: "tenant",
        id: tenant._id.toString(),
        name: tenant.name,
      },
      changes: trackChanges({ status: beforeStatus }, { status: tenant.status }),
      request,
    })

    await cacheFlushPattern(`tenant:*${tenant.slug}*`)

    return NextResponse.json(
      {
        message: `Tenant ${action === "suspend" ? "banned" : action === "activate" ? "activated" : action + "d"} successfully`,
        tenant: {
          id: tenant._id,
          name: tenant.name,
          status: tenant.status,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Update tenant error:", error)
    return NextResponse.json({ error: "Failed to update tenant", details: error.message }, { status: 500 })
  }
}

// DELETE /api/super/tenants/[id] - Delete tenant
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await loadModels()

    const tenant = await Tenant.findById(id)
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const deletionStats = {
      tenant: tenant.name,
      usersDeleted: 0,
      customDomainRemoved: false,
      subdomainRemoved: false,
      configDeleted: false,
    }

    console.log(`[v0] Starting tenant deletion for: ${tenant.name}`)
    console.log(`[v0] Tenant customDomain: ${tenant.customDomain}`)
    console.log(`[v0] Tenant slug: ${tenant.slug}`)
    console.log(`[v0] Tenant adminUserId: ${tenant.adminUserId}`)

    const usersToDelete = await User.find({
      $or: [{ tenant_id: tenant._id }, { _id: tenant.adminUserId }],
    })

    console.log(`[v0] Found ${usersToDelete.length} users to delete`)

    if (usersToDelete.length > 0) {
      const deleteResult = await User.deleteMany({
        $or: [{ tenant_id: tenant._id }, { _id: tenant.adminUserId }],
      })
      deletionStats.usersDeleted = deleteResult.deletedCount
      console.log(`[v0] Deleted ${deleteResult.deletedCount} users for tenant ${tenant.name}`)
    }

    const vercelToken = process.env.VERCEL_API_TOKEN
    const vercelProjectId = process.env.VERCEL_PROJECT_ID
    const vercelTeamId = process.env.VERCEL_TEAM_ID

    console.log(
      `[v0] Vercel env check - Token exists: ${!!vercelToken}, ProjectId: ${vercelProjectId}, TeamId: ${vercelTeamId}`,
    )

    if (tenant.customDomain) {
      try {
        if (vercelToken && vercelProjectId) {
          const vercelUrl = vercelTeamId
            ? `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${tenant.customDomain}?teamId=${vercelTeamId}`
            : `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${tenant.customDomain}`

          console.log(`[v0] Removing custom domain - URL: ${vercelUrl}`)

          const vercelResponse = await fetch(vercelUrl, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
            },
          })

          const responseStatus = vercelResponse.status
          const responseText = await vercelResponse.text()
          console.log(`[v0] Vercel custom domain response - Status: ${responseStatus}, Body: ${responseText}`)

          if (vercelResponse.ok || responseStatus === 404) {
            deletionStats.customDomainRemoved = true
            console.log(`[v0] Custom domain ${tenant.customDomain} removed from Vercel`)
          } else {
            console.log(`[v0] Failed to remove custom domain: ${responseStatus}`)
          }
        } else {
          console.log(`[v0] Missing Vercel credentials - cannot remove custom domain`)
        }
      } catch (domainError) {
        console.error(`[v0] Error removing custom domain:`, domainError.message)
      }
    } else {
      console.log(`[v0] No custom domain to remove`)
    }

    if (tenant.slug) {
      try {
        const subdomainFull = `${tenant.slug}.goalbett.com`

        if (vercelToken && vercelProjectId) {
          const vercelUrl = vercelTeamId
            ? `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${subdomainFull}?teamId=${vercelTeamId}`
            : `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${subdomainFull}`

          console.log(`[v0] Removing subdomain - URL: ${vercelUrl}`)

          const vercelResponse = await fetch(vercelUrl, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
            },
          })

          const responseStatus = vercelResponse.status
          const responseText = await vercelResponse.text()
          console.log(`[v0] Vercel subdomain response - Status: ${responseStatus}, Body: ${responseText}`)

          if (vercelResponse.ok || responseStatus === 404) {
            deletionStats.subdomainRemoved = true
            console.log(`[v0] Subdomain ${subdomainFull} removed from Vercel`)
          } else {
            console.log(`[v0] Failed to remove subdomain: ${responseStatus}`)
          }
        } else {
          console.log(`[v0] Missing Vercel credentials - cannot remove subdomain`)
        }
      } catch (subdomainError) {
        console.error(`[v0] Error removing subdomain:`, subdomainError.message)
      }
    } else {
      console.log(`[v0] No slug/subdomain to remove`)
    }

    await createAuditLog({
      tenant_id: tenant._id,
      actor: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      action: "tenant.delete",
      resource: {
        type: "tenant",
        id: tenant._id.toString(),
        name: tenant.name,
      },
      changes: {
        before: {
          name: tenant.name,
          status: tenant.status,
          customDomain: tenant.customDomain,
          usersCount: deletionStats.usersDeleted,
        },
        after: null,
      },
      request,
    })

    const configResult = await TenantConfig.deleteMany({ tenant_id: tenant._id })
    deletionStats.configDeleted = configResult.deletedCount > 0

    await Tenant.findByIdAndDelete(id)

    await cacheFlushPattern(`tenant:*${tenant.slug}*`)

    return NextResponse.json(
      {
        success: true,
        message: "Tenant deleted successfully",
        details: {
          tenantName: deletionStats.tenant,
          usersDeleted: deletionStats.usersDeleted,
          customDomainRemoved: deletionStats.customDomainRemoved,
          subdomainRemoved: deletionStats.subdomainRemoved,
          configDeleted: deletionStats.configDeleted,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Delete tenant error:", error)
    return NextResponse.json({ error: "Failed to delete tenant", details: error.message }, { status: 500 })
  }
}

// GET /api/super/tenants/[id] - Get single tenant
export async function GET(request, { params }) {
  try {
    await loadModels()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== "superadmin" && decoded.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized - Super Admin access required" }, { status: 403 })
    }

    const { id } = await params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid tenant ID" }, { status: 400 })
    }

    const tenant = await Tenant.findById(id)
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Get all configs for this tenant
    const configs = await TenantConfig.find({ tenant_id: id })
    const configMap = {}
    configs.forEach((c) => {
      configMap[c.key] = c.value
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        status: tenant.status,
        default_currency: tenant.default_currency,
        domain_list: tenant.domain_list,
        primaryDomain: tenant.primaryDomain,
        subdomain: tenant.subdomain,
        designId: tenant.designId || "classic",
        theme: {
          primaryColor: tenant.theme?.primaryColor || "#FFD700",
          secondaryColor: tenant.theme?.secondaryColor || "#0A1A2F",
          accentColor: tenant.theme?.accentColor || "#4A90E2",
          logoUrl: tenant.theme?.logoUrl || "",
          brandName: tenant.theme?.brandName || tenant.name,
          jackpotTicker: tenant.theme?.jackpotTicker || {},
        },
        configs: configMap,
        metadata: tenant.metadata,
        created_at: tenant.created_at,
      },
    })
  } catch (error) {
    console.error("[Super Admin Tenant GET] Error:", error)
    return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 })
  }
}
