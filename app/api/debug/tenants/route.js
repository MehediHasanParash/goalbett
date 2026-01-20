import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"

// Simple debug endpoint to see all tenants in database
export async function GET(request) {
  console.log("[v0] [Debug] Fetching all tenants from database...")

  try {
    await connectDB()

    const tenants = await Tenant.find({}).lean()

    console.log("[v0] [Debug] Found", tenants.length, "tenants:")
    tenants.forEach((t) => {
      console.log("[v0] [Debug]   -", t.name, "| slug:", t.slug, "| type:", t.type, "| status:", t.status)
      console.log("[v0] [Debug]     theme:", JSON.stringify(t.theme))
      console.log("[v0] [Debug]     domains:", JSON.stringify(t.domain_list))
    })

    return NextResponse.json({
      success: true,
      count: tenants.length,
      tenants: tenants.map((t) => ({
        _id: t._id,
        name: t.name,
        slug: t.slug,
        type: t.type,
        status: t.status,
        theme: t.theme,
        domain_list: t.domain_list,
      })),
    })
  } catch (error) {
    console.error("[v0] [Debug] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
