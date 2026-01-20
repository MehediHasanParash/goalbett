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
    const { fullName, email, phone, password, role = "player", referralCode, brandCode, hostname } = body

    console.log("[v0] Register attempt:", { email, phone, role, hostname })

    // Validate required fields
    if (!fullName || (!email && !phone) || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (fullName, email or phone, password)" },
        { status: 400 },
      )
    }

    let tenant_id = body.tenant_id

    if (role === "player" && !tenant_id) {
      const host = hostname || request.headers.get("host") || ""
      console.log("[v0] Resolving tenant from host:", host)

      // Check subdomain first (e.g., xbet.localhost:3000)
      if (host && host !== "localhost" && host !== "localhost:3000") {
        const subdomain = host.split(".")[0]
        if (subdomain && subdomain !== "localhost" && subdomain !== "www") {
          const tenantBySlug = await Tenant.findOne({
            slug: subdomain.toLowerCase(),
            status: "active",
          })
          if (tenantBySlug) {
            tenant_id = tenantBySlug._id.toString()
            console.log("[v0] Found tenant by subdomain:", { subdomain, tenant_id })
          }
        }

        // Check domain_list
        if (!tenant_id) {
          const tenantByDomain = await Tenant.findOne({
            "domain_list.domain": host,
            "domain_list.isActive": true,
            status: "active",
          })
          if (tenantByDomain) {
            tenant_id = tenantByDomain._id.toString()
            console.log("[v0] Found tenant by domain_list:", { domain: host, tenant_id })
          }
        }
      }

      // Fallback: Use first active tenant (for localhost development)
      if (!tenant_id) {
        const fallbackTenant = await Tenant.findOne({ status: "active" }).sort({ createdAt: 1 })
        if (fallbackTenant) {
          tenant_id = fallbackTenant._id.toString()
          console.log("[v0] Using fallback tenant:", { tenant_id, name: fallbackTenant.name })
        } else {
          return NextResponse.json(
            { success: false, error: "No active tenant found. Please contact support." },
            { status: 400 },
          )
        }
      }
    }

    // Validate tenant exists
    if (tenant_id) {
      const tenant = await Tenant.findById(tenant_id)
      if (!tenant) {
        return NextResponse.json({ success: false, error: "Invalid tenant" }, { status: 400 })
      }
      if (tenant.status !== "active") {
        return NextResponse.json({ success: false, error: "Tenant is not active" }, { status: 403 })
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [email ? { email: email.toLowerCase() } : null, phone ? { phone } : null].filter(Boolean),
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email or phone already exists" },
        { status: 400 },
      )
    }

    // Validate role
    const validRoles = ["player", "agent", "sub_agent", "admin", "tenant_admin", "superadmin"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 })
    }

    // Create new user
    const userData = {
      fullName,
      password,
      role,
      status: "active",
      kyc_status: "not_submitted",
      balance: 0,
    }

    if (email) userData.email = email.toLowerCase()
    if (phone) userData.phone = phone
    if (tenant_id) userData.tenant_id = tenant_id

    const user = await User.create(userData)

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email || user.phone,
      role: user.role,
      tenant_id: user.tenant_id,
    })

    // Create audit log
    await createAuditLog({
      tenant_id: user.tenant_id,
      actor: { userId: user._id.toString(), email: user.email || user.phone, role: user.role },
      action: "user.register",
      resource: { type: "user", id: user._id.toString(), name: user.fullName },
      metadata: { role: user.role, registrationMethod: email ? "email" : "phone" },
      severity: "medium",
      request,
    })

    const userDataResponse = user.toJSON()

    console.log("[v0] Registration successful:", { email: user.email, role: user.role, tenant_id: user.tenant_id })

    return NextResponse.json(
      {
        success: true,
        user: userDataResponse,
        token,
        message: "Account created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Register error:", error)
    return NextResponse.json({ success: false, error: error.message || "Registration failed" }, { status: 500 })
  }
}
