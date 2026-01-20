"use client"
import { useState, useEffect } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { X, Plus, Minus, Trash2, Receipt, AlertCircle, AlertTriangle } from "lucide-react"

export function BetSlip({ isOpen, onClose }) {
  const [bets, setBets] = useState([
    {
      id: 1,
      match: "Brentford vs Man Utd",
      selection: "Man Utd to Win",
      odds: 2.5,
      stake: 100,
    },
    {
      id: 2,
      match: "Chelsea vs Brighton",
      selection: "Over 2.5 Goals",
      odds: 1.8,
      stake: 50,
    },
  ])

  const [betType, setBetType] = useState("single") // single, multiple, system
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [riskAlerts, setRiskAlerts] = useState([])
  const [financialSettings, setFinancialSettings] = useState({
    winLimit: { enabled: true, amount: 5000 },
    winTax: { enabled: true, percentage: 5 },
    tax: { enabled: true, percentage: 2 },
    charity: { enabled: true, percentage: 1 },
    cashback: { enabled: true, twoGameLoss: 5, threeGameLoss: 8 },
  })
  const [slip, setSlip] = useState(null)
  const [slipCreatedTime, setSlipCreatedTime] = useState(null)
  const [canDeleteSlip, setCanDeleteSlip] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("financialSettings")
    if (saved) setFinancialSettings(JSON.parse(saved))

    const savedSlip = localStorage.getItem("currentSlip")
    if (savedSlip) {
      const slipData = JSON.parse(savedSlip)
      setSlip(slipData)
      setSlipCreatedTime(slipData.createdAt)
      checkSlipDeletionWindow(slipData.createdAt)
    }
  }, [])

  useEffect(() => {
    const alerts = []

    // Create a unique pattern for the current slip
    const currentSlipPattern = bets
      .map((b) => `${b.match}-${b.selection}`)
      .sort()
      .join("|")

    if (currentSlipPattern) {
      // Get all previous slips from history
      const slipHistory = JSON.parse(localStorage.getItem("slipHistory") || "[]")

      // Count how many times this exact pattern has been played
      const duplicateCount = slipHistory.filter((prevSlip) => {
        const prevPattern = prevSlip.pattern || ""
        return prevPattern === currentSlipPattern
      }).length

      if (duplicateCount >= 3) {
        alerts.push({
          type: "critical",
          icon: AlertTriangle,
          message: `⚠️ RISK ALERT: This exact slip combination has been played ${duplicateCount} times! Consider changing your selections to improve your odds.`,
          severity: "error",
        })
      } else if (duplicateCount >= 1) {
        alerts.push({
          type: "warning",
          icon: AlertCircle,
          message: `ℹ️ Pattern Alert: This slip has been played ${duplicateCount} time(s) before.`,
          severity: "warning",
        })
      }
    }

    setRiskAlerts(alerts)
  }, [bets])

  const checkSlipDeletionWindow = (createdTime) => {
    if (!createdTime) return
    const timeDiff = (Date.now() - createdTime) / 1000 / 60 // in minutes
    setCanDeleteSlip(timeDiff < 4)
  }

  const deleteSlip = () => {
    if (canDeleteSlip) {
      const allBets = JSON.parse(localStorage.getItem("allBets") || "[]")
      const updatedBets = allBets.filter((bet) => bet.id !== slip.id)
      localStorage.setItem("allBets", JSON.stringify(updatedBets))
      localStorage.removeItem("currentSlip")
      alert("Slip deleted successfully!")
      clearAll()
    }
  }

  const updateStake = (id, newStake) => {
    setBets(bets.map((bet) => (bet.id === id ? { ...bet, stake: Math.max(0, newStake) } : bet)))
  }

  const removeBet = (id) => {
    setBets(bets.filter((bet) => bet.id !== id))
  }

  const clearAll = () => {
    setBets([])
  }

  const calculateTotalOdds = () => {
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + bet.odds, 0)
    } else {
      return bets.reduce((product, bet) => product * bet.odds, 1)
    }
  }

  const calculateTotalStake = () => {
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + bet.stake, 0)
    } else {
      return Math.min(...bets.map((bet) => bet.stake))
    }
  }

  const calculatePotentialWin = () => {
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + bet.stake * bet.odds, 0)
    } else {
      const minStake = Math.min(...bets.map((bet) => bet.stake))
      const totalOdds = bets.reduce((product, bet) => product * bet.odds, 1)
      return minStake * totalOdds
    }
  }

  const placeBet = () => {
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

    setShowConfirmation(true)
    setTimeout(() => {
      setShowConfirmation(false)
      clearAll()
      onClose()
    }, 2000)
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
              <h2 className="text-xl font-bold">Bet Slip</h2>
              <span className="px-2 py-1 bg-[#FFD700] text-[#0A1A2F] rounded-full text-xs font-bold">
                {bets.length}
              </span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Bet Type Selector */}
          <div className="flex gap-2 mb-6">
            {["single", "multiple", "system"].map((type) => (
              <button
                key={type}
                onClick={() => setBetType(type)}
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                  betType === type ? "bg-[#FFD700] text-[#0A1A2F]" : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Risk Alerts - Display at top when present */}
          {riskAlerts.length > 0 && (
            <div className="mb-6 space-y-3">
              {riskAlerts.map((alert, index) => {
                const Icon = alert.icon
                const isError = alert.severity === "error"
                const bgColor = isError ? "bg-red-500/10" : "bg-orange-500/10"
                const borderColor = isError ? "border-red-500/30" : "border-orange-500/30"
                const textColor = isError ? "text-red-400" : "text-orange-400"

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-4 ${bgColor} border ${borderColor} rounded-lg animate-pulse`}
                  >
                    <Icon className={`w-6 h-6 ${textColor} flex-shrink-0 mt-0.5`} />
                    <p className={`text-sm font-semibold ${textColor}`}>{alert.message}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bets List */}
          {bets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#1A2F45] rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-[#B8C5D6]" />
              </div>
              <p className="text-[#B8C5D6] mb-2">Your bet slip is empty</p>
              <p className="text-sm text-[#B8C5D6]/60">Add selections to start betting</p>
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
                  Please check your selections carefully before placing your bet. All bets are final.
                </p>
              </div>

              {/* Place Bet Button */}
              <AnimatedButton
                variant="primary"
                className="w-full bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90 font-bold py-4"
                onClick={placeBet}
              >
                Place Bet - $ {calculateTotalStake().toFixed(2)}
              </AnimatedButton>

              {/* Delete Slip Button for Agents */}
              {canDeleteSlip && (
                <button
                  onClick={deleteSlip}
                  className="w-full py-2 mt-6 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Slip (Expires soon)
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0A1A2F] border-2 border-[#FFD700] rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Bet Placed Successfully!</h3>
            <p className="text-[#B8C5D6]">Your bet has been confirmed</p>
            <p className="text-sm text-[#B8C5D6] mt-2">Good luck!</p>
          </div>
        </div>
      )}
    </>
  )
}
