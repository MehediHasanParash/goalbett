import { verifyToken } from "@/lib/jwt"
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"


// Role hierarchy - higher number = more permissions
const ROLE_HIERARCHY = {
  guest: 0,
  player: 1,
  sub_agent: 2,
  agent: 3,
  admin: 4,
  tenant_admin: 5,
  superadmin: 6,
}

// Extract tenant from request (domain, header, or query)
export async function extractTenantContext(request) {
  const url = new URL(request.url)
  const host = request.headers.get("host") || ""
  
  // Check for tenant in header
  let tenantSlug = request.headers.get("x-tenant-slug")
  
  // Check for tenant in query params
  if (!tenantSlug) {
    tenantSlug = url.searchParams.get("tenant")
  }
  
  // Check for subdomain (e.g., tenant1.example.com)
  if (!tenantSlug && host) {
    const parts = host.split(".")
    if (parts.length > 2) {
      tenantSlug = parts[0]
    }
  }
  
  return tenantSlug
}

// Get client IP address
export function getClientIP(request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return "127.0.0.1"
}

// Middleware wrapper for protected routes
export function withAuth(handler, options = {}) {
  return async (request, context) => {
    try {
      await connectDB()
      
      // Extract token
      const authHeader = request.headers.get("authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        )
      }
      
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      
      if (!decoded) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 }
        )
      }
      
      // Get user from database
      const user = await User.findById(decoded.userId)
      if (!user || !user.isActive) {
        return NextResponse.json(
          { success: false, error: "User not found or inactive" },
          { status: 401 }
        )
      }
      
      // Check role requirement
      if (options.requiredRole) {
        const requiredRoles = Array.isArray(options.requiredRole) ? options.requiredRole : [options.requiredRole]
        if (!requiredRoles.includes(user.role)) {
          return NextResponse.json(
            { success: false, error: "Insufficient permissions" },
            { status: 403 }
          )
        }
      }
      
      // Check minimum role level
      if (options.minRoleLevel) {
        const userLevel = ROLE_HIERARCHY[user.role] || 0
        if (userLevel < options.minRoleLevel) {
          return NextResponse.json(
            { success: false, error: "Insufficient role level" },
            { status: 403 }
          )
        }
      }
      
      // Enforce tenant scoping (except for superadmin)
      if (options.requireTenant && user.role !== "superadmin") {
        const tenantSlug = await extractTenantContext(request)
        
        if (!tenantSlug) {
          return NextResponse.json(
            { success: false, error: "Tenant context required" },
            { status: 400 }
          )
        }
        
        if (!user.tenant_id) {
          return NextResponse.json(
            { success: false, error: "User not associated with any tenant" },
            { status: 403 }
          )
        }
      }
      
      // Attach user to request context
      const enrichedContext = {
        ...context,
        user,
        decoded,
        ipAddress: getClientIP(request),
      }
      
      // Call the original handler with enriched context
      return await handler(request, enrichedContext)
      
    } catch (error) {
      console.error("[v0] RBAC middleware error:", error)
      return NextResponse.json(
        { success: false, error: "Authorization failed" },
        { status: 500 }
      )
    }
  }
}

// Check if user has specific permission
export function hasPermission(user, permission) {
  // Superadmin has all permissions
  if (user.role === "superadmin") {
    return true
  }
  
  // Check role-based permissions
  if (user.permissions && user.permissions[permission]) {
    return true
  }
  
  return false
}

// Check if user has minimum role level
export function hasMinRole(user, minRole) {
  const userLevel = ROLE_HIERARCHY[user.role] || 0
  const minLevel = ROLE_HIERARCHY[minRole] || 0
  return userLevel >= minLevel
}
