"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Globe, ShieldX, AlertTriangle } from "lucide-react"

export function GeoBlockChecker({ children }) {
  const [status, setStatus] = useState("checking") // checking, allowed, blocked
  const [blockInfo, setBlockInfo] = useState(null)
  const pathname = usePathname()

  const isSuperAdminRoute = pathname?.startsWith("/s")
  const isApiRoute = pathname?.startsWith("/api")
  const shouldSkipGeoCheck = isSuperAdminRoute || isApiRoute

  useEffect(() => {
    // Skip geo check for Super Admin and other exempt routes
    if (shouldSkipGeoCheck) {
      setStatus("allowed")
      return
    }

    // Check if we're on a provider domain (betengin.com) - skip geo check
    const hostname = typeof window !== "undefined" ? window.location.hostname : ""
    const isProviderDomain =
      hostname === "betengin.com" ||
      hostname === "www.betengin.com" ||
      hostname === "localhost" ||
      hostname.includes("vercel.app")

    if (isProviderDomain) {
      setStatus("allowed")
      return
    }

    const checkGeoAccess = async () => {
      try {
        const res = await fetch("/api/geo-check")
        const data = await res.json()

        if (data.allowed) {
          setStatus("allowed")
        } else {
          setStatus("blocked")
          setBlockInfo({
            reason: data.reason,
            countryCode: data.countryCode,
            countryName: data.countryName,
          })
        }
      } catch (error) {
        console.error("Geo check failed:", error)
        // On error, allow access to avoid blocking everyone
        setStatus("allowed")
      }
    }

    checkGeoAccess()
  }, [pathname, shouldSkipGeoCheck])

  if (status === "checking" && !shouldSkipGeoCheck) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Globe className="h-5 w-5 animate-pulse" />
          <span>Verifying access...</span>
        </div>
      </div>
    )
  }

  // Show blocked state
  if (status === "blocked") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>

          <p className="text-muted-foreground mb-6">
            {blockInfo?.reason || "This service is not available in your region."}
          </p>

          {blockInfo?.countryName && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg py-3 px-4 mb-6">
              <Globe className="h-4 w-4" />
              <span>
                Detected location: <strong>{blockInfo.countryName}</strong>
              </span>
            </div>
          )}

          <div className="flex items-start gap-3 text-left bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">Why am I seeing this?</p>
              <p className="text-muted-foreground">
                Access to this platform is restricted in certain regions due to regulatory requirements. If you believe
                this is an error, please contact support.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <a href="mailto:support@goalbett.com" className="text-sm text-primary hover:underline">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Access allowed
  return children
}
