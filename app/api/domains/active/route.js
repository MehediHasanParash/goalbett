import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import PlatformDomain from "@/lib/models/PlatformDomain"

// Public endpoint - PWA can fetch the active domain without auth
export async function GET() {
  try {
    await dbConnect()

    // Get all healthy, active domains sorted by priority
    const domains = await PlatformDomain.find({
      isActive: true,
      status: { $in: ["healthy", "degraded"] },
    })
      .sort({ type: 1, priority: -1 })
      .lean()

    // Primary healthy domain takes precedence
    const primaryHealthy = domains.find((d) => d.type === "primary" && d.status === "healthy")
    const activeDomain = primaryHealthy?.domain || domains[0]?.domain || "goalbett.com"

    // Return all healthy domains for client-side failover
    const fallbackDomains = domains.filter((d) => d.domain !== activeDomain).map((d) => d.domain)

    return NextResponse.json({
      active: activeDomain,
      fallbacks: fallbackDomains,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    // Fallback if database is unavailable
    return NextResponse.json({
      active: "goalbett.com",
      fallbacks: [],
      updatedAt: new Date().toISOString(),
      error: "Using fallback",
    })
  }
}
