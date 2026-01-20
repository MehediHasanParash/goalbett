import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import PlatformDomain from "@/lib/models/PlatformDomain"

// GET /api/super/platform-domains - Get all platform domains
export async function GET() {
  try {
    await dbConnect()

    let domains = await PlatformDomain.find({}).sort({ type: 1, priority: -1, createdAt: 1 }).lean()

    // If no domains exist, create the primary domain (goalbett.com)
    if (domains.length === 0) {
      const primaryDomain = await PlatformDomain.create({
        domain: "goalbett.com",
        type: "primary",
        status: "healthy",
        priority: 100,
        isActive: true,
        lastHealthCheck: new Date(),
        responseTime: 45,
        sslValid: true,
        sslExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      domains = [primaryDomain.toObject()]
    }

    // Perform simulated health checks (in production, do actual HTTP checks)
    for (const domain of domains) {
      domain.lastHealthCheck = new Date()
      domain.responseTime = Math.floor(30 + Math.random() * 50)
    }

    return NextResponse.json({
      success: true,
      domains: domains.map((d) => ({
        ...d,
        _id: d._id?.toString(),
      })),
    })
  } catch (error) {
    console.error("Platform domains API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/super/platform-domains - Add new backup/mirror domain
export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()
    const { domain, type = "backup", notes = "" } = body

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Clean domain
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .toLowerCase()

    // Check if already exists
    const existing = await PlatformDomain.findOne({ domain: cleanDomain })
    if (existing) {
      return NextResponse.json({ error: "Domain already exists" }, { status: 400 })
    }

    // Get current count to set priority
    const count = await PlatformDomain.countDocuments()

    // Try to add domain to Vercel if credentials are available
    const vercelToken = process.env.VERCEL_TOKEN
    const vercelProjectId = process.env.VERCEL_PROJECT_ID
    const vercelTeamId = process.env.VERCEL_TEAM_ID

    let dnsRecords = []
    let vercelAdded = false
    let vercelError = null
    let isVerified = false
    let isMisconfigured = true

    if (vercelToken && vercelProjectId) {
      try {
        // Add domain to Vercel
        const vercelUrl = vercelTeamId
          ? `https://api.vercel.com/v10/projects/${vercelProjectId}/domains?teamId=${vercelTeamId}`
          : `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`

        const vercelRes = await fetch(vercelUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: cleanDomain }),
        })

        const vercelData = await vercelRes.json()

        if (vercelRes.ok || vercelData.error?.code === "domain_already_in_use") {
          vercelAdded = true

          // Check if domain is already verified
          if (vercelData.error?.domain?.verified || vercelData.verified) {
            isVerified = true
          }

          // Fetch DNS records and config from Vercel
          const dnsInfo = await fetchDNSRecordsFromVercel(cleanDomain, vercelToken, vercelProjectId, vercelTeamId)
          dnsRecords = dnsInfo.records
          isMisconfigured = dnsInfo.misconfigured
        } else {
          vercelError = vercelData.error?.message || "Failed to add domain to Vercel"
        }
      } catch (err) {
        console.error("[v0] Vercel API error:", err)
        vercelError = err.message
      }
    }

    // Determine status based on verification state
    let domainStatus = "checking"
    if (vercelAdded) {
      if (isVerified && !isMisconfigured) {
        domainStatus = "healthy"
      } else if (isVerified) {
        domainStatus = "degraded" // Verified but DNS misconfigured
      } else {
        domainStatus = "checking" // Awaiting DNS verification
      }
    }

    // Create the domain record in our database
    const newDomain = await PlatformDomain.create({
      domain: cleanDomain,
      type: type === "primary" ? "primary" : "backup",
      status: domainStatus,
      priority: 100 - count,
      isActive: domainStatus === "healthy", // Only active if fully configured
      notes,
      dnsRecords,
      vercelVerified: isVerified,
      misconfigured: isMisconfigured,
    })

    return NextResponse.json({
      success: true,
      domain: {
        ...newDomain.toObject(),
        _id: newDomain._id.toString(),
      },
      dnsRecords,
      vercelAdded,
      vercelError,
      needsDnsSetup: isMisconfigured,
      message: vercelAdded
        ? isMisconfigured
          ? "Domain added to Vercel. Configure DNS records to complete setup."
          : "Domain added and verified successfully!"
        : vercelError
          ? `Domain saved but Vercel integration failed: ${vercelError}`
          : "Domain saved. Add VERCEL_TOKEN and VERCEL_PROJECT_ID for automatic DNS setup.",
    })
  } catch (error) {
    console.error("Add platform domain error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/super/platform-domains - Remove a domain
export async function DELETE(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get("id")

    if (!domainId) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 })
    }

    // Check if it's the primary domain
    const domain = await PlatformDomain.findById(domainId)
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    if (domain.type === "primary") {
      return NextResponse.json({ error: "Cannot delete primary domain" }, { status: 400 })
    }

    await PlatformDomain.findByIdAndDelete(domainId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete platform domain error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/super/platform-domains - Update domain (set primary, toggle active, etc.)
export async function PUT(request) {
  try {
    await dbConnect()

    const body = await request.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 })
    }

    const domain = await PlatformDomain.findById(id)
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    if (action === "setPrimary") {
      // Demote current primary
      await PlatformDomain.updateMany({ type: "primary" }, { type: "backup" })
      domain.type = "primary"
      domain.priority = 100
    } else if (action === "toggleActive") {
      domain.isActive = !domain.isActive
    } else {
      // General updates
      Object.assign(domain, updates)
    }

    await domain.save()

    return NextResponse.json({
      success: true,
      domain: {
        ...domain.toObject(),
        _id: domain._id.toString(),
      },
    })
  } catch (error) {
    console.error("Update platform domain error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function fetchDNSRecordsFromVercel(domain, vercelToken, vercelProjectId, vercelTeamId) {
  const dnsRecords = []
  let misconfigured = true

  try {
    // Fetch domain configuration to get actual DNS records from Vercel
    const configUrl = vercelTeamId
      ? `https://api.vercel.com/v6/domains/${domain}/config?teamId=${vercelTeamId}`
      : `https://api.vercel.com/v6/domains/${domain}/config`

    console.log("[v0] Fetching DNS config from Vercel:", configUrl)

    const configRes = await fetch(configUrl, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })

    if (configRes.ok) {
      const configData = await configRes.json()
      console.log("[v0] Vercel domain config response:", JSON.stringify(configData, null, 2))

      misconfigured = configData.misconfigured !== false

      // Add CNAME record from Vercel's recommended values
      if (configData.recommendedCNAME && configData.recommendedCNAME.length > 0) {
        const rank1CNAME = configData.recommendedCNAME.find((item) => item.rank === 1)
        if (rank1CNAME && rank1CNAME.value) {
          const cleanCNAME = rank1CNAME.value.endsWith(".") ? rank1CNAME.value.slice(0, -1) : rank1CNAME.value
          dnsRecords.push({
            type: "CNAME",
            name: "www",
            value: cleanCNAME,
            purpose: "Points www subdomain to Vercel (Recommended)",
          })
          console.log("[v0] Added CNAME record from Vercel:", cleanCNAME)
        }
      } else if (configData.cnames && configData.cnames.length > 0) {
        dnsRecords.push({
          type: "CNAME",
          name: "www",
          value: configData.cnames[0],
          purpose: "Points www subdomain to Vercel (Recommended)",
        })
      }

      // Add A record from Vercel's recommended IPv4 addresses
      if (configData.recommendedIPv4 && configData.recommendedIPv4.length > 0) {
        console.log("[v0] Found recommended IPv4 addresses:", configData.recommendedIPv4)

        const rank1IPs = configData.recommendedIPv4.find((item) => item.rank === 1)
        if (rank1IPs && rank1IPs.value && Array.isArray(rank1IPs.value) && rank1IPs.value.length > 0) {
          // Add the primary A record
          dnsRecords.push({
            type: "A",
            name: "@",
            value: rank1IPs.value[0],
            purpose: "Points apex domain to Vercel (Primary)",
          })
          console.log("[v0] Added A record from Vercel:", rank1IPs.value[0])
        }
      } else if (configData.aValues && configData.aValues.length > 0) {
        // Alternative: use aValues if available
        dnsRecords.push({
          type: "A",
          name: "@",
          value: configData.aValues[0],
          purpose: "Points apex domain to Vercel (Primary)",
        })
      }
    }

    // Fetch domain details for verification TXT record
    const detailsUrl = vercelTeamId
      ? `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}?teamId=${vercelTeamId}`
      : `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}`

    console.log("[v0] Fetching domain details from Vercel:", detailsUrl)

    const detailsRes = await fetch(detailsUrl, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })

    if (detailsRes.ok) {
      const domainData = await detailsRes.json()
      console.log("[v0] Vercel domain details response:", JSON.stringify(domainData, null, 2))

      // Add verification TXT records if domain is not yet verified
      if (domainData.verification && domainData.verification.length > 0) {
        domainData.verification.forEach((verification) => {
          dnsRecords.push({
            type: verification.type || "TXT",
            name: verification.domain || "_vercel",
            value: verification.value,
            purpose: "Domain Verification (Required)",
          })
          console.log("[v0] Added verification record:", verification.type, verification.value)
        })
      }
    }

    // Fallback: If no records found, provide default Vercel DNS values
    if (dnsRecords.length === 0) {
      console.log("[v0] No DNS records from Vercel API, using fallback values")

      // Default CNAME for www
      dnsRecords.push({
        type: "CNAME",
        name: "www",
        value: "cname.vercel-dns.com",
        purpose: "Points www subdomain to Vercel",
      })

      // Default A record for apex
      dnsRecords.push({
        type: "A",
        name: "@",
        value: "76.76.21.21",
        purpose: "Points apex domain to Vercel",
      })
    }

    return { records: dnsRecords, misconfigured }
  } catch (error) {
    console.error("[v0] Error fetching DNS records from Vercel:", error)

    // Return fallback DNS records on error
    return {
      records: [
        {
          type: "CNAME",
          name: "www",
          value: "cname.vercel-dns.com",
          purpose: "Points www subdomain to Vercel",
        },
        {
          type: "A",
          name: "@",
          value: "76.76.21.21",
          purpose: "Points apex domain to Vercel",
        },
      ],
      misconfigured: true,
    }
  }
}
