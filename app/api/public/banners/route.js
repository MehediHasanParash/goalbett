import dbConnect from "@/lib/db"
import Banner from "@/lib/models/Banner"

export async function GET(request) {
  try {
    await dbConnect()

    // Get tenant from hostname if needed
    const hostname = request.headers.get("host") || ""

    // Fetch active banners sorted by position
    const banners = await Banner.find({
      isActive: true,
    })
      .sort({ position: 1, createdAt: -1 })
      .limit(10)
      .lean()

    return Response.json({
      success: true,
      data: banners,
    })
  } catch (error) {
    console.error("Public banners fetch error:", error)
    return Response.json(
      {
        success: false,
        error: "Failed to fetch banners",
      },
      { status: 500 },
    )
  }
}
