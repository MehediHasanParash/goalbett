"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Share2, Download, AlertCircle, CheckCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

export default function GuestBettingPlatform() {
  const [betSlip, setBetSlip] = useState([
    {
      id: 1,
      match: "Man City vs Liverpool",
      selection: "Over 2.5 Goals",
      odds: 1.85,
    },
    {
      id: 2,
      match: "Barcelona vs Real Madrid",
      selection: "Both Teams to Score",
      odds: 1.65,
    },
  ])
  const [stake, setStake] = useState(100)
  const [betId, setBetId] = useState(null)
  const [generatedCode, setGeneratedCode] = useState(null)

  const totalOdds = betSlip.reduce((acc, bet) => acc * bet.odds, 1).toFixed(2)
  const totalReturn = (stake * totalOdds).toFixed(2)

  const generateBetId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = "GB-"
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setBetId(code)
    setGeneratedCode({
      code: code,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      link: `${window.location.origin}/guest?betid=${code}`,
    })
  }

  const removeBet = (id) => {
    setBetSlip(betSlip.filter((bet) => bet.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 font-semibold">Guest Mode Active</p>
          <p className="text-blue-300 text-sm">
            Browse freely and build your bet slip. Generate a BetID to share with friends or our agents to place your
            bet.
          </p>
        </div>
      </div>

      {/* Bet Slip */}
      <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
        <CardHeader>
          <CardTitle className="text-white">Your Bet Slip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {betSlip.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#B8C5D6]">No bets in your slip yet. Browse matches and add selections.</p>
            </div>
          ) : (
            <>
              {betSlip.map((bet, idx) => (
                <div key={bet.id} className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-semibold">
                        {idx + 1}. {bet.match}
                      </p>
                      <p className="text-[#B8C5D6] text-sm">{bet.selection}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#FFD700] font-bold text-lg">{bet.odds}</p>
                      <button
                        onClick={() => removeBet(bet.id)}
                        className="text-red-400 text-xs hover:text-red-500 mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Stake Input */}
              <div className="bg-[#1A2F45] border border-[#FFD700]/30 rounded-lg p-4">
                <label className="block text-[#B8C5D6] text-sm mb-2">Stake ($)</label>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="w-full bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              {/* Odds Summary */}
              <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#B8C5D6]">Total Odds:</span>
                  <span className="text-[#FFD700] font-bold">{totalOdds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B8C5D6]">Potential Return:</span>
                  <span className="text-green-400 font-bold text-lg">${totalReturn}</span>
                </div>
              </div>

              {/* Generate BetID */}
              <Button
                onClick={generateBetId}
                className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold h-12"
              >
                Generate BetID & Payment Link
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Generated BetID Display */}
      {generatedCode && (
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <CardTitle className="text-green-400">BetID Generated Successfully!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* BetID Code */}
            <div className="bg-[#1A2F45] border border-[#FFD700]/30 rounded-lg p-4">
              <p className="text-[#B8C5D6] text-sm mb-2">BetID Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[#FFD700] font-mono font-bold break-all">{generatedCode.code}</code>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#FFD700] text-[#FFD700] bg-transparent"
                  onClick={() => navigator.clipboard.writeText(generatedCode.code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-lg p-4 flex justify-center">
              <QRCodeSVG value={generatedCode.link} size={200} level="H" includeMargin={true} />
            </div>

            {/* Sharing Options */}
            <div className="space-y-2">
              <p className="text-[#B8C5D6] text-sm">Share with:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="border-[#FFD700] text-[#FFD700] text-sm bg-transparent">
                  <Share2 className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="border-[#FFD700] text-[#FFD700] text-sm bg-transparent">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button variant="outline" className="border-[#FFD700] text-[#FFD700] text-sm bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-[#0A1A2F]/50 border border-[#FFD700]/20 rounded-lg p-3 space-y-1">
              <p className="text-[#B8C5D6] text-xs">
                Generated: {new Date(generatedCode.generatedAt).toLocaleString()}
              </p>
              <p className="text-[#B8C5D6] text-xs">Expires: {new Date(generatedCode.expiresAt).toLocaleString()}</p>
              <p className="text-green-400 text-xs">Valid for 24 hours</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Account CTA for Payment */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-bold text-amber-300 mb-2">Ready to Play with Real Money?</h3>
          <p className="text-amber-200 text-sm mb-4">
            Create an account to deposit, withdraw, and keep your betting history.
          </p>
          <button
            onClick={() => (window.location.href = "/auth/unified")}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1A2F] hover:from-[#FFD700]/90 hover:to-[#FFA500]/90 font-bold py-3 px-6 rounded-lg transition-all duration-300 w-full"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
