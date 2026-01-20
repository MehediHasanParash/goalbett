"use client"

import { useBets } from "@/hooks/useBets"
import { useTenant } from "@/components/providers/tenant-provider"
import { Clock, Check, X, Loader2 } from "lucide-react"

const statusConfig = {
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  won: { icon: Check, color: "text-green-400", bg: "bg-green-500/10" },
  lost: { icon: X, color: "text-red-400", bg: "bg-red-500/10" },
  void: { icon: X, color: "text-gray-400", bg: "bg-gray-500/10" },
  cashout: { icon: Check, color: "text-blue-400", bg: "bg-blue-500/10" },
}

export function BetHistory({ limit = 10 }) {
  const { bets, isLoading, isError } = useBets({ limit })
  const { primaryColor } = useTenant()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-[#B8C5D6]">Failed to load bet history</p>
      </div>
    )
  }

  if (!bets || bets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A2F45] flex items-center justify-center">
          <span className="text-3xl">📋</span>
        </div>
        <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">No Bets Yet</h3>
        <p className="text-sm text-[#B8C5D6]">Your betting history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bets.map((bet) => {
        const StatusIcon = statusConfig[bet.status]?.icon || Clock
        const statusColor = statusConfig[bet.status]?.color || "text-gray-400"
        const statusBg = statusConfig[bet.status]?.bg || "bg-gray-500/10"

        return (
          <div key={bet._id} className="bg-[#1A2F45] rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${statusBg} ${statusColor}`}>
                  <StatusIcon className="w-3 h-3 inline mr-1" />
                  {bet.status}
                </span>
                <span className="text-xs text-[#B8C5D6] capitalize">{bet.betType}</span>
              </div>
              <span className="text-xs text-[#B8C5D6]">{new Date(bet.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Selections */}
            <div className="space-y-2 mb-3">
              {bet.selections.slice(0, 3).map((sel, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <p className="text-[#F5F5F5]">{sel.eventName}</p>
                    <p className="text-xs text-[#B8C5D6]">{sel.outcomeName}</p>
                  </div>
                  <span style={{ color: primaryColor }}>{sel.odds.toFixed(2)}</span>
                </div>
              ))}
              {bet.selections.length > 3 && (
                <p className="text-xs text-[#B8C5D6]">+{bet.selections.length - 3} more selections</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#2A3F55]">
              <div>
                <p className="text-xs text-[#B8C5D6]">Stake</p>
                <p className="text-sm font-medium text-[#F5F5F5]">
                  {bet.currency} {bet.stake.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#B8C5D6]">{bet.status === "won" ? "Won" : "Potential Win"}</p>
                <p className="text-sm font-bold" style={{ color: primaryColor }}>
                  {bet.currency} {(bet.status === "won" ? bet.payout : bet.potentialWin).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
