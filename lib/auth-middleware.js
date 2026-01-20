import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { ROLES } from "./auth-service"

/**
 * Verify authentication and authorization for API routes
 * @param {Request} request - The incoming request
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Promise<{authenticated: boolean, user?: any, error?: string}>}
 */
export async function verifyAuth(request, allowedRoles = []) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { authenticated: false, error: "No token provided" }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production"

    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (jwtError) {
      console.error("[v0] JWT verification failed:", jwtError.message)
      return { authenticated: false, error: "Invalid token" }
    }

    // Check if user has required role
    if (allowedRoles.length > 0) {
      const userRole = decoded.role || decoded.userRole

      if (!allowedRoles.includes(userRole)) {
        return {
          authenticated: false,
          error: "Insufficient permissions",
          user: decoded,
        }
      }
    }

    return {
      authenticated: true,
      user: decoded,
    }
  } catch (error) {
    console.error("[v0] Auth middleware error:", error)
    return {
      authenticated: false,
      error: "Authentication failed",
    }
  }
}

/**
 * Middleware wrapper for API routes
 * @param {Function} handler - The API route handler
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Wrapped handler
 */
export function withAuth(handler, allowedRoles = []) {
  return async (request, context) => {
    const authResult = await verifyAuth(request, allowedRoles)

    if (!authResult.authenticated) {
      return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 })
    }

    // Attach user to request for handler to use
    request.user = authResult.user

    return handler(request, context)
  }
}

/**
 * Check if user has specific role
 * @param {string} userRole - User's role
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export function hasRole(userRole, allowedRoles) {
  return allowedRoles.includes(userRole)
}

/**
 * Check if user has super admin role
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export function isSuperAdmin(userRole) {
  return userRole === ROLES.SUPER_ADMIN || userRole === ROLES.SUPERADMIN
}
