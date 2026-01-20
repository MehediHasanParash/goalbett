"use client"

import { useState, useEffect } from "react"
import { getVersionInfo } from "@/lib/version"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"

export function VersionFooter({ variant = "fixed" }) {
  const [versionInfo, setVersionInfo] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    setVersionInfo(getVersionInfo())
  }, [])

  if (!versionInfo) return null

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-xs text-[#8A9DB8]">
        <span className="font-mono">{versionInfo.fullVersion}</span>
        {versionInfo.environment === "development" && (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0"
          >
            DEV
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div
      className="fixed bottom-0 right-0 p-2 text-xs text-[#8A9DB8] bg-[#0A1A2F]/90 backdrop-blur-sm border-t border-l border-[#2A3F55] rounded-tl-lg z-50 cursor-pointer hover:bg-[#0D1F35] transition-colors"
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-center gap-2">
        <Info className="w-3 h-3" />
        <span className="font-mono">{versionInfo.fullVersion}</span>
        {versionInfo.environment === "development" && (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0"
          >
            DEV
          </Badge>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-[#2A3F55] space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-[#6B7B8F]">Build:</span>
            <span className="font-mono">{versionInfo.build}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#6B7B8F]">Released:</span>
            <span>{versionInfo.releaseDate}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#6B7B8F]">Environment:</span>
            <span className="capitalize">{versionInfo.environment}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function getVersion() {
  return getVersionInfo()
}
