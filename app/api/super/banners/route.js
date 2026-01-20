import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Banner from "@/lib/models/Banner"
import { verifyJWT } from "@/lib/jwt"
import User from "@/lib/models/User"

// GET - Fetch all platform banners
export async function GET(request) {
  try {
    console.log("[v0] Banners API: Starting GET request")
    console.log("[v0] Banners API: MONGODB_URI exists:", !!process.env.MONGODB_URI)

    await connectDB()
    console.log("[v0] Banners API: DB connected")

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.log("[v0] Banners API: No token provided")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Banners API: Token received, verifying...")
    const decoded = verifyJWT(token) // Removed await - verifyJWT is synchronous
    console.log("[v0] Banners API: Token decoded:", decoded ? "success" : "failed")

    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const user = await User.findById(decoded.userId)
    console.log("[v0] Banners API: User found:", !!user, user?.role)

    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const banners = await Banner.find({ scope: "platform" })
      .sort({ position: 1, createdAt: -1 })
      .populate("createdBy", "name email")

    console.log("[v0] Banners API: Found banners:", banners.length)
    return NextResponse.json({ success: true, data: banners })
  } catch (error) {
    console.error("[v0] Fetch platform banners error:", error.message)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create platform banner
export async function POST(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const user = await User.findById(decoded.userId)

    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      imageUrl,
      buttonText,
      linkUrl,
      link,
      linkType,
      size,
      position,
      startDate,
      endDate,
      isActive,
    } = body

    const finalLinkUrl = linkUrl || link
    const finalSubtitle = subtitle || description

    if (!title || !imageUrl || !finalLinkUrl) {
      return NextResponse.json(
        { success: false, error: "Title, image URL, and link URL are required" },
        { status: 400 },
      )
    }

    const banner = await Banner.create({
      title,
      subtitle: finalSubtitle,
      imageUrl,
      buttonText: buttonText || "Learn More",
      linkUrl: finalLinkUrl,
      link: finalLinkUrl,
      linkType: linkType || "custom",
      size: size || "large",
      position: position || 0,
      scope: "platform",
      tenantId: null,
      createdBy: user._id,
      isActive: isActive !== undefined ? isActive : true,
      startDate,
      endDate,
    })

    return NextResponse.json({ success: true, data: banner }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create platform banner error:", error.message)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
