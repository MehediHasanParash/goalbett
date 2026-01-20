export const ROLES = {
  PLAYER: "player",
  AGENT: "agent",
  SUB_AGENT: "sub_agent",
  ADMIN: "admin",
  TENANT_ADMIN: "tenant_admin",
  SUPER_ADMIN: "superadmin",
  SUPERADMIN: "superadmin",
  // New staff roles
  FINANCE_MANAGER: "finance_manager",
  GENERAL_MANAGER: "general_manager",
  SUPPORT_MANAGER: "support_manager",
  SUPPORT_AGENT: "support_agent",
}

export const ROLE_PATHS = {
  player: "/p",
  agent: "/a",
  sub_agent: "/sa",
  admin: "/admin",
  tenant_admin: "/t",
  superadmin: "/s",
  // Staff role paths
  finance_manager: "/staff/finance",
  general_manager: "/staff/gm",
  support_manager: "/staff/support",
  support_agent: "/staff/support",
}

export const STAFF_HIERARCHY = {
  tenant_admin: ["finance_manager", "general_manager", "support_manager", "support_agent"],
  general_manager: ["support_manager", "support_agent"],
  support_manager: ["support_agent"],
}

export const DEFAULT_PERMISSIONS = {
  finance_manager: {
    canViewDeposits: true,
    canViewWithdrawals: true,
    canApproveWithdrawals: true,
    canViewWalletLedger: true,
    canViewReconciliation: true,
    canExportFinanceReports: true,
    canViewKPIs: true,
  },
  general_manager: {
    canCreateAgents: true,
    canSetCommissions: true,
    canCreateSupportUsers: true,
    canViewKPIs: true,
    canViewTenantSettings: true,
  },
  support_manager: {
    canViewTickets: true,
    canViewPlayerProfile: true,
    canResetPasswords: true,
    canLockAccounts: true,
    canViewBetHistory: true,
    canViewTransactionHistory: true,
    canCreateNotes: true,
    canEscalateIssues: true,
  },
  support_agent: {
    canViewTickets: true,
    canViewPlayerProfile: true,
    canViewBetHistory: true,
    canViewTransactionHistory: true,
    canCreateNotes: true,
    canEscalateIssues: true,
  },
}

export function isStaffRole(role) {
  return ["finance_manager", "general_manager", "support_manager", "support_agent"].includes(role)
}

// Token management
export function setAuthToken(token) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
    document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
  }
}

export function getAuthToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

export const getToken = getAuthToken

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user")
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }
}

export const clearToken = removeAuthToken

export function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload
  } catch (error) {
    console.error("[v0] Token parse error:", error)
    return null
  }
}

export function isTokenExpired(token) {
  try {
    const payload = parseToken(token)
    if (!payload || !payload.exp) return true
    return Date.now() >= payload.exp * 1000
  } catch (error) {
    return true
  }
}

// User management
export function setUser(user) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
  }
}

export function getUser() {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

export function removeUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}

// Guest session management functions
export async function createGuestSession(tenant_id) {
  try {
    const response = await fetch("/api/auth/guest-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tenant_id }),
    })

    const data = await response.json()

    if (data.success) {
      setGuestSession(data.gsid)
    }

    return data
  } catch (error) {
    console.error("[v0] Create guest session error:", error)
    return { success: false, error: error.message }
  }
}

export function setGuestSession(gsid) {
  if (typeof window !== "undefined") {
    localStorage.setItem("guest_session_id", gsid)
  }
}

export function getGuestSession() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("guest_session_id")
}

export function clearGuestSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("guest_session_id")
  }
}

// Password reset functions
export async function requestPasswordReset(emailOrPhone) {
  try {
    const body = emailOrPhone.includes("@") ? { email: emailOrPhone } : { phone: emailOrPhone }

    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    return await response.json()
  } catch (error) {
    console.error("[v0] Password reset request error:", error)
    return { success: false, error: error.message }
  }
}

export async function verifyPasswordReset(emailOrPhone, otp, newPassword) {
  try {
    const body = emailOrPhone.includes("@")
      ? { email: emailOrPhone, otp, newPassword }
      : { phone: emailOrPhone, otp, newPassword }

    const response = await fetch("/api/auth/password-reset/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    return await response.json()
  } catch (error) {
    console.error("[v0] Password reset verify error:", error)
    return { success: false, error: error.message }
  }
}

// OTP login functions
export async function requestOTPLogin(phone, tenant_id) {
  try {
    const response = await fetch("/api/auth/otp-login/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, tenant_id }),
    })

    return await response.json()
  } catch (error) {
    console.error("[v0] OTP login request error:", error)
    return { success: false, error: error.message }
  }
}

export async function verifyOTPLogin(phone, otp, tenant_id) {
  try {
    const response = await fetch("/api/auth/otp-login/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp, tenant_id }),
    })

    const data = await response.json()

    if (data.success) {
      setAuthToken(data.token)
      setUser(data.user)
    }

    return data
  } catch (error) {
    console.error("[v0] OTP login verify error:", error)
    return { success: false, error: error.message }
  }
}

// Authentication functions
export async function signup(userData) {
  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (data.success) {
      setAuthToken(data.token)
      setUser(data.user)
    }

    return data
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return { success: false, error: error.message }
  }
}

export async function login(email, password, role = null) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
    })

    const data = await response.json()

    if (data.success) {
      setAuthToken(data.token)
      setUser(data.user)
    }

    return data
  } catch (error) {
    console.error("[v0] Login error:", error)
    return { success: false, error: error.message }
  }
}

export async function logout() {
  try {
    const token = getAuthToken()

    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    }

    removeAuthToken()
    removeUser()

    return { success: true }
  } catch (error) {
    console.error("[v0] Logout error:", error)
    removeAuthToken()
    removeUser()
    return { success: true }
  }
}

export async function getCurrentUser() {
  try {
    const token = getAuthToken()

    if (!token) {
      return { success: false, error: "No token found" }
    }

    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (data.success) {
      setUser(data.user)
    } else {
      removeAuthToken()
      removeUser()
    }

    return data
  } catch (error) {
    console.error("[v0] Get current user error:", error)
    return { success: false, error: error.message }
  }
}

export function isAuthenticated() {
  return !!getAuthToken()
}

export function getUserRole() {
  const user = getUser()
  return user?.role || null
}

export function clearAuth() {
  removeAuthToken()
  removeUser()
}

export function createToken(userData) {
  console.warn("[v0] createToken is deprecated. Use login() or signup() instead.")
  setUser(userData)
  const dummyToken = btoa(JSON.stringify({ ...userData, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }))
  setAuthToken(dummyToken)
  return dummyToken
}
