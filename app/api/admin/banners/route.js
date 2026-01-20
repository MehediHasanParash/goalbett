import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Banner from "@/lib/models/Banner"
import { verifyJWT } from "@/lib/jwt"
import User from "@/lib/models/User"

// GET - Fetch tenant-specific banners
export async function GET(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    const user = await User.findById(decoded.userId).populate("tenantId")

    if (!user || !user.tenantId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const banners = await Banner.find({
      scope: "tenant",
      tenantId: user.tenantId._id,
    })
      .sort({ position: 1, createdAt: -1 })
      .populate("createdBy", "name email")

    return NextResponse.json({ success: true, data: banners })
  } catch (error) {
    console.error("[v0] Fetch tenant banners error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create tenant banner
export async function POST(request) {
  try {
    await connectDB()

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
    const { title, subtitle, imageUrl, buttonText, linkUrl, linkType, size, position, startDate, endDate } = body

    if (!title || !imageUrl || !linkUrl) {
      return NextResponse.json(
        { success: false, error: "Title, image URL, and link URL are required" },
        { status: 400 },
      )
    }

    const banner = await Banner.create({
      title,
      subtitle,
      imageUrl,
      buttonText: buttonText || "Learn More",
      linkUrl,
      linkType: linkType || "custom",
      size: size || "large",
      position: position || 0,
      scope: "tenant",
      tenantId: user.tenantId._id,
      createdBy: user._id,
      startDate,
      endDate,
    })

    return NextResponse.json({ success: true, data: banner }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create tenant banner error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
