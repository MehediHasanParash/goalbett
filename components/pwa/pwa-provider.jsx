"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"

const PWAContext = createContext({
  isInstallable: false,
  isInstalled: false,
  isOnline: true,
  installPrompt: null,
  triggerInstall: () => {},
  role: "player",
  currentManifest: "/manifest.json",
  canInstallCurrentApp: false,
})

export function usePWA() {
  return useContext(PWAContext)
}

const DOMAINS = {
  SUPER_ADMIN: "betengin.com",
  TENANT: "tenantbetengin.com",
  AGENT: "agentbetengin.com",
  PLAYER: "goalbett.com",
}

const APP_CONFIGS = {
  "super-admin": {
    manifest: "/manifest-super-admin.json",
    scope: "/",
    id: "goalbett-super-admin",
    storageKey: "pwa-installed-super-admin",
    domain: DOMAINS.SUPER_ADMIN,
  },
  tenant: {
    manifest: "/manifest-tenant.json",
    scope: "/",
    id: "goalbett-tenant-admin",
    storageKey: "pwa-installed-tenant",
    domain: DOMAINS.TENANT,
  },
  agent: {
    manifest: "/manifest-agent.json",
    scope: "/",
    id: "goalbett-agent-portal",
    storageKey: "pwa-installed-agent",
    domain: DOMAINS.AGENT,
  },
  subagent: {
    manifest: "/manifest-subagent.json",
    scope: "/sa/",
    id: "goalbett-subagent-portal",
    storageKey: "pwa-installed-subagent",
  },
  admin: {
    manifest: "/manifest-admin.json",
    scope: "/admin/",
    id: "goalbett-admin-dashboard",
    storageKey: "pwa-installed-admin",
  },
  staff: {
    manifest: "/manifest-staff.json",
    scope: "/staff/",
    id: "goalbett-staff-portal",
    storageKey: "pwa-installed-staff",
  },
  player: {
    manifest: "/manifest-player.json",
    scope: "/",
    id: "goalbett-player-app",
    storageKey: "pwa-installed-player",
    domain: DOMAINS.PLAYER,
  },
}

function getRoleFromDomainAndPath(hostname, pathname) {
  const cleanHost =
    hostname
      ?.toLowerCase()
      .replace(/:\d+$/, "")
      .replace(/^www\./, "") || ""

  // Check domain first
  if (cleanHost === DOMAINS.SUPER_ADMIN) return "super-admin"
  if (cleanHost === DOMAINS.TENANT) return "tenant"
  if (cleanHost === DOMAINS.AGENT) return "agent"
  if (cleanHost === DOMAINS.PLAYER) return "player"

  // Fall back to path-based detection (for localhost)
  if (pathname.startsWith("/s/") || pathname === "/s") return "super-admin"
  if (pathname.startsWith("/t/") || pathname === "/t") return "tenant"
  if (pathname.startsWith("/a/") || pathname === "/a") return "agent"
  if (pathname.startsWith("/sa/") || pathname === "/sa") return "subagent"
  if (pathname.startsWith("/admin/") || pathname === "/admin") return "admin"
  if (pathname.startsWith("/staff/") || pathname === "/staff") return "staff"
  return "player"
}

function isAppInstalled(role) {
  if (typeof window === "undefined") return false
  const config = APP_CONFIGS[role]
  if (!config) return false
  return localStorage.getItem(config.storageKey) === "true"
}

function markAppInstalled(role) {
  if (typeof window === "undefined") return
  const config = APP_CONFIGS[role]
  if (config) {
    localStorage.setItem(config.storageKey, "true")
  }
}

function isRunningStandalone() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
}

export function PWAProvider({ children }) {
  const [installPrompts, setInstallPrompts] = useState({})
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [role, setRole] = useState("player")
  const [currentManifest, setCurrentManifest] = useState("/manifest-player.json")
  const [canInstallCurrentApp, setCanInstallCurrentApp] = useState(false)
  const manifestUpdateTimeoutRef = useRef(null)

  const updateManifest = useCallback((manifestUrl, forRole) => {
    if (manifestUpdateTimeoutRef.current) {
      clearTimeout(manifestUpdateTimeoutRef.current)
    }

    const existingManifest = document.querySelector('link[rel="manifest"]')
    if (existingManifest) {
      existingManifest.remove()
    }

    const link = document.createElement("link")
    link.rel = "manifest"
    link.href = `${manifestUrl}?v=${Date.now()}&role=${forRole}`
    document.head.appendChild(link)

    setCurrentManifest(manifestUrl)
  }, [])

  useEffect(() => {
    const hostname = window.location.hostname
    const pathname = window.location.pathname

    const detectedRole = getRoleFromDomainAndPath(hostname, pathname)
    const config = APP_CONFIGS[detectedRole]

    setRole(detectedRole)
    updateManifest(config.manifest, detectedRole)

    const thisAppInstalled = isAppInstalled(detectedRole)
    const isStandalone = isRunningStandalone()

    setIsInstalled(thisAppInstalled || isStandalone)

    const canInstall = !thisAppInstalled && !isStandalone
    setCanInstallCurrentApp(canInstall)

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()

      setInstallPrompts((prev) => ({
        ...prev,
        [detectedRole]: e,
      }))

      setIsInstallable(true)
      setCanInstallCurrentApp(true)
    }

    const handleAppInstalled = () => {
      markAppInstalled(detectedRole)
      setIsInstalled(true)
      setIsInstallable(false)
      setCanInstallCurrentApp(false)

      setInstallPrompts((prev) => {
        const newPrompts = { ...prev }
        delete newPrompts[detectedRole]
        return newPrompts
      })
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    const isDevelopment = hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("localhost")

    if ("serviceWorker" in navigator && !isDevelopment) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered")
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error)
        })
    } else if (isDevelopment) {
      // Unregister any existing service workers in development
      navigator.serviceWorker?.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
          console.log("[PWA] Service Worker unregistered (dev mode)")
        })
      })
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)

      if (manifestUpdateTimeoutRef.current) {
        clearTimeout(manifestUpdateTimeoutRef.current)
      }
    }
  }, [updateManifest])

  const triggerInstall = async () => {
    const currentPrompt = installPrompts[role]

    if (!currentPrompt) {
      const config = APP_CONFIGS[role]
      if (config && !isAppInstalled(role)) {
        if (config.domain) {
          window.location.href = `https://${config.domain}/?install=true`
        } else {
          window.location.href = `${config.scope}login?install=true`
        }
        return false
      }
      return false
    }

    try {
      currentPrompt.prompt()
      const { outcome } = await currentPrompt.userChoice

      if (outcome === "accepted") {
        markAppInstalled(role)
        setIsInstalled(true)
        setIsInstallable(false)
        setCanInstallCurrentApp(false)

        setInstallPrompts((prev) => {
          const newPrompts = { ...prev }
          delete newPrompts[role]
          return newPrompts
        })
        return true
      }
      return false
    } catch (error) {
      console.error("[PWA] Install error:", error)
      return false
    }
  }

  return (
    <PWAContext.Provider
      value={{
        isInstallable: isInstallable || canInstallCurrentApp,
        isInstalled,
        isOnline,
        installPrompt: installPrompts[role] || null,
        triggerInstall,
        role,
        currentManifest,
        canInstallCurrentApp,
      }}
    >
      {children}
    </PWAContext.Provider>
  )
}
