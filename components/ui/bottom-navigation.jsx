"use client"
import { useState, useEffect } from "react"
import {
  Home,
  Gamepad2,
  ShoppingBag,
  Menu,
  Receipt,
  X,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  AlertTriangle,
  LogIn,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { useAuth } from "@/hooks/useAuth"
import { useBetState } from "@/lib/bet-state"
import { useLanguage } from "@/lib/i18n/language-context"
import { getAuthToken } from "@/lib/auth-service"
import BetSuccessModal from "@/components/ui/bet-success-modal"
import { useThemeColors } from "@/hooks/useThemeColors"

const MAX_WIN_LIMIT = 500000

const BottomNavigation = ({ activeTab }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { primaryColor, secondaryColor } = useTenant()
  const { isAuthenticated, user } = useAuth()
  const { bets, addBet, removeBet, updateStake, clearBets } = useBetState()
  const { t, locale } = useLanguage()
  const { colors, currentTheme } = useThemeColors()

  const accentColor = colors.accent || primaryColor || "#FFD700"
  const accentColorRgb = "255, 215, 0"

  // Betslip state
  const [isExpanded, setIsExpanded] = useState(false)
  const [betType, setBetType] = useState("single")
  const [showBookingCode, setShowBookingCode] = useState(false)
  const [bookingCode, setBookingCode] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [generatedBetId, setGeneratedBetId] = useState("")
  const [animatingBetId, setAnimatingBetId] = useState(null)
  const [betPlaced, setBetPlaced] = useState(false)
  const [riskAlerts, setRiskAlerts] = useState([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successBetData, setSuccessBetData] = useState(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [loginPromptMessage, setLoginPromptMessage] = useState("")

  // Listen for bet additions
  useEffect(() => {
    const handleAddBet = (event) => {
      const newBet = event.detail
      const exists = bets.some((bet) => bet.id === newBet.id)
      if (!exists) {
        addBet(newBet)
        setAnimatingBetId(newBet.id)
        setTimeout(() => setAnimatingBetId(null), 500)
        if (!isExpanded) {
          setIsExpanded(true)
        }
      }
    }

    window.addEventListener("addGuestBet", handleAddBet)
    window.addEventListener("addBet", handleAddBet)
    return () => {
      window.removeEventListener("addGuestBet", handleAddBet)
      window.removeEventListener("addBet", handleAddBet)
    }
  }, [isExpanded, bets, addBet])

  // Risk alerts
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
      const duplicateCount = slipHistory.filter((prevSlip) => prevSlip.pattern === currentSlipPattern).length

      if (duplicateCount >= 3) {
        alerts.push({
          type: "critical",
          icon: AlertTriangle,
          message: `This exact slip has been played ${duplicateCount} times!`,
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

  const handleUpdateStake = (id, newStake) => {
    updateStake(id, Math.max(0, newStake))
  }

  const handleRemoveBet = (id) => {
    removeBet(id)
  }

  const handleClearAll = () => {
    clearBets()
    setShowBookingCode(false)
    setGeneratedBetId("")
  }

  const calculateTotalOdds = () => {
    if (bets.length === 0) return 0
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + (bet.odds || 0), 0)
    }
    return bets.reduce((product, bet) => product * (bet.odds || 1), 1)
  }

  const calculateTotalStake = () => {
    if (bets.length === 0) return 0
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + (bet.stake || 0), 0)
    }
    return Math.min(...bets.map((bet) => bet.stake || 0))
  }

  const calculatePotentialWin = () => {
    if (bets.length === 0) return 0
    if (betType === "single") {
      return bets.reduce((sum, bet) => sum + (bet.stake || 0) * (bet.odds || 0), 0)
    }
    const minStake = Math.min(...bets.map((bet) => bet.stake || 0))
    const totalOdds = bets.reduce((product, bet) => product * (bet.odds || 1), 1)
    return minStake * totalOdds
  }

  const isOverMaxWin = () => calculatePotentialWin() > MAX_WIN_LIMIT
  const getMaxAllowedStake = () => {
    const totalOdds = calculateTotalOdds()
    if (totalOdds <= 0) return 0
    return Math.floor(MAX_WIN_LIMIT / totalOdds)
  }

  const handlePlaceBet = async () => {
    if (bets.length === 0) {
      alert(t("noBetsSelected"))
      return
    }

    if (isOverMaxWin()) {
      alert(`Maximum winning limit is $${MAX_WIN_LIMIT.toLocaleString()}. Please reduce your stake.`)
      return
    }

    const slipPattern = bets
      .map((b) => `${b.match}-${b.selection}`)
      .sort()
      .join("|")
    const slipHistory = JSON.parse(localStorage.getItem("slipHistory") || "[]")
    slipHistory.push({ pattern: slipPattern, timestamp: Date.now(), bets, betType })
    localStorage.setItem("slipHistory", JSON.stringify(slipHistory))

    setBetPlaced(true)
    try {
      const token = getAuthToken()
      const response = await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          betType,
          selections: bets,
          stake: calculateTotalStake(),
          totalOdds: calculateTotalOdds(),
          potentialWin: calculatePotentialWin(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccessBetData({
          betId: data.data?.betId || data.betId || `BET-${Date.now()}`,
          stake: calculateTotalStake(),
          odds: calculateTotalOdds(),
          potentialWin: calculatePotentialWin(),
          selections: bets.length,
        })
        setShowSuccessModal(true)
        handleClearAll()
        setIsExpanded(false)
      } else {
        const data = await response.json()
        alert(data.details ? data.details.join(". ") : data.error || t("betFailed"))
      }
    } catch (error) {
      console.error("Bet placement error:", error)
      alert(t("betFailed"))
    }
    setBetPlaced(false)
  }

  const generateBetId = async () => {
    if (bets.length === 0) {
      alert("No bets to generate BetID for")
      return
    }

    try {
      const response = await fetch("/api/guest/betslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "default",
          slip: {
            legs: bets.map((bet) => ({
              match: bet.match,
              matchName: bet.match,
              selection: bet.selection,
              odds: bet.odds,
              stake: bet.stake,
            })),
            totalOdds: calculateTotalOdds(),
            stake: calculateTotalStake(),
            potentialWin: calculatePotentialWin(),
            estimatedPayout: calculatePotentialWin(),
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedBetId(result.data.betId)
        setShowBookingCode(true)
      } else {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let code = "GB-"
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setGeneratedBetId(code)
        setShowBookingCode(true)
      }
    } catch (error) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let code = "GB-"
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      setGeneratedBetId(code)
      setShowBookingCode(true)
    }
  }

  const copyBetId = () => {
    navigator.clipboard.writeText(generatedBetId)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const loadBookingCode = () => {
    if (bookingCode.trim()) {
      addBet({ id: "loaded-1", match: "Arsenal vs Chelsea", selection: "Arsenal Win", odds: 2.1, stake: 50 })
      addBet({ id: "loaded-2", match: "Liverpool vs Man City", selection: "Over 2.5", odds: 1.85, stake: 50 })
      setBookingCode("")
    }
  }

  const handleRestrictedAction = (action) => {
    if (!isAuthenticated) {
      setLoginPromptMessage(`Please login or register to access ${action}`)
      setShowLoginPrompt(true)
      return true // Action was restricted
    }
    return false // Action allowed
  }

  const currentTab =
    activeTab ||
    (() => {
      if (pathname === "/" || pathname === "/p/dashboard") return "home"
      if (pathname.includes("/casino")) return "casino"
      if (pathname.includes("/shop")) return "shop"
      if (pathname.includes("/menu")) return "menu"
      return "home"
    })()

  const tabs = [
    { id: "home", icon: Home, label: t("sports"), href: "/" },
    { id: "casino", icon: Gamepad2, label: t("casino"), href: "/casino" },
    { id: "shop", icon: ShoppingBag, label: t("shop"), href: "/shop", requiresAuth: true },
    { id: "betslip", icon: Receipt, label: t("betslip"), onClick: true },
    { id: "menu", icon: Menu, label: t("menu"), href: "/menu" },
  ]

  const handleTabClick = (tab) => {
    if (tab.onClick) {
      setIsExpanded(!isExpanded)
      return
    }

    if (tab.requiresAuth && !isAuthenticated) {
      handleRestrictedAction(tab.label)
      return
    }

    router.push(tab.href)
  }

  const getNavStyles = () => {
    if (currentTheme === "modern") {
      return {
        nav: "bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg",
        activeColor: "text-violet-600",
        inactiveColor: "text-gray-400",
        badge: "bg-violet-600 text-white",
        indicator: "bg-violet-600",
      }
    }
    if (currentTheme === "neon") {
      return {
        nav: "bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/30",
        activeColor: "text-cyan-400",
        inactiveColor: "text-gray-500",
        badge: "bg-gradient-to-r from-cyan-500 to-purple-500 text-white",
        indicator: "bg-cyan-400 shadow-lg shadow-cyan-500/50",
      }
    }
    // Classic
    return {
      nav: "bg-[#0A1A2F]/95 backdrop-blur-sm border-t border-[#2A3F55]",
      activeColor: "",
      inactiveColor: "text-[#B8C5D6]",
      badge: "",
      indicator: "",
    }
  }

  const styles = getNavStyles()

  return (
    <>
      <BetSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} betData={successBetData} />

      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl p-6 ${
              currentTheme === "modern"
                ? "bg-white"
                : currentTheme === "neon"
                  ? "bg-slate-900 border border-cyan-500/30"
                  : "bg-[#0A1A2F] border border-[#2A3F55]"
            }`}
          >
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  currentTheme === "modern"
                    ? "bg-violet-100"
                    : currentTheme === "neon"
                      ? "bg-cyan-500/20"
                      : "bg-[#FFD700]/20"
                }`}
              >
                <LogIn
                  className={`w-8 h-8 ${
                    currentTheme === "modern"
                      ? "text-violet-600"
                      : currentTheme === "neon"
                        ? "text-cyan-400"
                        : "text-[#FFD700]"
                  }`}
                />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${currentTheme === "modern" ? "text-gray-900" : "text-white"}`}>
                Login Required
              </h3>
              <p
                className={`text-sm ${
                  currentTheme === "modern"
                    ? "text-gray-500"
                    : currentTheme === "neon"
                      ? "text-cyan-400/70"
                      : "text-[#B8C5D6]"
                }`}
              >
                {loginPromptMessage}
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth"
                onClick={() => setShowLoginPrompt(false)}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  currentTheme === "modern"
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : currentTheme === "neon"
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90"
                      : "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1A2F] hover:opacity-90"
                }`}
              >
                <LogIn className="w-5 h-5" />
                Login
              </Link>

              <Link
                href="/auth?mode=register"
                onClick={() => setShowLoginPrompt(false)}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${
                  currentTheme === "modern"
                    ? "border-violet-600 text-violet-600 hover:bg-violet-50"
                    : currentTheme === "neon"
                      ? "border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                      : "border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/10"
                }`}
              >
                <UserPlus className="w-5 h-5" />
                Register
              </Link>

              <button
                onClick={() => setShowLoginPrompt(false)}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  currentTheme === "modern"
                    ? "text-gray-500 hover:bg-gray-100"
                    : currentTheme === "neon"
                      ? "text-gray-500 hover:bg-slate-800"
                      : "text-[#B8C5D6] hover:bg-[#1A2F45]"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Betslip Panel */}
      {isExpanded && (
        <div
          className={`fixed bottom-[60px] left-0 right-0 max-h-[70vh] z-[55] border-t shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 ${
            currentTheme === "modern"
              ? "bg-white border-gray-200"
              : currentTheme === "neon"
                ? "bg-slate-900 border-cyan-500/30"
                : "bg-[#0A1A2F]"
          }`}
          style={{ borderColor: currentTheme === "classic" ? `rgba(${accentColorRgb}, 0.3)` : undefined }}
        >
          {/* Header */}
          <div
            className="p-3"
            style={{
              background:
                currentTheme === "modern"
                  ? "linear-gradient(to right, #7c3aed, #a855f7)"
                  : currentTheme === "neon"
                    ? "linear-gradient(to right, #06b6d4, #a855f7)"
                    : `linear-gradient(to right, ${accentColor}, ${secondaryColor || accentColor})`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt
                  className={`w-5 h-5 ${currentTheme === "modern" ? "text-white" : currentTheme === "neon" ? "text-white" : "text-[#0A1A2F]"}`}
                />
                <h2
                  className={`text-lg font-bold ${currentTheme === "modern" || currentTheme === "neon" ? "text-white" : "text-[#0A1A2F]"}`}
                >
                  {currentTheme === "neon" ? "BETSLIP" : t("betslip")}
                </h2>
                {bets.length > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      currentTheme === "modern"
                        ? "bg-white text-violet-600"
                        : currentTheme === "neon"
                          ? "bg-slate-900 text-cyan-400 font-mono"
                          : "bg-[#0A1A2F]"
                    }`}
                    style={{ color: currentTheme === "classic" ? accentColor : undefined }}
                  >
                    {bets.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  currentTheme === "modern"
                    ? "bg-white/20 hover:bg-white/40"
                    : currentTheme === "neon"
                      ? "bg-slate-800/50 hover:bg-slate-800"
                      : "bg-[#0A1A2F]/20 hover:bg-[#0A1A2F]/40"
                }`}
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-3">
            {/* Bet Type Tabs */}
            <div
              className={`flex gap-2 mb-3 border-b ${currentTheme === "modern" ? "border-gray-200" : currentTheme === "neon" ? "border-cyan-500/20" : "border-[#2A3F55]"}`}
            >
              {["single", "multiple"].map((type) => (
                <button
                  key={type}
                  onClick={() => setBetType(type)}
                  className={`flex-1 py-2 font-medium text-sm transition-colors relative ${
                    currentTheme === "modern"
                      ? betType === type
                        ? "text-violet-600"
                        : "text-gray-400"
                      : currentTheme === "neon"
                        ? betType === type
                          ? "text-cyan-400 font-mono"
                          : "text-gray-500 font-mono"
                        : betType === type
                          ? ""
                          : "text-[#B8C5D6]"
                  }`}
                  style={{ color: currentTheme === "classic" && betType === type ? accentColor : undefined }}
                >
                  {currentTheme === "neon"
                    ? type === "single"
                      ? "SINGLE"
                      : "ACCUMULATOR"
                    : type === "single"
                      ? t("single")
                      : t("accumulator")}
                  {betType === type && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{
                        backgroundColor:
                          currentTheme === "modern" ? "#7c3aed" : currentTheme === "neon" ? "#06b6d4" : accentColor,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Bets List or Empty State */}
            {bets.length === 0 ? (
              <div
                className={`rounded-xl p-4 ${
                  currentTheme === "modern"
                    ? "bg-gray-50 border border-gray-200"
                    : currentTheme === "neon"
                      ? "bg-slate-800/50 border border-cyan-500/20"
                      : "bg-[#1A2F45]/50 border border-[#2A3F55]"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                      currentTheme === "modern"
                        ? "bg-gray-200"
                        : currentTheme === "neon"
                          ? "bg-slate-700"
                          : "bg-[#0A1A2F]"
                    }`}
                  >
                    <Receipt
                      className={`w-6 h-6 ${currentTheme === "modern" ? "text-gray-400" : currentTheme === "neon" ? "text-cyan-500/50" : "text-[#B8C5D6]"}`}
                    />
                  </div>
                  <p
                    className={`mb-3 text-sm ${currentTheme === "modern" ? "text-gray-500" : currentTheme === "neon" ? "text-cyan-400/60 font-mono" : "text-[#B8C5D6]"}`}
                  >
                    {currentTheme === "neon" ? "// CLICK ODDS TO ADD" : t("clickOddsToAdd")}
                  </p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={currentTheme === "neon" ? "BOOKING_CODE..." : t("bookingCode")}
                      value={bookingCode}
                      onChange={(e) => setBookingCode(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none ${
                        currentTheme === "modern"
                          ? "bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500"
                          : currentTheme === "neon"
                            ? "bg-slate-900 border border-cyan-500/30 text-cyan-400 placeholder-cyan-700 font-mono"
                            : "bg-[#0A1A2F] border border-[#2A3F55] text-[#F5F5F5] placeholder-[#B8C5D6]/50"
                      }`}
                    />
                    <button
                      onClick={loadBookingCode}
                      className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                        currentTheme === "modern"
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : currentTheme === "neon"
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 font-mono"
                            : "bg-[#2A3F55] text-[#B8C5D6] hover:bg-[#3A4F65]"
                      }`}
                    >
                      {currentTheme === "neon" ? "LOAD" : t("load")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className={`p-3 rounded-xl transition-all duration-500 ${animatingBetId === bet.id ? "animate-in slide-in-from-right" : ""} ${
                        currentTheme === "modern"
                          ? "bg-gray-50 border border-gray-200"
                          : currentTheme === "neon"
                            ? "bg-slate-800/50 border border-cyan-500/20"
                            : "bg-[#1A2F45] border border-[#2A3F55]"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div
                            className={`text-xs mb-0.5 ${currentTheme === "modern" ? "text-gray-500" : currentTheme === "neon" ? "text-cyan-400/60 font-mono" : "text-[#B8C5D6]"}`}
                          >
                            {bet.match}
                          </div>
                          <div
                            className={`font-medium text-sm ${currentTheme === "modern" ? "text-gray-900" : currentTheme === "neon" ? "text-white" : ""}`}
                          >
                            {bet.selection}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveBet(bet.id)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStake(bet.id, (bet.stake || 0) - 10)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                              currentTheme === "modern"
                                ? "bg-gray-200 hover:bg-gray-300"
                                : currentTheme === "neon"
                                  ? "bg-slate-700 hover:bg-slate-600"
                                  : "bg-[#0A1A2F] hover:bg-[#2A3F55]"
                            }`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={bet.stake || 0}
                            onChange={(e) => handleUpdateStake(bet.id, Number.parseInt(e.target.value) || 0)}
                            className={`w-14 px-2 py-1 rounded text-center text-sm focus:outline-none ${
                              currentTheme === "modern"
                                ? "bg-white border border-violet-300 text-gray-900"
                                : currentTheme === "neon"
                                  ? "bg-slate-900 border border-cyan-500/50 text-cyan-400 font-mono"
                                  : "bg-[#0A1A2F] border text-white"
                            }`}
                            style={{ borderColor: currentTheme === "classic" ? accentColor : undefined }}
                          />
                          <button
                            onClick={() => handleUpdateStake(bet.id, (bet.stake || 0) + 10)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                              currentTheme === "modern"
                                ? "bg-gray-200 hover:bg-gray-300"
                                : currentTheme === "neon"
                                  ? "bg-slate-700 hover:bg-slate-600"
                                  : "bg-[#0A1A2F] hover:bg-[#2A3F55]"
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-xs ${currentTheme === "modern" ? "text-gray-500" : currentTheme === "neon" ? "text-gray-500 font-mono" : "text-[#B8C5D6]"}`}
                          >
                            {currentTheme === "neon" ? "ODDS" : t("odds")}
                          </div>
                          <div
                            className={`font-bold text-sm ${currentTheme === "modern" ? "text-violet-600" : currentTheme === "neon" ? "text-cyan-400 font-mono" : ""}`}
                            style={{ color: currentTheme === "classic" ? accentColor : undefined }}
                          >
                            {(bet.odds || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clear All */}
                <button
                  onClick={handleClearAll}
                  className={`w-full py-2 mb-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors ${
                    currentTheme === "neon"
                      ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 font-mono"
                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  {currentTheme === "neon" ? "CLEAR_ALL" : t("clearAll")}
                </button>

                {/* Summary */}
                <div
                  className={`p-3 rounded-xl mb-3 ${
                    currentTheme === "modern"
                      ? "bg-violet-50 border border-violet-200"
                      : currentTheme === "neon"
                        ? "bg-slate-800/50 border border-cyan-500/20"
                        : "bg-[#1A2F45] border border-[#2A3F55]"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={
                          currentTheme === "modern"
                            ? "text-gray-600"
                            : currentTheme === "neon"
                              ? "text-gray-400 font-mono"
                              : "text-[#B8C5D6]"
                        }
                      >
                        {currentTheme === "neon" ? "SELECTIONS" : t("selections")}
                      </span>
                      <span className={`font-bold ${currentTheme === "neon" ? "font-mono" : ""}`}>{bets.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={
                          currentTheme === "modern"
                            ? "text-gray-600"
                            : currentTheme === "neon"
                              ? "text-gray-400 font-mono"
                              : "text-[#B8C5D6]"
                        }
                      >
                        {currentTheme === "neon" ? "TOTAL_ODDS" : t("totalOdds")}
                      </span>
                      <span
                        className={`font-bold ${currentTheme === "modern" ? "text-violet-600" : currentTheme === "neon" ? "text-cyan-400 font-mono" : ""}`}
                        style={{ color: currentTheme === "classic" ? accentColor : undefined }}
                      >
                        {calculateTotalOdds().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={
                          currentTheme === "modern"
                            ? "text-gray-600"
                            : currentTheme === "neon"
                              ? "text-gray-400 font-mono"
                              : "text-[#B8C5D6]"
                        }
                      >
                        {currentTheme === "neon" ? "TOTAL_STAKE" : t("totalStake")}
                      </span>
                      <span className={`font-bold ${currentTheme === "neon" ? "font-mono" : ""}`}>
                        $ {calculateTotalStake().toFixed(2)}
                      </span>
                    </div>
                    <div
                      className={`h-px ${currentTheme === "modern" ? "bg-violet-200" : currentTheme === "neon" ? "bg-cyan-500/20" : "bg-[#2A3F55]"}`}
                    />
                    <div className="flex items-center justify-between">
                      <span className={`font-medium text-sm ${currentTheme === "neon" ? "font-mono" : ""}`}>
                        {currentTheme === "neon" ? "POTENTIAL_WIN" : t("potentialWin")}
                      </span>
                      <span
                        className={`font-bold ${isOverMaxWin() ? "text-red-500" : "text-green-400"} ${currentTheme === "neon" ? "font-mono" : ""}`}
                      >
                        $ {calculatePotentialWin().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Place Bet Buttons */}
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={handlePlaceBet}
                      disabled={betPlaced || isOverMaxWin()}
                      className={`w-full font-bold py-2.5 rounded-lg transition-all duration-300 hover:scale-[1.02] mb-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentTheme === "neon" ? "font-mono" : ""
                      }`}
                      style={{
                        background: isOverMaxWin()
                          ? "linear-gradient(to right, #EF4444, #DC2626)"
                          : "linear-gradient(to right, #22C55E, #16A34A)",
                        color: "white",
                      }}
                    >
                      {betPlaced
                        ? currentTheme === "neon"
                          ? "PROCESSING..."
                          : t("loading")
                        : isOverMaxWin()
                          ? "LIMIT EXCEEDED"
                          : currentTheme === "neon"
                            ? `PLACE_BET - $${calculateTotalStake().toFixed(2)}`
                            : `${t("placeBet")} - $${calculateTotalStake().toFixed(2)}`}
                    </button>
                    <button
                      onClick={generateBetId}
                      className={`w-full font-bold py-2.5 rounded-lg transition-all duration-300 hover:opacity-90 ${currentTheme === "neon" ? "font-mono" : ""}`}
                      style={{
                        background:
                          currentTheme === "modern"
                            ? "linear-gradient(to right, #7c3aed, #a855f7)"
                            : currentTheme === "neon"
                              ? "linear-gradient(to right, #06b6d4, #a855f7)"
                              : `linear-gradient(to right, ${accentColor}, ${secondaryColor || accentColor})`,
                        color: currentTheme === "modern" || currentTheme === "neon" ? "white" : "#0A1A2F",
                      }}
                    >
                      {currentTheme === "neon" ? "GENERATE_BET_ID" : t("betIdForAgent")}
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className={`flex items-start gap-2 p-2 rounded-lg mb-3 ${
                        currentTheme === "neon"
                          ? "bg-orange-500/10 border border-orange-500/30"
                          : "bg-orange-500/10 border border-orange-500/30"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className={`text-xs text-orange-400 ${currentTheme === "neon" ? "font-mono" : ""}`}>
                        {currentTheme === "neon"
                          ? "// GENERATE BET_ID FOR AGENT SHOP"
                          : "Generate a BetID to place this bet at any agent shop."}
                      </p>
                    </div>
                    <button
                      onClick={generateBetId}
                      className={`w-full font-bold py-2.5 rounded-lg transition-all duration-300 hover:scale-[1.02] mb-2 ${currentTheme === "neon" ? "font-mono" : ""}`}
                      style={{
                        background:
                          currentTheme === "modern"
                            ? "linear-gradient(to right, #7c3aed, #a855f7)"
                            : currentTheme === "neon"
                              ? "linear-gradient(to right, #06b6d4, #a855f7)"
                              : `linear-gradient(to right, ${accentColor}, ${secondaryColor || accentColor})`,
                        color: currentTheme === "modern" || currentTheme === "neon" ? "white" : "#0A1A2F",
                      }}
                    >
                      {currentTheme === "neon" ? "GENERATE_BET_ID" : t("generateBetId")}
                    </button>
                    <button
                      onClick={() => (window.location.href = "/auth")}
                      className={`w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2 rounded-lg text-sm ${currentTheme === "neon" ? "font-mono" : ""}`}
                    >
                      {currentTheme === "neon" ? "CREATE_ACCOUNT" : t("createAccount")}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 h-[60px] z-50 ${styles.nav}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-full w-full px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === currentTab || (tab.id === "betslip" && isExpanded)
            const hasBets = tab.id === "betslip" && bets.length > 0
            const isRestricted = tab.requiresAuth && !isAuthenticated

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  isActive
                    ? currentTheme === "classic"
                      ? ""
                      : styles.activeColor
                    : isRestricted
                      ? "opacity-50"
                      : styles.inactiveColor
                } ${!isActive && !isRestricted ? "hover:opacity-80" : ""}`}
                style={{
                  color: isActive && currentTheme === "classic" ? accentColor : undefined,
                }}
              >
                {isActive && currentTheme !== "classic" && (
                  <div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full ${styles.indicator}`}
                  />
                )}
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                  {hasBets && (
                    <span
                      className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${styles.badge}`}
                      style={{
                        backgroundColor: currentTheme === "classic" ? accentColor : undefined,
                        color: currentTheme === "classic" ? "#0A1A2F" : undefined,
                      }}
                    >
                      {bets.length}
                    </span>
                  )}
                  {isRestricted && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white">!</span>
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? "opacity-100" : "opacity-70"}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* BetID Modal */}
      {showBookingCode && generatedBetId && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={() => setShowBookingCode(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
            <div
              className={`rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-300 relative ${
                currentTheme === "modern"
                  ? "bg-white border-2 border-violet-500"
                  : currentTheme === "neon"
                    ? "bg-slate-900 border-2 border-cyan-500"
                    : "bg-[#0A1A2F] border-2"
              }`}
              style={{ borderColor: currentTheme === "classic" ? accentColor : undefined }}
            >
              <button
                onClick={() => setShowBookingCode(false)}
                className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
                  currentTheme === "modern" ? "hover:bg-gray-100" : "hover:bg-white/10"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    backgroundColor:
                      currentTheme === "modern" ? "#7c3aed" : currentTheme === "neon" ? "#06b6d4" : accentColor,
                  }}
                >
                  <Receipt
                    className={`w-7 h-7 ${currentTheme === "modern" || currentTheme === "neon" ? "text-white" : "text-[#0A1A2F]"}`}
                  />
                </div>
                <h3 className={`text-lg font-bold mb-1 ${currentTheme === "neon" ? "font-mono text-cyan-400" : ""}`}>
                  {currentTheme === "neon" ? "YOUR_BET_ID" : t("yourBetId")}
                </h3>
                <p
                  className={`text-sm mb-4 ${currentTheme === "modern" ? "text-gray-500" : currentTheme === "neon" ? "text-cyan-400/60 font-mono" : "text-[#B8C5D6]"}`}
                >
                  {currentTheme === "neon" ? "// TAKE THIS TO ANY AGENT SHOP" : "Take this BetID to any agent shop"}
                </p>
                <div
                  className={`rounded-xl p-4 mb-4 ${
                    currentTheme === "modern"
                      ? "bg-violet-50 border border-violet-200"
                      : currentTheme === "neon"
                        ? "bg-slate-800 border border-cyan-500/30"
                        : "bg-[#1A2F45] border border-[#2A3F55]"
                  }`}
                >
                  <code
                    className={`text-xl font-bold tracking-wider ${currentTheme === "neon" ? "font-mono" : "font-mono"}`}
                    style={{
                      color: currentTheme === "modern" ? "#7c3aed" : currentTheme === "neon" ? "#06b6d4" : accentColor,
                    }}
                  >
                    {generatedBetId}
                  </code>
                </div>
                <button
                  onClick={copyBetId}
                  className={`w-full py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${currentTheme === "neon" ? "font-mono" : ""}`}
                  style={{
                    background: copiedCode
                      ? "#22C55E"
                      : currentTheme === "modern"
                        ? "linear-gradient(to right, #7c3aed, #a855f7)"
                        : currentTheme === "neon"
                          ? "linear-gradient(to right, #06b6d4, #a855f7)"
                          : `linear-gradient(to right, ${accentColor}, ${secondaryColor || accentColor})`,
                    color: currentTheme === "modern" || currentTheme === "neon" ? "white" : "#0A1A2F",
                  }}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-5 h-5" />
                      {currentTheme === "neon" ? "COPIED!" : t("copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      {currentTheme === "neon" ? "COPY_BET_ID" : t("copyBetId")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export { BottomNavigation }
export default BottomNavigation
