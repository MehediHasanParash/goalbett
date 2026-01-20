// Domain configuration for multi-domain setup
// Super Admin domain: betengin.com
// Tenant Admin domain: tenantbetengin.com
// Agent domain: agentbetengin.com
// Player domain: goalbett.com

export const SUPER_ADMIN_DOMAIN = "betengin.com"
export const SUPER_ADMIN_DOMAIN_WWW = `www.${SUPER_ADMIN_DOMAIN}`

export const TENANT_DOMAIN = "tenantbetengin.com"
export const TENANT_DOMAIN_WWW = `www.${TENANT_DOMAIN}`

export const AGENT_DOMAIN = "agentbetengin.com"
export const AGENT_DOMAIN_WWW = `www.${AGENT_DOMAIN}`

export const PLAYER_DOMAIN = "goalbett.com"
export const PLAYER_DOMAIN_WWW = `www.${PLAYER_DOMAIN}`

// Check if hostname is the super admin domain
export function isSuperAdminDomain(hostname) {
  if (!hostname) return false
  const cleanHost = hostname.toLowerCase().replace(/:\d+$/, "")
  if (cleanHost === "localhost" || cleanHost.startsWith("localhost:")) {
    return false // localhost should use path-based routing
  }
  return cleanHost === SUPER_ADMIN_DOMAIN || cleanHost === SUPER_ADMIN_DOMAIN_WWW
}

export function isTenantDomain(hostname) {
  if (!hostname) return false
  const cleanHost = hostname.toLowerCase().replace(/:\d+$/, "")
  if (cleanHost === "localhost" || cleanHost.startsWith("localhost:")) {
    return false
  }
  return cleanHost === TENANT_DOMAIN || cleanHost === TENANT_DOMAIN_WWW
}

export function isAgentDomain(hostname) {
  if (!hostname) return false
  const cleanHost = hostname.toLowerCase().replace(/:\d+$/, "")
  if (cleanHost === "localhost" || cleanHost.startsWith("localhost:")) {
    return false
  }
  return cleanHost === AGENT_DOMAIN || cleanHost === AGENT_DOMAIN_WWW
}

export function isPlayerDomain(hostname) {
  if (!hostname) return false
  const cleanHost = hostname.toLowerCase().replace(/:\d+$/, "")
  if (cleanHost === "localhost" || cleanHost.startsWith("localhost:")) {
    return false
  }
  return cleanHost === PLAYER_DOMAIN || cleanHost === PLAYER_DOMAIN_WWW
}

// Get the appropriate redirect URL based on domain type
export function getSuperAdminUrl(path = "/") {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname === "localhost") {
      return `http://localhost:${window.location.port}${path}`
    }
  }
  return `https://${SUPER_ADMIN_DOMAIN}${path}`
}

export function getTenantUrl(path = "/") {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname === "localhost") {
      return `http://localhost:${window.location.port}/t${path}`
    }
  }
  return `https://${TENANT_DOMAIN}${path}`
}

export function getAgentUrl(path = "/") {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname === "localhost") {
      return `http://localhost:${window.location.port}/a${path}`
    }
  }
  return `https://${AGENT_DOMAIN}${path}`
}

export function getPlayerUrl(path = "/") {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname === "localhost") {
      return `http://localhost:${window.location.port}${path}`
    }
  }
  return `https://${PLAYER_DOMAIN}${path}`
}

// Domain routing configuration
export const DOMAIN_CONFIG = {
  superAdmin: {
    domain: SUPER_ADMIN_DOMAIN,
    name: "Betengin",
    description: "Super Admin Platform",
    routes: ["/s/*"],
    loginPath: "/s/login",
    dashboardPath: "/s/dashboard",
  },
  tenant: {
    domain: TENANT_DOMAIN,
    name: "Tenant Admin",
    description: "Tenant Admin Portal",
    routes: ["/t/*"],
    loginPath: "/login",
    dashboardPath: "/dashboard",
  },
  agent: {
    domain: AGENT_DOMAIN,
    name: "Agent Portal",
    description: "Agent Portal",
    routes: ["/a/*"],
    loginPath: "/login",
    dashboardPath: "/dashboard",
  },
  player: {
    domain: PLAYER_DOMAIN,
    name: "GoalBett",
    description: "Sports Betting & Casino",
    routes: ["/", "/p/*"],
    loginPath: "/auth",
    defaultPath: "/",
  },
}
