"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getAuthToken,
  getUser,
  setAuthToken,
  setUser as setStoredUser,
  removeAuthToken,
  removeUser,
  isTokenExpired,
} from "@/lib/auth-service"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const initAuth = () => {
      try {
        const storedToken = getAuthToken()
        const storedUser = getUser()

        console.log("[v0] useAuth init - token exists:", !!storedToken, "user exists:", !!storedUser)

        if (storedToken && storedUser) {
          if (isTokenExpired(storedToken)) {
            console.log("[v0] useAuth - token expired, clearing auth")
            removeAuthToken()
            removeUser()
            setToken(null)
            setUser(null)
          } else {
            setToken(storedToken)
            setUser(storedUser)
          }
        }
      } catch (error) {
        console.error("[v0] useAuth init error:", error)
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = useCallback(async (email, password, hostname) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: "player",
          hostname: hostname || (typeof window !== "undefined" ? window.location.hostname : ""),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAuthToken(data.token)
        setStoredUser(data.user)
        setToken(data.token)
        setUser(data.user)
        return data.user
      } else {
        throw new Error(data.error || "Login failed")
      }
    } catch (error) {
      console.error("[v0] Login failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    console.log("[v0] useAuth logout called")
    removeAuthToken()
    removeUser()
    setUser(null)
    setToken(null)
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }, [])

  const refreshAuth = useCallback(() => {
    try {
      const storedToken = getAuthToken()
      const storedUser = getUser()

      console.log("[v0] useAuth refresh - token exists:", !!storedToken, "user exists:", !!storedUser)

      if (storedToken && storedUser && !isTokenExpired(storedToken)) {
        setToken(storedToken)
        setUser(storedUser)
      } else {
        setToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error("[v0] useAuth refresh error:", error)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = getAuthToken()
      if (!storedToken) return null

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
      const data = await response.json()

      if (data.success && data.user) {
        setStoredUser(data.user)
        setUser(data.user)
        return data.user
      }
    } catch (error) {
      console.error("[v0] refreshUser error:", error)
    }
    return null
  }, [])

  useEffect(() => {
    if (!mounted) return

    const handleStorageChange = (e) => {
      if (e.key === "auth_token" || e.key === "user") {
        console.log("[v0] useAuth - storage changed, refreshing")
        refreshAuth()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [mounted, refreshAuth])

  const isAuthenticated = mounted && !!user && !!token

  return {
    user,
    token,
    loading: !mounted || loading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
    refreshUser, // Export refreshUser
  }
}
