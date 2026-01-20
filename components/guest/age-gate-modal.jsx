"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

export default function AgeGateModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const ageGateAccepted = localStorage.getItem("ageGateAccepted")
    if (!ageGateAccepted) {
      setIsOpen(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("ageGateAccepted", "true")
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-foreground mb-4">Age Verification</h2>

        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          You must be 18 years or older to use GoalBet. Please confirm you are 18 or older to continue.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            className="w-full px-4 py-3 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
          >
            I am 18 or Older - Continue
          </button>

          <button
            onClick={() => (window.location.href = "https://www.google.com")}
            className="w-full px-4 py-3 bg-muted text-muted-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors"
          >
            I am Under 18 - Leave Site
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          This decision is stored locally and you must confirm your age only once.
        </p>
      </div>
    </div>
  )
}
