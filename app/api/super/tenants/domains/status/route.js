import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get("domain")

    if (!domain) {
      return NextResponse.json({ error: "Domain parameter is required" }, { status: 400 })
    }

    const vercelToken = process.env.VERCEL_TOKEN
    const vercelProjectId = process.env.VERCEL_PROJECT_ID
    const vercelTeamId = process.env.VERCEL_TEAM_ID

    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json(
        {
          added: false,
          verified: false,
          configured: false,
          error: "Vercel configuration missing",
          dnsRecords: [],
        },
        { status: 200 },
      )
    }

    // Check if domain exists in Vercel project
    const getDomainUrl = vercelTeamId
      ? `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}?teamId=${vercelTeamId}`
      : `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}`

    const domainResponse = await fetch(getDomainUrl, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    if (!domainResponse.ok) {
      // Domain not added yet
      return NextResponse.json({
        added: false,
        verified: false,
        configured: false,
        dnsRecords: [],
      })
    }

    const domainData = await domainResponse.json()

    // Fetch DNS records from Vercel
    const dnsRecords = await fetchDNSRecordsFromVercel(domain, vercelToken, vercelProjectId, vercelTeamId)

    return NextResponse.json({
      added: true,
      verified: domainData.verified || false,
      configured: !domainData.misconfigured,
      dnsRecords,
      domainData,
    })
  } catch (error) {
    console.error("[v0] Error fetching domain status:", error)
    return NextResponse.json(
      {
        added: false,
        verified: false,
        configured: false,
        error: error.message,
        dnsRecords: [],
      },
      { status: 200 },
    )
  }
}

async function fetchDNSRecordsFromVercel(domain, vercelToken, vercelProjectId, vercelTeamId) {
  const records = []

  try {
    // Fetch domain configuration to get actual DNS records
    const configUrl = vercelTeamId
      ? `https://api.vercel.com/v6/domains/${domain}/config?teamId=${vercelTeamId}`
      : `https://api.vercel.com/v6/domains/${domain}/config`

    console.log("[v0] Fetching DNS config from:", configUrl)

    const configResponse = await fetch(configUrl, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    if (configResponse.ok) {
      const configData = await configResponse.json()
      console.log("[v0] Vercel domain config response:", JSON.stringify(configData, null, 2))

      // Add CNAME record (recommended option)
      if (configData.cnames && configData.cnames.length > 0) {
        records.push({
          type: "CNAME",
          name: "www",
          value: configData.cnames[0],
          purpose: "Domain Configuration (Recommended)",
        })
      } else {
        // Default CNAME
        records.push({
          type: "CNAME",
          name: "www",
          value: "cname.vercel-dns.com",
          purpose: "Domain Configuration (Recommended)",
        })
      }

      // Add only ONE Primary A Record if domain is misconfigured
      if (configData.misconfigured) {
        if (configData.intendedNameservers && configData.intendedNameservers.length > 0) {
          // Only add the first IP as Primary A Record
          records.push({
            type: "A",
            name: "@",
            value: configData.intendedNameservers[0],
            purpose: "Primary A Record",
          })
        }
      }
    }

    // Fetch domain details for verification TXT record (optional)
    const getDomainUrl = vercelTeamId
      ? `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}?teamId=${vercelTeamId}`
      : `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}`

    const domainResponse = await fetch(getDomainUrl, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    if (domainResponse.ok) {
      const domainData = await domainResponse.json()
      console.log("[v0] Vercel domain details response:", JSON.stringify(domainData, null, 2))

      // Add verification TXT records if available (optional)
      if (domainData.verification && domainData.verification.length > 0) {
        domainData.verification.forEach((verification) => {
          if (verification.type === "TXT") {
            const existingTxt = records.find((r) => r.type === "TXT" && r.value === verification.value)
            if (!existingTxt) {
              records.push({
                type: "TXT",
                name: verification.domain || "@",
                value: verification.value,
                purpose: "Domain Verification (Optional)",
              })
            }
          }
        })
      }
    }

    // If no A record found, add one Primary A Record
    if (!records.some((r) => r.type === "A")) {
      records.push({
        type: "A",
        name: "@",
        value: "76.76.21.21",
        purpose: "Primary A Record",
      })
    }
  } catch (error) {
    console.error("[v0] Error fetching DNS records:", error)
    // Return basic fallback records (CNAME + one A record)
    records.push({
      type: "CNAME",
      name: "www",
      value: "cname.vercel-dns.com",
      purpose: "Domain Configuration (Recommended)",
    })

    records.push({
      type: "A",
      name: "@",
      value: "76.76.21.21",
      purpose: "Primary A Record",
    })
  }

  return records
}
