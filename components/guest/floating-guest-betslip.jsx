"use client"
import { useState, useEffect } from "react"
import { X, Plus, Minus, Trash2, Receipt, AlertCircle, Copy, Check, ChevronDown } from "lucide-react"

export function FloatingGuestBetslip({ isAuthenticated = false }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [bets, setBets] = useState([])
  const [betType, setBetType] = useState("single")
  const [showBookingCode, setShowBookingCode] = useState(false)
  const [bookingCode, setBookingCode] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [generatedBetId, setGeneratedBetId] = useState("")
  const [animatingBetId, setAnimatingBetId] = useState(null)
  const [betPlaced, setBetPlaced] = useState(false)

  // Listen for bet additions from the page
  useEffect(() => {
    const handleAddBet = (event) => {
      const newBet = event.detail
      setBets((prevBets) => {
        // Check if bet already exists
        const exists = prevBets.some((bet) => bet.id === newBet.id)
        if (exists) return prevBets

        // Add animation
        setAnimatingBetId(newBet.id)
        setTimeout(() => setAnimatingBetId(null), 500)

        return [...prevBets, newBet]
      })

      // Auto-expand when bet is added
      if (!isExpanded) {
        setIsExpanded(true)
      }
    }

    window.addEventListener("addGuestBet", handleAddBet)
    return () => window.removeEventListener("addGuestBet", handleAddBet)
  }, [isExpanded])

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

  const MAX_WIN_LIMIT = 500000 // $500,000 max win limit from sandbox

  const getEnforcedPotentialWin = () => {
    const calculatedWin = calculatePotentialWin()
    return Math.min(calculatedWin, MAX_WIN_LIMIT)
  }

  const isOverMaxWin = () => {
    return calculatePotentialWin() > MAX_WIN_LIMIT
  }

  const placeBet = () => {
    // Simulate bet placement
    setBetPlaced(true)
    setTimeout(() => {
      alert(
        `Bet placed successfully! Total stake: $${calculateTotalStake().toFixed(2)}, Potential win: $${getEnforcedPotentialWin().toFixed(2)}`,
      )
      clearAll()
      setBetPlaced(false)
    }, 500)
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
    if (bookingCode.trim()) {
      alert(`Loading booking code: ${bookingCode}`)
    }
  }

  return (
    <>
      {/* Floating Button (Minimized State) */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-22 right-6 z-40 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1A2F] rounded-full shadow-2xl hover:shadow-[#FFD700]/50 transition-all duration-300 hover:scale-110 animate-pulse"
        >
          <div className="flex items-center justify-center px-4 py-4">
            <Receipt className="w-6 h-6" />
            <div className="text-left">
              {/* <div className="font-bold text-sm">Betslip</div> */}
              {bets.length > 0 && <div className="text-xs opacity-90">{bets.length} selections</div>}
            </div>
            {bets.length > 0 && (
              <div className="w-6 h-6 bg-[#0A1A2F] text-[#FFD700] rounded-full flex items-center justify-center text-xs font-bold">
                {bets.length}
              </div>
            )}
            {/* <ChevronUp className="w-5 h-5" /> */}
          </div>
        </button>
      )}

      {/* Expanded Betslip Panel */}
      {isExpanded && (
        <div className="fixed bottom-20 right-0 md:right-6 md:bottom-6 w-full md:w-96 md:max-h-[85vh] bg-[#0A1A2F] z-50 md:rounded-2xl shadow-2xl border-t md:border border-[#FFD700]/30 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-[#0A1A2F]" />
                <h2 className="text-xl font-bold text-[#0A1A2F]">Betslip</h2>
                {bets.length > 0 && (
                  <span className="px-2 py-1 bg-[#0A1A2F] text-[#FFD700] rounded-full text-xs font-bold">
                    {bets.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-black/10 rounded-lg transition-colors text-white"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(100vh-200px)] md:max-h-[calc(85vh-80px)] p-4">
            {/* Bet Type Tabs */}
            <div className="flex gap-2 mb-4 border-b border-[#2A3F55]">
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
            <div className="flex gap-2 mb-4">
              <button className="px-4 py-2 bg-[#FFD700] text-[#0A1A2F] rounded-lg font-bold text-sm">REAL</button>
              <button className="px-4 py-2 bg-[#1A2F45] text-[#B8C5D6] rounded-lg font-medium text-sm hover:bg-[#2A3F55] transition-colors">
                SIM
              </button>
            </div>

            {/* Bets List or Empty State */}
            {bets.length === 0 ? (
              <div className="bg-[#1A2F45]/50 border border-[#2A3F55] rounded-xl p-6">
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
                <div className="space-y-3 mb-4">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className={`bg-[#1A2F45] p-4 rounded-xl border border-[#2A3F55] transition-all duration-500 ${
                        animatingBetId === bet.id ? "animate-in slide-in-from-right scale-in" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="text-xs text-[#B8C5D6] mb-1">{bet.match}</div>
                          <div className="font-medium text-sm">{bet.selection}</div>
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
                            className="w-7 h-7 bg-[#0A1A2F] rounded-lg flex items-center justify-center hover:bg-[#2A3F55] transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={bet.stake}
                            onChange={(e) => updateStake(bet.id, Number.parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 bg-[#0A1A2F] border border-[#2A3F55] rounded-lg text-center text-sm focus:outline-none focus:border-[#FFD700]"
                          />
                          <button
                            onClick={() => updateStake(bet.id, bet.stake + 10)}
                            className="w-7 h-7 bg-[#0A1A2F] rounded-lg flex items-center justify-center hover:bg-[#2A3F55] transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#B8C5D6]">Odds</div>
                          <div className="font-bold text-[#FFD700]">{bet.odds.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clear All Button */}
                <button
                  onClick={clearAll}
                  className="w-full py-2 mb-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Bets
                </button>

                {/* Summary */}
                <div className="bg-[#1A2F45] p-4 rounded-xl border border-[#2A3F55] mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#B8C5D6]">Total Selections</span>
                      <span className="font-bold">{bets.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#B8C5D6]">Total Odds</span>
                      <span className="font-bold text-[#FFD700]">{calculateTotalOdds().toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#B8C5D6]">Total Stake</span>
                      <span className="font-bold">$ {calculateTotalStake().toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-[#2A3F55]" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Potential Win</span>
                      <div className="text-right">
                        <span className={`font-bold text-lg ${isOverMaxWin() ? "text-yellow-400" : "text-green-400"}`}>
                          $ {getEnforcedPotentialWin().toFixed(2)}
                        </span>
                        {isOverMaxWin() && <div className="text-xs text-yellow-400 mt-1">Max win limit applied</div>}
                      </div>
                    </div>
                    {isOverMaxWin() && (
                      <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-2 mt-2">
                        <p className="text-xs text-yellow-400">
                          Maximum payout is ${MAX_WIN_LIMIT.toLocaleString()}. Your potential win has been capped.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {isAuthenticated ? (
                  <>
                    {/* Warning for authenticated users */}
                    <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                      <AlertCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-400">
                        Place your bet now or generate a BetID to play at any agent shop.
                      </p>
                    </div>

                    {/* Place Bet Button (Primary for authenticated users) */}
                    <button
                      onClick={placeBet}
                      disabled={betPlaced}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {betPlaced ? "Placing Bet..." : "Place Bet"}
                    </button>

                    {/* Generate BetID Button (Secondary for authenticated users) */}
                    <button
                      onClick={generateBetId}
                      className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1A2F] hover:from-[#FFD700]/90 hover:to-[#FFA500]/90 font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      Generate BetID for Agent Shop
                    </button>

                    {/* Payment Methods - Only for authenticated users */}
                    <div className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20 rounded-2xl p-6 mt-4">
                      <h3 className="font-bold mb-4 text-white">Payment Methods</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { name: "Mobile Money", icon: "📱" },
                          { name: "Bank Transfer", icon: "🏦" },
                          { name: "Debit Card", icon: "💳" },
                          { name: "E-Wallet", icon: "👛" },
                        ].map((method, idx) => (
                          <button
                            key={idx}
                            className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 hover:border-[#FFD700] transition-colors text-center"
                          >
                            <p className="text-2xl mb-2">{method.icon}</p>
                            <p className="text-[#B8C5D6] text-sm">{method.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Warning for guest users */}
                    <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-4">
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-400">
                        Generate a BetID to place this bet at any agent shop. No registration required!
                      </p>
                    </div>

                    {/* Generate BetID Button (Only option for guests) */}
                    <button
                      onClick={generateBetId}
                      className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1A2F] hover:from-[#FFD700]/90 hover:to-[#FFA500]/90 font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      Generate BetID for Agent Shop
                    </button>

                    {!isAuthenticated && bets.length > 0 && (
                      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-lg p-4 mt-4">
                        <div className="text-center">
                          <p className="text-amber-300 text-sm font-semibold mb-3">
                            Want to deposit and place real money bets?
                          </p>
                          <button
                            onClick={() => (window.location.href = "/auth/unified")}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 font-bold py-2 rounded-lg transition-colors text-sm"
                          >
                            Create Account Now
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* BetID Modal */}
      {showBookingCode && generatedBetId && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={() => setShowBookingCode(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
            <div className="bg-[#0A1A2F] border-2 border-[#FFD700] rounded-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-300 relative">
              {/* Close Button */}
              <button
                onClick={() => setShowBookingCode(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5 text-white" />
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
                      <span className="font-bold text-green-400">$ {getEnforcedPotentialWin().toFixed(2)}</span>
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
