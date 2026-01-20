import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"
import { generateToken } from "@/lib/jwt"
import { createAuditLog } from "@/lib/middleware/audit-middleware"

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, phone, username, password, role, hostname } = body

    console.log("[v0] Login attempt:", { email, phone, username, role, hostname })

    if ((!email && !phone && !username) || !password) {
      return NextResponse.json(
        { success: false, error: "Username/email/phone and password are required" },
        { status: 400 },
      )
    }

    const query = {}
    if (username) {
      query.username = username.toLowerCase()
    } else if (email) {
      query.email = email.toLowerCase()
    } else if (phone) {
      query.phone = phone
    }

    const user = await User.findOne(query).select("+password")

    if (!user) {
      console.log("[v0] Login failed: User not found for query", query)
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    console.log("[v0] User found:", {
      id: user._id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
    })

    if (role === "player" && user.tenant_id) {
      const host = hostname || request.headers.get("host") || ""
      console.log("[v0] Validating tenant access for host:", host)

      let currentTenantId = null

      // Check subdomain (e.g., xbet.localhost:3000)
      if (host && host !== "localhost" && host !== "localhost:3000") {
        const subdomain = host.split(".")[0]
        if (subdomain && subdomain !== "localhost" && subdomain !== "www") {
          const tenantBySlug = await Tenant.findOne({
            slug: subdomain.toLowerCase(),
            status: "active",
          })
          if (tenantBySlug) {
            currentTenantId = tenantBySlug._id.toString()
            console.log("[v0] Found tenant by subdomain:", { subdomain, tenant_id: currentTenantId })
          }
        }

        // Also check domain_list
        if (!currentTenantId) {
          const tenantByDomain = await Tenant.findOne({
            "domain_list.domain": host,
            "domain_list.isActive": true,
            status: "active",
          })
          if (tenantByDomain) {
            currentTenantId = tenantByDomain._id.toString()
            console.log("[v0] Found tenant by domain_list:", { domain: host, tenant_id: currentTenantId })
          }
        }
      }

      // If we found a current tenant, validate user belongs to it
      if (currentTenantId && user.tenant_id.toString() !== currentTenantId) {
        console.log("[v0] Tenant mismatch:", {
          userTenant: user.tenant_id.toString(),
          currentTenant: currentTenantId,
        })
        return NextResponse.json(
          {
            success: false,
            error: "This account is not registered with this platform. Please login at your registered platform.",
          },
          { status: 403 },
        )
      }
    }

    // Validate password
    console.log("[v0] Comparing password, input length:", password?.length)
    const isPasswordValid = await user.comparePassword(password)
    console.log("[v0] Password comparison result:", isPasswordValid)

    if (!isPasswordValid) {
      console.log("[v0] Login failed: Invalid password")
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Check user status
    if (user.status !== "active" && user.status !== "pending_verification") {
      return NextResponse.json({ success: false, error: `Account is ${user.status}` }, { status: 403 })
    }

    // Validate role if specified
    if (role && user.role !== role) {
      console.log("[v0] Role mismatch:", { expected: role, actual: user.role })
      return NextResponse.json({ success: false, error: `This account is not registered as ${role}` }, { status: 403 })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken({
      userId: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenant_id: user.tenant_id,
    })

    // Create audit log
    await createAuditLog({
      tenant_id: user.tenant_id,
      actor: { userId: user._id.toString(), email: user.email || user.username || user.phone, role: user.role },
      action: "auth.login",
      resource: { type: "user", id: user._id.toString(), name: user.fullName },
      metadata: { loginMethod: username ? "username" : email ? "email" : "phone" },
      severity: "low",
      request,
    })

    const userData = user.toJSON()

    console.log("[v0] Login successful:", { email: user.email, role: user.role, tenant_id: user.tenant_id })

    return NextResponse.json(
      {
        success: true,
        user: userData,
        token,
        message: "Login successful",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ success: false, error: error.message || "Login failed" }, { status: 500 })
  }
}
