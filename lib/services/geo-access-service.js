import CountryAccessRule from "@/lib/models/CountryAccessRule"
import GeoAccessException from "@/lib/models/GeoAccessException"
import GeoAccessLog from "@/lib/models/GeoAccessLog"
import connectDB from "@/lib/db"

// In-memory cache for performance
let countryRulesCache = null
let countryRulesCacheTime = 0
const COUNTRY_RULES_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

let exceptionsCache = null
let exceptionsCacheTime = 0
const EXCEPTIONS_CACHE_TTL = 1 * 60 * 1000 // 1 minute

// IP to country cache (in production, use Redis)
const ipCountryCache = new Map()
const IP_COUNTRY_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Get real client IP from request headers
 */
export function getClientIp(request) {
  // Cloudflare
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) return cfIp

  // X-Forwarded-For (take first IP, which is the client)
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim())
    return ips[0]
  }

  // X-Real-IP
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp

  // Fallback
  return "unknown"
}

/**
 * Get country from IP using free IP geolocation API
 * In production, use MaxMind GeoIP2 local database for better performance
 */
export async function getCountryFromIp(ip) {
  // Check cache first
  const cached = ipCountryCache.get(ip)
  if (cached && Date.now() - cached.time < IP_COUNTRY_CACHE_TTL) {
    return cached.data
  }

  // Skip for localhost/private IPs
  if (ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { countryCode: "XX", countryName: "Unknown", isVpn: false, isProxy: false }
  }

  try {
    // Using ip-api.com (free, 45 requests/minute limit)
    // In production, use MaxMind GeoIP2 or ipinfo.io with API key
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,proxy,hosting`,
      { next: { revalidate: 86400 } }, // Cache for 24 hours
    )

    if (!response.ok) {
      throw new Error("IP lookup failed")
    }

    const data = await response.json()

    if (data.status === "fail") {
      return { countryCode: "XX", countryName: "Unknown", isVpn: false, isProxy: false }
    }

    const result = {
      countryCode: data.countryCode || "XX",
      countryName: data.country || "Unknown",
      isVpn: data.hosting || false,
      isProxy: data.proxy || false,
    }

    // Cache result
    ipCountryCache.set(ip, { data: result, time: Date.now() })

    return result
  } catch (error) {
    console.error("Error looking up IP country:", error)
    return { countryCode: "XX", countryName: "Unknown", isVpn: false, isProxy: false }
  }
}

/**
 * Get cached country rules from database
 */
async function getCountryRules() {
  if (countryRulesCache && Date.now() - countryRulesCacheTime < COUNTRY_RULES_CACHE_TTL) {
    return countryRulesCache
  }

  await connectDB()
  const rules = await CountryAccessRule.find({ enabled: true }).lean()

  // Convert to map for O(1) lookup
  countryRulesCache = new Map()
  for (const rule of rules) {
    countryRulesCache.set(rule.countryCode, rule)
  }
  countryRulesCacheTime = Date.now()

  return countryRulesCache
}

/**
 * Get cached exceptions from database
 */
async function getExceptions() {
  if (exceptionsCache && Date.now() - exceptionsCacheTime < EXCEPTIONS_CACHE_TTL) {
    return exceptionsCache
  }

  await connectDB()
  const now = new Date()
  const exceptions = await GeoAccessException.find({
    isActive: true,
    $or: [{ startsAt: { $lte: now } }, { startsAt: null }],
    $or: [{ endsAt: { $gte: now } }, { endsAt: null }],
  }).lean()

  exceptionsCache = exceptions
  exceptionsCacheTime = Date.now()

  return exceptionsCache
}

/**
 * Check if IP matches CIDR range
 */
function ipMatchesCidr(ip, cidr) {
  if (!cidr.includes("/")) {
    return ip === cidr
  }

  const [range, bits] = cidr.split("/")
  const mask = ~(2 ** (32 - Number.parseInt(bits)) - 1)

  const ipNum = ip.split(".").reduce((acc, octet) => (acc << 8) + Number.parseInt(octet), 0)
  const rangeNum = range.split(".").reduce((acc, octet) => (acc << 8) + Number.parseInt(octet), 0)

  return (ipNum & mask) === (rangeNum & mask)
}

/**
 * Main access check function
 * Returns: { allowed: boolean, reason: string, source: "exception"|"country_rule"|"default"|"vpn_detected" }
 */
export async function isAllowed(request, user = null, routeType = "general") {
  const ip = getClientIp(request)
  const geoData = await getCountryFromIp(ip)
  const { countryCode, countryName, isVpn, isProxy } = geoData

  // Optional: Block known VPNs/proxies
  // if (isVpn || isProxy) {
  //   return { allowed: false, reason: "VPN/Proxy detected", source: "VPN_DETECTED", countryCode, countryName }
  // }

  // 1. Check exceptions first (highest priority)
  const exceptions = await getExceptions()

  // Check account-based exception
  if (user?._id) {
    const accountException = exceptions.find(
      (e) =>
        e.type === "ACCOUNT" &&
        e.accountId?.toString() === user._id.toString() &&
        (!e.countryCode || e.countryCode === countryCode),
    )
    if (accountException) {
      return {
        allowed: accountException.status === "ALLOW",
        reason: accountException.note || `Account exception: ${accountException.status}`,
        source: "EXCEPTION",
        exceptionId: accountException._id,
        countryCode,
        countryName,
      }
    }
  }

  // Check IP-based exception
  const ipException = exceptions.find(
    (e) =>
      (e.type === "IP" || e.type === "CIDR") &&
      e.ipOrCidr &&
      ipMatchesCidr(ip, e.ipOrCidr) &&
      (!e.countryCode || e.countryCode === countryCode),
  )
  if (ipException) {
    return {
      allowed: ipException.status === "ALLOW",
      reason: ipException.note || `IP exception: ${ipException.status}`,
      source: "EXCEPTION",
      exceptionId: ipException._id,
      countryCode,
      countryName,
    }
  }

  // 2. Check country rules
  const rules = await getCountryRules()
  const countryRule = rules.get(countryCode)

  if (countryRule && countryRule.status === "BLOCK") {
    // Check granular blocking based on route type
    let isBlocked = true
    if (routeType === "signup" && !countryRule.blockSignup) isBlocked = false
    if (routeType === "login" && !countryRule.blockLogin) isBlocked = false
    if (routeType === "deposit" && !countryRule.blockDeposits) isBlocked = false
    if (routeType === "withdrawal" && !countryRule.blockWithdrawals) isBlocked = false
    if (routeType === "betting" && !countryRule.blockBetting) isBlocked = false
    if (routeType === "casino" && !countryRule.blockCasino) isBlocked = false

    if (isBlocked) {
      return {
        allowed: false,
        reason: countryRule.reason || `Access blocked for ${countryName}`,
        source: "COUNTRY_RULE",
        ruleId: countryRule._id,
        countryCode,
        countryName,
      }
    }
  }

  // 3. Default: ALLOW
  return {
    allowed: true,
    reason: "Access permitted",
    source: "DEFAULT",
    countryCode,
    countryName,
  }
}

/**
 * Log geo access decision
 */
export async function logGeoAccess(request, decision, user = null) {
  try {
    await connectDB()
    const ip = getClientIp(request)
    const geoData = await getCountryFromIp(ip)

    await GeoAccessLog.create({
      ipAddress: ip,
      countryCode: decision.countryCode || geoData.countryCode,
      countryName: decision.countryName || geoData.countryName,
      userId: user?._id,
      userEmail: user?.email,
      route: request.nextUrl?.pathname || request.url,
      decision: decision.allowed ? "ALLOWED" : "BLOCKED",
      decisionSource: decision.source,
      reason: decision.reason,
      exceptionId: decision.exceptionId,
      ruleId: decision.ruleId,
      userAgent: request.headers.get("user-agent"),
      isVpn: geoData.isVpn,
      isProxy: geoData.isProxy,
      requestMethod: request.method,
      requestPath: request.nextUrl?.pathname,
    })
  } catch (error) {
    console.error("Error logging geo access:", error)
  }
}

/**
 * Invalidate caches (call when admin updates rules)
 */
export function invalidateCountryRulesCache() {
  countryRulesCache = null
  countryRulesCacheTime = 0
}

export function invalidateExceptionsCache() {
  exceptionsCache = null
  exceptionsCacheTime = 0
}

export function invalidateIpCache(ip = null) {
  if (ip) {
    ipCountryCache.delete(ip)
  } else {
    ipCountryCache.clear()
  }
}
