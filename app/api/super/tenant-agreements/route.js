import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import TenantAgreement from "@/lib/models/TenantAgreement"
import { verifyJWT } from "@/lib/auth"

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || (decoded.role !== "super_admin" && decoded.role !== "superadmin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const status = searchParams.get("status")

    const query = {}
    if (tenantId) query.tenantId = tenantId
    if (status) query.status = status

    const agreements = await TenantAgreement.find(query)
      .populate("tenantId", "name slug")
      .populate("legalEntityId", "legalName registrationNumber")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      agreements,
    })
  } catch (error) {
    console.error("[v0] Error fetching agreements:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || (decoded.role !== "super_admin" && decoded.role !== "superadmin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()

    // Generate reference number if not provided
    if (!body.referenceNumber) {
      const count = await TenantAgreement.countDocuments()
      body.referenceNumber = `AGR-${Date.now()}-${count + 1}`
    }

    body.createdBy = decoded.userId

    const agreement = await TenantAgreement.create(body)

    return NextResponse.json({
      success: true,
      agreement,
      message: "Agreement created successfully",
    })
  } catch (error) {
    console.error("[v0] Error creating agreement:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
