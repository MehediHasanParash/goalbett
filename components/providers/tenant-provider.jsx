"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { getAuthToken } from "@/lib/auth-service"

const TenantContext = createContext()

const TENANT_CACHE_KEY = "goalbett_tenant_cache"
const TENANT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getTenantFromCache = () => {
  if (typeof window === "undefined") return null
  try {
    const cached = localStorage.getItem(TENANT_CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < TENANT_CACHE_TTL) {
        return data
      }
    }
  } catch (e) {
    // Ignore cache errors
  }
  return null
}

const setTenantCache = (data) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      TENANT_CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    )
  } catch (e) {
    // Ignore cache errors
  }
}

const THEME_DEFINITIONS = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Traditional dark blue with gold accents",
    colors: {
      background: "#0a1a2f",
      foreground: "#f5f5f5",
      card: "#0d1f35",
      cardForeground: "#f5f5f5",
      primary: "#ffd700",
      primaryForeground: "#0a1a2f",
      secondary: "#1a2f45",
      secondaryForeground: "#f5f5f5",
      accent: "#ffd700",
      accentForeground: "#0a1a2f",
      muted: "#1a2f45",
      mutedForeground: "#a0a0a0",
      border: "#2a3f55",
      input: "#1a2f45",
      ring: "#ffd700",
    },
  },
  modern: {
    id: "modern",
    name: "Modern",
    description: "Clean light theme with purple gradients",
    colors: {
      background: "#f8fafc",
      foreground: "#1e293b",
      card: "#ffffff",
      cardForeground: "#1e293b",
      primary: "#7c3aed",
      primaryForeground: "#ffffff",
      secondary: "#f1f5f9",
      secondaryForeground: "#1e293b",
      accent: "#8b5cf6",
      accentForeground: "#ffffff",
      muted: "#f1f5f9",
      mutedForeground: "#64748b",
      border: "#e2e8f0",
      input: "#e2e8f0",
      ring: "#7c3aed",
    },
  },
  neon: {
    id: "neon",
    name: "Neon",
    description: "Cyberpunk dark with neon accents",
    colors: {
      background: "#0a0a0f",
      foreground: "#e0e0e0",
      card: "#12121a",
      cardForeground: "#e0e0e0",
      primary: "#00ffd5",
      primaryForeground: "#0a0a0f",
      secondary: "#1a1a25",
      secondaryForeground: "#e0e0e0",
      accent: "#39ff14",
      accentForeground: "#0a0a0f",
      muted: "#1a1a25",
      mutedForeground: "#808080",
      border: "#2a2a3a",
      input: "#1a1a25",
      ring: "#00ffd5",
    },
  },
}

