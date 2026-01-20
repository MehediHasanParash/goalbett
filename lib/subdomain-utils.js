export function getSubdomainFromHost(hostname) {
  if (!hostname) return null

  const hostWithoutPort = hostname.split(":")[0]
  const parts = hostWithoutPort.split(".")

  // localhost handling: xbet.localhost -> xbet
  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    if (parts[0] !== "localhost") {
      return parts[0]
    }
    return null
  }

  // Vercel subdomain handling: betmax.goal-bett.vercel.app -> betmax
  // Format: [subdomain].[app-name].vercel.app (4 parts)
  if (parts.length === 4 && parts[2] === "vercel" && parts[3] === "app") {
    const mainAppName = parts[1] // "goal-bett"
    const potentialSubdomain = parts[0] // "betmax"

    // Only treat as subdomain if it's NOT the main app name
    if (potentialSubdomain !== mainAppName && potentialSubdomain !== "www") {
      return potentialSubdomain
    }
    return null
  }

  // Standard Vercel domain: goal-bett.vercel.app (no subdomain)
  if (parts.length === 3 && parts[1] === "vercel" && parts[2] === "app") {
    return null
  }

  // Custom domain with subdomain: betmax.example.com -> betmax
  if (parts.length >= 3) {
    const potentialSubdomain = parts[0]
    if (potentialSubdomain !== "www") {
      return potentialSubdomain
    }
  }

  return null
}

export function getTenantFromRequest(request) {
  const hostname = request.headers.get("host") || ""
  return getSubdomainFromHost(hostname)
}

export function buildSubdomainURL(tenantSlug, path = "") {
  const host = process.env.NEXT_PUBLIC_VERCEL_URL || "localhost:3000"
  const protocol = host.includes("localhost") ? "http" : "https"

  // For localhost: use subdomain.localhost:3000
  if (host.includes("localhost")) {
    const port = host.split(":")[1] || "3000"
    return `${protocol}://${tenantSlug}.localhost:${port}${path}`
  }

  // For Vercel: betmax.goal-bett.vercel.app
  if (host.includes("vercel.app")) {
    // host = "goal-bett.vercel.app" -> insert subdomain before it
    return `${protocol}://${tenantSlug}.${host}${path}`
  }

  // For custom domains: betmax.example.com
  return `${protocol}://${tenantSlug}.${host}${path}`
}
