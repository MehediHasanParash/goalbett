"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken, parseToken, ROLE_PATHS, clearToken, isTokenExpired } from "@/lib/auth-service"

export default function RoleProtectedLayout({ children, requiredRole }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const validateAccess = () => {
      const token = getToken()

      if (!token) {
        setError("Session expired. Please login again.")
        clearToken()
        const loginPath = requiredRole ? ROLE_PATHS[requiredRole] + "/login" : "/auth"
        router.push(loginPath)
        return
      }

      if (isTokenExpired(token)) {
        setError("Your session has expired.")
        clearToken()
        router.push(ROLE_PATHS[requiredRole] + "/login?expired=true")
        return
      }

      const payload = parseToken(token)
      if (!payload) {
        setError("Invalid session.")
        clearToken()
        router.push("/auth")
        return
      }

      // Verify role matches required role
      if (requiredRole && payload.role !== requiredRole) {
        setError("You do not have access to this section.")
        clearToken()
        // Redirect to correct login for their role
        const correctPath = ROLE_PATHS[payload.role] + "/login"
        router.push(correctPath)
        return
      }

      setUser(payload)
      setLoading(false)
    }

    validateAccess()
  }, [requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-secondary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push("/auth")}
            className="px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return children
}
