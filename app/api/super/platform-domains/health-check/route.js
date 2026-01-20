import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import PlatformDomain from "@/lib/models/PlatformDomain"

// Perform actual health checks on all platform domains
export async function POST() {
  try {
    await dbConnect()

    const domains = await PlatformDomain.find({ isActive: true })
    const results = []
    const blockedDomains = []

    for (const domain of domains) {
      const healthResult = await checkDomainHealth(domain.domain)

      // Update domain status in database
      domain.status = healthResult.status
      domain.responseTime = healthResult.responseTime
      domain.sslValid = healthResult.sslValid
      domain.lastHealthCheck = new Date()

      if (healthResult.status === "blocked" || healthResult.status === "offline") {
        blockedDomains.push({
          domain: domain.domain,
          status: healthResult.status,
          error: healthResult.error,
        })

        // Increment failover count if this was previously healthy
        if (domain.type === "primary") {
          domain.failoverCount = (domain.failoverCount || 0) + 1
        }
      }

      await domain.save()

      results.push({
        domain: domain.domain,
        type: domain.type,
        status: healthResult.status,
        responseTime: healthResult.responseTime,
        sslValid: healthResult.sslValid,
        error: healthResult.error,
      })
    }

    // Determine active domain (for failover)
    const healthyDomains = await PlatformDomain.find({
      isActive: true,
      status: "healthy",
    }).sort({ type: 1, priority: -1 })

    const activeDomain = healthyDomains[0]?.domain || domains[0]?.domain || "goalbett.com"

    // Check if failover occurred
    const primaryDomain = domains.find((d) => d.type === "primary")
    const failoverOccurred =
      primaryDomain && primaryDomain.status !== "healthy" && activeDomain !== primaryDomain.domain

    return NextResponse.json({
      success: true,
      results,
      activeDomain,
      failoverOccurred,
      blockedDomains,
      totalChecked: domains.length,
      healthyCount: results.filter((r) => r.status === "healthy").length,
      blockedCount: blockedDomains.length,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function checkDomainHealth(domain) {
  const startTime = Date.now()

  try {
    // Try HTTPS first
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`https://${domain}/api/health`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "GoalBett-HealthCheck/1.0",
      },
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (response.ok) {
      return {
        status: "healthy",
        responseTime,
        sslValid: true,
        error: null,
      }
    }

    // Check for specific blocking indicators
    if (response.status === 403 || response.status === 451) {
      return {
        status: "blocked",
        responseTime,
        sslValid: true,
        error: `HTTP ${response.status}: Possible geo-block or access denied`,
      }
    }

    if (response.status >= 500) {
      return {
        status: "degraded",
        responseTime,
        sslValid: true,
        error: `HTTP ${response.status}: Server error`,
      }
    }

    return {
      status: "degraded",
      responseTime,
      sslValid: true,
      error: `HTTP ${response.status}`,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    // Check for specific error types
    if (error.name === "AbortError") {
      return {
        status: "offline",
        responseTime,
        sslValid: false,
        error: "Request timeout (>10s)",
      }
    }

    if (error.message?.includes("SSL") || error.message?.includes("certificate")) {
      return {
        status: "degraded",
        responseTime,
        sslValid: false,
        error: "SSL certificate issue",
      }
    }

    if (error.message?.includes("ENOTFOUND") || error.message?.includes("getaddrinfo")) {
      return {
        status: "blocked",
        responseTime,
        sslValid: false,
        error: "DNS resolution failed - possibly blocked",
      }
    }

    if (error.message?.includes("ECONNREFUSED") || error.message?.includes("ETIMEDOUT")) {
      return {
        status: "offline",
        responseTime,
        sslValid: false,
        error: "Connection refused or timed out",
      }
    }

    return {
      status: "offline",
      responseTime,
      sslValid: false,
      error: error.message || "Unknown error",
    }
  }
}
