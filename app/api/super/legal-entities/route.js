import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import LegalEntity from "@/lib/models/LegalEntity"
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

    const entities = await LegalEntity.find(query).populate("tenantId", "name slug").sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      entities,
    })
  } catch (error) {
    console.error("[v0] Error fetching legal entities:", error)
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

    const entity = await LegalEntity.create(body)

    return NextResponse.json({
      success: true,
      entity,
      message: "Legal entity created successfully",
    })
  } catch (error) {
    console.error("[v0] Error creating legal entity:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
