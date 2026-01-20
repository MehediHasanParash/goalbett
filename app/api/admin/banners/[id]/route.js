import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Banner from "@/lib/models/Banner"
import { verifyJWT } from "@/lib/jwt"
import User from "@/lib/models/User"

// PUT - Update tenant banner
export async function PUT(request, { params }) {
  try {
    await connectDB()
    const { id } = await params

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    const user = await User.findById(decoded.userId).populate("tenantId")

    if (!user || !user.tenantId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const banner = await Banner.findOneAndUpdate(
      {
        _id: id,
        tenantId: user.tenantId._id,
      },
      body,
      { new: true },
    )

    if (!banner) {
      return NextResponse.json({ success: false, error: "Banner not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: banner })
  } catch (error) {
    console.error("[v0] Update tenant banner error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete tenant banner
export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const { id } = await params

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    const user = await User.findById(decoded.userId).populate("tenantId")

    if (!user || !user.tenantId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const banner = await Banner.findOneAndDelete({
      _id: id,
      tenantId: user.tenantId._id,
    })

    if (!banner) {
      return NextResponse.json({ success: false, error: "Banner not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Banner deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete tenant banner error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
