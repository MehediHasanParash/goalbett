"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { usePWA } from "./pwa-provider"
import { Button } from "@/components/ui/button"
import { Download, X, Smartphone, Monitor, CheckCircle2, Wifi, WifiOff } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const ROLE_CONFIG = {
  player: {
    title: "Install GoalBett App",
    description: "Get instant access to sports betting and casino games",
    features: ["Faster loading times", "Works offline", "Push notifications for bet results", "Home screen access"],
    color: "from-yellow-500 to-amber-600",
    bgColor: "bg-yellow-500/10",
    storageKey: "pwa-installed-player",
    icon: "/playerIcon.png",
  },
  guest: {
    title: "Install GoalBett App",
    description: "Get instant access to sports betting and casino games",
    features: ["Faster loading times", "Works offline", "Push notifications for bet results", "Home screen access"],
    color: "from-yellow-500 to-amber-600",
    bgColor: "bg-yellow-500/10",
    storageKey: "pwa-installed-player",
    icon: "/playerIcon.png",
  },
  "super-admin": {
    title: "Install Super Admin Panel",
    description: "Manage your betting platform on the go",
    features: ["Quick access to dashboard", "Real-time notifications", "Offline viewing", "Secure admin access"],
    color: "from-indigo-500 to-purple-600",
    bgColor: "bg-indigo-500/10",
    storageKey: "pwa-installed-super-admin",
    icon: "/superAdminIcon.png",
  },
  tenant: {
    title: "Install Tenant Admin Portal",
    description: "Manage your tenant operations anywhere",
    features: ["Monitor tenant activity", "Manage users & agents", "View reports offline", "Instant notifications"],
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500/10",
    storageKey: "pwa-installed-tenant",
    icon: "/tenantIcon.png",
  },
  agent: {
    title: "Install Agent Portal",
    description: "Access your agent dashboard instantly",
    features: ["Quick transaction access", "Player management", "Commission tracking", "Offline support"],
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-500/10",
    storageKey: "pwa-installed-agent",
    icon: "/agentIcon.png",
  },
  subagent: {
    title: "Install Sub-Agent Portal",
    description: "Manage your sub-agent operations",
    features: ["Player management", "Transaction tracking", "Commission reports", "Offline access"],
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    storageKey: "pwa-installed-subagent",
    icon: "/subagentIcon.png",
  },
  admin: {
    title: "Install Admin Panel",
    description: "Tenant administration on the go",
    features: ["User management", "Settings control", "Report viewing", "Offline support"],
    color: "from-red-500 to-rose-600",
    bgColor: "bg-red-500/10",
    storageKey: "pwa-installed-admin",
    icon: "/adminIcon.png",
  },
  staff: {
    title: "Install Staff Portal",
    description: "Access staff tools anywhere",
    features: ["Player support", "Transaction handling", "Task management", "Offline access"],
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-500/10",
    storageKey: "pwa-installed-staff",
    icon: "/staffIcon.png",
  },
}

function getRoleFromPath(pathname) {
  if (pathname.startsWith("/s/") || pathname === "/s") return "super-admin"
  if (pathname.startsWith("/t/") || pathname === "/t") return "tenant"
  if (pathname.startsWith("/a/") || pathname === "/a") return "agent"
  if (pathname.startsWith("/sa/") || pathname === "/sa") return "subagent"
  if (pathname.startsWith("/admin/") || pathname === "/admin") return "admin"
  if (pathname.startsWith("/staff/") || pathname === "/staff") return "staff"
  return "player"
}

function isThisAppInstalled(role) {
  if (typeof window === "undefined") return false
  const config = ROLE_CONFIG[role]
  if (!config) return false
  return localStorage.getItem(config.storageKey) === "true"
}

function markAppInstalled(role) {
  if (typeof window === "undefined") return
  const config = ROLE_CONFIG[role]
  if (config) {
    localStorage.setItem(config.storageKey, "true")
  }
}

export function InstallPrompt({ variant = "banner" }) {
  const { isInstallable, triggerInstall, isOnline, canInstallCurrentApp } = usePWA()
  const pathname = usePathname()
  const [showBanner, setShowBanner] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [thisAppInstalled, setThisAppInstalled] = useState(false)

  const detectedRole = getRoleFromPath(pathname)
  const config = ROLE_CONFIG[detectedRole] || ROLE_CONFIG.player

  useEffect(() => {
    setThisAppInstalled(isThisAppInstalled(detectedRole))
  }, [detectedRole])

  useEffect(() => {
    // Check if user has dismissed the banner recently for this specific role
    const dismissKey = `pwa-install-dismissed-${detectedRole}`
    const dismissedAt = localStorage.getItem(dismissKey)
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime()
      const now = new Date().getTime()
      // Show again after 7 days
      if (now - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true)
        return
      }
    }

    setDismissed(false)

    const timer = setTimeout(() => {
      const appInstalled = isThisAppInstalled(detectedRole)
      if (!appInstalled && !dismissed) {
        setShowBanner(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isInstallable, dismissed, detectedRole])

  useEffect(() => {
    const dismissKey = `pwa-install-dismissed-${detectedRole}`
    const dismissedAt = localStorage.getItem(dismissKey)
    if (!dismissedAt) {
      setDismissed(false)
    }
    // Re-check if this app is installed
    setThisAppInstalled(isThisAppInstalled(detectedRole))
  }, [detectedRole])

  const handleInstall = async () => {
    setInstalling(true)
    const success = await triggerInstall()
    setInstalling(false)
    if (success) {
      markAppInstalled(detectedRole)
      setThisAppInstalled(true)
      setShowBanner(false)
      setShowDialog(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem(`pwa-install-dismissed-${detectedRole}`, new Date().toISOString())
  }

  // Already installed indicator
  if (thisAppInstalled && variant === "status") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-500">
        <CheckCircle2 className="h-4 w-4" />
        <span>App Installed</span>
      </div>
    )
  }

  // Online/Offline indicator
  if (variant === "network-status") {
    return (
      <div className={`flex items-center gap-2 text-sm ${isOnline ? "text-green-500" : "text-yellow-500"}`}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>
    )
  }

  // Install button variant
  if (variant === "button") {
    if (thisAppInstalled) return null

    return (
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        className={`gap-2 border-primary/30 hover:bg-primary/10`}
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>
    )
  }

  // Banner variant (default) - check thisAppInstalled instead of isInstalled
  if (!showBanner || thisAppInstalled || dismissed) return null

  return (
    <>
      {/* Bottom Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-background via-card to-background border-t border-border/50 backdrop-blur-lg animate-in slide-in-from-bottom duration-500">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${config.color}`}>
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{config.title}</h3>
              <p className="text-sm text-muted-foreground hidden sm:block">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setShowDialog(true)}
              className={`bg-gradient-to-r ${config.color} text-white hover:opacity-90`}
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          </div>
        </div>
      </div>

      {/* Install Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-4`}
            >
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl">{config.title}</DialogTitle>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {config.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {typeof window !== "undefined" && window.location.protocol === "http:" && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-500">
                <strong>Note:</strong> PWA install requires HTTPS. Deploy to production or use ngrok for testing.
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="h-4 w-4" />
                <span>Desktop</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>Mobile</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
              Maybe Later
            </Button>
            <Button
              onClick={handleInstall}
              disabled={installing || (typeof window !== "undefined" && window.location.protocol === "http:")}
              className={`flex-1 bg-gradient-to-r ${config.color} text-white hover:opacity-90`}
            >
              {installing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install Now
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
