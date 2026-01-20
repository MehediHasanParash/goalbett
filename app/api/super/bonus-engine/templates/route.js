import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import BonusTemplate from "@/lib/models/BonusTemplate"

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const query = {}
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const category = searchParams.get("category")

    if (status) query.status = status
    if (type) query.type = type
    if (category) query.category = category

    const templates = await BonusTemplate.find(query).sort({ priority: -1, createdAt: -1 }).lean()

    return NextResponse.json({ success: true, templates })
  } catch (error) {
    console.error("[Bonus Templates API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()
    const data = await request.json()

    // Generate unique code if not provided
    if (!data.code) {
      data.code = `BONUS${Date.now().toString(36).toUpperCase()}`
    }

    const template = new BonusTemplate({
      ...data,
      createdBy: decoded.userId,
    })

    await template.save()
    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error("[Bonus Templates API] Error:", error)
    if (error.code === 11000) {
      return NextResponse.json({ error: "Bonus code already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
