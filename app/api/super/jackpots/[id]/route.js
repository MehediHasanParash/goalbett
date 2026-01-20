import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import Jackpot from "@/lib/models/Jackpot"
import JackpotEntry from "@/lib/models/JackpotEntry"

const ALLOWED_ROLES_READ = ["superadmin", "super_admin", "tenant_admin", "admin"]
const ALLOWED_ROLES_WRITE = ["superadmin", "super_admin", "admin"]

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("[v0] Jackpot GET [id] - Token present:", !!token)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] Jackpot GET [id] - Role:", decoded?.role)

    if (!decoded || !ALLOWED_ROLES_READ.includes(decoded.role)) {
      return NextResponse.json({ error: `Forbidden - Role '${decoded?.role}' not allowed` }, { status: 403 })
    }

    await connectToDatabase()
    const { id } = await params

    const jackpot = await Jackpot.findById(id).lean()
    if (!jackpot) {
      return NextResponse.json({ error: "Jackpot not found" }, { status: 404 })
    }

    const entries = await JackpotEntry.find({ jackpotId: id }).sort({ correctPredictions: -1, createdAt: 1 }).lean()

    return NextResponse.json({
      success: true,
      jackpot,
      entries,
      participantCount: entries.length,
    })
  } catch (error) {
    console.error("[v0] Jackpot API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("[v0] Jackpot PUT - Token present:", !!token)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] Jackpot PUT - Role:", decoded?.role)

    if (!decoded || !ALLOWED_ROLES_WRITE.includes(decoded.role)) {
      return NextResponse.json({ error: `Forbidden - Role '${decoded?.role}' not allowed` }, { status: 403 })
    }

    await connectToDatabase()
    const { id } = await params
    const data = await request.json()

    const jackpot = await Jackpot.findByIdAndUpdate(id, { ...data, updatedBy: decoded.userId }, { new: true })

    if (!jackpot) {
      return NextResponse.json({ error: "Jackpot not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, jackpot })
  } catch (error) {
    console.error("[v0] Jackpot API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("[v0] Jackpot DELETE - Token present:", !!token)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    console.log("[v0] Jackpot DELETE - Role:", decoded?.role)

    if (!decoded || !ALLOWED_ROLES_WRITE.includes(decoded.role)) {
      return NextResponse.json({ error: `Forbidden - Role '${decoded?.role}' not allowed` }, { status: 403 })
    }

    await connectToDatabase()
    const { id } = await params

    const entryCount = await JackpotEntry.countDocuments({ jackpotId: id })
    if (entryCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete jackpot with participants. Cancel it instead." },
        { status: 400 },
      )
    }

    const jackpot = await Jackpot.findByIdAndDelete(id)
    if (!jackpot) {
      return NextResponse.json({ error: "Jackpot not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Jackpot deleted" })
  } catch (error) {
    console.error("[v0] Jackpot API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
