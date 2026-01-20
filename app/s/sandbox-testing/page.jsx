"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Trophy,
  Dices,
  Rocket,
  Grid3X3,
  Play,
  Plus,
  X,
  RefreshCw,
  FileText,
  Shield,
  Wallet,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  Target,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

// Import new game components
// import { DiceGame } from "@/components/casino/dice-game"
import { CrashGame } from "@/components/casino/crash-game"
import { MinesGame } from "@/components/casino/mines-game"
import { DiceGame } from "@/components/casino/dice-game"

const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount || 0)
}

export default function SandboxTestingPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  // Sports betting state
  const [events, setEvents] = useState([])
  const [selectedSelections, setSelectedSelections] = useState([])
  const [betStake, setBetStake] = useState(100)
  const [betResult, setBetResult] = useState(null)
  const [bets, setBets] = useState([]) // Added for bet history

  // Casino state
  const [casinoGame, setCasinoGame] = useState("dice")
  const [casinoStake, setCasinoStake] = useState(10)
  const [diceTarget, setDiceTarget] = useState(50)
  const [diceType, setDiceType] = useState("over")
  const [crashAutoCashout, setCrashAutoCashout] = useState(2.0)
  const [minesCount, setMinesCount] = useState(5)
  const [casinoResult, setCasinoResult] = useState(null)
  const [casinoHistory, setCasinoHistory] = useState([])
  const [isGamePlaying, setIsGamePlaying] = useState(false)

  // Settlement state
  const [pendingBets, setPendingBets] = useState([])
  const [settlementResult, setSettlementResult] = useState(null)

  // Stats
  const [stats, setStats] = useState({
    totalBets: 0,
    totalStaked: 0,
    totalPayout: 0,
    ggr: 0,
    casinoRounds: 0,
    casinoRtp: 0,
    sportsStats: {}, // Added to hold sports-specific stats
    commissionStats: {}, // Added for commission stats
  })

  // Limits
  const [limits, setLimits] = useState({
    maxWinning: 500000,
    maxStake: 100000,
    minStake: 1,
  })

  // Test wallet
  const [testWallet, setTestWallet] = useState({
    balance: 10000,
    currency: "USD",
  })

  // Create event dialog
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    sportId: "football",
    leagueId: "premier-league",
    homeTeam: "",
    awayTeam: "",
    startTime: "",
    odds: { home: 2.0, draw: 3.5, away: 2.5 },
  })

  // Settlement dialog
  const [showSettleDialog, setShowSettleDialog] = useState(false)
  const [settlingEvent, setSettlingEvent] = useState(null)
  const [settlementScores, setSettlementScores] = useState({ home: 0, away: 0 })

  const [verificationModal, setVerificationModal] = useState({
    open: false,
    data: null,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Fetching events from /api/sandbox/sports/events?status=all")
      const eventsRes = await fetch("/api/sandbox/sports/events?status=all", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!eventsRes.ok) {
        console.error("[v0] Events fetch failed with status:", eventsRes.status)
        throw new Error(`HTTP error! status: ${eventsRes.status}`)
      }

      const eventsData = await eventsRes.json()
      console.log("[v0] Events API response:", eventsData)

      if (eventsData.success) {
        const events = eventsData.data || eventsData.events || []
        setEvents(events)
        console.log("[v0] Set events state:", events.length, "events")

        if (events.length === 0) {
          console.log("[v0] No events returned - check server logs for debugging info")
        }
      } else {
        console.error("[v0] Events API failed:", eventsData.error)
      }

      // Fetch GGR stats
      const statsRes = await fetch("/api/sandbox/reports/ggr", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats((prev) => ({
          ...prev,
          sportsStats: {
            totalBets: statsData.data?.totalBets || 0,
            totalStaked: statsData.data?.totalStaked || 0,
            totalPayout: statsData.data?.totalPayout || 0,
            ggr: statsData.data?.ggr || 0,
          },
        }))
      } else {
        console.error("[v0] GGR stats API failed:", statsData.error)
      }

      // Fetch casino stats
      const casinoStatsRes = await fetch("/api/sandbox/casino/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const casinoStatsData = await casinoStatsRes.json()
      if (casinoStatsData.success) {
        setCasinoHistory(casinoStatsData.recentRounds || [])
        setStats((prev) => ({
          ...prev,
          casinoRounds: casinoStatsData.stats?.totalRounds || 0,
          casinoRtp: casinoStatsData.stats?.actualRtp || 0,
        }))
      } else {
        console.error("[v0] Casino stats API failed:", casinoStatsData.error)
      }

      // Fetch pending bets
      const pendingBetsRes = await fetch("/api/sandbox/sports/bets", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const pendingBetsData = await pendingBetsRes.json()
      if (pendingBetsData.success) {
        setPendingBets(pendingBetsData.data || [])
      } else {
        console.error("[v0] Pending bets API failed:", pendingBetsData.error)
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate potential win
  const calculatePotentialWin = () => {
    if (selectedSelections.length === 0) return 0
    const totalOdds = selectedSelections.reduce((acc, s) => acc * s.odds, 1)
    return betStake * totalOdds
  }

  const potentialWin = calculatePotentialWin()
  const exceedsMaxWin = potentialWin > limits.maxWinning
  const maxAllowedStake =
    exceedsMaxWin && selectedSelections.length > 0
      ? limits.maxWinning / selectedSelections.reduce((acc, s) => acc * s.odds, 1)
      : null

  // Add selection to bet slip
  const addSelection = (event, market, selection, odds) => {
    const existing = selectedSelections.find((s) => s.eventId === event._id)
    if (existing) {
      // Remove if clicking same event
      setSelectedSelections(selectedSelections.filter((s) => s.eventId !== event._id))
    } else {
      setSelectedSelections([
        ...selectedSelections,
        {
          eventId: event._id,
          eventName: `${event.homeTeam?.name || "Home"} vs ${event.awayTeam?.name || "Away"}`,
          market,
          selection,
          odds,
        },
      ])
    }
  }

  // Place sports bet
  const placeBet = async () => {
    if (exceedsMaxWin) {
      alert(
        `Potential win exceeds maximum limit of ${formatCurrency(limits.maxWinning)}. Max allowed stake: ${formatCurrency(maxAllowedStake)}`,
      )
      return
    }

    const token = getAuthToken()
    try {
      const res = await fetch("/api/sandbox/sports/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selections: selectedSelections,
          stake: betStake,
          betType: selectedSelections.length > 1 ? "multiple" : "single",
        }),
      })
      const data = await res.json()

      if (data.success) {
        const betData = data.data || data.bet
        setBetResult({
          success: true,
          bet: betData,
          message: `Bet placed successfully! Ticket: ${betData.ticketNumber}`,
        })
        setSelectedSelections([])
        setTestWallet((prev) => ({ ...prev, balance: betData.newBalance || prev.balance - betStake }))
        fetchData()
      } else {
        setBetResult({
          success: false,
          message: data.error,
          details: data.details,
          enforcement: data.enforcement,
        })
      }
    } catch (error) {
      console.error("[v0] Bet error:", error)
      setBetResult({
        success: false,
        message: "Failed to place bet",
      })
    }
  }

  // Create demo event
  const createDemoEvent = async () => {
    const token = getAuthToken()
    try {
      const res = await fetch("/api/sandbox/sports/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sportId: newEvent.sportId,
          leagueId: newEvent.leagueId,
          homeTeam: { name: newEvent.homeTeam },
          awayTeam: { name: newEvent.awayTeam },
          startTime: newEvent.startTime || new Date(Date.now() + 3600000).toISOString(),
          odds: newEvent.odds,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreateEvent(false)
        setNewEvent({
          sportId: "football",
          leagueId: "premier-league",
          homeTeam: "",
          awayTeam: "",
          startTime: "",
          odds: { home: 2.0, draw: 3.5, away: 2.5 },
        })
        fetchData()
      } else {
        console.error("[v0] Create event failed:", data.error)
        alert(`Failed to create event: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Create event error:", error)
      alert(`Error creating event: ${error.message}`)
    }
  }

  // Settle event
  const settleEvent = async () => {
    if (!settlingEvent) return
    const token = getAuthToken()
    try {
      const res = await fetch("/api/sandbox/sports/settle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "settle_event",
          eventId: settlingEvent._id,
          result: {
            homeScore: settlementScores.home,
            awayScore: settlementScores.away,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSettlementResult(data.data)
        setShowSettleDialog(false)
        setSettlingEvent(null)
        await fetchData()
      } else {
        console.error("[v0] Settlement API failed:", data.error)
        alert(`Failed to settle event: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Settlement error:", error)
      alert(`Error settling event: ${error.message}`)
    }
  }

  // Play casino game
  const playCasinoGame = async () => {
    const token = getAuthToken()
    setIsGamePlaying(true)
    setCasinoResult(null)

    try {
      const gameParams = {
        dice: { targetNumber: diceTarget, rollType: diceType },
        crash: { autoCashout: crashAutoCashout },
        mines: { minesCount, tilesRevealed: [] },
      }

      const res = await fetch("/api/sandbox/casino/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "quick_play", // Uses quick_play to init and play in one request
          gameType: casinoGame,
          stake: casinoStake,
          gameParams: gameParams[casinoGame],
        }),
      })
      const data = await res.json()

      if (data.success) {
        setTimeout(
          () => {
            setCasinoResult(data.data)
            setIsGamePlaying(false)
          },
          casinoGame === "crash" ? 3000 : 2000,
        )

        // Update wallet balance from the API response
        if (data.data?.newBalance !== undefined) {
          setTestWallet((prev) => ({ ...prev, balance: data.data.newBalance }))
        }
        fetchData() // Refresh data after playing
      } else {
        setCasinoResult({ success: false, error: data.error })
        setIsGamePlaying(false)
      }
    } catch (error) {
      console.error("[v0] Casino error:", error)
      setCasinoResult({ success: false, error: "An unexpected error occurred." })
      setIsGamePlaying(false)
    }
  }

  const verifyCasinoRound = async (roundNumber) => {
    const token = getAuthToken()
    try {
      const res = await fetch(`/api/sandbox/casino/verify?round=${roundNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setVerificationModal({
          open: true,
          data: data.data,
        })
      } else {
        alert(`Verification failed: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Verify error:", error)
      alert(`Error verifying round: ${error.message}`)
    }
  }

  // Calculate dice multiplier
  const calculateDiceMultiplier = () => {
    // Ensure winChance is not zero to avoid division by zero
    const winChance = diceType === "over" ? (100 - diceTarget) / 100 : diceTarget / 100
    if (winChance === 0) return "Infinity" // Or handle as an error
    // Assuming a small house edge of 1% (0.01)
    return ((1 - 0.01) / winChance).toFixed(4)
  }

  return (
    <SuperAdminLayout
      title="Sandbox Testing Console"
      description="Regulator-approved testing environment for sports betting and casino systems"
    >
      {/* Key Stats Banner */}
      <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#0D1F35] border border-[#FFD700]/30 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#FFD700] flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Regulator Testing Environment
            </h2>
            <p className="text-[#B8C5D6] text-sm mt-1">
              Complete sandbox with sports betting, casino games, settlement, and audit trail
            </p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            All Systems Operational
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-[#0D1F35]/50 rounded-lg p-3">
            <p className="text-[#8A9DB8] text-xs">Test Wallet</p>
            <p className="text-[#FFD700] font-bold text-lg">{formatCurrency(testWallet.balance)}</p>
          </div>
          <div className="bg-[#0D1F35]/50 rounded-lg p-3">
            <p className="text-[#8A9DB8] text-xs">Total Bets</p>
            <p className="text-[#F5F5F5] font-bold text-lg">{stats.sportsStats?.totalBets || 0}</p>
          </div>
          <div className="bg-[#0D1F35]/50 rounded-lg p-3">
            <p className="text-[#8A9DB8] text-xs">Total Staked</p>
            <p className="text-blue-400 font-bold text-lg">{formatCurrency(stats.sportsStats?.totalStaked || 0)}</p>
          </div>
          <div className="bg-[#0D1F35]/50 rounded-lg p-3">
            <p className="text-[#8A9DB8] text-xs">GGR</p>
            <p className="text-green-400 font-bold text-lg">{formatCurrency(stats.sportsStats?.ggr || 0)}</p>
          </div>
          <div className="bg-[#0D1F35]/50 rounded-lg p-3">
            <p className="text-[#8A9DB8] text-xs">Casino Rounds</p>
            <p className="text-purple-400 font-bold text-lg">{stats.casinoRounds}</p>
          </div>
          <div className="bg-[#0D1F35]/50 rounded-lg p-3">
            <p className="text-[#8A9DB8] text-xs">Max Win Limit</p>
            <p className="text-[#F5F5F5] font-bold text-lg">{formatCurrency(limits.maxWinning)}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#0D1F35] border border-[#2A3F55] p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sports" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Trophy className="w-4 h-4 mr-2" />
            Sports Betting
          </TabsTrigger>
          <TabsTrigger value="casino" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Dices className="w-4 h-4 mr-2" />
            Casino Games
          </TabsTrigger>
          <TabsTrigger
            value="settlement"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Settlement
          </TabsTrigger>
          <TabsTrigger value="docs" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <BookOpen className="w-4 h-4 mr-2" />
            Documentation
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How It Works */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  What Regulators Need to See
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#1A2F45] rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-[#F5F5F5] font-medium">Betting & Casino Logic Works End-to-End</p>
                      <p className="text-[#8A9DB8] text-sm">Place bets, play games, see results and payouts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#1A2F45] rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-[#F5F5F5] font-medium">Max Winning Limit Enforced Server-Side</p>
                      <p className="text-[#8A9DB8] text-sm">
                        System prevents bets exceeding {formatCurrency(limits.maxWinning)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#1A2F45] rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-[#F5F5F5] font-medium">Double-Entry Ledger System</p>
                      <p className="text-[#8A9DB8] text-sm">Every transaction creates balanced debit/credit entries</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#1A2F45] rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-[#F5F5F5] font-medium">Provably Fair Casino Games</p>
                      <p className="text-[#8A9DB8] text-sm">Cryptographic verification of all game outcomes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#1A2F45] rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-[#F5F5F5] font-medium">Complete Audit Trail</p>
                      <p className="text-[#8A9DB8] text-sm">All actions logged with timestamps and user info</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Test Guide */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quick Testing Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-[#1A2F45] rounded-lg">
                    <p className="text-[#FFD700] font-medium mb-1">Step 1: Sports Betting Test</p>
                    <ol className="text-[#8A9DB8] text-sm space-y-1 list-decimal list-inside">
                      <li>Create a demo event with odds</li>
                      <li>Place a single bet</li>
                      <li>Place a multi-selection bet (accumulator)</li>
                      <li>Try to exceed max winning - see enforcement</li>
                      <li>Settle the event with a score</li>
                      <li>Verify wallet balance updated correctly</li>
                    </ol>
                  </div>
                  <div className="p-3 bg-[#1A2F45] rounded-lg">
                    <p className="text-[#FFD700] font-medium mb-1">Step 2: Casino Test</p>
                    <ol className="text-[#8A9DB8] text-sm space-y-1 list-decimal list-inside">
                      <li>Play Dice game with different targets</li>
                      <li>Play Crash game with auto-cashout</li>
                      <li>Play Mines game</li>
                      <li>Verify provably fair for any round</li>
                      <li>Check RTP matches expected values</li>
                    </ol>
                  </div>
                  <div className="p-3 bg-[#1A2F45] rounded-lg">
                    <p className="text-[#FFD700] font-medium mb-1">Step 3: Verify Audit Trail</p>
                    <ol className="text-[#8A9DB8] text-sm space-y-1 list-decimal list-inside">
                      <li>Go to Wallet & Ledger page</li>
                      <li>Review all ledger entries</li>
                      <li>Check GGR & Commission Reports</li>
                      <li>Export audit logs</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab("sports")}
              className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6 text-left hover:border-[#FFD700]/50 transition-colors"
            >
              <Trophy className="w-10 h-10 text-[#FFD700] mb-4" />
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-2">Sports Betting</h3>
              <p className="text-[#8A9DB8] text-sm">Create events, place bets, test max-win limits</p>
              <ChevronRight className="w-5 h-5 text-[#FFD700] mt-4" />
            </button>

            <button
              onClick={() => setActiveTab("casino")}
              className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6 text-left hover:border-[#FFD700]/50 transition-colors"
            >
              <Dices className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-2">Casino Games</h3>
              <p className="text-[#8A9DB8] text-sm">Play Dice, Crash, Mines with provably fair</p>
              <ChevronRight className="w-5 h-5 text-[#FFD700] mt-4" />
            </button>

            <button
              onClick={() => setActiveTab("settlement")}
              className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6 text-left hover:border-[#FFD700]/50 transition-colors"
            >
              <CheckCircle className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-2">Settlement</h3>
              <p className="text-[#8A9DB8] text-sm">Settle events, view bet results, GGR reports</p>
              <ChevronRight className="w-5 h-5 text-[#FFD700] mt-4" />
            </button>
          </div>
        </TabsContent>

        {/* Sports Betting Tab */}
        <TabsContent value="sports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#F5F5F5]">Sports Betting Sandbox</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateEvent(true)}
                className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Demo Event
              </Button>
              <Button
                onClick={fetchData}
                variant="outline"
                className="border-[#2A3F55] text-[#B8C5D6] hover:bg-[#1A2F45] bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Events List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#F5F5F5]">Available Events</CardTitle>
                  <CardDescription className="text-[#8A9DB8]">
                    Click odds to add selections to your bet slip
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 animate-spin text-[#FFD700] mx-auto" />
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 text-[#8A9DB8] mx-auto mb-4" />
                      <p className="text-[#8A9DB8]">No events yet. Create a demo event to start testing.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {events
                        .filter((e) => e.status !== "finished")
                        .map((event) => (
                          <div key={event._id} className="bg-[#1A2F45] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-[#F5F5F5] font-medium">
                                  {event.homeTeam?.name || "Home"} vs {event.awayTeam?.name || "Away"}
                                </p>
                                <p className="text-[#8A9DB8] text-xs">{new Date(event.startTime).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={
                                    event.isBettingOpen
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-red-500/20 text-red-400"
                                  }
                                >
                                  {event.isBettingOpen ? "Open" : "Closed"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSettlingEvent(event)
                                    setShowSettleDialog(true)
                                  }}
                                  className="border-[#2A3F55] text-[#FFD700] hover:bg-[#FFD700]/10"
                                >
                                  Settle
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => addSelection(event, "Match Winner", "Home", event.odds?.home)}
                                className={`p-3 rounded-lg border text-center transition-colors ${
                                  selectedSelections.find((s) => s.eventId === event._id && s.selection === "Home")
                                    ? "bg-[#FFD700] text-[#0A1A2F] border-[#FFD700]"
                                    : "bg-[#0D1F35] border-[#2A3F55] hover:border-[#FFD700]"
                                }`}
                              >
                                <p className="text-xs text-[#8A9DB8]">Home</p>
                                <p className="font-bold text-lg">{event.odds?.home?.toFixed(2) || "2.00"}</p>
                              </button>
                              <button
                                onClick={() => addSelection(event, "Match Winner", "Draw", event.odds?.draw)}
                                className={`p-3 rounded-lg border text-center transition-colors ${
                                  selectedSelections.find((s) => s.eventId === event._id && s.selection === "Draw")
                                    ? "bg-[#FFD700] text-[#0A1A2F] border-[#FFD700]"
                                    : "bg-[#0D1F35] border-[#2A3F55] hover:border-[#FFD700]"
                                }`}
                              >
                                <p className="text-xs text-[#8A9DB8]">Draw</p>
                                <p className="font-bold text-lg">{event.odds?.draw?.toFixed(2) || "3.50"}</p>
                              </button>
                              <button
                                onClick={() => addSelection(event, "Match Winner", "Away", event.odds?.away)}
                                className={`p-3 rounded-lg border text-center transition-colors ${
                                  selectedSelections.find((s) => s.eventId === event._id && s.selection === "Away")
                                    ? "bg-[#FFD700] text-[#0A1A2F] border-[#FFD700]"
                                    : "bg-[#0D1F35] border-[#2A3F55] hover:border-[#FFD700]"
                                }`}
                              >
                                <p className="text-xs text-[#8A9DB8]">Away</p>
                                <p className="font-bold text-lg">{event.odds?.away?.toFixed(2) || "2.50"}</p>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bet Slip */}
            <div className="space-y-4">
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#F5F5F5] flex items-center justify-between">
                    <span>Bet Slip</span>
                    {selectedSelections.length > 0 && (
                      <Badge className="bg-[#FFD700] text-[#0A1A2F]">
                        {selectedSelections.length} selection{selectedSelections.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedSelections.length === 0 ? (
                    <p className="text-[#8A9DB8] text-center py-4">Click on odds to add selections</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {selectedSelections.map((sel, idx) => (
                          <div key={idx} className="bg-[#1A2F45] rounded-lg p-3 flex items-center justify-between">
                            <div>
                              <p className="text-[#F5F5F5] text-sm">{sel.eventName}</p>
                              <p className="text-[#8A9DB8] text-xs">
                                {sel.market}: {sel.selection}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#FFD700] font-bold">{sel.odds.toFixed(2)}</span>
                              <button
                                onClick={() => setSelectedSelections(selectedSelections.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label className="text-[#8A9DB8]">Stake Amount</Label>
                        <Input
                          type="number"
                          value={betStake}
                          onChange={(e) => setBetStake(Number(e.target.value))}
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] text-lg font-bold"
                        />
                      </div>

                      <div className="bg-[#1A2F45] rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#8A9DB8]">Total Odds:</span>
                          <span className="text-[#F5F5F5] font-medium">
                            {selectedSelections.reduce((acc, s) => acc * s.odds, 1).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8A9DB8]">Potential Win:</span>
                          <span className={`font-bold ${exceedsMaxWin ? "text-red-400" : "text-green-400"}`}>
                            {formatCurrency(potentialWin)}
                          </span>
                        </div>
                        {exceedsMaxWin && (
                          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 mt-2">
                            <p className="text-red-400 text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Exceeds max win limit ({formatCurrency(limits.maxWinning)})
                            </p>
                            <p className="text-[#8A9DB8] text-xs">
                              Max allowed stake: {formatCurrency(maxAllowedStake)}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={placeBet}
                        disabled={exceedsMaxWin || betStake <= 0 || selectedSelections.length === 0} // Added check for empty selections
                        className="w-full bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200] disabled:opacity-50"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Place Bet
                      </Button>
                    </>
                  )}

                  {/* Bet Result */}
                  {betResult && (
                    <div
                      className={`p-4 rounded-lg border ${
                        betResult.success ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      {betResult.success ? (
                        <>
                          <p className="text-green-400 font-medium flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Bet Placed Successfully!
                          </p>
                          <p className="text-[#8A9DB8] text-sm mt-1">Ticket: {betResult.bet?.ticketNumber}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-red-400 font-medium flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {betResult.message}
                          </p>
                          {betResult.enforcement?.maxWinningEnforced && (
                            <p className="text-[#8A9DB8] text-xs mt-1">
                              Max allowed stake: {formatCurrency(betResult.enforcement.maxAllowedStake)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Limits Info */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#F5F5F5] text-sm">Betting Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8A9DB8]">Min Stake:</span>
                    <span className="text-[#F5F5F5]">{formatCurrency(limits.minStake)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9DB8]">Max Stake:</span>
                    <span className="text-[#F5F5F5]">{formatCurrency(limits.maxStake)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9DB8]">Max Winning:</span>
                    <span className="text-[#FFD700] font-bold">{formatCurrency(limits.maxWinning)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9DB8]">Max Selections:</span>
                    <span className="text-[#F5F5F5]">100</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Casino Tab */}
        <TabsContent value="casino" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#F5F5F5]">Casino Games Sandbox</h2>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Provably Fair
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game Selection */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">Select Game</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => {
                    setCasinoGame("dice")
                    setCasinoResult(null) // Clear previous result
                    setIsGamePlaying(false) // Reset game playing state
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    casinoGame === "dice"
                      ? "bg-[#FFD700]/10 border-[#FFD700]"
                      : "bg-[#1A2F45] border-[#2A3F55] hover:border-[#FFD700]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Dices className="w-8 h-8 text-[#FFD700]" />
                    <div>
                      <p className="text-[#F5F5F5] font-medium">Dice</p>
                      <p className="text-[#8A9DB8] text-xs">Roll over/under target</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setCasinoGame("crash")
                    setCasinoResult(null) // Clear previous result
                    setIsGamePlaying(false) // Reset game playing state
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    casinoGame === "crash"
                      ? "bg-[#FFD700]/10 border-[#FFD700]"
                      : "bg-[#1A2F45] border-[#2A3F55] hover:border-[#FFD700]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Rocket className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-[#F5F5F5] font-medium">Crash</p>
                      <p className="text-[#8A9DB8] text-xs">Cash out before crash</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setCasinoGame("mines")
                    setCasinoResult(null) // Clear previous result
                    setIsGamePlaying(false) // Reset game playing state
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    casinoGame === "mines"
                      ? "bg-[#FFD700]/10 border-[#FFD700]"
                      : "bg-[#1A2F45] border-[#2A3F55] hover:border-[#FFD700]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Grid3X3 className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-[#F5F5F5] font-medium">Mines</p>
                      <p className="text-[#8A9DB8] text-xs">Avoid the mines</p>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* Game Visualization */}
            <Card className="bg-[#0D1F35] border-[#2A3F55] lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5] capitalize">{casinoGame} Game</CardTitle>
              </CardHeader>
              <CardContent>
                {casinoGame === "dice" && (
                  <DiceGame
                    result={casinoResult?.result}
                    target={diceTarget}
                    rollType={diceType}
                    isRolling={isGamePlaying}
                  />
                )}
                {casinoGame === "crash" && (
                  <CrashGame result={casinoResult?.result} autoCashout={crashAutoCashout} isPlaying={isGamePlaying} />
                )}
                {casinoGame === "mines" && (
                  <MinesGame result={casinoResult?.result} minesCount={minesCount} isPlaying={isGamePlaying} />
                )}

                {/* Controls below game */}
                <div className="mt-6 space-y-4 bg-[#0F1A26] rounded-lg p-4 border border-[#2A3F55]">
                  <div>
                    <Label className="text-[#8A9DB8]">Stake</Label>
                    <Input
                      type="number"
                      value={casinoStake}
                      onChange={(e) => setCasinoStake(Number(e.target.value))}
                      disabled={isGamePlaying}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>

                  {casinoGame === "dice" && (
                    <>
                      <div>
                        <Label className="text-[#8A9DB8]">Roll Type</Label>
                        <Select value={diceType} onValueChange={setDiceType} disabled={isGamePlaying}>
                          <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                            <SelectItem value="over">Roll Over</SelectItem>
                            <SelectItem value="under">Roll Under</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[#8A9DB8]">Target: {diceTarget}</Label>
                        <Slider
                          value={[diceTarget]}
                          onValueChange={(v) => setDiceTarget(v[0])}
                          min={1}
                          max={99}
                          step={1}
                          disabled={isGamePlaying}
                          className="mt-2"
                        />
                      </div>
                      <div className="bg-[#1A2F45] rounded-lg p-3">
                        <p className="text-[#8A9DB8] text-sm">Multiplier</p>
                        <p className="text-[#FFD700] font-bold text-xl">{calculateDiceMultiplier()}x</p>
                        <p className="text-[#8A9DB8] text-xs">
                          Win chance: {diceType === "over" ? 100 - diceTarget : diceTarget}%
                        </p>
                      </div>
                    </>
                  )}

                  {casinoGame === "crash" && (
                    <div>
                      <Label className="text-[#8A9DB8]">Auto Cashout at</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={crashAutoCashout}
                        onChange={(e) => setCrashAutoCashout(Number(e.target.value))}
                        disabled={isGamePlaying}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                      <p className="text-[#8A9DB8] text-xs mt-1">Auto cashout at {crashAutoCashout}x multiplier</p>
                    </div>
                  )}

                  {casinoGame === "mines" && (
                    <div>
                      <Label className="text-[#8A9DB8]">Number of Mines: {minesCount}</Label>
                      <Slider
                        value={[minesCount]}
                        onValueChange={(v) => setMinesCount(v[0])}
                        min={1}
                        max={24}
                        step={1}
                        disabled={isGamePlaying}
                        className="mt-2"
                      />
                      <p className="text-[#8A9DB8] text-xs mt-1">More mines = higher multiplier per tile</p>
                    </div>
                  )}

                  <Button
                    onClick={playCasinoGame}
                    disabled={isGamePlaying}
                    className="w-full bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200] disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isGamePlaying ? "Playing..." : "Play"}
                  </Button>

                  {/* Result Summary */}
                  {casinoResult && !isGamePlaying && (
                    <div className="rounded-lg border border-[#2A3F55] bg-[#0F1A26]/50 p-4">
                      <p
                        className={`flex items-center gap-2 text-base font-semibold ${casinoResult.result?.won ? "text-[#22C55E]" : "text-[#EF4444]"}`}
                      >
                        {casinoResult.result?.won ? (
                          <>
                            <CheckCircle className="w-4 h-4" /> Won!
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" /> Lost
                          </>
                        )}
                      </p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-[#8A9DB8]">
                          Multiplier: <span className="text-[#FFD700]">{casinoResult.result?.multiplier}x</span>
                        </p>
                        <p className="text-[#8A9DB8]">
                          Payout: <span className="text-[#F5F5F5]">{formatCurrency(casinoResult.payout)}</span>
                        </p>
                        <p className="text-[#8A9DB8]">
                          Round: <span className="text-[#F5F5F5]">{casinoResult.roundNumber}</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verifyCasinoRound(casinoResult.roundNumber)}
                        className="mt-2 w-full border-[#2A3F55] text-[#FFD700]"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Verify Provably Fair
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Rounds */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">Recent Rounds</CardTitle>
              </CardHeader>
              <CardContent>
                {casinoHistory.length === 0 ? (
                  <p className="text-[#8A9DB8] text-center py-4">No rounds yet</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {casinoHistory.map((round, idx) => (
                      <div key={idx} className="bg-[#1A2F45] rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[#F5F5F5] text-sm capitalize">{round.gameType}</p>
                          <p className="text-[#8A9DB8] text-xs">{round.roundNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${round.outcome?.payout > 0 ? "text-green-400" : "text-red-400"}`}>
                            {round.outcome?.multiplier}x
                          </p>
                          <p className="text-[#8A9DB8] text-xs">{formatCurrency(round.outcome?.payout || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settlement Tab */}
        <TabsContent value="settlement" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#F5F5F5]">Settlement & Reports</h2>
            <Button
              onClick={fetchData}
              variant="outline"
              className="border-[#2A3F55] text-[#B8C5D6] hover:bg-[#1A2F45] bg-transparent"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Settlement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-4">
                <p className="text-[#8A9DB8] text-sm">Total Staked</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(stats.sportsStats?.totalStaked || 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-4">
                <p className="text-[#8A9DB8] text-sm">Total Payout</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(stats.sportsStats?.totalPayout || 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-4">
                <p className="text-[#8A9DB8] text-sm">GGR (Gross Gaming Revenue)</p>
                <p className="text-2xl font-bold text-[#FFD700]">{formatCurrency(stats.sportsStats?.ggr || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-4">
                <p className="text-[#8A9DB8] text-sm">Commission</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(stats.commissionStats?.total || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Events to Settle */}
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5]">Events Pending Settlement</CardTitle>
              <CardDescription className="text-[#8A9DB8]">
                Click "Settle" to set event result and trigger automatic bet settlement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.filter((e) => e.status !== "finished").length === 0 ? (
                <p className="text-[#8A9DB8] text-center py-8">No events pending settlement</p>
              ) : (
                <div className="space-y-3">
                  {events
                    .filter((e) => e.status !== "finished")
                    .map((event) => (
                      <div key={event._id} className="bg-[#1A2F45] rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[#F5F5F5] font-medium">
                            {event.homeTeam?.name} vs {event.awayTeam?.name}
                          </p>
                          <p className="text-[#8A9DB8] text-sm">{new Date(event.startTime).toLocaleString()}</p>
                        </div>
                        <Button
                          onClick={() => {
                            setSettlingEvent(event)
                            setShowSettleDialog(true)
                          }}
                          className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Settle
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settled Events */}
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5]">Settled Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.filter((e) => e.status === "finished").length === 0 ? (
                <p className="text-[#8A9DB8] text-center py-8">No settled events yet</p>
              ) : (
                <div className="space-y-3">
                  {events
                    .filter((e) => e.status === "finished")
                    .map((event) => (
                      <div key={event._id} className="bg-[#1A2F45] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[#F5F5F5] font-medium">
                              {event.homeTeam?.name} vs {event.awayTeam?.name}
                            </p>
                            <p className="text-[#8A9DB8] text-sm">
                              Final Score: {event.homeTeam?.score ?? "-"} - {event.awayTeam?.score ?? "-"}
                            </p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Settled</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settlement Result */}
          {settlementResult && (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Settlement Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[#8A9DB8] text-sm">Bets Processed</p>
                    <p className="text-[#F5F5F5] font-bold">{settlementResult.betsProcessed}</p>
                  </div>
                  <div>
                    <p className="text-[#8A9DB8] text-sm">Total Staked</p>
                    <p className="text-blue-400 font-bold">{formatCurrency(settlementResult.totalStaked)}</p>
                  </div>
                  <div>
                    <p className="text-[#8A9DB8] text-sm">Total Paid Out</p>
                    <p className="text-green-400 font-bold">{formatCurrency(settlementResult.totalPaidOut)}</p>
                  </div>
                  <div>
                    <p className="text-[#8A9DB8] text-sm">GGR</p>
                    <p className="text-[#FFD700] font-bold">{formatCurrency(settlementResult.ggr)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Regulator Documentation</CardTitle>
              <CardDescription className="text-[#8A9DB8]">
                Complete technical documentation for regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/s/regulator-docs"
                  className="bg-[#1A2F45] rounded-lg p-4 hover:border-[#FFD700] border border-[#2A3F55] transition-colors block"
                >
                  <FileText className="w-8 h-8 text-[#FFD700] mb-3" />
                  <h3 className="text-[#F5F5F5] font-medium mb-1">System Architecture</h3>
                  <p className="text-[#8A9DB8] text-sm">
                    Complete system overview, data flows, and architecture diagrams
                  </p>
                </a>
                <a
                  href="/s/api-docs"
                  className="bg-[#1A2F45] rounded-lg p-4 hover:border-[#FFD700] border border-[#2A3F55] transition-colors block"
                >
                  <Settings className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="text-[#F5F5F5] font-medium mb-1">API Documentation</h3>
                  <p className="text-[#8A9DB8] text-sm">OpenAPI/Swagger specification for all endpoints</p>
                </a>
                <a
                  href="/s/wallet-ledger"
                  className="bg-[#1A2F45] rounded-lg p-4 hover:border-[#FFD700] border border-[#2A3F55] transition-colors block"
                >
                  <Wallet className="w-8 h-8 text-green-400 mb-3" />
                  <h3 className="text-[#F5F5F5] font-medium mb-1">Wallet & Ledger</h3>
                  <p className="text-[#8A9DB8] text-sm">Double-entry accounting system and transaction history</p>
                </a>
                <a
                  href="/s/audit-logs"
                  className="bg-[#1A2F45] rounded-lg p-4 hover:border-[#FFD700] border border-[#2A3F55] transition-colors block"
                >
                  <BookOpen className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-[#F5F5F5] font-medium mb-1">Audit Logs</h3>
                  <p className="text-[#8A9DB8] text-sm">Complete audit trail of all system actions</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Event Dialog */}
      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">Create Demo Event</DialogTitle>
            <DialogDescription className="text-[#8A9DB8]">
              Create a sandbox event for testing sports betting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#8A9DB8]">Home Team</Label>
                <Input
                  value={newEvent.homeTeam}
                  onChange={(e) => setNewEvent({ ...newEvent, homeTeam: e.target.value })}
                  placeholder="Manchester United"
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label className="text-[#8A9DB8]">Away Team</Label>
                <Input
                  value={newEvent.awayTeam}
                  onChange={(e) => setNewEvent({ ...newEvent, awayTeam: e.target.value })}
                  placeholder="Liverpool"
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>
            <div>
              <Label className="text-[#8A9DB8]">Start Time</Label>
              <Input
                type="datetime-local"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[#8A9DB8]">Home Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newEvent.odds.home}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, odds: { ...newEvent.odds, home: Number(e.target.value) } })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label className="text-[#8A9DB8]">Draw Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newEvent.odds.draw}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, odds: { ...newEvent.odds, draw: Number(e.target.value) } })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label className="text-[#8A9DB8]">Away Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newEvent.odds.away}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, odds: { ...newEvent.odds, away: Number(e.target.value) } })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateEvent(false)}
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              Cancel
            </Button>
            <Button onClick={createDemoEvent} className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]">
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle Event Dialog */}
      <Dialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">Settle Event</DialogTitle>
            <DialogDescription className="text-[#8A9DB8]">
              Enter the final score to settle all bets for this event
            </DialogDescription>
          </DialogHeader>
          {settlingEvent && (
            <div className="space-y-4">
              <div className="bg-[#1A2F45] rounded-lg p-4 text-center">
                <p className="text-[#F5F5F5] font-medium text-lg">
                  {settlingEvent.homeTeam?.name} vs {settlingEvent.awayTeam?.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#8A9DB8]">{settlingEvent.homeTeam?.name} Score</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settlementScores.home}
                    onChange={(e) => setSettlementScores({ ...settlementScores, home: Number(e.target.value) })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] text-2xl font-bold text-center"
                  />
                </div>
                <div>
                  <Label className="text-[#8A9DB8]">{settlingEvent.awayTeam?.name} Score</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settlementScores.away}
                    onChange={(e) => setSettlementScores({ ...settlementScores, away: Number(e.target.value) })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] text-2xl font-bold text-center"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettleDialog(false)}
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              Cancel
            </Button>
            <Button onClick={settleEvent} className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]">
              <CheckCircle className="w-4 h-4 mr-2" />
              Settle Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Modal */}
      <Dialog open={verificationModal.open} onOpenChange={(open) => setVerificationModal({ open, data: null })}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700] flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Provably Fair Verification
            </DialogTitle>
            <DialogDescription className="text-[#8A9DB8]">
              Cryptographic proof that the game result was fair and not manipulated
            </DialogDescription>
          </DialogHeader>

          {verificationModal.data && (
            <div className="space-y-4">
              {/* Verification Status */}
              <div className="bg-[#1A2F45] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {verificationModal.data.verification.valid ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400" />
                  )}
                  <div>
                    <p className="font-semibold text-lg">
                      {verificationModal.data.verification.valid ? "Valid Result ✓" : "Invalid Result ✗"}
                    </p>
                    <p className="text-sm text-[#8A9DB8]">
                      {verificationModal.data.verification.valid
                        ? "This game was provably fair"
                        : "This game result could not be verified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Details */}
              <div className="space-y-3">
                <div className="bg-[#1A2F45] rounded-lg p-3">
                  <p className="text-xs text-[#8A9DB8] mb-1">Server Seed (Revealed)</p>
                  <p className="text-sm font-mono text-[#F5F5F5] break-all">
                    {verificationModal.data.howToVerify.serverSeed}
                  </p>
                </div>

                <div className="bg-[#1A2F45] rounded-lg p-3">
                  <p className="text-xs text-[#8A9DB8] mb-1">Server Seed Hash (Pre-committed)</p>
                  <p className="text-sm font-mono text-[#F5F5F5] break-all">
                    {verificationModal.data.verification.serverSeedHash}
                  </p>
                </div>

                <div className="bg-[#1A2F45] rounded-lg p-3">
                  <p className="text-xs text-[#8A9DB8] mb-1">Client Seed</p>
                  <p className="text-sm font-mono text-[#F5F5F5] break-all">
                    {verificationModal.data.howToVerify.clientSeed}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1A2F45] rounded-lg p-3">
                    <p className="text-xs text-[#8A9DB8] mb-1">Nonce</p>
                    <p className="text-sm font-mono text-[#F5F5F5]">{verificationModal.data.howToVerify.nonce}</p>
                  </div>

                  <div className="bg-[#1A2F45] rounded-lg p-3">
                    <p className="text-xs text-[#8A9DB8] mb-1">Game Result</p>
                    <p className="text-sm font-mono text-[#FFD700]">{verificationModal.data.verification.result}</p>
                  </div>
                </div>
              </div>

              {/* How to Verify */}
              <div className="bg-[#1A2F45] rounded-lg p-4 border border-[#2A3F55]">
                <p className="text-sm font-semibold text-[#FFD700] mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  How to Verify
                </p>
                <ol className="text-sm text-[#8A9DB8] space-y-1 list-decimal list-inside">
                  <li>Hash the revealed server seed and compare it with the pre-committed hash</li>
                  <li>Combine: Server Seed + Client Seed + Nonce</li>
                  <li>Generate result from the combined seed</li>
                  <li>Compare the generated result with the actual game result</li>
                </ol>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setVerificationModal({ open: false, data: null })}
              className="bg-[#FFD700] text-[#0D1F35] hover:bg-[#FFC700]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}
