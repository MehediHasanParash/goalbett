"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const ROLES = {
  SUPERADMIN: "superadmin",
  TENANT_ADMIN: "tenant_admin",
  AGENT_OWNER: "agent_owner",
  AGENT_SELLER: "agent_seller",
  PLAYER: "player",
  VIEWER: "viewer",
}

const PERMISSIONS = {
  [ROLES.SUPERADMIN]: ["*"], // All permissions
  [ROLES.TENANT_ADMIN]: ["manage_brand", "manage_agents", "view_reports", "manage_features"],
  [ROLES.AGENT_OWNER]: ["manage_subagents", "topup_customers", "view_sales", "manage_wallet"],
  [ROLES.AGENT_SELLER]: ["place_bets", "view_own_sales"],
  [ROLES.PLAYER]: ["play_games", "manage_own_wallet"],
  [ROLES.VIEWER]: ["view_reports"],
}

export default function RoleGuard({ children, requiredRole, requiredPermission }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simulate getting user from auth context/localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const hasPermission = (userRole, permission) => {
    const userPermissions = PERMISSIONS[userRole] || []
    return userPermissions.includes("*") || userPermissions.includes(permission)
  }

  const hasRole = (userRole, requiredRole) => {
    return userRole === requiredRole
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/auth")
    return null
  }

  if (requiredRole && !hasRole(user.role, requiredRole)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to perform this action.</p>
        </div>
      </div>
    )
  }

  return children
}

export { ROLES, PERMISSIONS }
