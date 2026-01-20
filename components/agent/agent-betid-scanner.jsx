"use client"

import { useState } from "react"
import { X, AlertCircle, CheckCircle } from "lucide-react"
import { createCashBet } from "@/lib/agent-service"
import { getAuthToken } from "@/lib/auth-service"
import { BetSuccessModal } from "./bet-success-modal"

export function AgentBetIdScanner({ onClose }) {
  const [betId, setBetId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [scannedSlip, setScannedSlip] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [successDetails, setSuccessDetails] = useState(null)

  const handleScan = async () => {
    if (!betId.trim()) {
      setError("Please enter a BetID")
      return
    }

    const guestFormat = /^GB-[A-Z0-9]{6}$/
    const playerFormat = /^BET-[A-Z0-9]{9}$/
    if (!guestFormat.test(betId) && !playerFormat.test(betId)) {
      setError("Invalid BetID format. Expected: GB-XXXXXX (guest) or BET-XXXXXXXXX (player)")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Fetch from server API
      const response = await fetch(`/api/guest/betslip?betId=${betId}`)
      const data = await response.json()

      if (data.success && data.data && data.data.slip) {
        setScannedSlip({
          betId: data.data.betId,
          slip: {
            selections: data.data.slip.legs || [],
            totalOdds: data.data.slip.totalOdds || 1,
            stake: data.data.slip.stake || 10,
            estimatedPayout: data.data.slip.estimatedPayout || data.data.slip.stake * data.data.slip.totalOdds,
          },
          expiresAt: data.data.expiresAt,
        })
      } else {
        setError("BetID not found or expired")
      }
    } catch (err) {
      console.error("[v0] BetID lookup error:", err)
      setError("Failed to look up BetID. Please try again.")
    }

    setLoading(false)
  }

  const handleAcceptBet = async () => {
    setProcessing(true)

    try {
      const response = await fetch("/api/agent/accept-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          betId: scannedSlip.betId,
          selections: scannedSlip.slip.selections,
          totalOdds: scannedSlip.slip.totalOdds,
          stake: scannedSlip.slip.stake,
          estimatedPayout: scannedSlip.slip.estimatedPayout,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Also save to local cache for offline support
        createCashBet(scannedSlip.betId, scannedSlip.slip.stake, "agent")

        setSuccessDetails({
          betId: scannedSlip.betId,
          totalOdds: scannedSlip.slip.totalOdds,
          stake: scannedSlip.slip.stake,
          potentialWin: scannedSlip.slip.estimatedPayout,
          selections: scannedSlip.slip.selections,
        })
      } else {
        setError(data.error || "Failed to accept bet")
      }
    } catch (err) {
      console.error("[v0] Accept bet error:", err)
      setError("Failed to accept bet. Please try again.")
    }

    setProcessing(false)
  }

  const handleSuccessClose = () => {
    setSuccessDetails(null)
    onClose()
  }

  if (successDetails) {
    return <BetSuccessModal betDetails={successDetails} onClose={handleSuccessClose} />
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Scan BetID</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        {!scannedSlip ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Enter BetID</label>
              <input
                type="text"
                placeholder="GB-XXXXXX or BET-XXXXXXXXX"
                value={betId}
                onChange={(e) => {
                  setBetId(e.target.value.toUpperCase())
                  setError("")
                }}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <p className="text-xs text-muted-foreground mt-1">Format: GB-XXXXXX (guest) or BET-XXXXXXXXX (player)</p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
                <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full py-3 bg-secondary text-secondary-foreground font-bold rounded-lg hover:bg-secondary/90 transition-all disabled:opacity-50"
            >
              {loading ? "Scanning..." : "Scan"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-500 mb-4">
              <CheckCircle size={20} />
              <span className="font-semibold">BetID Found</span>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">BetID</p>
                <p className="font-mono font-bold text-secondary">{scannedSlip.betId}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Selections</p>
                {scannedSlip.slip.selections.map((sel, idx) => (
                  <div key={idx} className="text-sm text-foreground">
                    {sel.match || sel.matchName || "Unknown Match"}
                    <br />
                    <span className="text-muted-foreground">{sel.selection || sel.betType}</span> @ {sel.odds}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Legs</p>
                  <p className="font-semibold text-foreground">{scannedSlip.slip.selections.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Odds</p>
                  <p className="font-semibold text-foreground">{scannedSlip.slip.totalOdds.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stake</p>
                  <p className="font-semibold text-foreground">${scannedSlip.slip.stake.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Potential Payout</p>
                  <p className="font-semibold text-green-500">${scannedSlip.slip.estimatedPayout.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {scannedSlip.expiresAt && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Expires at:</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(scannedSlip.expiresAt).toLocaleString()}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
                <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setScannedSlip(null)}
                className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleAcceptBet}
                disabled={processing}
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Accept Bet"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentBetIdScanner
