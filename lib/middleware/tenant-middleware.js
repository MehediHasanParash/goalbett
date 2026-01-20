import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import { cacheGet, cacheSet } from "@/lib/redis"

// Extract tenant from request (domain-based or header-based)
export async function getTenantFromRequest(request) {
  const hostname = request.headers.get("host") || ""
  const tenantSlug = request.headers.get("x-tenant-slug")

  // Try cache first
  const cacheKey = `tenant:${tenantSlug || hostname}`
  const cached = await cacheGet(cacheKey)
  if (cached) {
    return cached
  }

  await connectDB()

  let tenant = null

  // Try by slug first (from header)
  if (tenantSlug) {
    tenant = await Tenant.findOne({ slug: tenantSlug, status: "active" }).lean()
  }

  // Try by domain
  if (!tenant && hostname) {
    tenant = await Tenant.findOne({
      "domain_list.domain": hostname,
      "domain_list.isActive": true,
      status: "active",
    }).lean()
  }

  if (tenant) {
    // Cache for 5 minutes
    await cacheSet(cacheKey, tenant, 300)
  }

  return tenant
}

// Middleware to inject tenant_id into request context
export async function withTenant(request, handler) {
  const tenant = await getTenantFromRequest(request)

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
  }

  // Add tenant to request context
  request.tenant = tenant
  request.tenant_id = tenant._id

  return handler(request)
}

// Validation middleware - ensures tenant is active
export function requireActiveTenant(tenant) {
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
  }

  if (tenant.status !== "active") {
    return NextResponse.json({ error: "Tenant is not active" }, { status: 403 })
  }

  return null
}
