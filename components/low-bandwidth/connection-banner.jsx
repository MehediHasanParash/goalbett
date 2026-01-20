"use client"

import { useState, useEffect } from "react"
import { useLowBandwidth } from "@/lib/contexts/low-bandwidth-context"
import { WifiOff, X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ConnectionBanner() {
  const { isLowBandwidth, setLowBandwidth } = useLowBandwidth()
  const [showBanner, setShowBanner] = useState(false)
  const [connectionType, setConnectionType] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if already dismissed this session
    if (sessionStorage.getItem("connection-banner-dismissed")) {
      setDismissed(true)
      return
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    if (connection) {
      const checkConnection = () => {
        const type = connection.effectiveType
        setConnectionType(type)

        const isSlowConnection = connection.saveData || type === "slow-2g" || type === "2g" || connection.downlink < 1.5

        // Show banner if slow connection detected and not already in low bandwidth mode
        if (isSlowConnection && !isLowBandwidth && !dismissed) {
          setShowBanner(true)
        }
      }

      checkConnection()
      connection.addEventListener("change", checkConnection)
      return () => connection.removeEventListener("change", checkConnection)
    }
  }, [isLowBandwidth, dismissed])

  const handleEnableLowBandwidth = () => {
    setLowBandwidth(true)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    sessionStorage.setItem("connection-banner-dismissed", "true")
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 z-50 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <WifiOff className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-sm">Slow Connection Detected</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your connection appears to be {connectionType || "slow"}. Enable Low Bandwidth Mode for a faster experience.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnableLowBandwidth}
              className="bg-yellow-500 text-black hover:bg-yellow-400"
            >
              <Zap className="h-3 w-3 mr-1" />
              Enable
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not Now
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
