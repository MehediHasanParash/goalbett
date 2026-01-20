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

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Add domain to Vercel
    const vercelToken = process.env.VERCEL_API_TOKEN
    const vercelProjectId = process.env.VERCEL_PROJECT_ID

    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json({ error: "Vercel API credentials not configured" }, { status: 500 })
    }

    // Add domain to Vercel project
    const addDomainResponse = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    })

    if (!addDomainResponse.ok) {
      const error = await addDomainResponse.json()
      return NextResponse.json(
        { error: error.error?.message || "Failed to add domain to Vercel" },
        { status: addDomainResponse.status },
      )
    }

    // Fetch DNS configuration
    const configResponse = await fetch(`https://api.vercel.com/v6/domains/${domain}/config`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    if (!configResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch DNS configuration" }, { status: 500 })
    }

    const configData = await configResponse.json()

    // Extract rank 1 DNS records
    const rank1CNAME = configData.recommendedCNAME?.find((item) => item.rank === 1)
    const rank1IPv4 = configData.recommendedIPv4?.find((item) => item.rank === 1)

    const dnsRecords = []

    if (rank1CNAME) {
      dnsRecords.push({
        type: "CNAME",
        name: "@",
        value: rank1CNAME.value.replace(/\.$/, ""),
      })
    }

    if (rank1IPv4 && rank1IPv4.value.length > 0) {
      dnsRecords.push({
        type: "A",
        name: "@",
        value: rank1IPv4.value[0],
      })
    }

    const { default: Tenant } = await import("@/lib/models/Tenant")

    await Tenant.findByIdAndUpdate(tenantId, {
      primaryDomain: domain,
      $addToSet: {
        domain_list: {
          domain,
          isActive: true,
          isPrimary: true,
          verificationStatus: "pending",
        },
      },
    })

    return NextResponse.json({
      success: true,
      dnsRecords,
    })
  } catch (error) {
    console.error("Error adding domain:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
