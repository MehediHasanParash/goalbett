import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import PlayerKYC from "@/lib/models/PlayerKYC"
import User from "@/lib/models/User"
import { uploadImage } from "@/lib/cloudinary"

export async function POST(request) {
  try {
    let token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get("auth_token")?.value
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 })
    }

    await dbConnect()

    const body = await request.json()
    const { documentType, fileData, fileName } = body

    console.log("[v0] KYC Upload - documentType:", documentType)

    if (!documentType || !fileData || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "").replace(/^data:application\/pdf;base64,/, "")
    const fileBuffer = Buffer.from(base64Data, "base64")

    // Upload to Cloudinary in kyc-documents folder
    const cloudinaryResult = await uploadImage(fileBuffer, "kyc-documents")
    const documentUrl = cloudinaryResult.secure_url

    console.log("[v0] Uploaded to Cloudinary:", documentUrl)

    // Get or create KYC record
    let kycRecord = await PlayerKYC.findOne({ userId: decoded.userId })

    if (!kycRecord) {
      const user = await User.findById(decoded.userId)
      kycRecord = await PlayerKYC.create({
        userId: decoded.userId,
        tenant_id: user.tenant_id,
        documents: {
          identity: { status: "not_submitted" },
          proofOfAddress: { status: "not_submitted" },
          selfie: { status: "not_submitted" },
        },
      })
    }

    let updateData = {}

    if (documentType === "identity") {
      updateData = {
        "documents.identity.frontImage": documentUrl,
        "documents.identity.status": "pending",
        "documents.identity.uploadedAt": new Date(),
      }
    } else if (documentType === "address") {
      updateData = {
        "documents.proofOfAddress.image": documentUrl,
        "documents.proofOfAddress.status": "pending",
        "documents.proofOfAddress.uploadedAt": new Date(),
      }
    } else if (documentType === "selfie") {
      updateData = {
        "documents.selfie.image": documentUrl,
        "documents.selfie.status": "pending",
        "documents.selfie.uploadedAt": new Date(),
      }
    } else {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    // Also update overallStatus to pending
    updateData.overallStatus = "pending"

    const updatedRecord = await PlayerKYC.findOneAndUpdate(
      { userId: decoded.userId },
      { $set: updateData },
      { new: true },
    )

    console.log("[v0] Updated KYC record:", JSON.stringify(updatedRecord?.documents, null, 2))

    // Update user KYC status
    await User.findByIdAndUpdate(decoded.userId, { kyc_status: "pending" })

    return NextResponse.json({
      success: true,
      url: documentUrl,
      message: "Document uploaded successfully",
    })
  } catch (error) {
    console.error("[v0] Error uploading KYC document:", error)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}
