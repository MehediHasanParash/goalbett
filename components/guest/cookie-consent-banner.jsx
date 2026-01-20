"use client"

import { useEffect, useState } from "react"

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const cookieConsent = localStorage.getItem("cookieConsent")
    if (!cookieConsent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(
      "cookieConsent",
      JSON.stringify({
        analytics: true,
        marketing: true,
        performance: true,
        timestamp: Date.now(),
      }),
    )
    setIsVisible(false)
  }

  const handleReject = () => {
    localStorage.setItem(
      "cookieConsent",
      JSON.stringify({
        analytics: false,
        marketing: false,
        performance: false,
        timestamp: Date.now(),
      }),
    )
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">Cookie Settings</h3>
          <p className="text-sm text-muted-foreground">
            We use cookies to improve your experience. Read our{" "}
            <button className="text-secondary hover:underline">privacy policy</button>.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-secondary text-primary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
