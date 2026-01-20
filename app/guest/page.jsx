"use client"

import { useState } from "react"
import { LogIn } from "lucide-react"
import AgeGateModal from "@/components/guest/age-gate-modal"
import CookieConsentBanner from "@/components/guest/cookie-consent-banner"
import { GuestBetSlip } from "@/components/guest/guest-bet-slip"
import GuestBettingPlatform from "@/components/guest/guest-betting-platform" // imported new guest platform component

export default function GuestPage() {
  const [showBetSlip, setShowBetSlip] = useState(false)
  const [showGuestPlatform, setShowGuestPlatform] = useState(false) // added state for platform view

  // ... existing mockSports ...

  return (
    <>
      <AgeGateModal />
      <CookieConsentBanner />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">GoalBet</h1>
              <p className="text-sm text-muted-foreground">Guest Mode - Browse Only</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGuestPlatform(!showGuestPlatform)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  showGuestPlatform
                    ? "bg-secondary text-primary"
                    : "bg-transparent border border-secondary text-secondary hover:bg-secondary/10"
                }`}
              >
                {showGuestPlatform ? "Browse Events" : "Build Bet & Get BetID"}
              </button>
              <button
                onClick={() => (window.location.href = "/p/login")}
                className="px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-2"
              >
                <LogIn size={18} />
                Login / Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {showGuestPlatform ? (
            <GuestBettingPlatform />
          ) : (
            <>
              {/* Featured Banner */}
              <div className="bg-gradient-to-r from-secondary/20 to-accent/20 border border-secondary/30 rounded-lg p-8 mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to GoalBet</h2>
                <p className="text-muted-foreground mb-4">
                  Browse our sportsbook and jackpots. Build a bet slip and generate a BetID to share with friends or our
                  agents.
                </p>
                <button
                  onClick={() => setShowGuestPlatform(true)}
                  className="px-6 py-3 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
                >
                  Build a Bet
                </button>
              </div>

              {/* Sports Categories */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-4">Popular Sports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* ... existing mockSports code ... */}
                </div>
              </div>

              {/* Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{/* ... existing info cards code ... */}</div>
            </>
          )}
        </div>

        {/* Bet Slip Modal */}
        {showBetSlip && <GuestBetSlip isOpen={showBetSlip} onClose={() => setShowBetSlip(false)} />}
      </div>
    </>
  )
}
