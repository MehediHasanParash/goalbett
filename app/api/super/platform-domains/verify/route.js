import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import PlatformDomain from "@/lib/models/PlatformDomain"

// POST /api/super/platform-domains/verify - Verify domain DNS configuration
export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()
    const { domainId } = body

    if (!domainId) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 })
    }

    const domain = await PlatformDomain.findById(domainId)
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    const vercelToken = process.env.VERCEL_TOKEN
    const vercelProjectId = process.env.VERCEL_PROJECT_ID
    const vercelTeamId = process.env.VERCEL_TEAM_ID

    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json({
        success: false,
        error: "Vercel credentials not configured",
        verified: false,
      })
    }

    // Check domain status on Vercel
    const vercelUrl = vercelTeamId
      ? `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain.domain}?teamId=${vercelTeamId}`
      : `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain.domain}`

    const vercelRes = await fetch(vercelUrl, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })

    if (!vercelRes.ok) {
      return NextResponse.json({
        success: false,
        error: "Domain not found in Vercel project",
        verified: false,
      })
    }

    const vercelData = await vercelRes.json()
    console.log("[v0] Domain verification status:", JSON.stringify(vercelData, null, 2))

    const isVerified = vercelData.verified === true
    const hasPendingVerification = vercelData.verification && vercelData.verification.length > 0

    // Update domain status
    domain.status = isVerified ? "healthy" : "pending_dns"
    domain.isActive = isVerified
    domain.lastHealthCheck = new Date()
    domain.sslValid = isVerified

    if (isVerified) {
      domain.verifiedAt = new Date()
    }

    await domain.save()

    // Fetch updated DNS records
    const dnsRecords = []
    if (!isVerified && hasPendingVerification) {
      // Get the required verification records
      vercelData.verification.forEach((v) => {
        dnsRecords.push({
          type: v.type || "TXT",
          name: v.domain || "_vercel",
          value: v.value,
          purpose: "Domain Verification (Required)",
        })
      })
    }

    // Add standard DNS records
    const isApex = !domain.domain.includes(".") || domain.domain.split(".").length === 2
    if (isApex) {
      dnsRecords.push({
        type: "A",
        name: "@",
        value: "76.76.21.21",
        purpose: "Points apex domain to Vercel",
      })
    } else {
      dnsRecords.push({
        type: "CNAME",
        name: domain.domain.split(".")[0],
        value: "cname.vercel-dns.com",
        purpose: "Points subdomain to Vercel",
      })
    }

    return NextResponse.json({
      success: true,
      verified: isVerified,
      domain: {
        ...domain.toObject(),
        _id: domain._id.toString(),
      },
      dnsRecords,
      message: isVerified
        ? "Domain verified successfully! DNS is correctly configured."
        : "Domain not yet verified. Please configure DNS records and wait for propagation.",
    })
  } catch (error) {
    console.error("Domain verification error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
