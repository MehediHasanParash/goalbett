import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import GameProvider from "@/lib/models/GameProvider"

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const allowedRoles = ["superadmin", "super_admin", "tenant_admin", "admin"]

    if (!decoded || !allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()
    const provider = await GameProvider.findById(params.id).lean()

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, provider })
  } catch (error) {
    console.error("[v0] Providers API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const allowedRoles = ["superadmin", "super_admin", "admin"]

    if (!decoded || !allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()
    const data = await request.json()

    const provider = await GameProvider.findByIdAndUpdate(
      params.id,
      {
        ...data,
        updatedBy: decoded.userId,
      },
      { new: true, runValidators: true },
    )

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, provider })
  } catch (error) {
    console.error("[v0] Providers API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const allowedRoles = ["superadmin", "super_admin", "admin"]

    if (!decoded || !allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()
    const provider = await GameProvider.findByIdAndDelete(params.id)

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Provider deleted" })
  } catch (error) {
    console.error("[v0] Providers API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
