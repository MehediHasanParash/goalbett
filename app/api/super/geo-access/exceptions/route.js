import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import GeoAccessException from "@/lib/models/GeoAccessException"
import CountryRuleHistory from "@/lib/models/CountryRuleHistory"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth"
import { invalidateExceptionsCache } from "@/lib/services/geo-access-service"

// GET - List all exceptions
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const active = searchParams.get("active")

    const query = {}
    if (type) query.type = type
    if (active === "true") {
      query.isActive = true
      query.$or = [{ endsAt: { $gte: new Date() } }, { endsAt: null }]
    } else if (active === "false") {
      query.$or = [{ isActive: false }, { endsAt: { $lt: new Date() } }]
    }

    const exceptions = await GeoAccessException.find(query)
      .sort({ createdAt: -1 })
      .populate("accountId", "email username")
      .lean()

    // Add computed validity status
    const now = new Date()
    const exceptionsWithStatus = exceptions.map((e) => ({
      ...e,
      isCurrentlyValid:
        e.isActive && (!e.startsAt || now >= new Date(e.startsAt)) && (!e.endsAt || now <= new Date(e.endsAt)),
    }))

    return NextResponse.json({
      success: true,
      exceptions: exceptionsWithStatus,
      total: exceptionsWithStatus.length,
    })
  } catch (error) {
    console.error("Error fetching exceptions:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new exception
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { type, accountId, accountEmail, ipOrCidr, countryCode, status, startsAt, endsAt, note, licenseProofUrl } =
      body

    // Validate required fields
    if (!type || !status) {
      return NextResponse.json({ success: false, error: "Type and status are required" }, { status: 400 })
    }

    // Validate type-specific fields
    if (type === "ACCOUNT" && !accountId && !accountEmail) {
      return NextResponse.json(
        { success: false, error: "Account ID or email is required for ACCOUNT type" },
        { status: 400 },
      )
    }

    if ((type === "IP" || type === "CIDR") && !ipOrCidr) {
      return NextResponse.json({ success: false, error: "IP or CIDR is required for IP/CIDR type" }, { status: 400 })
    }

    // If email provided, look up account
    let resolvedAccountId = accountId
    let resolvedAccountEmail = accountEmail
    if (accountEmail && !accountId) {
      const user = await User.findOne({ email: accountEmail.toLowerCase() })
      if (user) {
        resolvedAccountId = user._id
        resolvedAccountEmail = user.email
      }
    }

    const exception = await GeoAccessException.create({
      type,
      accountId: resolvedAccountId,
      accountEmail: resolvedAccountEmail,
      ipOrCidr,
      countryCode: countryCode?.toUpperCase(),
      status,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      note,
      licenseProofUrl,
      createdBy: decoded.userId,
      createdByEmail: decoded.email,
    })

    // Log history
    await CountryRuleHistory.create({
      countryCode: countryCode?.toUpperCase() || "ALL",
      actionType: "EXCEPTION_ADD",
      newValues: { type, status, accountEmail: resolvedAccountEmail, ipOrCidr, note },
      changedBy: decoded.userId,
      changedByEmail: decoded.email,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      note: `Exception added: ${type} - ${status}`,
    })

    // Invalidate cache
    invalidateExceptionsCache()

    return NextResponse.json({ success: true, exception })
  } catch (error) {
    console.error("Error creating exception:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Remove exception
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Exception ID is required" }, { status: 400 })
    }

    const exception = await GeoAccessException.findByIdAndDelete(id)

    if (!exception) {
      return NextResponse.json({ success: false, error: "Exception not found" }, { status: 404 })
    }

    // Log history
    await CountryRuleHistory.create({
      countryCode: exception.countryCode || "ALL",
      actionType: "EXCEPTION_REMOVE",
      oldValues: {
        type: exception.type,
        status: exception.status,
        accountEmail: exception.accountEmail,
        ipOrCidr: exception.ipOrCidr,
      },
      changedBy: decoded.userId,
      changedByEmail: decoded.email,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      note: `Exception removed: ${exception.type}`,
    })

    // Invalidate cache
    invalidateExceptionsCache()

    return NextResponse.json({ success: true, deleted: true })
  } catch (error) {
    console.error("Error deleting exception:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
