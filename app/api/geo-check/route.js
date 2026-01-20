import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import CountryAccessRule from "@/lib/models/CountryAccessRule"
import GeoAccessException from "@/lib/models/GeoAccessException"
import GeoAccessLog from "@/lib/models/GeoAccessLog"
import PlatformSettings from "@/lib/models/PlatformSettings"

// Check if IP matches CIDR
function ipMatchesCidr(ip, cidr) {
  if (!cidr.includes("/")) return ip === cidr

  const [range, bits] = cidr.split("/")
  const mask = ~(2 ** (32 - Number.parseInt(bits)) - 1)

  const ipNum = ip.split(".").reduce((acc, octet) => (acc << 8) + Number.parseInt(octet), 0)
  const rangeNum = range.split(".").reduce((acc, octet) => (acc << 8) + Number.parseInt(octet), 0)

  return (ipNum & mask) === (rangeNum & mask)
}

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { ip, countryCode, route } = body

    console.log("[v0] Geo check POST - IP:", ip, "Country:", countryCode, "Route:", route)

    // Check if geo blocking is globally enabled
    const platformSettings = await PlatformSettings.findById("platform_settings")

    console.log("[v0] Platform settings geoBlocking:", platformSettings?.geoBlocking)

    if (!platformSettings?.geoBlocking?.enabled) {
      console.log("[v0] Geo blocking is DISABLED globally")
      return NextResponse.json({ allowed: true, reason: "Geo blocking disabled" })
    }

    if (!countryCode || countryCode === "XX") {
      console.log("[v0] Country unknown, allowing access")
      return NextResponse.json({ allowed: true, reason: "Country unknown", countryCode })
    }

    const upperCountryCode = countryCode.toUpperCase()
    console.log("[v0] Checking country:", upperCountryCode)

    // Check exceptions first (IP-based)
    const now = new Date()
    const exceptions = await GeoAccessException.find({
      isActive: true,
      type: { $in: ["IP", "CIDR"] },
    }).lean()

    console.log("[v0] Found exceptions:", exceptions.length)

    for (const exception of exceptions) {
      if (exception.ipOrCidr && ipMatchesCidr(ip, exception.ipOrCidr)) {
        const allowed = exception.status === "ALLOW"
        console.log("[v0] IP matches exception:", exception.ipOrCidr, "- Allowed:", allowed)

        // Log the access
        await GeoAccessLog.create({
          ipAddress: ip,
          countryCode: upperCountryCode,
          countryName: getCountryName(upperCountryCode),
          route: route || "/",
          decision: allowed ? "ALLOWED" : "BLOCKED",
          decisionSource: "EXCEPTION",
          reason: exception.note || `Exception: ${exception.status}`,
          exceptionId: exception._id,
        })

        return NextResponse.json({
          allowed,
          reason: exception.note || `IP exception`,
          source: "EXCEPTION",
          countryCode: upperCountryCode,
          countryName: getCountryName(upperCountryCode),
        })
      }
    }

    // Check country rule
    const countryRule = await CountryAccessRule.findOne({
      countryCode: upperCountryCode,
      enabled: true,
    }).lean()

    console.log("[v0] Country rule for", upperCountryCode, ":", countryRule?.status || "not found")

    // Determine if blocked based on mode
    let isBlocked = false
    const mode = platformSettings.geoBlocking.mode || "blacklist"

    if (mode === "blacklist") {
      // Blacklist mode: block only if country rule says BLOCK
      isBlocked = countryRule?.status === "BLOCK"
    } else {
      // Whitelist mode: block unless country rule says ALLOW
      isBlocked = !countryRule || countryRule.status !== "ALLOW"
    }

    console.log("[v0] Mode:", mode, "- Is blocked:", isBlocked)

    const countryName = getCountryName(upperCountryCode)

    // Log the access
    await GeoAccessLog.create({
      ipAddress: ip,
      countryCode: upperCountryCode,
      countryName,
      route: route || "/",
      decision: isBlocked ? "BLOCKED" : "ALLOWED",
      decisionSource: isBlocked ? "COUNTRY_RULE" : "DEFAULT",
      reason: isBlocked ? countryRule?.reason || `Blocked for ${countryName}` : "Access permitted",
      ruleId: countryRule?._id,
    })

    if (isBlocked) {
      return NextResponse.json({
        allowed: false,
        reason:
          countryRule?.reason || platformSettings.geoBlocking.blockMessage || `Access not available in ${countryName}`,
        source: "COUNTRY_RULE",
        countryCode: upperCountryCode,
        countryName,
      })
    }

    return NextResponse.json({
      allowed: true,
      reason: "Access permitted",
      source: "DEFAULT",
      countryCode: upperCountryCode,
      countryName,
    })
  } catch (error) {
    console.error("[v0] Geo check POST error:", error)
    // On error, allow access (fail open)
    return NextResponse.json({ allowed: true, reason: "Check failed", error: error.message })
  }
}

