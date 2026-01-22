import { NextResponse } from "next/server"

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next()
  }

  const hostname = request.headers.get("host") || ""
  const token = request.cookies.get("auth_token")?.value

  const SUPER_ADMIN_DOMAIN = process.env.SUPER_ADMIN_DOMAIN || "betengin.com"
  const TENANT_DOMAIN = "tenantbetengin.com"
  const AGENT_DOMAIN = "agentbetengin.com"
  const PLAYER_DOMAIN = "goalbett.com"

  const isLocalDev = hostname.startsWith("localhost") || hostname.includes("127.0.0.1")

  if (isLocalDev) {
    // On localhost, just handle basic routing without any geo/IP checks
    const loginPages = [
      "/auth",
      "/s/login",
      "/t/login",
      "/a/login",
      "/admin/login",
      "/sa/login",
      "/p/login",
      "/staff/login",
    ]
    const isLoginPage = loginPages.some((page) => pathname.startsWith(page))
    const protectedRoutes = ["/p/", "/a/", "/t/", "/s/", "/admin/", "/sa/", "/staff/"]
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

    // Only check auth for protected routes on localhost
    if (isProtected && !isLoginPage && !token) {
      let loginUrl
      if (pathname.startsWith("/staff/")) {
        loginUrl = new URL("/staff/login", request.url)
      } else if (pathname.startsWith("/t/")) {
        loginUrl = new URL("/t/login", request.url)
      } else if (pathname.startsWith("/a/") || pathname.startsWith("/admin/")) {
        loginUrl = new URL("/a/login", request.url)
      } else if (pathname.startsWith("/p/")) {
        loginUrl = new URL("/p/login", request.url)
      } else if (pathname.startsWith("/s/")) {
        loginUrl = new URL("/s/login", request.url)
      } else {
        loginUrl = new URL("/p/login", request.url)
      }
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Allow all other requests on localhost
    return NextResponse.next()
  }

  const isSuperAdminDomain =
    hostname === SUPER_ADMIN_DOMAIN ||
    hostname === `www.${SUPER_ADMIN_DOMAIN}` ||
    hostname.endsWith(`.${SUPER_ADMIN_DOMAIN}`)

  const isTenantDomain = hostname === TENANT_DOMAIN || hostname === `www.${TENANT_DOMAIN}`
  const isAgentDomain = hostname === AGENT_DOMAIN || hostname === `www.${AGENT_DOMAIN}`
  const isPlayerDomain = hostname === PLAYER_DOMAIN || hostname === `www.${PLAYER_DOMAIN}`

  const isPlayerRoute = pathname.startsWith("/p/")
  const isPlayerLoginPage = pathname === "/p/login"
  const isTenantPlayerDomain =
    isPlayerDomain || (!isLocalDev && !isSuperAdminDomain && !isTenantDomain && !isAgentDomain)

  // Check geo blocking for player routes on tenant domains
  if (isPlayerRoute && isTenantPlayerDomain && !isLocalDev && !isPlayerLoginPage) {
    try {
      // Get client IP
      const clientIP =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"

      // Get country code from Cloudflare/Vercel headers
      const countryCode = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || null

      if (clientIP !== "unknown" && countryCode) {
        // Call our geo-check API to check database rules
        const baseUrl = request.nextUrl.origin
        const geoCheckUrl = `${baseUrl}/api/geo-check`

        const geoResponse = await fetch(geoCheckUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip: clientIP,
            countryCode: countryCode.toUpperCase(),
            route: pathname,
          }),
        })

        if (geoResponse.ok) {
          const geoResult = await geoResponse.json()

          if (!geoResult.allowed) {
            // Redirect to geo-blocked page
            const blockedUrl = new URL("/geo-blocked", request.url)
            blockedUrl.searchParams.set("reason", geoResult.reason || "Access not available in your region")
            blockedUrl.searchParams.set("country", geoResult.countryName || countryCode)
            return NextResponse.redirect(blockedUrl)
          }
        }
      }
    } catch (error) {
      // Log error but don't block access on failure
      console.error("[Middleware] Geo check error:", error.message)
    }
  }

  // MFA still required for sensitive routes, but no domain redirect
  if (pathname.startsWith("/s/") && !isLocalDev) {
    const mfaToken = request.cookies.get("mfa_verified")?.value
    // Removed /s/financials and /s/audit-logs from MFA required routes
    const mfaRequiredRoutes = ["/s/tenants"]
    const requiresMFA = mfaRequiredRoutes.some((route) => pathname.startsWith(route))

    if (requiresMFA && !mfaToken && !pathname.includes("/s/mfa") && !pathname.includes("/s/login")) {
      const mfaUrl = new URL("/s/mfa/verify", request.url)
      mfaUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(mfaUrl)
    }
  }

  const geoBlockEnabled = process.env.GEO_BLOCKING_ENABLED === "true"

  if (isPlayerRoute && isTenantPlayerDomain && !isLocalDev) {
    try {
      const clientIP =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        request.headers.get("cf-connecting-ip") ||
        "unknown"

      if (geoBlockEnabled && clientIP !== "unknown") {
        const countryCode = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || null

        if (countryCode) {
          const blockedCountries = (process.env.BLOCKED_COUNTRIES || "")
            .split(",")
            .map((c) => c.trim().toUpperCase())
            .filter(Boolean)

          if (blockedCountries.includes(countryCode.toUpperCase())) {
            return NextResponse.json(
              {
                error: "Access denied. This service is not available in your country.",
                code: "GEO_BLOCKED",
                country: countryCode,
              },
              { status: 403 },
            )
          }
        }
      }
    } catch (error) {
      console.error("[Middleware] Geo check error:", error)
    }
  }

  if (isTenantDomain) {
    if (
      pathname.startsWith("/s/") ||
      pathname.startsWith("/a/") ||
      pathname.startsWith("/p/") ||
      pathname.startsWith("/admin/") ||
      pathname.startsWith("/staff/")
    ) {
      return NextResponse.json({ error: "This route is not accessible on the tenant domain" }, { status: 403 })
    }

    if (pathname === "/") {
      if (token) {
        return NextResponse.rewrite(new URL("/t/dashboard", request.url))
      } else {
        return NextResponse.rewrite(new URL("/t/login", request.url))
      }
    }

    if (
      !pathname.startsWith("/t/") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/api") &&
      !pathname.includes(".")
    ) {
      return NextResponse.rewrite(new URL(`/t${pathname}`, request.url))
    }
  }

  if (isAgentDomain) {
    if (
      pathname.startsWith("/s/") ||
      pathname.startsWith("/t/") ||
      pathname.startsWith("/p/") ||
      pathname.startsWith("/admin/") ||
      pathname.startsWith("/staff/")
    ) {
      return NextResponse.json({ error: "This route is not accessible on the agent domain" }, { status: 403 })
    }

    if (pathname === "/") {
      if (token) {
        return NextResponse.rewrite(new URL("/a/dashboard", request.url))
      } else {
        return NextResponse.rewrite(new URL("/a/login", request.url))
      }
    }

    if (
      !pathname.startsWith("/a/") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/api") &&
      !pathname.includes(".")
    ) {
      return NextResponse.rewrite(new URL(`/a${pathname}`, request.url))
    }
  }

  if (isSuperAdminDomain && pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/s/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/s/login", request.url))
    }
  }

  const tenantRoutes = ["/p/", "/a/", "/t/", "/admin/", "/staff/"]
  const isTenantRoute = tenantRoutes.some((route) => pathname.startsWith(route))

  if (isSuperAdminDomain && isTenantRoute) {
    return NextResponse.json({ error: "Tenant routes are not accessible on the super admin domain" }, { status: 403 })
  }

  if (isPlayerDomain && pathname.startsWith("/s/")) {
    return NextResponse.json({ error: "Super admin routes are not accessible on the player domain" }, { status: 403 })
  }

  const loginPages = [
    "/auth",
    "/s/login",
    "/t/login",
    "/a/login",
    "/admin/login",
    "/sa/login",
    "/p/login",
    "/staff/login",
  ]

  const isLoginPage = loginPages.some((page) => pathname.startsWith(page))

  const protectedRoutes = ["/p/", "/a/", "/t/", "/s/", "/admin/", "/sa/", "/staff/"]
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtected && !isLoginPage && !token) {
    let loginUrl

    if (isTenantDomain) {
      loginUrl = new URL("/t/login", request.url)
    } else if (isAgentDomain) {
      loginUrl = new URL("/a/login", request.url)
    } else if (!isLocalDev && isSuperAdminDomain) {
      loginUrl = new URL("/s/login", request.url)
    } else if (pathname.startsWith("/staff/")) {
      loginUrl = new URL("/staff/login", request.url)
    } else if (pathname.startsWith("/t/")) {
      loginUrl = new URL("/t/login", request.url)
    } else if (pathname.startsWith("/a/") || pathname.startsWith("/admin/")) {
      loginUrl = new URL("/a/login", request.url)
    } else if (pathname.startsWith("/p/")) {
      loginUrl = new URL("/p/login", request.url)
    } else if (pathname.startsWith("/s/")) {
      loginUrl = new URL("/s/login", request.url)
    } else {
      loginUrl = new URL("/p/login", request.url)
    }
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")

  let domainType = "player"
  if (isSuperAdminDomain) domainType = "super-admin"
  else if (isTenantDomain) domainType = "tenant"
  else if (isAgentDomain) domainType = "agent"

  response.headers.set("X-Domain-Type", domainType)

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|public|.*\\..*).*)",
  ],
}
