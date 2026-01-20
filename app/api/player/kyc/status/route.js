import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongodb"
import PlayerKYC from "@/lib/models/PlayerKYC"

export async function GET(request) {
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

    const kyc = await PlayerKYC.findOne({ userId: decoded.userId }).lean()

    return NextResponse.json({
      kyc: kyc || null,
    })
  } catch (error) {
    console.error("[v0] Error fetching KYC status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