export async function GET(request) {
  try {
    await connectDB()

    // Get client IP from headers
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"

    // Get country from Cloudflare/Vercel headers
    const countryCode = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "XX"

    console.log("[v0] Geo check GET - IP:", ip, "Country:", countryCode)

    // Check if geo blocking is globally enabled
    const platformSettings = await PlatformSettings.findById("platform_settings")

    if (!platformSettings?.geoBlocking?.enabled) {
      return NextResponse.json({ allowed: true, reason: "Geo blocking disabled" })
    }

    if (!countryCode || countryCode === "XX") {
      return NextResponse.json({ allowed: true, reason: "Country unknown", countryCode })
    }

    const upperCountryCode = countryCode.toUpperCase()

    // Check exceptions first (IP-based)
    const exceptions = await GeoAccessException.find({
      isActive: true,
      type: { $in: ["IP", "CIDR"] },
    }).lean()

    for (const exception of exceptions) {
      if (exception.ipOrCidr && ipMatchesCidr(ip, exception.ipOrCidr)) {
        const allowed = exception.status === "ALLOW"
        return NextResponse.json({
          allowed,
          reason: exception.note || `IP exception`,
          source: "EXCEPTION",
          countryCode: upperCountryCode,
          countryName: getCountryName(upperCountryCode),
        })
      }
    }

    // Check country rule
    const countryRule = await CountryAccessRule.findOne({
      countryCode: upperCountryCode,
      enabled: true,
    }).lean()

    // Determine if blocked based on mode
    let isBlocked = false
    const mode = platformSettings.geoBlocking.mode || "blacklist"

    if (mode === "blacklist") {
      isBlocked = countryRule?.status === "BLOCK"
    } else {
      isBlocked = !countryRule || countryRule.status !== "ALLOW"
    }

    const countryName = getCountryName(upperCountryCode)

    if (isBlocked) {
      return NextResponse.json({
        allowed: false,
        reason:
          countryRule?.reason || platformSettings.geoBlocking.blockMessage || `Access not available in ${countryName}`,
        source: "COUNTRY_RULE",
        countryCode: upperCountryCode,
        countryName,
      })
    }

    return NextResponse.json({
      allowed: true,
      reason: "Access permitted",
      source: "DEFAULT",
      countryCode: upperCountryCode,
      countryName,
    })
  } catch (error) {
    console.error("[v0] Geo check GET error:", error)
    return NextResponse.json({ allowed: true, reason: "Check failed", error: error.message })
  }
}

// Helper to get country name from code
function getCountryName(code) {
  const countries = {
    BD: "Bangladesh",
    US: "United States",
    GB: "United Kingdom",
    IN: "India",
    PK: "Pakistan",
    CN: "China",
    RU: "Russia",
    DE: "Germany",
    FR: "France",
    AU: "Australia",
    CA: "Canada",
    BR: "Brazil",
    JP: "Japan",
    KR: "South Korea",
    // Add more as needed
  }
  return countries[code] || code
}
