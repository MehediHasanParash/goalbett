import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { domain, tenantId } = await request.json()

    if (!domain || !tenantId) {
      return NextResponse.json({ error: "Domain and tenantId are required" }, { status: 400 })
    }

    const vercelToken = process.env.VERCEL_TOKEN
    const vercelProjectId = process.env.VERCEL_PROJECT_ID
    const vercelTeamId = process.env.VERCEL_TEAM_ID

    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json(
        {
          error: "Vercel configuration missing",
          message: "VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables are required",
          manualSetup: true,
        },
        { status: 500 },
      )
    }

    const vercelUrl = vercelTeamId
      ? `https://api.vercel.com/v10/projects/${vercelProjectId}/domains?teamId=${vercelTeamId}`
      : `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`

    console.log("[v0] Adding domain to Vercel:", domain)

    const vercelResponse = await fetch(vercelUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: domain,
      }),
    })

    const vercelData = await vercelResponse.json()
    console.log("[v0] Vercel add domain response:", JSON.stringify(vercelData, null, 2))

    if (!vercelResponse.ok) {
      // Domain might already exist or other error
      if (vercelData.error?.code === "domain_already_in_use") {
        console.log("[v0] Domain already exists, fetching configuration...")
        // Domain already added, fetch its configuration
        const getDomainUrl = vercelTeamId
          ? `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}?teamId=${vercelTeamId}`
          : `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}`

        const existingDomainResponse = await fetch(getDomainUrl, {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
        })

        if (existingDomainResponse.ok) {
          const existingDomainData = await existingDomainResponse.json()
          console.log("[v0] Existing domain data:", JSON.stringify(existingDomainData, null, 2))
          const dnsRecords = await fetchDNSRecordsFromVercel(domain, vercelToken, vercelProjectId, vercelTeamId)
          return NextResponse.json({
            success: true,
            domain: existingDomainData,
            dnsRecords,
            alreadyExists: true,
          })
        }
      }

      return NextResponse.json(
        {
          error: "Failed to add domain to Vercel",
          details: vercelData.error?.message || vercelData.error || "Unknown error",
        },
        { status: vercelResponse.status },
      )
    }

    const dnsRecords = await fetchDNSRecordsFromVercel(domain, vercelToken, vercelProjectId, vercelTeamId)

    return NextResponse.json({
      success: true,
      domain: vercelData,
      dnsRecords,
    })
  } catch (error) {
    console.error("[v0] Error adding domain to Vercel:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
      if (configData.recommendedCNAME && configData.recommendedCNAME.length > 0) {
        const rank1CNAME = configData.recommendedCNAME.find((item) => item.rank === 1)
        if (rank1CNAME && rank1CNAME.value) {
          const cleanCNAME = rank1CNAME.value.endsWith(".") ? rank1CNAME.value.slice(0, -1) : rank1CNAME.value
          records.push({
            type: "CNAME",
            name: "www",
            value: cleanCNAME,
            purpose: "Domain Configuration (Recommended)",
          })
          console.log("[v0] Added rank 1 CNAME record:", cleanCNAME)
        }
      } else if (configData.cnames && configData.cnames.length > 0) {
        records.push({
          type: "CNAME",
          name: "www",
          value: configData.cnames[0],
          purpose: "Domain Configuration (Recommended)",
        })
      }

      // Add only ONE Primary A Record (no alternatives or fallbacks)
      if (configData.recommendedIPv4 && configData.recommendedIPv4.length > 0) {
        console.log("[v0] Found recommended IPv4 addresses:", configData.recommendedIPv4)

        const rank1IPs = configData.recommendedIPv4.find((item) => item.rank === 1)
        if (rank1IPs && rank1IPs.value && Array.isArray(rank1IPs.value) && rank1IPs.value.length > 0) {
          // Only add the first IP as Primary A Record
          records.push({
            type: "A",
            name: "@",
            value: rank1IPs.value[0],
            purpose: "Primary A Record",
          })
          console.log("[v0] Added Primary A record:", rank1IPs.value[0])
        }
      } else if (configData.intendedNameservers && configData.intendedNameservers.length > 0) {
        // Legacy fallback - only add first IP
        console.log("[v0] Found intended nameservers (A records):", configData.intendedNameservers)
        records.push({
          type: "A",
          name: "@",
          value: configData.intendedNameservers[0],
          purpose: "Primary A Record",
        })
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
            records.push({
              type: "TXT",
              name: verification.domain || "@",
              value: verification.value,
              purpose: "Domain Verification (Optional)",
            })
          }
        })
      }
    }

    // If no records found, add basic fallback (only CNAME and one A record)
    if (records.length === 0) {
      console.log("[v0] No DNS records from Vercel, using fallback")
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
  } catch (error) {
    console.error("[v0] Error fetching DNS records:", error)
    // Return basic fallback records only on error (CNAME + one A record)
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
