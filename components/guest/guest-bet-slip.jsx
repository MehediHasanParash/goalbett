"use client"
import { useState } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { X, Plus, Minus, Trash2, Receipt, AlertCircle, Copy, Check } from "lucide-react"

export function GuestBetSlip({ isOpen, onClose }) {
  const [bets, setBets] = useState([])
  const [betType, setBetType] = useState("single") // single, multiple
  const [showBookingCode, setShowBookingCode] = useState(false)
  const [bookingCode, setBookingCode] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [generatedBetId, setGeneratedBetId] = useState("")

  const updateStake = (id, newStake) => {
    setBets(bets.map((bet) => (bet.id === id ? { ...bet, stake: Math.max(0, newStake) } : bet)))
  }

  const removeBet = (id) => {
    setBets(bets.filter((bet) => bet.id !== id))
  }

  const clearAll = () => {
    setBets([])
    setShowBookingCode(false)
    setGeneratedBetId("")
  }

  const calculateTotalOdds = () => {
    if (bets.length === 0) return 0
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + bet.odds, 0)
    } else {
      return bets.reduce((product, bet) => product * bet.odds, 1)
    }
  }

  const calculateTotalStake = () => {
    if (bets.length === 0) return 0
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + bet.stake, 0)
    } else {
      return Math.min(...bets.map((bet) => bet.stake))
    }
  }

  const calculatePotentialWin = () => {
    if (bets.length === 0) return 0
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + bet.stake * bet.odds, 0)
    } else {
      const minStake = Math.min(...bets.map((bet) => bet.stake))
      const totalOdds = bets.reduce((product, bet) => product * bet.odds, 1)
      return minStake * totalOdds
    }
  }

  const generateBetId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = "GB-"
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedBetId(code)
    setShowBookingCode(true)
  }

  const copyBetId = () => {
    navigator.clipboard.writeText(generatedBetId)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const loadBookingCode = () => {
    // Placeholder for loading booking code functionality
    if (bookingCode.trim()) {
      alert(`Loading booking code: ${bookingCode}`)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Bet Slip Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-[#0A1A2F] z-50 overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6 text-[#FFD700]" />
              <h2 className="text-xl font-bold">Betslip</h2>
              {bets.length > 0 && (
                <span className="px-2 py-1 bg-[#FFD700] text-[#0A1A2F] rounded-full text-xs font-bold">
                  {bets.length}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bet Type Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[#2A3F55]">
            <button
              onClick={() => setBetType("single")}
              className={`flex-1 py-3 font-medium text-sm transition-colors relative ${
                betType === "single" ? "text-[#FFD700]" : "text-[#B8C5D6] hover:text-[#F5F5F5]"
              }`}
            >
              Betslip
              {betType === "single" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]" />}
            </button>
            <button
              onClick={() => setBetType("multiple")}
              className={`flex-1 py-3 font-medium text-sm transition-colors relative ${
                betType === "multiple" ? "text-[#FFD700]" : "text-[#B8C5D6] hover:text-[#F5F5F5]"
              }`}
            >
              Cashout
              {betType === "multiple" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]" />}
            </button>
          </div>

          {/* REAL/SIM Toggle */}
          <div className="flex gap-2 mb-6">
            <button className="px-4 py-2 bg-[#FFD700] text-[#0A1A2F] rounded-lg font-bold text-sm">REAL</button>
            <button className="px-4 py-2 bg-[#1A2F45] text-[#B8C5D6] rounded-lg font-medium text-sm hover:bg-[#2A3F55] transition-colors">
              SIM
            </button>
          </div>

          {/* Bets List or Empty State */}
          {bets.length === 0 ? (
            <div className="bg-[#1A2F45]/50 border border-[#2A3F55] rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#0A1A2F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-[#B8C5D6]" />
                </div>
                <p className="text-[#B8C5D6] mb-4 text-sm">
                  To place a bet, click on the odds. Or insert a booking code
                </p>

                {/* Booking Code Input */}
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Booking Code"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A1A2F] border border-[#2A3F55] rounded-lg text-[#F5F5F5] placeholder-[#B8C5D6]/50 focus:outline-none focus:border-[#FFD700] text-sm"
                  />
                  <button
                    onClick={loadBookingCode}
                    className="w-full py-3 bg-[#2A3F55] text-[#B8C5D6] rounded-lg hover:bg-[#3A4F65] transition-colors font-medium text-sm"
                  >
                    Load
                  </button>
                </div>

                <p className="text-xs text-[#B8C5D6]/60 mt-4">
                  A booking code enables you to transfer your bet between multiple devices.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {bets.map((bet) => (
                  <Card3D key={bet.id}>
                    <div className="bg-[#1A2F45] p-4 rounded-xl border border-[#2A3F55]">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="text-sm text-[#B8C5D6] mb-1">{bet.match}</div>
                          <div className="font-medium">{bet.selection}</div>
                        </div>
                        <button
                          onClick={() => removeBet(bet.id)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStake(bet.id, bet.stake - 10)}
                            className="w-8 h-8 bg-[#0A1A2F] rounded-lg flex items-center justify-center hover:bg-[#2A3F55] transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={bet.stake}
                            onChange={(e) => updateStake(bet.id, Number.parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-[#0A1A2F] border border-[#2A3F55] rounded-lg text-center focus:outline-none focus:border-[#FFD700]"
                          />
                          <button
                            onClick={() => updateStake(bet.id, bet.stake + 10)}
                            className="w-8 h-8 bg-[#0A1A2F] rounded-lg flex items-center justify-center hover:bg-[#2A3F55] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#B8C5D6]">Odds</div>
                          <div className="font-bold text-[#FFD700]">{bet.odds.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </Card3D>
                ))}
              </div>

              {/* Clear All Button */}
              <button
                onClick={clearAll}
                className="w-full py-2 mb-6 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Bets
              </button>

              {/* Summary */}
              <Card3D className="mb-6">
                <div className="bg-[#1A2F45] p-4 rounded-xl border border-[#2A3F55]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#B8C5D6]">Total Selections</span>
                      <span className="font-bold">{bets.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#B8C5D6]">Total Odds</span>
                      <span className="font-bold text-[#FFD700]">{calculateTotalOdds().toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#B8C5D6]">Total Stake</span>
                      <span className="font-bold">$ {calculateTotalStake().toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-[#2A3F55]" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Potential Win</span>
                      <span className="font-bold text-green-400 text-lg">$ {calculatePotentialWin().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card3D>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-400">
                  Generate a BetID to place this bet at any agent shop. No registration required!
                </p>
              </div>

              {/* Generate BetID Button */}
              <AnimatedButton
                variant="primary"
                className="w-full bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90 font-bold py-4"
                onClick={generateBetId}
              >
                Generate BetID for Agent Shop
              </AnimatedButton>
            </>
          )}
        </div>
      </div>

      {/* BetID Modal */}
      {showBookingCode && generatedBetId && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={() => setShowBookingCode(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
            <div className="bg-[#0A1A2F] border-2 border-[#FFD700] rounded-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-300">
              {/* Close Button */}
              <button
                onClick={() => setShowBookingCode(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-[#0A1A2F]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Your BetID</h3>
                <p className="text-sm text-[#B8C5D6] mb-6">Take this BetID to any agent shop to place your bet</p>

                {/* BetID Display */}
                <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-6 mb-6">
                  <code className="text-2xl font-mono font-bold text-[#FFD700] tracking-wider">{generatedBetId}</code>
                </div>

                {/* Copy Button */}
                <button
                  onClick={copyBetId}
                  className="w-full py-3 bg-[#FFD700] text-[#0A1A2F] rounded-lg hover:bg-[#FFD700]/90 transition-colors font-bold flex items-center justify-center gap-2 mb-4"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy BetID
                    </>
                  )}
                </button>

                {/* Bet Summary */}
                <div className="bg-[#1A2F45]/50 border border-[#2A3F55] rounded-lg p-4 text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#B8C5D6]">Selections:</span>
                      <span className="font-medium">{bets.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#B8C5D6]">Total Odds:</span>
                      <span className="font-medium text-[#FFD700]">{calculateTotalOdds().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#B8C5D6]">Stake:</span>
                      <span className="font-medium">$ {calculateTotalStake().toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-[#2A3F55] my-2" />
                    <div className="flex justify-between">
                      <span className="font-medium">Potential Win:</span>
                      <span className="font-bold text-green-400">$ {calculatePotentialWin().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#B8C5D6]/60 mt-4">
                  Valid for 24 hours. Visit any authorized agent shop to complete your bet.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
