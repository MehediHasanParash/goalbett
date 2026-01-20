"use client"
import { useEffect } from "react"
import { CheckCircle2, TrendingUp, Receipt, X } from "lucide-react"

function BetSuccessModal({ isOpen, onClose, betDetails, betData }) {
  // Support both prop names
  const details = betData || betDetails

  useEffect(() => {
    if (isOpen) {
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
        <div className="bg-gradient-to-br from-[#0A1A2F] via-[#1A2F45] to-[#0A1A2F] border-2 border-[#FFD700] rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in slide-in-from-bottom duration-300">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-[#B8C5D6] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Icon */}
          <div className="flex flex-col items-center px-6 pb-6">
            <div className="relative mb-6">
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-green-500/30 animate-pulse" />
              {/* Icon */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Bet Placed Successfully!</h3>
            <p className="text-[#B8C5D6] text-center mb-6">Your bet has been confirmed and is now active</p>

            {/* Bet Details Card */}
            <div className="w-full bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-5 space-y-4">
              {/* Bet ID */}
              {details?.betId && (
                <div className="flex items-center justify-between pb-3 border-b border-[#2A3F55]">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#FFD700]" />
                    <span className="text-sm text-[#B8C5D6]">Bet ID</span>
                  </div>
                  <span className="font-mono font-bold text-[#FFD700]">{details.betId}</span>
                </div>
              )}

              {/* Total Stake */}
              <div className="flex items-center justify-between">
                <span className="text-[#B8C5D6]">Total Stake</span>
                <span className="font-bold text-white text-lg">
                  ${(details?.totalStake || details?.stake)?.toFixed(2) || "0.00"}
                </span>
              </div>

              {/* Total Odds */}
              <div className="flex items-center justify-between">
                <span className="text-[#B8C5D6]">Total Odds</span>
                <span className="font-bold text-[#FFD700] text-lg">
                  {(details?.totalOdds || details?.odds)?.toFixed(2) || "0.00"}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#2A3F55] to-transparent" />

              {/* Potential Win */}
              <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-green-300">Potential Win</span>
                </div>
                <span className="font-bold text-green-400 text-xl">${details?.potentialWin?.toFixed(2) || "0.00"}</span>
              </div>
            </div>

            {/* Good Luck Message */}
            <div className="mt-6 text-center">
              <p className="text-[#FFD700] font-semibold text-lg mb-1">Good Luck!</p>
              <p className="text-[#B8C5D6] text-sm">May the odds be in your favor</p>
            </div>

            {/* Auto-close indicator */}
            <div className="mt-4 text-center">
              <p className="text-xs text-[#B8C5D6]/60">This will close automatically in 5 seconds</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default BetSuccessModal
export { BetSuccessModal }
