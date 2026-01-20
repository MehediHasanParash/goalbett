"use client"

import { usePWA } from "./pwa-provider"
import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-950 py-2 px-4">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-yellow-950 hover:bg-yellow-600/20"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  )
}
