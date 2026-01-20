"use client"

import { useState } from "react"
import { useBetSlip } from "@/hooks/useBetSlip"
import { useWallet } from "@/hooks/useWallet"
import { useTenant } from "@/components/providers/tenant-provider"
import { X, AlertCircle, Check, Loader2 } from "lucide-react"

export function BetPlacementCard() {
  const {
    selections,
    removeSelection,
    clearSelections,
    betType,
    setBetType,
    stakes,
    updateStake,
    totalStake,
    potentialWinnings,
    placeBet,
    isPlacingBet,
  } = useBetSlip()
  const { wallet } = useWallet()
  const { primaryColor } = useTenant()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handlePlaceBet = async () => {
    setError(null)
    setSuccess(false)

    if (!wallet || wallet.balance < totalStake) {
      setError("Insufficient balance")
      return
    }

    if (selections.length === 0) {
      setError("Add selections to your betslip")
      return
    }

    try {
      await placeBet()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || "Failed to place bet")
    }
  }

  if (selections.length === 0) {
    return (
      <div className="bg-[#1A2F45] rounded-xl p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0A1A2F] flex items-center justify-center">
          <span className="text-3xl">🎯</span>
        </div>
        <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Your Betslip is Empty</h3>
        <p className="text-sm text-[#B8C5D6]">Click on odds to add selections to your betslip</p>
      </div>
    )
  }

  return (
    <div className="bg-[#1A2F45] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
        <span className="font-bold text-[#0A1A2F]">Betslip ({selections.length})</span>
        <button onClick={clearSelections} className="text-sm text-[#0A1A2F]/70 hover:text-[#0A1A2F]">
          Clear All
        </button>
      </div>

      {/* Bet Type Tabs */}
      <div className="flex border-b border-[#2A3F55]">
        {["single", "accumulator", "system"].map((type) => (
          <button
            key={type}
            onClick={() => setBetType(type)}
            className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
              betType === type ? "text-[#F5F5F5] border-b-2" : "text-[#B8C5D6] hover:text-[#F5F5F5]"
            }`}
            style={{ borderColor: betType === type ? primaryColor : "transparent" }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Selections */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {selections.map((selection, idx) => (
          <div key={idx} className="bg-[#0A1A2F] rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs text-[#B8C5D6]">{selection.eventName}</p>
                <p className="text-sm font-medium text-[#F5F5F5]">{selection.marketName}</p>
                <p className="text-sm" style={{ color: primaryColor }}>
                  {selection.outcomeName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: primaryColor }}>
                  {selection.odds.toFixed(2)}
                </span>
                <button onClick={() => removeSelection(idx)} className="p-1 rounded hover:bg-[#2A3F55]">
                  <X className="w-4 h-4 text-[#B8C5D6]" />
                </button>
              </div>
            </div>

            {/* Stake Input for Singles */}
            {betType === "single" && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-[#B8C5D6]">Stake:</span>
                <input
                  type="number"
                  value={stakes[idx] || ""}
                  onChange={(e) => updateStake(idx, Number.parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1 bg-[#1A2F45] border border-[#2A3F55] rounded px-2 py-1 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Accumulator Stake */}
      {betType !== "single" && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#B8C5D6]">Total Stake:</span>
            <input
              type="number"
              value={stakes[0] || ""}
              onChange={(e) => updateStake(0, Number.parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="flex-1 bg-[#0A1A2F] border border-[#2A3F55] rounded px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
            />
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="px-4 py-3 bg-[#0A1A2F] space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#B8C5D6]">Total Stake</span>
          <span className="text-[#F5F5F5] font-medium">
            {wallet?.currency || "USD"} {totalStake.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#B8C5D6]">Potential Win</span>
          <span className="font-bold" style={{ color: primaryColor }}>
            {wallet?.currency || "USD"} {potentialWinnings.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mx-4 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-4 mb-3 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Bet placed successfully!</span>
        </div>
      )}

      {/* Place Bet Button */}
      <div className="p-4">
        <button
          onClick={handlePlaceBet}
          disabled={isPlacingBet || selections.length === 0 || totalStake === 0}
          className="w-full py-3 rounded-lg font-bold text-[#0A1A2F] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          {isPlacingBet ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing Bet...
            </>
          ) : (
            `Place Bet - ${wallet?.currency || "USD"} ${totalStake.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  )
}
