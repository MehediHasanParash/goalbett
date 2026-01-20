"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, Share2, XCircle } from "lucide-react"
import { WinCardGenerator } from "@/components/player/win-card-generator"

export function BetResultModal({ isOpen, onClose, betResult }) {
  const [showShareCard, setShowShareCard] = useState(false)

  if (!betResult) return null

  const isWin = betResult.status === "won"
  const profit = isWin ? betResult.potentialWin - betResult.stake : -betResult.stake

  if (showShareCard && isWin) {
    return (
      <WinCardGenerator
        isOpen={true}
        onClose={() => {
          setShowShareCard(false)
          onClose()
        }}
        winData={{
          amount: betResult.potentialWin,
          game: betResult.type === "casino" ? betResult.game : "Sports Bet",
          multiplier: betResult.odds ? `${betResult.odds}x` : "",
          betId: betResult.betId || betResult._id,
          playerName: betResult.playerName || "Player",
          timestamp: betResult.settledAt || new Date().toISOString(),
          brandName: betResult.brandName || "GoalBett",
          eventName: betResult.eventName || betResult.selections?.[0]?.eventName || "",
          odds: betResult.totalOdds ? `@${betResult.totalOdds.toFixed(2)}` : "",
        }}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0D1F35] border-[#2A3F55] max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="sr-only">Bet Result</DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-4">
          {/* Result Icon */}
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
              isWin ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            {isWin ? <Trophy className="w-10 h-10 text-[#FFD700]" /> : <XCircle className="w-10 h-10 text-red-500" />}
          </div>

          {/* Result Text */}
          <div>
            <h3 className={`text-2xl font-bold ${isWin ? "text-[#FFD700]" : "text-red-500"}`}>
              {isWin ? "You Won!" : "Better Luck Next Time"}
            </h3>
            <p className="text-[#B8C5D6] mt-1">{betResult.eventName || betResult.game || "Bet Settled"}</p>
          </div>

          {/* Amount */}
          <div className={`text-4xl font-bold ${isWin ? "text-green-400" : "text-red-400"}`}>
            {isWin ? "+" : ""}
            {profit >= 0 ? "+" : ""}${Math.abs(profit).toFixed(2)}
          </div>

          {/* Details */}
          <div className="bg-[#122A45] rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8A9DB8]">Stake</span>
              <span className="text-white">${betResult.stake?.toFixed(2)}</span>
            </div>
            {betResult.totalOdds && (
              <div className="flex justify-between">
                <span className="text-[#8A9DB8]">Odds</span>
                <span className="text-white">@{betResult.totalOdds?.toFixed(2)}</span>
              </div>
            )}
            {isWin && (
              <div className="flex justify-between">
                <span className="text-[#8A9DB8]">Payout</span>
                <span className="text-green-400">${betResult.potentialWin?.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isWin && (
              <Button
                onClick={() => setShowShareCard(true)}
                className="flex-1 bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Win
              </Button>
            )}
            <Button
              onClick={onClose}
              variant={isWin ? "outline" : "default"}
              className={
                isWin
                  ? "flex-1 border-[#2A3F55] text-white bg-transparent hover:bg-[#1A2F45]"
                  : "flex-1 bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
              }
            >
              {isWin ? "Close" : "Try Again"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BetResultModal
