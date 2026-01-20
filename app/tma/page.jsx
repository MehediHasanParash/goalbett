"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Wallet,
  History,
  Share2,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Gift,
  Users,
  Target,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { WinCardGenerator } from "@/components/player/win-card-generator"

function getTeamName(team) {
  if (!team) return "Unknown"
  if (typeof team === "string") return team
  if (typeof team === "object" && team.name) return team.name
  return "Unknown"
}

function getTeamScore(event, team) {
  if (event?.score) {
    return team === "home" ? event.score.home || 0 : event.score.away || 0
  }
  if (event?.result) {
    return team === "home" ? event.result.homeScore || 0 : event.result.awayScore || 0
  }
  // Check if score is stored in team object
  const teamObj = team === "home" ? event?.homeTeam : event?.awayTeam
  if (typeof teamObj === "object" && teamObj?.score !== null && teamObj?.score !== undefined) {
    return teamObj.score
  }
  return 0
}

// TMA Content Component that uses useSearchParams
function TMAContent() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get("token")
  const debugMode = searchParams.get("debug") === "true"

  const [user, setUser] = useState(null)
  const [balance, setBalance] = useState(0)
  const [events, setEvents] = useState([])
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("events")
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [betAmount, setBetAmount] = useState("")
  const [selectedOutcome, setSelectedOutcome] = useState(null)
  const [placingBet, setPlacingBet] = useState(false)
  const [showBetDialog, setShowBetDialog] = useState(false)
  const [showWinCard, setShowWinCard] = useState(false)
  const [lastWin, setLastWin] = useState(null)
  const [tg, setTg] = useState(null)
  const [isTelegram, setIsTelegram] = useState(false)
  const [authToken, setAuthToken] = useState(null)

  // Initialize Telegram WebApp
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if running inside Telegram
      if (window.Telegram?.WebApp) {
        const telegram = window.Telegram.WebApp
        telegram.ready()
        telegram.expand()
        setTg(telegram)
        setIsTelegram(true)

        // Set theme colors
        document.documentElement.style.setProperty("--tg-theme-bg-color", telegram.backgroundColor || "#1a1a2e")
        document.documentElement.style.setProperty("--tg-theme-text-color", telegram.textColor || "#ffffff")
      }
    }
  }, [])

  // Authenticate user
  useEffect(() => {
    async function authenticate() {
      try {
        setLoading(true)
        setError(null)

        // Get initData from Telegram or token from URL
        const initData = tg?.initData || ""
        const token = tokenFromUrl || ""

        console.log("[v0] TMA Auth - initData:", initData ? "present" : "empty", "token:", token ? "present" : "empty")

        if (!initData && !token && !debugMode) {
          // Not in Telegram and no token - show instructions
          setError("NOT_TELEGRAM")
          setLoading(false)
          return
        }

        if (debugMode && !initData && !token) {
          // Create demo session for testing
          setUser({
            id: "demo_user",
            username: "demo_tester",
            firstName: "Demo",
            tenantId: "default",
          })
          setBalance(100)
          setAuthToken("debug_mode")
          setLoading(false)
          return
        }

        const res = await fetch("/api/tma/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, token }),
        })

        const data = await res.json()
        console.log("[v0] TMA Auth response:", data)

        if (data.success) {
          setUser(data.user)
          setBalance(data.wallet?.balance || data.balance || 0)
          if (data.token) {
            setAuthToken(data.token)
            localStorage.setItem("tma_token", data.token)
          }
        } else {
          console.error("[v0] TMA Auth failed:", data.error)
          setError(data.error || "Authentication failed")
        }
      } catch (err) {
        console.error("[v0] TMA Auth error:", err)
        setError("Failed to connect to server")
      } finally {
        setLoading(false)
      }
    }

    // Wait a bit for Telegram SDK to load
    const timer = setTimeout(() => {
      authenticate()
    }, 300)

    return () => clearTimeout(timer)
  }, [tg, tokenFromUrl, debugMode])

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/sandbox/sports/events?status=all&limit=20")
      const data = await res.json()
      if (data.success) {
        setEvents(data.data || [])
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    }
  }, [])

  // Fetch bet history
  const fetchBets = useCallback(async () => {
    if (!user) return
    if (debugMode || authToken === "debug_mode") {
      setBets([])
      return
    }
    try {
      const token = authToken || localStorage.getItem("tma_token")
      if (!token || token === "null" || token === "debug_mode") {
        console.log("[v0] No valid token for bets API")
        return
      }
      const res = await fetch("/api/sandbox/sports/bets", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-tenant-id": user.tenantId || "default",
        },
      })
      const data = await res.json()
      if (data.success) {
        setBets(data.data || [])
        // Check for recent wins to show win card
        const recentWin = data.data?.find(
          (b) => b.status === "won" && new Date(b.settledAt) > new Date(Date.now() - 60000),
        )
        if (recentWin && !lastWin) {
          setLastWin(recentWin)
          setShowWinCard(true)
        }
      }
    } catch (err) {
      console.error("Failed to fetch bets:", err)
    }
  }, [user, lastWin, authToken, debugMode])

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!user) return
    if (debugMode || authToken === "debug_mode") {
      return
    }
    try {
      const token = authToken || localStorage.getItem("tma_token")
      if (!token || token === "null" || token === "debug_mode") {
        return
      }
      const res = await fetch("/api/user/wallet", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-tenant-id": user.tenantId || "default",
        },
      })
      const data = await res.json()
      if (data.success) {
        setBalance(data.balance || 0)
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err)
    }
  }, [user, authToken, debugMode])

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      fetchEvents()
      fetchBets()
      fetchBalance()

      // Auto refresh every 30 seconds
      const interval = setInterval(() => {
        fetchEvents()
        fetchBalance()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [user, fetchEvents, fetchBets, fetchBalance])

  // Haptic feedback
  const haptic = (type = "light") => {
    if (tg?.HapticFeedback) {
      if (type === "success") tg.HapticFeedback.notificationOccurred("success")
      else if (type === "error") tg.HapticFeedback.notificationOccurred("error")
      else if (type === "medium") tg.HapticFeedback.impactOccurred("medium")
      else tg.HapticFeedback.impactOccurred("light")
    }
  }

  // Place bet
  const placeBet = async () => {
    if (!selectedEvent || !selectedOutcome || !betAmount) return

    setPlacingBet(true)
    haptic("medium")

    try {
      const token = authToken || localStorage.getItem("tma_token")
      const res = await fetch("/api/sandbox/sports/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && token !== "null" && token !== "debug_mode" ? { Authorization: `Bearer ${token}` } : {}),
          "x-tenant-id": user?.tenantId || "default",
        },
        body: JSON.stringify({
          selections: [
            {
              eventId: selectedEvent._id,
              market: "match_winner",
              outcome: selectedOutcome.type,
              odds: selectedOutcome.odds,
              eventName: `${getTeamName(selectedEvent.homeTeam)} vs ${getTeamName(selectedEvent.awayTeam)}`,
            },
          ],
          stake: Number.parseFloat(betAmount),
          betType: "single",
          debug: debugMode || authToken === "debug_mode",
        }),
      })

      const data = await res.json()

      if (data.success) {
        haptic("success")
        setShowBetDialog(false)
        setBetAmount("")
        setSelectedEvent(null)
        setSelectedOutcome(null)
        if (data.data?.newBalance !== undefined) {
          setBalance(data.data.newBalance)
        } else {
          fetchBalance()
        }
        fetchBets()

        // Show success in Telegram or alert
        const winAmount = (Number.parseFloat(betAmount) * selectedOutcome.odds).toFixed(2)
        if (tg) {
          tg.showAlert(`Bet placed successfully! Potential win: $${winAmount}`)
        } else {
          alert(`Bet placed successfully! Potential win: $${winAmount}`)
        }
      } else {
        haptic("error")
        const errorMsg = data.error || "Failed to place bet"
        if (tg) {
          tg.showAlert(errorMsg)
        } else {
          alert(errorMsg)
        }
      }
    } catch (err) {
      console.error("[v0] Place bet error:", err)
      haptic("error")
      if (tg) {
        tg.showAlert("Failed to place bet")
      } else {
        alert("Failed to place bet")
      }
    } finally {
      setPlacingBet(false)
    }
  }

  // Quick bet amounts
  const quickAmounts = [5, 10, 25, 50, 100]

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-white/60">Connecting...</p>
        </div>
      </div>
    )
  }

  if (error === "NOT_TELEGRAM") {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "GoalBettBot"
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <Card className="bg-[#252547] border-yellow-500/20 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Open from Telegram</h2>
            <p className="text-white/60 mb-6">
              This app is designed to run inside Telegram. Please open it from the Telegram bot.
            </p>

            <div className="space-y-3">
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0088cc]/80 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.1.154.234.169.33.016.098.035.319.02.491z" />
                </svg>
                Open @{botUsername}
                <ExternalLink className="h-4 w-4" />
              </a>

              <p className="text-white/40 text-sm">
                Send <code className="bg-white/10 px-2 py-0.5 rounded">/start</code> to the bot
              </p>

              <div className="pt-4 border-t border-white/10">
                <p className="text-white/40 text-xs mb-2">Developer testing?</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white/60 bg-transparent"
                  onClick={() => {
                    window.location.href = "/tma?debug=true"
                  }}
                >
                  Enable Debug Mode
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <Card className="bg-[#252547] border-red-500/20">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-white font-bold mb-2">Connection Error</h2>
            <p className="text-white/60 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-yellow-500 text-black">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1a1a2e]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-black" />
            </div>
            <span className="font-bold">GoalBett</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#252547] rounded-full px-3 py-1.5 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-yellow-500" />
              <span className="font-bold text-yellow-500">${balance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      {user && (
        <div className="px-4 py-3">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Welcome back,</p>
                <p className="font-bold text-white">{user.username || user.firstName || "Player"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="w-full bg-[#252547] border border-white/10">
          <TabsTrigger
            value="events"
            className="flex-1 data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
          >
            <Target className="h-4 w-4 mr-1" />
            Events
          </TabsTrigger>
          <TabsTrigger value="live" className="flex-1 data-[state=active]:bg-red-500 data-[state=active]:text-white">
            <Zap className="h-4 w-4 mr-1" />
            Live
          </TabsTrigger>
          <TabsTrigger value="bets" className="flex-1 data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
            <History className="h-4 w-4 mr-1" />
            My Bets
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold">Upcoming Matches</h2>
            <Button variant="ghost" size="sm" onClick={fetchEvents} className="text-white/60">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {events.filter((e) => e.status === "upcoming").length === 0 ? (
            <Card className="bg-[#252547] border-white/10">
              <CardContent className="py-8 text-center">
                <Clock className="h-8 w-8 text-white/40 mx-auto mb-2" />
                <p className="text-white/60">No upcoming events</p>
              </CardContent>
            </Card>
          ) : (
            events
              .filter((e) => e.status === "upcoming")
              .slice(0, 10)
              .map((event) => (
                <Card
                  key={event._id}
                  className="bg-[#252547] border-white/10 overflow-hidden"
                  onClick={() => {
                    haptic()
                    setSelectedEvent(event)
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                        {event.sport}
                      </Badge>
                      <span className="text-xs text-white/40">{new Date(event.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{getTeamName(event.homeTeam)}</p>
                        <p className="font-medium text-sm text-white/60">vs {getTeamName(event.awayTeam)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/50 text-green-500 text-xs px-2 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            haptic()
                            setSelectedEvent(event)
                            setSelectedOutcome({ type: "home", odds: event.odds?.home || 1.5 })
                            setShowBetDialog(true)
                          }}
                        >
                          {event.odds?.home?.toFixed(2) || "1.50"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white/60 text-xs px-2 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            haptic()
                            setSelectedEvent(event)
                            setSelectedOutcome({ type: "draw", odds: event.odds?.draw || 3.0 })
                            setShowBetDialog(true)
                          }}
                        >
                          {event.odds?.draw?.toFixed(2) || "3.00"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-500 text-xs px-2 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            haptic()
                            setSelectedEvent(event)
                            setSelectedOutcome({ type: "away", odds: event.odds?.away || 2.5 })
                            setShowBetDialog(true)
                          }}
                        >
                          {event.odds?.away?.toFixed(2) || "2.50"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        {/* Live Tab */}
        <TabsContent value="live" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-bold">Live Matches</h2>
          </div>

          {events.filter((e) => e.status === "live").length === 0 ? (
            <Card className="bg-[#252547] border-white/10">
              <CardContent className="py-8 text-center">
                <Zap className="h-8 w-8 text-white/40 mx-auto mb-2" />
                <p className="text-white/60">No live matches right now</p>
              </CardContent>
            </Card>
          ) : (
            events
              .filter((e) => e.status === "live")
              .map((event) => (
                <Card
                  key={event._id}
                  className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20 overflow-hidden"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <Badge className="bg-red-500 text-white text-xs">LIVE</Badge>
                      </div>
                      <span className="text-xs text-white/60">{event.currentTime || "45'"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {getTeamName(event.homeTeam)}{" "}
                          <span className="text-yellow-500 font-bold">{getTeamScore(event, "home")}</span>
                        </p>
                        <p className="font-medium text-white/60">
                          {getTeamName(event.awayTeam)}{" "}
                          <span className="text-yellow-500 font-bold">{getTeamScore(event, "away")}</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => {
                          haptic("medium")
                          setSelectedEvent(event)
                          setShowBetDialog(true)
                        }}
                      >
                        Bet Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        {/* Bets Tab */}
        <TabsContent value="bets" className="mt-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold">My Bets</h2>
            <Button variant="ghost" size="sm" onClick={fetchBets} className="text-white/60">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {bets.length === 0 ? (
            <Card className="bg-[#252547] border-white/10">
              <CardContent className="py-8 text-center">
                <History className="h-8 w-8 text-white/40 mx-auto mb-2" />
                <p className="text-white/60">No bets yet</p>
                <Button className="mt-4 bg-yellow-500 text-black" onClick={() => setActiveTab("events")}>
                  Place Your First Bet
                </Button>
              </CardContent>
            </Card>
          ) : (
            bets.slice(0, 20).map((bet) => (
              <Card
                key={bet._id}
                className={`border-white/10 overflow-hidden ${
                  bet.status === "won"
                    ? "bg-green-500/10 border-green-500/20"
                    : bet.status === "lost"
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-[#252547]"
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {bet.status === "won" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {bet.status === "lost" && <XCircle className="h-4 w-4 text-red-500" />}
                      {bet.status === "pending" && <Clock className="h-4 w-4 text-yellow-500" />}
                      <Badge
                        className={`text-xs ${
                          bet.status === "won"
                            ? "bg-green-500"
                            : bet.status === "lost"
                              ? "bg-red-500"
                              : "bg-yellow-500 text-black"
                        }`}
                      >
                        {bet.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-xs text-white/40">{new Date(bet.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-white/80 mb-1">{bet.eventName || "Match"}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/40">Stake: ${bet.stake?.toFixed(2)}</p>
                      <p className="text-xs text-white/40">Odds: {bet.odds?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      {bet.status === "won" ? (
                        <p className="text-green-500 font-bold">+${bet.winnings?.toFixed(2)}</p>
                      ) : bet.status === "pending" ? (
                        <p className="text-yellow-500 font-medium">Potential: ${(bet.stake * bet.odds).toFixed(2)}</p>
                      ) : (
                        <p className="text-red-500 font-medium">-${bet.stake?.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                  {bet.status === "won" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 border-green-500/50 text-green-500 bg-transparent"
                      onClick={() => {
                        haptic("success")
                        setLastWin(bet)
                        setShowWinCard(true)
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Win
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Bet Dialog */}
      <Dialog open={showBetDialog} onOpenChange={setShowBetDialog}>
        <DialogContent className="bg-[#252547] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-[#1a1a2e] rounded-lg p-3">
                <p className="text-sm text-white/60 mb-1">{selectedEvent.sport}</p>
                <p className="font-medium">
                  {getTeamName(selectedEvent.homeTeam)} vs {getTeamName(selectedEvent.awayTeam)}
                </p>
              </div>

              {/* Outcome Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: "home", label: "Home", odds: selectedEvent.odds?.home || 1.5 },
                  { type: "draw", label: "Draw", odds: selectedEvent.odds?.draw || 3.0 },
                  { type: "away", label: "Away", odds: selectedEvent.odds?.away || 2.5 },
                ].map((outcome) => (
                  <Button
                    key={outcome.type}
                    variant={selectedOutcome?.type === outcome.type ? "default" : "outline"}
                    className={`flex-col h-auto py-3 ${
                      selectedOutcome?.type === outcome.type ? "bg-yellow-500 text-black" : "border-white/20"
                    }`}
                    onClick={() => {
                      haptic()
                      setSelectedOutcome(outcome)
                    }}
                  >
                    <span className="text-xs">{outcome.label}</span>
                    <span className="font-bold">{outcome.odds.toFixed(2)}</span>
                  </Button>
                ))}
              </div>

              {/* Quick Amounts */}
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant={betAmount === String(amount) ? "default" : "outline"}
                    className={betAmount === String(amount) ? "bg-yellow-500 text-black" : "border-white/20"}
                    onClick={() => {
                      haptic()
                      setBetAmount(String(amount))
                    }}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              {/* Custom Amount */}
              <Input
                type="number"
                placeholder="Enter amount"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="bg-[#1a1a2e] border-white/20 text-white"
              />

              {/* Potential Win */}
              {betAmount && selectedOutcome && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-white/60">Potential Win</p>
                  <p className="text-2xl font-bold text-green-500">
                    ${(Number.parseFloat(betAmount || 0) * (selectedOutcome?.odds || 1)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBetDialog(false)} className="border-white/20">
              Cancel
            </Button>
            <Button
              onClick={placeBet}
              disabled={!betAmount || !selectedOutcome || placingBet || Number.parseFloat(betAmount) > balance}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              {placingBet ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing...
                </>
              ) : (
                <>Place Bet</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Win Card Dialog */}
      <Dialog open={showWinCard} onOpenChange={setShowWinCard}>
        <DialogContent className="bg-[#252547] border-white/10 text-white max-w-md p-0">
          {lastWin && <WinCardGenerator bet={lastWin} user={user} onClose={() => setShowWinCard(false)} />}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#252547] border-t border-white/10 px-4 py-2 flex justify-around">
        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 ${activeTab === "events" ? "text-yellow-500" : "text-white/60"}`}
          onClick={() => {
            haptic()
            setActiveTab("events")
          }}
        >
          <Target className="h-5 w-5" />
          <span className="text-xs mt-1">Events</span>
        </Button>
        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 ${activeTab === "live" ? "text-red-500" : "text-white/60"}`}
          onClick={() => {
            haptic()
            setActiveTab("live")
          }}
        >
          <Zap className="h-5 w-5" />
          <span className="text-xs mt-1">Live</span>
        </Button>
        <Button
          variant="ghost"
          className={`flex-col h-auto py-2 ${activeTab === "bets" ? "text-yellow-500" : "text-white/60"}`}
          onClick={() => {
            haptic()
            setActiveTab("bets")
          }}
        >
          <History className="h-5 w-5" />
          <span className="text-xs mt-1">My Bets</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-col h-auto py-2 text-white/60"
          onClick={() => {
            haptic()
            if (tg) {
              tg.openLink("https://t.me/goalbett_support")
            }
          }}
        >
          <Gift className="h-5 w-5" />
          <span className="text-xs mt-1">Bonus</span>
        </Button>
      </div>
    </div>
  )
}

// Main page component wrapped with Suspense
export default function TMAPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      }
    >
      <TMAContent />
    </Suspense>
  )
}
