import connectDB from "./mongodb"
import Tenant from "./models/Tenant"

/**
 * Resolves tenant from request based on (priority order):
 * 1. Custom primary domain (e.g., xbet.com)
 * 2. Subdomain (e.g., xbet.goalbett.com or xbet.localhost:3000)
 * 3. URL parameter (e.g., ?tenant=xbet)
 * 4. Default to provider tenant (GoalBet)
 */
export async function resolveTenant(request) {
  console.log("[v0] [Tenant Resolver] == STARTING RESOLUTION ==")

  try {
    await connectDB()

    const hostname = request.headers.get("host") || ""
    const url = new URL(request.url)
    const tenantParam = url.searchParams.get("tenant")

    console.log("[v0] [Tenant Resolver] Full hostname:", hostname)
    console.log("[v0] [Tenant Resolver] Tenant URL param:", tenantParam)

    let tenant = null

    const hostWithoutPort = hostname.split(":")[0]
    console.log("[v0] [Tenant Resolver] Method 1: Looking up by primary domain:", hostWithoutPort)
    tenant = await Tenant.findOne({ primaryDomain: hostWithoutPort, status: "active" }).lean()
    if (tenant) {
      console.log("[v0] [Tenant Resolver] ✓ FOUND by primary domain:", tenant.name)
      return tenant
    }
    console.log("[v0] [Tenant Resolver] ✗ Not found by primary domain")

    const parts = hostWithoutPort.split(".")
    console.log("[v0] [Tenant Resolver] Host parts:", parts)

    // For xbet.localhost -> parts = ["xbet", "localhost"]
    // For xbet.goalbett.com -> parts = ["xbet", "goalbett", "com"]
    if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
      const subdomain = parts[0]
      console.log("[v0] [Tenant Resolver] Method 2: Looking up by subdomain:", subdomain)

      // Try by slug first (most common case)
      tenant = await Tenant.findOne({ slug: subdomain, status: "active" }).lean()
      if (tenant) {
        console.log("[v0] [Tenant Resolver] ✓ FOUND by subdomain slug:", tenant.name)
        return tenant
      }

      // Try by subdomain field
      tenant = await Tenant.findOne({ subdomain: subdomain, status: "active" }).lean()
      if (tenant) {
        console.log("[v0] [Tenant Resolver] ✓ FOUND by subdomain field:", tenant.name)
        return tenant
      }

      console.log("[v0] [Tenant Resolver] ✗ Not found by subdomain")
    }

    if (tenantParam) {
      console.log("[v0] [Tenant Resolver] Method 3: Looking up by URL param slug:", tenantParam)
      tenant = await Tenant.findOne({ slug: tenantParam, status: "active" }).lean()
      if (tenant) {
        console.log("[v0] [Tenant Resolver] ✓ FOUND by URL param:", tenant.name)
        return tenant
      }
      console.log("[v0] [Tenant Resolver] ✗ Not found by URL param")
    }

    console.log("[v0] [Tenant Resolver] Method 4: Looking up by domain_list:", hostname)
    tenant = await Tenant.findOne({
      "domain_list.domain": hostname,
      "domain_list.isActive": true,
      status: "active",
    }).lean()

    if (tenant) {
      console.log("[v0] [Tenant Resolver] ✓ FOUND by domain_list:", tenant.name)
      return tenant
    }
    console.log("[v0] [Tenant Resolver] ✗ Not found by domain_list")

    console.log("[v0] [Tenant Resolver] Method 5: Getting default provider tenant")
    tenant = await Tenant.findOne({ type: "provider", status: "active" }).lean()

    if (tenant) {
      console.log("[v0] [Tenant Resolver] ✓ FOUND provider tenant:", tenant.name)
      return tenant
    }

    console.log("[v0] [Tenant Resolver] ✗ NO TENANT FOUND AT ALL")
    return null
  } catch (error) {
    console.error("[v0] [Tenant Resolver] ERROR:", error)
    return null
  }
}

/**
 * Get tenant theme configuration
 */
export function getTenantTheme(tenant) {
  if (!tenant) {
    return {
      primaryColor: "#FFD700",
      secondaryColor: "#0A1A2F",
      accentColor: "#4A90E2",
      logoUrl: "",
      brandName: "GoalBet",
    }
  }

  return {
    primaryColor: tenant.theme?.primaryColor || "#FFD700",
    secondaryColor: tenant.theme?.secondaryColor || "#0A1A2F",
    accentColor: tenant.theme?.accentColor || "#4A90E2",
    logoUrl: tenant.theme?.logoUrl || "",
    brandName: tenant.theme?.brandName || tenant.name,
    customCSS: tenant.theme?.customCSS || "",
  }
}

/**
 * Generate subdomain URL for a tenant
 */
export function generateSubdomainURL(tenantSlug) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "goalbett.com"
  const protocol = baseURL.includes("localhost") ? "http" : "https"

  if (baseURL.includes("localhost")) {
    return `${protocol}://${tenantSlug}.${baseURL}`
  }

  return `${protocol}://${tenantSlug}.${baseURL}`
}
