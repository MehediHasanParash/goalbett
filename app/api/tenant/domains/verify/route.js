import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

export async function POST(request) {
  try {
    await connectDB()

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const tenantId = decoded?.tenant_id || decoded?.tenantId

    if (!decoded || !tenantId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { domain } = await request.json()

    const vercelToken = process.env.VERCEL_API_TOKEN

    if (!vercelToken) {
      return NextResponse.json({ error: "Vercel API credentials not configured" }, { status: 500 })
    }

    // Check domain verification status
    const response = await fetch(`https://api.vercel.com/v6/domains/${domain}/config`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to verify domain" }, { status: 500 })
    }

    const data = await response.json()
    const verified = !data.misconfigured

    if (verified) {
      const { default: Tenant } = await import("@/lib/models/Tenant")

      await Tenant.findOneAndUpdate(
        { _id: tenantId, "domain_list.domain": domain },
        {
          $set: {
            "domain_list.$.verificationStatus": "verified",
          },
        },
      )
    }

    return NextResponse.json({
      success: true,
      verified,
    })
  } catch (error) {
    console.error("Error verifying domain:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
