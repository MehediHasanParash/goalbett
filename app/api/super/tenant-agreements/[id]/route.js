import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import TenantAgreement from "@/lib/models/TenantAgreement"
import { verifyJWT } from "@/lib/auth"

export async function GET(request, { params }) {
  try {
    await dbConnect()

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || (decoded.role !== "super_admin" && decoded.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const agreement = await TenantAgreement.findById(id)
      .populate("tenantId", "name slug")
      .populate("legalEntityId", "legalName registrationNumber")
      .lean()

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, agreement })
  } catch (error) {
    console.error("[v0] Agreement fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    const { id } = await params
    console.log("[v0] Update request for agreement:", id)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || (decoded.role !== "super_admin" && decoded.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await request.json()

    if (data.tenantId === "" || data.tenantId === null || data.tenantId === undefined) {
      delete data.tenantId
    }
    if (data.legalEntityId === "" || data.legalEntityId === null || data.legalEntityId === undefined) {
      delete data.legalEntityId
    }

    console.log("[v0] Update data:", data)

    const agreement = await TenantAgreement.findByIdAndUpdate(
      id,
      { ...data, lastUpdatedBy: decoded.userId },
      { new: true, runValidators: true },
    )

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    console.log("[v0] Agreement updated successfully")
    return NextResponse.json({ success: true, agreement })
  } catch (error) {
    console.error("[v0] Agreement update error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || (decoded.role !== "super_admin" && decoded.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const agreement = await TenantAgreement.findByIdAndDelete(id)

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Agreement deleted" })
  } catch (error) {
    console.error("[v0] Agreement deletion error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
