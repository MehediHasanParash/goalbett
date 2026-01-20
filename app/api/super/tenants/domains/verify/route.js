import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    const vercelToken = process.env.VERCEL_TOKEN
    const vercelProjectId = process.env.VERCEL_PROJECT_ID
    const vercelTeamId = process.env.VERCEL_TEAM_ID

    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json({ error: "Vercel configuration missing" }, { status: 500 })
    }

    const vercelUrl = vercelTeamId
      ? `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}?teamId=${vercelTeamId}`
      : `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}`

    const vercelResponse = await fetch(vercelUrl, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    if (!vercelResponse.ok) {
      return NextResponse.json({ error: "Domain not found in Vercel project" }, { status: 404 })
    }

    const domainData = await vercelResponse.json()

    return NextResponse.json({
      success: true,
      domain: domainData.name,
      verified: domainData.verified || false,
      configured: domainData.configured || false,
      verification: domainData.verification,
    })
  } catch (error) {
    console.error("[v0] Error verifying domain:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
