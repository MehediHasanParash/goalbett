import { ROLES } from "./auth-service"

export interface ReferralData {
  agentId?: string
  agentName?: string
  tenantId: string
  tenantName: string
  status: "valid" | "invalid" | "expired"
}

export interface JoinContext {
  referralCode?: string
  brandCode?: string
  agent?: {
    id: string
    name: string
  }
  tenant: {
    id: string
    name: string
  }
}

/**
 * Validate and retrieve referral code data
 * In production, this would call a backend API
 */
export async function validateReferralCode(code: string): Promise<ReferralData | null> {
  // Demo implementation - in production connect to API
  if (!code) return null

  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Demo: Any code starting with "AGT" is valid
      if (code.startsWith("AGT")) {
        resolve({
          agentId: `agent_${code}`,
          agentName: `Agent ${code}`,
          tenantId: "tenant_demo",
          tenantName: "Demo Brand",
          status: "valid",
        })
      } else {
        resolve(null)
      }
    }, 500)
  })
}

/**
 * Validate brand code for direct brand joining
 */
export async function validateBrandCode(code: string): Promise<ReferralData | null> {
  if (!code) return null

  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Demo: Any code starting with "BRD" is valid
      if (code.startsWith("BRD")) {
        resolve({
          tenantId: `tenant_${code}`,
          tenantName: `Brand ${code}`,
          status: "valid",
        })
      } else {
        resolve(null)
      }
    }, 500)
  })
}

/**
 * Assign player role based on context (referral code, brand, or admin assignment)
 */
export function assignPlayerRole(context: JoinContext): string {
  // All players joining via join/referral get PLAYER role
  // Role assignment to AGENT/TENANT_ADMIN/SUPERADMIN happens via admin dashboard
  return ROLES.PLAYER
}

/**
 * Store join context in user data for later reference
 */
export function storeJoinContext(userId: string, context: JoinContext): void {
  const key = `joinContext_${userId}`
  localStorage.setItem(key, JSON.stringify(context))
}

/**
 * Retrieve join context for a user
 */
export function getJoinContext(userId: string): JoinContext | null {
  const key = `joinContext_${userId}`
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : null
}
