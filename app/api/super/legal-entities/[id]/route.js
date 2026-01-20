import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import LegalEntity from "@/lib/models/LegalEntity"
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
    const entity = await LegalEntity.findById(id).lean()

    if (!entity) {
      return NextResponse.json({ error: "Legal entity not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, entity })
  } catch (error) {
    console.error("[v0] Legal entity fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    const { id } = await params
    console.log("[v0] Update request for entity:", id)

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

    console.log("[v0] Update data:", data)

    const entity = await LegalEntity.findByIdAndUpdate(
      id,
      { ...data, lastUpdatedBy: decoded.userId },
      { new: true, runValidators: true },
    )

    if (!entity) {
      return NextResponse.json({ error: "Legal entity not found" }, { status: 404 })
    }

    console.log("[v0] Entity updated successfully")
    return NextResponse.json({ success: true, entity })
  } catch (error) {
    console.error("[v0] Legal entity update error:", error)
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
    const entity = await LegalEntity.findByIdAndDelete(id)

    if (!entity) {
      return NextResponse.json({ error: "Legal entity not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Legal entity deleted" })
  } catch (error) {
    console.error("[v0] Legal entity deletion error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