const hexToHSL = (hex) => {
  const cleanHex = hex.replace("#", "")
  const r = Number.parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = Number.parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = Number.parseInt(cleanHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

const getContrastColor = (hex) => {
  const cleanHex = hex.replace("#", "")
  const r = Number.parseInt(cleanHex.substring(0, 2), 16)
  const g = Number.parseInt(cleanHex.substring(2, 4), 16)
  const b = Number.parseInt(cleanHex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

export function TenantProvider({ children, initialTenant, context = "public" }) {
  const cachedTenant = getTenantFromCache()
  const [tenant, setTenant] = useState(initialTenant || cachedTenant)
  const [isLoading, setIsLoading] = useState(!initialTenant && !cachedTenant)
  const [designId, setDesignId] = useState(initialTenant?.designId || cachedTenant?.designId || "classic")
  const [logoUrl, setLogoUrl] = useState(initialTenant?.theme?.logoUrl || cachedTenant?.theme?.logoUrl || "")
  const [brandName, setBrandName] = useState(initialTenant?.theme?.brandName || cachedTenant?.theme?.brandName || "")
  const [primaryColor, setPrimaryColor] = useState(
    initialTenant?.theme?.primaryColor || cachedTenant?.theme?.primaryColor || "#FFD700",
  )
  const [secondaryColor, setSecondaryColor] = useState(
    initialTenant?.theme?.secondaryColor || cachedTenant?.theme?.secondaryColor || "#0A1A2F",
  )
  const themeAppliedRef = useRef(false)
  const fetchingRef = useRef(false)

  const applyFullTheme = useCallback((themeId, tenantTheme) => {
    if (typeof document === "undefined") return

    const validThemes = ["classic", "modern", "neon"]
    const theme = validThemes.includes(themeId) ? themeId : "classic"
    const designColors = THEME_DEFINITIONS[theme]?.colors || THEME_DEFINITIONS.classic.colors

    const root = document.documentElement

    // Set data-theme attribute
    document.documentElement.setAttribute("data-theme", theme)
    document.body.setAttribute("data-theme", theme)
    document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "").trim()
    document.documentElement.classList.add(`theme-${theme}`)
    document.body.className = document.body.className.replace(/theme-\w+/g, "").trim()
    document.body.classList.add(`theme-${theme}`)

    // Use tenant's custom primary color if provided, otherwise use design default
    const primaryColor = tenantTheme?.primaryColor || designColors.primary
    const secondaryColor = tenantTheme?.secondaryColor || designColors.background
    const accentColor = tenantTheme?.accentColor || primaryColor

    // Convert to HSL for shadcn/ui compatibility
    const primaryHSL = hexToHSL(primaryColor)
    const accentHSL = hexToHSL(accentColor)
    const secondaryHSL = hexToHSL(secondaryColor)
    const bgHSL = hexToHSL(designColors.background)
    const fgHSL = hexToHSL(designColors.foreground)
    const cardHSL = hexToHSL(designColors.card)
    const mutedHSL = hexToHSL(designColors.muted)
    const borderHSL = hexToHSL(designColors.border)

    // Get foreground colors for contrast
    const primaryFg = getContrastColor(primaryColor)
    const primaryFgHSL = hexToHSL(primaryFg)
    const accentFg = getContrastColor(accentColor)
    const accentFgHSL = hexToHSL(accentFg)

    // Apply CSS variables that shadcn/ui components use
    root.style.setProperty("--background", `${bgHSL.h} ${bgHSL.s}% ${bgHSL.l}%`)
    root.style.setProperty("--foreground", `${fgHSL.h} ${fgHSL.s}% ${fgHSL.l}%`)
    root.style.setProperty("--card", `${cardHSL.h} ${cardHSL.s}% ${cardHSL.l}%`)
    root.style.setProperty("--card-foreground", `${fgHSL.h} ${fgHSL.s}% ${fgHSL.l}%`)
    root.style.setProperty("--popover", `${cardHSL.h} ${cardHSL.s}% ${cardHSL.l}%`)
    root.style.setProperty("--popover-foreground", `${fgHSL.h} ${fgHSL.s}% ${fgHSL.l}%`)

    // Primary color - use tenant's branding
    root.style.setProperty("--primary", `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`)
    root.style.setProperty("--primary-foreground", `${primaryFgHSL.h} ${primaryFgHSL.s}% ${primaryFgHSL.l}%`)

    // Secondary uses design background color
    root.style.setProperty("--secondary", `${mutedHSL.h} ${mutedHSL.s}% ${mutedHSL.l}%`)
    root.style.setProperty("--secondary-foreground", `${fgHSL.h} ${fgHSL.s}% ${fgHSL.l}%`)

    // Accent color - use tenant's accent or primary
    root.style.setProperty("--accent", `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`)
    root.style.setProperty("--accent-foreground", `${accentFgHSL.h} ${accentFgHSL.s}% ${accentFgHSL.l}%`)

    // Muted colors from design
    root.style.setProperty("--muted", `${mutedHSL.h} ${mutedHSL.s}% ${mutedHSL.l}%`)
    root.style.setProperty("--muted-foreground", `${fgHSL.h} ${fgHSL.s}% ${Math.max(fgHSL.l - 30, 30)}%`)

    // Border and input
    root.style.setProperty("--border", `${borderHSL.h} ${borderHSL.s}% ${borderHSL.l}%`)
    root.style.setProperty("--input", `${borderHSL.h} ${borderHSL.s}% ${borderHSL.l}%`)
    root.style.setProperty("--ring", `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`)

    // Also set raw hex values for components that use them directly
    root.style.setProperty("--tenant-primary", primaryColor)
    root.style.setProperty("--tenant-secondary", secondaryColor)
    root.style.setProperty("--tenant-accent", accentColor)
    root.style.setProperty("--theme-background", designColors.background)
    root.style.setProperty("--theme-foreground", designColors.foreground)
    root.style.setProperty("--theme-card", designColors.card)
    root.style.setProperty("--theme-primary", primaryColor)
    root.style.setProperty("--theme-secondary", secondaryColor)
    root.style.setProperty("--theme-accent", accentColor)
    root.style.setProperty("--theme-muted", designColors.muted)
    root.style.setProperty("--theme-border", designColors.border)

    // Set RGB values for rgba() usage
    const hexToRgb = (hex) => {
      const cleanHex = hex.replace("#", "")
      const r = Number.parseInt(cleanHex.substring(0, 2), 16)
      const g = Number.parseInt(cleanHex.substring(2, 4), 16)
      const b = Number.parseInt(cleanHex.substring(4, 6), 16)
      return `${r}, ${g}, ${b}`
    }

    root.style.setProperty("--primary-rgb", hexToRgb(primaryColor))
    root.style.setProperty("--accent-rgb", hexToRgb(accentColor))
    root.style.setProperty("--secondary-rgb", hexToRgb(secondaryColor))

    themeAppliedRef.current = true
  }, [])

  // Legacy functions for backwards compatibility
  const applyDesignTheme = useCallback(
    (themeId) => {
      applyFullTheme(themeId, tenant?.theme)
    },
    [applyFullTheme, tenant?.theme],
  )

  const applyTenantTheme = useCallback(
    (theme) => {
      applyFullTheme(designId, theme)
    },
    [applyFullTheme, designId],
  )

  const fetchTenant = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    const currentHost = typeof window !== "undefined" ? window.location.host : ""

    try {
      const res = await fetch(`/api/tenant/current?hostname=${encodeURIComponent(currentHost)}`)
      const data = await res.json()

      if (data.success && data.tenant) {
        setTenant(data.tenant)
        setTenantCache(data.tenant) // Cache for next load
        const loadedDesignId = data.tenant.designId || "classic"
        setDesignId(loadedDesignId)
        setLogoUrl(data.tenant.theme?.logoUrl || "")
        setBrandName(data.tenant.theme?.brandName || data.tenant.name || "")
        setPrimaryColor(data.tenant.theme?.primaryColor || "#FFD700")
        setSecondaryColor(data.tenant.theme?.secondaryColor || "#0A1A2F")
        applyFullTheme(loadedDesignId, data.tenant.theme)
      } else {
        setLogoUrl("/images/goal-betting-logo.png")
        setBrandName("GoalBet")
        applyFullTheme("classic", null)
      }
    } catch (error) {
      console.error("Tenant fetch error:", error)
      setLogoUrl("/images/goal-betting-logo.png")
      setBrandName("GoalBet")
      applyFullTheme("classic", null)
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [applyFullTheme])

  const refreshTenant = useCallback(() => {
    fetchTenant()
  }, [fetchTenant])

  useEffect(() => {
    if (cachedTenant && !initialTenant) {
      applyFullTheme(cachedTenant.designId || "classic", cachedTenant.theme)
      setIsLoading(false)
    }

    if (!initialTenant) {
      fetchTenant()
    } else {
      const initialDesignId = initialTenant.designId || "classic"
      setDesignId(initialDesignId)
      setLogoUrl(initialTenant.theme?.logoUrl || "")
      setBrandName(initialTenant.theme?.brandName || initialTenant.name || "")
      setPrimaryColor(initialTenant.theme?.primaryColor || "#FFD700")
      setSecondaryColor(initialTenant.theme?.secondaryColor || "#0A1A2F")
      applyFullTheme(initialDesignId, initialTenant.theme)
    }
  }, []) // Empty dependency array - only run once on mount

  const switchDesign = async (newDesignId) => {
    try {
      themeAppliedRef.current = false
      applyFullTheme(newDesignId, tenant?.theme)
      setDesignId(newDesignId)

      const token = getAuthToken()
      if (!token) {
        return { success: false, error: "Not authenticated" }
      }

      const response = await fetch("/api/tenant/design", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          designId: newDesignId,
          tenantId: tenant?._id || tenant?.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (tenant) {
          const updatedTenant = { ...tenant, designId: newDesignId }
          setTenant(updatedTenant)
          setTenantCache(updatedTenant) // Update cache
        }
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const previewDesign = (previewId) => {
    themeAppliedRef.current = false
    applyFullTheme(previewId, tenant?.theme)
  }

  const value = {
    tenant,
    isLoading,
    refreshTenant,
    designId,
    switchDesign,
    applyDesignTheme,
    applyTenantTheme,
    logoUrl,
    brandName,
    primaryColor,
    secondaryColor,
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider")
  }
  return context
}
