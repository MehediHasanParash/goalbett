"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X } from "lucide-react"
import { getGeoBlockedMessage } from "@/lib/compliance-service"

export default function GeoRestrictionBanner({ countryCode }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isBanned, setIsBanned] = useState(false)

  useEffect(() => {
    const checkGeo = async () => {
      const restrictedCountries = ["US", "UK", "CN", "RU"]
      if (restrictedCountries.includes(countryCode)) {
        setIsBanned(true)
        setIsVisible(true)
      }
    }
    checkGeo()
  }, [countryCode])

  if (!isVisible) return null

  return (
    <div
      className={`${isBanned ? "bg-destructive/10 border-destructive/30" : "bg-accent/10 border-accent/30"} border rounded-lg p-4`}
    >
      <div className="flex gap-3">
        <AlertTriangle size={20} className={isBanned ? "text-destructive" : "text-accent"} />
        <div className="flex-1">
          <p className={`font-semibold ${isBanned ? "text-destructive" : "text-accent"} mb-1`}>
            {isBanned ? "Service Not Available" : "Geographic Notice"}
          </p>
          <p className="text-sm text-foreground mb-3">{getGeoBlockedMessage()}</p>
          <div className="text-xs text-muted-foreground">
            For more information, visit our{" "}
            <button className="text-secondary hover:underline">responsible gaming</button> page.
          </div>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
