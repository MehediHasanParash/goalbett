export interface PaymentAccessCheck {
  canAccessPayments: boolean
  reason?: string
  redirectUrl?: string
}

/**
 * Check if user can access payment methods
 * Only authenticated users (Players and Agents) can access payments
 */
export function checkPaymentAccess(): PaymentAccessCheck {
  if (typeof window === "undefined") {
    return {
      canAccessPayments: false,
      reason: "Server-side check required",
    }
  }

  const user = localStorage.getItem("user")

  if (!user) {
    return {
      canAccessPayments: false,
      reason: "User must be logged in",
      redirectUrl: "/auth/unified",
    }
  }

  try {
    const userData = JSON.parse(user)

    // Only PLAYER and AGENT roles can access payments
    const allowedRoles = ["PLAYER", "AGENT", "TENANT_ADMIN", "SUPERADMIN"]

    if (!allowedRoles.includes(userData.role)) {
      return {
        canAccessPayments: false,
        reason: "Your role does not have payment access",
      }
    }

    return {
      canAccessPayments: true,
    }
  } catch (error) {
    return {
      canAccessPayments: false,
      reason: "Invalid user data",
    }
  }
}

/**
 * Redirect to auth if user tries to access payments without login
 */
export function requirePaymentAuth(): void {
  const check = checkPaymentAccess()

  if (!check.canAccessPayments && typeof window !== "undefined") {
    window.location.href = check.redirectUrl || "/auth/unified"
  }
}
