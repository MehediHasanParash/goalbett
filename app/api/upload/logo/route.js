import { NextResponse } from "next/server"
import { uploadImage, deleteImage } from "@/lib/cloudinary"

export async function POST(request) {
  console.log("[v0] [Logo Upload] Starting upload...")

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const logoUrl = formData.get("logoUrl")
    const oldPublicId = formData.get("oldPublicId")

    // If URL is provided instead of file, just return the URL
    if (logoUrl && !file) {
      console.log("[v0] [Logo Upload] Using provided URL:", logoUrl)
      return NextResponse.json({
        success: true,
        logoUrl: logoUrl,
        publicId: null,
        source: "url",
      })
    }

    if (!file) {
      return NextResponse.json({ error: "No file or URL provided" }, { status: 400 })
    }

    // Delete old image if exists
    if (oldPublicId) {
      console.log("[v0] [Logo Upload] Deleting old image:", oldPublicId)
      await deleteImage(oldPublicId)
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log("[v0] [Logo Upload] Uploading to Cloudinary...")

    // Upload to Cloudinary with tenant-logos folder
    const result = await uploadImage(buffer, "tenant-logos")

    console.log("[v0] [Logo Upload] Upload successful:", result.secure_url)

    return NextResponse.json({
      success: true,
      logoUrl: result.secure_url,
      publicId: result.public_id,
      source: "cloudinary",
    })
  } catch (error) {
    console.error("[v0] [Logo Upload] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload logo" }, { status: 500 })
  }
}
