import { NextResponse } from "next/server"
import { uploadImage, deleteImage } from "@/lib/cloudinary"

export async function POST(request) {
  console.log("[v0] [Sport Icon Upload] Starting upload...")

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const oldPublicId = formData.get("oldPublicId")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Delete old image if exists
    if (oldPublicId) {
      console.log("[v0] [Sport Icon Upload] Deleting old image:", oldPublicId)
      await deleteImage(oldPublicId)
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log("[v0] [Sport Icon Upload] Uploading to Cloudinary...")

    // Upload to Cloudinary with sport-icons folder
    const result = await uploadImage(buffer, "sport-icons")

    console.log("[v0] [Sport Icon Upload] Upload successful:", result.secure_url)

    return NextResponse.json({
      success: true,
      iconUrl: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("[v0] [Sport Icon Upload] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload icon" }, { status: 500 })
  }
}
