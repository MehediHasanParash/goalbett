"use client"
import { useState, useEffect } from "react"
import { X, Plus, Minus, Trash2, Receipt, AlertCircle, Copy, Check, ChevronDown, AlertTriangle } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import { useAuth } from "@/hooks/useAuth"
import { BetSuccessModal } from "@/components/ui/bet-success-modal"

export function FloatingBetslip() {
  const { isAuthenticated, user } = useAuth()
  const { primaryColor, secondaryColor } = useTenant()

  const [isExpanded, setIsExpanded] = useState(false)
  const [bets, setBets] = useState([])
  const [betType, setBetType] = useState("single")
  const [showBookingCode, setShowBookingCode] = useState(false)
  const [bookingCode, setBookingCode] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [generatedBetId, setGeneratedBetId] = useState("")
  const [animatingBetId, setAnimatingBetId] = useState(null)
  const [betPlaced, setBetPlaced] = useState(false)
  const [riskAlerts, setRiskAlerts] = useState([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successBetDetails, setSuccessBetDetails] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const handleAddBet = (event) => {
      const newBet = event.detail
      setBets((prevBets) => {
        const exists = prevBets.some((bet) => bet.id === newBet.id)
        if (exists) return prevBets

        setAnimatingBetId(newBet.id)
        setTimeout(() => setAnimatingBetId(null), 500)

        return [...prevBets, newBet]
      })

      if (!isExpanded) {
        setIsExpanded(true)
      }
    }

    window.addEventListener("addGuestBet", handleAddBet)
    window.addEventListener("addBet", handleAddBet)
    return () => {
      window.removeEventListener("addGuestBet", handleAddBet)
      window.removeEventListener("addBet", handleAddBet)
    }
  }, [isExpanded])

  useEffect(() => {
    if (!isAuthenticated || bets.length === 0) {
      setRiskAlerts([])
      return
    }

    const alerts = []
    const currentSlipPattern = bets
      .map((b) => `${b.match}-${b.selection}`)
      .sort()
      .join("|")

    if (currentSlipPattern) {
      const slipHistory = JSON.parse(localStorage.getItem("slipHistory") || "[]")
      const duplicateCount = slipHistory.filter((prevSlip) => {
        const prevPattern = prevSlip.pattern || ""
        return prevPattern === currentSlipPattern
      }).length

      if (duplicateCount >= 3) {
        alerts.push({
          type: "critical",
          icon: AlertTriangle,
          message: `This exact slip has been played ${duplicateCount} times! Consider changing selections.`,
          severity: "error",
        })
      } else if (duplicateCount >= 1) {
        alerts.push({
          type: "warning",
          icon: AlertCircle,
          message: `This slip has been played ${duplicateCount} time(s) before.`,
          severity: "warning",
        })
      }
    }

    setRiskAlerts(alerts)
  }, [bets, isAuthenticated])

  useEffect(() => {
    setErrorMessage("")
  }, [bets, betType])

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
    setErrorMessage("")
  }

  const calculateTotalOdds = () => {
    if (bets.length === 0) return 0
    if (betType === "single") {
      // For singles, we don't multiply odds - each bet is independent
      // Return average or sum for display purposes
      return bets.reduce((sum, bet) => sum + bet.odds, 0)
    } else {
      // For accumulator, multiply all odds
      return bets.reduce((product, bet) => product * bet.odds, 1)
    }
  }

  const calculateTotalStake = () => {
    if (bets.length === 0) return 0
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + (bet.stake || 0), 0)
    } else {
      // For accumulator, use the first bet's stake or minimum stake
      const stakes = bets.map((bet) => bet.stake || 0).filter((s) => s > 0)
      return stakes.length > 0 ? Math.min(...stakes) : 0
    }
  }

  const calculatePotentialWin = () => {
    if (bets.length === 0) return 0
    if (betType === "single") {
      // For singles, sum up each bet's potential win
      return bets.reduce((sum, bet) => sum + (bet.stake || 0) * bet.odds, 0)
    } else {
      // For accumulator, multiply odds by stake
      const stake = calculateTotalStake()
      const totalOdds = bets.reduce((product, bet) => product * bet.odds, 1)
      return stake * totalOdds
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

  const getMaxAllowedStake = () => {
    if (betType === "single") {
      // For singles, calculate per-bet max stake
      const highestOdds = Math.max(...bets.map((bet) => bet.odds))
      return MAX_WIN_LIMIT / highestOdds
    } else {
      const totalOdds = bets.reduce((product, bet) => product * bet.odds, 1)
      return MAX_WIN_LIMIT / totalOdds
    }
  }

  const placeBet = async () => {
    if (isOverMaxWin()) {
      const maxStake = getMaxAllowedStake()
      setErrorMessage(
        `Maximum win limit of $${MAX_WIN_LIMIT.toLocaleString()} exceeded! Your potential win is $${calculatePotentialWin().toLocaleString()}. Reduce your stake to $${maxStake.toFixed(2)} or remove selections.`,
      )
      return
    }

    try {
      setBetPlaced(true)
      setErrorMessage("")

      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMessage("Authentication token not found. Please log in again.")
        setBetPlaced(false)
        return
      }

      const totalStake = calculateTotalStake()
      const totalOdds = betType === "single" ? calculateTotalOdds() : bets.reduce((p, b) => p * b.odds, 1)
      const potentialWin = getEnforcedPotentialWin()

      console.log("[v0] Placing bet:", { totalStake, totalOdds, potentialWin, selectionsCount: bets.length, betType })

      const betData = {
        selections: bets.map((bet) => ({
          eventId: bet.eventId || bet.matchId || bet.id,
          eventName: bet.match,
          marketName: bet.market || "Match Winner",
          selectionName: bet.selection,
          odds: bet.odds,
          stake: betType === "single" ? bet.stake : totalStake,
        })),
        betType: betType === "single" ? "single" : "multiple",
        stake: totalStake,
      }

      const response = await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(betData), // Fixed JSON.JSON.stringify typo to JSON.stringify
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        let errorMsg = data.error || "Failed to place bet"

        if (data.enforcement && data.enforcement.maxWinningEnforced) {
          errorMsg = `Maximum Win Limit Exceeded! Your potential win of $${data.enforcement.originalPotentialWin?.toLocaleString() || "N/A"} exceeds the $${MAX_WIN_LIMIT.toLocaleString()} limit. Maximum allowed stake: $${data.enforcement.maxAllowedStake?.toFixed(2) || "N/A"}`
        } else if (data.details && Array.isArray(data.details)) {
          errorMsg = data.details.join(". ")
        }

        setErrorMessage(errorMsg)
        setBetPlaced(false)
        return
      }

      console.log("[v0] Bet placed successfully:", data.data?.ticketNumber)

      const slipPattern = bets
        .map((b) => `${b.match}-${b.selection}`)
        .sort()
        .join("|")
      const slipHistory = JSON.parse(localStorage.getItem("slipHistory") || "[]")
      slipHistory.push({
        pattern: slipPattern,
        timestamp: Date.now(),
        bets: bets,
        betType: betType,
      })
      localStorage.setItem("slipHistory", JSON.stringify(slipHistory))

      setSuccessBetDetails({
        betId: data.data?.ticketNumber || data.data?.betId || "N/A",
        totalStake: totalStake,
        totalOdds: totalOdds,
        potentialWin: potentialWin,
      })
      setShowSuccessModal(true)

      setTimeout(() => {
        clearAll()
        setBetPlaced(false)
      }, 500)
    } catch (error) {
      console.error("[v0] Error placing bet:", error)
      setErrorMessage(error.message || "An unexpected error occurred")
      setBetPlaced(false)
    }
  }

  const generateBetId = () => {
    const betId = "BET-" + Math.random().toString(36).substr(2, 9).toUpperCase()
    setGeneratedBetId(betId)
    setShowBookingCode(true)
  }

  const copyBetId = () => {
    navigator.clipboard.writeText(generatedBetId)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const loadBookingCode = () => {
    if (bookingCode.trim()) {
      setBets([
        { id: "loaded-1", match: "Arsenal vs Chelsea", selection: "Arsenal Win", odds: 2.1, stake: 50 },
        { id: "loaded-2", match: "Liverpool vs Man City", selection: "Over 2.5", odds: 1.85, stake: 50 },
      ])
      setBookingCode("")
    }
  }

  const accentColor = primaryColor || "#FFD700"
  const accentColorRgb =
    accentColor === "#FFD700"
      ? "255, 215, 0"
      : accentColor === "#22C55E"
        ? "34, 197, 94"
        : accentColor === "#EC4899"
          ? "236, 72, 153"
          : "255, 215, 0"

  return (
    <>
      <BetSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        betDetails={successBetDetails}
      />

      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          style={{ background: `linear-gradient(to right, ${accentColor}, ${secondaryColor || accentColor})` }}
          className="fixed bottom-[85px] right-4 z-[60] text-[#0A1A2F] rounded-full shadow-2xl transition-all duration-300 hover:scale-110"
        >
          <div className="flex items-center justify-center px-4 py-4 gap-2">
            <Receipt className="w-6 h-6" />
            {bets.length > 0 && (
              <>
                <span className="text-xs font-medium">{bets.length} selections</span>
                <div
                  className="w-6 h-6 bg-[#0A1A2F] rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ color: accentColor }}
                >
                  {bets.length}
                </div>
              </>
            )}
          </div>
        </button>
      )}

      {isExpanded && (
        <div
          className="fixed bottom-[80px] right-0 md:right-6 md:bottom-6 w-full md:w-96 max-h-[50vh] md:max-h-[85vh] bg-[#0A1A2F] z-[60] md:rounded-2xl shadow-2xl border-t md:border overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-300 pb-2"
          style={{ borderColor: `rgba(${accentColorRgb}, 0.3)` }}
        >
          <div
            style={{ background: `linear-gradient(to right, ${accentColor}, ${secondaryColor || accentColor})` }}
            className="p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-[#0A1A2F]" />
                <h2 className="text-xl font-bold text-[#0A1A2F]">Betslip</h2>
                {bets.length > 0 && (
                  <span
                    className="px-2 py-1 bg-[#0A1A2F] rounded-full text-xs font-bold"
                    style={{ color: accentColor }}
                  >
                    {bets.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-black/10 rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-[#0A1A2F]" />
              </button>
            </div>
          </div>

          <div className="p-4 max-h-[calc(85vh-80px)] overflow-y-auto">
            {bets.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-[#4A5C6A]" />
                <p className="text-[#B8C5D6]">Your betslip is empty</p>
                <p className="text-xs text-[#4A5C6A] mt-2">Add selections to start betting</p>
              </div>
            ) : (
              <>
                {riskAlerts.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {riskAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border flex items-start gap-2 ${
                          alert.severity === "error"
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                        }`}
                      >
                        <alert.icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p className="text-xs">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setBetType("single")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      betType === "single" ? "text-[#0A1A2F]" : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
                    }`}
                    style={betType === "single" ? { backgroundColor: accentColor } : {}}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setBetType("accumulator")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      betType === "accumulator" ? "text-[#0A1A2F]" : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
                    }`}
                    style={betType === "accumulator" ? { backgroundColor: accentColor } : {}}
                  >
                    Accumulator
                  </button>
                </div>

                <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className={`bg-[#1A2F45] p-3 rounded-xl border border-[#2A3F55] transition-all duration-300 ${
                        animatingBetId === bet.id ? "animate-pulse ring-2 ring-[#FFD700]" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-[#B8C5D6] truncate">{bet.match}</p>
                          <p className="font-medium text-white text-sm">{bet.selection}</p>
                        </div>
                        <button
                          onClick={() => removeBet(bet.id)}
                          className="p-1 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateStake(bet.id, bet.stake - 10)}
                            className="w-7 h-7 bg-[#0A1A2F] rounded-lg flex items-center justify-center hover:bg-[#2A3F55] transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={bet.stake}
                            onChange={(e) => updateStake(bet.id, Number.parseFloat(e.target.value) || 0)}
                            className="w-16 h-7 bg-[#0A1A2F] rounded-lg text-center text-sm font-medium border focus:outline-none focus:ring-1"
                            style={{ borderColor: accentColor }}
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
                          <div className="font-bold" style={{ color: accentColor }}>
                            {bet.odds.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={clearAll}
                  className="w-full py-2 mb-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>

                <div className="bg-[#1A2F45] p-4 rounded-xl border border-[#2A3F55] mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#B8C5D6]">Selections</span>
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
                        <span className={`font-bold text-lg ${isOverMaxWin() ? "text-red-400" : "text-green-400"}`}>
                          ${" "}
                          {calculatePotentialWin().toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        {isOverMaxWin() && (
                          <div className="text-xs text-red-400 mt-1">
                            Exceeds ${MAX_WIN_LIMIT.toLocaleString()} limit!
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-[#2A3F55]" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#4A5C6A]">Max Win Limit</span>
                      <span className="text-[#4A5C6A]">${MAX_WIN_LIMIT.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {isOverMaxWin() && (
                  <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 mb-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-red-400 font-bold text-sm">MAXIMUM WIN LIMIT EXCEEDED</p>
                        <p className="text-red-300 text-xs mt-1">
                          Your potential win of{" "}
                          <span className="font-bold">${calculatePotentialWin().toLocaleString()}</span> exceeds the{" "}
                          <span className="font-bold">${MAX_WIN_LIMIT.toLocaleString()}</span> maximum limit.
                        </p>
                        <p className="text-yellow-400 text-xs mt-2 font-medium">
                          Maximum allowed stake at these odds: ${getMaxAllowedStake().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {errorMessage && !isOverMaxWin() && (
                  <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-bold text-sm">Bet Failed</p>
                        <p className="text-red-300 text-xs mt-1">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isAuthenticated ? (
                  <>
                    <button
                      onClick={placeBet}
                      disabled={betPlaced || isOverMaxWin() || calculateTotalStake() <= 0}
                      className={`w-full font-bold py-3 rounded-lg transition-all duration-300 mb-3 ${
                        isOverMaxWin()
                          ? "bg-red-500/50 text-red-200 cursor-not-allowed"
                          : betPlaced
                            ? "bg-gray-500 text-gray-300 cursor-wait"
                            : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105"
                      }`}
                    >
                      {betPlaced
                        ? "Placing Bet..."
                        : isOverMaxWin()
                          ? `LIMIT EXCEEDED - Max $${MAX_WIN_LIMIT.toLocaleString()}`
                          : `Place Bet - $${calculateTotalStake().toFixed(2)}`}
                    </button>

                    <button
                      onClick={generateBetId}
                      className="w-full text-[#0A1A2F] font-bold py-3 rounded-lg transition-all duration-300 hover:opacity-90"
                      style={{
                        background: `linear-gradient(to right, ${accentColor}, ${secondaryColor || accentColor})`,
                      }}
                    >
                      Generate BetID for Agent
                    </button>
                  </>
                ) : (
                  <>
                    {isOverMaxWin() && (
                      <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400">
                          Maximum win limit exceeded. Reduce stake to ${getMaxAllowedStake().toFixed(2)} or less.
                        </p>
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-4">
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-400">
                        Generate a BetID to place this bet at any agent shop. No registration required!
                      </p>
                    </div>

                    <button
                      onClick={generateBetId}
                      disabled={isOverMaxWin()}
                      className={`w-full font-bold py-3 rounded-lg transition-all duration-300 mb-3 ${
                        isOverMaxWin()
                          ? "bg-red-500/50 text-red-200 cursor-not-allowed"
                          : "text-[#0A1A2F] hover:scale-105"
                      }`}
                      style={
                        !isOverMaxWin()
                          ? {
                              background: `linear-gradient(to right, ${accentColor}, ${secondaryColor || accentColor})`,
                            }
                          : {}
                      }
                    >
                      {isOverMaxWin() ? "LIMIT EXCEEDED" : "Generate BetID"}
                    </button>

                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-lg p-4">
                      <p className="text-amber-300 text-sm font-semibold mb-3 text-center">
                        Want to place bets online?
                      </p>
                      <button
                        onClick={() => (window.location.href = "/auth")}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                      >
                        Create Account
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showBookingCode && generatedBetId && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={() => setShowBookingCode(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
            <div
              className="bg-[#0A1A2F] border-2 rounded-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-300 relative"
              style={{ borderColor: accentColor }}
            >
              <button
                onClick={() => setShowBookingCode(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Receipt className="w-8 h-8" style={{ color: accentColor }} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Your Bet ID</h3>
                <p className="text-[#B8C5D6] text-sm mb-6">Take this BetID to any agent shop</p>

                <div className="bg-[#1A2F45] rounded-xl p-4 mb-4">
                  <p className="text-2xl font-mono font-bold" style={{ color: accentColor }}>
                    {generatedBetId}
                  </p>
                </div>

                <button
                  onClick={copyBetId}
                  className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 mb-6 transition-colors"
                  style={{
                    backgroundColor: copiedCode ? "#22C55E" : `${accentColor}30`,
                    color: copiedCode ? "white" : accentColor,
                  }}
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? "Copied!" : "Copy Bet ID"}
                </button>

                <div className="bg-[#1A2F45] rounded-xl p-4 text-left">
                  <h4 className="font-semibold mb-3" style={{ color: accentColor }}>
                    Bet Summary
                  </h4>
                  <div className="space-y-2">
                    {bets.map((bet) => (
                      <div key={bet.id} className="flex justify-between text-sm">
                        <div>
                          <p className="text-[#B8C5D6]">{bet.match}</p>
                          <p className="text-white">{bet.selection}</p>
                        </div>
                        <p className="font-medium" style={{ color: accentColor }}>
                          {bet.odds.toFixed(2)}
                        </p>
                      </div>
                    ))}
                    <div className="h-px bg-[#2A3F55] my-2" />
                    <div className="flex justify-between font-medium">
                      <span className="text-white">Total Stake</span>
                      <span style={{ color: accentColor }}>${calculateTotalStake().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-white">Potential Win</span>
                      <span className={isOverMaxWin() ? "text-red-400" : "text-green-400"}>
                        $
                        {getEnforcedPotentialWin().toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {isOverMaxWin() && " (capped)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
