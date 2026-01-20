export const ROLE_PATHS = {
  player: "/p",
  agent: "/a",
  subagent: "/a", // Sub-agents use agent paths
  tenant_admin: "/t",
  superadmin: "/s",
};

// Domain-based routing structure for goal-bett.vercel.app
export const DOMAIN_ROUTING = {
  // Super Admin: https://goal-bett.vercel.app/s/dashboard
  superadmin: {
    path: "/s",
    loginPath: "/s/login",
    dashboardPath: "/s/dashboard",
    description: "Global system administration and provider management",
    domain: "https://goal-bett.vercel.app/s",
    accessLevel: "System-wide",
  },

  // Tenant Admin: https://goal-bett.vercel.app/t/dashboard
  tenant_admin: {
    path: "/t",
    loginPath: "/t/login",
    dashboardPath: "/t/dashboard",
    description: "Brand management and tenant operations",
    domain: "https://goal-bett.vercel.app/t",
    accessLevel: "Tenant",
  },

  // Agent: https://goal-bett.vercel.app/a/dashboard
  agent: {
    path: "/a",
    loginPath: "/a/login",
    dashboardPath: "/a/dashboard",
    description: "Agent operations and sub-agent management",
    domain: "https://goal-bett.vercel.app/a",
    accessLevel: "Agent",
  },

  // Sub-Agent: https://goal-bett.vercel.app/a/subagents
  subagent: {
    path: "/a",
    loginPath: "/a/login",
    dashboardPath: "/a/subagents",
    description: "Sub-agent operations under agent management",
    domain: "https://goal-bett.vercel.app/a/subagents",
    accessLevel: "Sub-Agent",
  },

  // Player: https://goal-bett.vercel.app/p/dashboard
  player: {
    path: "/p",
    loginPath: "/p/login",
    dashboardPath: "/p/dashboard",
    description: "Player betting and gaming platform",
    domain: "https://goal-bett.vercel.app/p",
    accessLevel: "Public",
  },

  // Guest: https://goal-bett.vercel.app (public betting without login)
  guest: {
    path: "/",
    loginPath: "/auth",
    dashboardPath: "/",
    description: "Public betting platform (no login required)",
    domain: "https://goal-bett.vercel.app",
    accessLevel: "Public",
  },
};

// Environment-based URL configuration
export const ENV_URLS = {
  development: {
    baseUrl: "http://localhost:3000",
    api: "http://localhost:3001/v1",
  },
  production: {
    baseUrl: "https://goal-bett.vercel.app",
    api: "https://api.goal-bett.vercel.app/v1",
  },
};

// Helper function to get the correct domain based on environment
export function getDomainUrl(role, env = "production") {
  const baseUrl = ENV_URLS[env].baseUrl;
  const routing = DOMAIN_ROUTING[role];

  if (!routing) {
    return baseUrl;
  }

  return `${baseUrl}${routing.path}`;
}

// Helper function to build redirect URLs based on role after login
export function getRedirectUrl(role) {
  const routing = DOMAIN_ROUTING[role];
  return routing ? routing.dashboardPath : "/";
}
