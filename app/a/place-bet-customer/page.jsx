"use client"
import { useState, useEffect } from "react"
import AgentSidebar from "@/components/agent/agent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Trash2, DollarSign, Search, Printer, Users } from "lucide-react"
import PlayerAccountCreator from "@/components/agent/player-account-creator"

export default function PlaceBetCustomerPage() {
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [matches, setMatches] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [selectedBets, setSelectedBets] = useState([])
  const [stake, setStake] = useState("")
  const [placingBet, setPlacingBet] = useState(false)
  const [generatedTicket, setGeneratedTicket] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showPlayerCreator, setShowPlayerCreator] = useState(false)
  const [currency, setCurrency] = useState("USD")

  useEffect(() => {
    fetchPlayers()
    fetchMatches()
    fetchCurrency()
  }, [])

  const fetchPlayers = async () => {
    try {
      setLoadingPlayers(true)
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")
      const response = await fetch("/api/users/players", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching players:", error)
    } finally {
      setLoadingPlayers(false)
    }
  }

  const fetchMatches = async () => {
    try {
      setLoadingMatches(true)
      const response = await fetch("/api/events?limit=20")
      if (response.ok) {
        const result = await response.json()
        setMatches(result.data || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching matches:", error)
    } finally {
      setLoadingMatches(false)
    }
  }

  const fetchCurrency = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch("/api/agent/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success && data.data.currency) {
        setCurrency(data.data.currency)
      }
    } catch (error) {
      console.error("Error fetching currency:", error)
    }
  }

  const getAuthToken = () => localStorage.getItem("auth_token") || localStorage.getItem("token")

  const filteredPlayers = players.filter((player) =>
    `${player.fullName} ${player.username} ${player.phone}`.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const addBetToSlip = (match, marketId, selectionName, odds) => {
    if (!selectedPlayer) {
      alert("Please select a player first")
      return
    }

    const homeTeam = typeof match.homeTeam === "string" ? match.homeTeam : match.homeTeam?.name || "Home"
    const awayTeam = typeof match.awayTeam === "string" ? match.awayTeam : match.awayTeam?.name || "Away"
    const eventName = `${homeTeam} vs ${awayTeam}`

    // Validate marketId is a proper MongoDB ObjectId (24 hex characters)
    const isValidMarketId = marketId && typeof marketId === "string" && /^[0-9a-fA-F]{24}$/.test(marketId)

    console.log("[v0] Adding bet to slip:", {
      eventName,
      marketId,
      isValidMarketId,
      selectionName,
      odds,
    })

    const newBet = {
      eventId: match._id,
      ...(isValidMarketId ? { marketId } : {}), // Only include marketId if it's valid
      eventName,
      marketName: "1X2",
      selectionName,
      odds: Number.parseFloat(odds),
    }

    setSelectedBets([...selectedBets, newBet])
  }

  const removeBet = (id) => {
    setSelectedBets(selectedBets.filter((b) => b.id !== id))
  }

  const calculatePotentialWin = () => {
    if (!stake) return 0
    const totalOdds = selectedBets.reduce((acc, bet) => acc * bet.odds, 1)
    return (Number.parseFloat(stake) * totalOdds).toFixed(2)
  }

  const handlePlaceBet = async () => {
    if (selectedBets.length === 0 || !stake || !selectedPlayer) {
      alert("Please select a player, add bets, and enter stake amount")
      return
    }

    try {
      setPlacingBet(true)
      const token = getAuthToken()
      const response = await fetch("/api/agent/place-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId: selectedPlayer._id,
          selections: selectedBets,
          stake: Number.parseFloat(stake),
          betType: selectedBets.length > 1 ? "multiple" : "single",
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setGeneratedTicket(data.data)
        setShowSuccessModal(true)
        setSelectedBets([])
        setStake("")
        fetchPlayers()
      } else {
        alert(data.error || "Failed to place bet")
      }
    } catch (error) {
      console.error("[v0] Error placing bet:", error)
      alert("Failed to place bet")
    } finally {
      setPlacingBet(false)
    }
  }

  return (
    <>
      <div className="flex min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]">
        <AgentSidebar />

        <main className="flex-1 md:ml-64 p-6 sm:p-4 text-[#F5F5F5] min-w-0">
          <div className="max-w-6xl mx-auto space-y-6 mt-10 md:mt-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Place Bet for Customer</h1>
                <p className="text-[#B8C5D6]">Select a player and place bets on their behalf</p>
              </div>
              <Button
                onClick={() => setShowPlayerCreator(!showPlayerCreator)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                Create Player Account
              </Button>
            </div>

            {/* Player Creator */}
            {showPlayerCreator && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-green-400">Create New Player Account</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-400 bg-transparent"
                    onClick={() => setShowPlayerCreator(false)}
                  >
                    Close
                  </Button>
                </div>
                <PlayerAccountCreator onPlayerCreated={fetchPlayers} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Player Selection & Matches */}
              <div className="lg:col-span-2 space-y-4">
                {/* Player Selection */}
                <Card className="bg-[#0D1F35]/80 border border-[#2A3F55]">
                  <CardHeader>
                    <CardTitle className="text-[#FFD700] flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Select Player
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedPlayer ? (
                      <div className="space-y-3">
                        {/* Selected Player Card */}
                        <div className="p-4 bg-[#0A1A2F] border-2 border-[#FFD700] rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-[#FFD700] text-lg font-bold">{selectedPlayer.fullName}</p>
                              <p className="text-[#B8C5D6] text-sm">@{selectedPlayer.username || "N/A"}</p>
                              <p className="text-[#B8C5D6] text-sm">Phone: {selectedPlayer.phone || "N/A"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-[#B8C5D6]">Balance</p>
                              <p className="text-green-400 font-bold text-2xl">
                                {selectedPlayer.balance || 0} {currency}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => setSelectedPlayer(null)}
                            variant="outline"
                            className="w-full bg-[#0D1F35] border-[#2A3F55] hover:bg-[#FFD700]/10 hover:border-[#FFD700] text-[#B8C5D6] hover:text-[#FFD700]"
                          >
                            Change Player
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                          <input
                            type="text"
                            placeholder="Search players by name, username, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#0A1A2F] border border-[#2A3F55] rounded-lg text-[#F5F5F5] placeholder-[#B8C5D6]/50 focus:outline-none focus:border-[#FFD700]"
                          />
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-2 p-2 bg-[#0A1A2F]/50 rounded-lg border border-[#2A3F55]">
                          {loadingPlayers ? (
                            <p className="text-[#B8C5D6] text-center py-8">Loading players...</p>
                          ) : filteredPlayers.length === 0 ? (
                            <p className="text-[#B8C5D6] text-center py-8">
                              {players.length === 0
                                ? "No players found in your tenant"
                                : "No players match your search"}
                            </p>
                          ) : (
                            filteredPlayers.map((player) => (
                              <button
                                key={player._id}
                                onClick={() => {
                                  console.log("[v0] Player selected:", player)
                                  setSelectedPlayer(player)
                                  setSearchQuery("")
                                }}
                                className="w-full p-3 bg-[#0D1F35] hover:bg-[#FFD700]/10 border border-[#2A3F55] hover:border-[#FFD700] rounded-lg transition-all text-left group"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-[#F5F5F5] font-bold group-hover:text-[#FFD700] transition-colors">
                                      {player.fullName}
                                    </p>
                                    <p className="text-[#B8C5D6] text-sm">@{player.username || "N/A"}</p>
                                    <p className="text-[#FFD700] text-sm mt-1">Phone: {player.phone || "N/A"}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-[#B8C5D6]">Balance</p>
                                    <p className="text-green-400 font-bold text-lg">
                                      {player.balance || 0} {currency}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Matches */}
                <Card className="bg-[#0D1F35]/80 border border-[#2A3F55]">
                  <CardHeader>
                    <CardTitle className="text-[#FFD700]">Available Matches</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loadingMatches ? (
                      <p className="text-[#B8C5D6] text-center py-8">Loading matches...</p>
                    ) : matches.length === 0 ? (
                      <p className="text-[#B8C5D6] text-center py-8">No matches available</p>
                    ) : (
                      matches.map((match) => {
                        const markets = Array.isArray(match.markets) ? match.markets : []
                        let market1X2 = markets.find((m) => m.name === "1X2" || m.category === "1X2")

                        if (!market1X2 || !market1X2.outcomes || market1X2.outcomes.length < 3) {
                          market1X2 = {
                            _id: `default-${match._id}`,
                            name: "1X2",
                            outcomes: [
                              { name: "Home", odds: "2.50" },
                              { name: "Draw", odds: "3.20" },
                              { name: "Away", odds: "2.80" },
                            ],
                          }
                        }

                        return (
                          <div key={match._id} className="p-4 bg-[#1A2F45]/50 rounded-lg border border-[#2A3F55]">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <p className="text-[#F5F5F5] font-bold">
                                  {match.homeTeam?.name || match.homeTeam} vs {match.awayTeam?.name || match.awayTeam}
                                </p>
                                <p className="text-[#B8C5D6] text-sm">{match.league?.name || "Unknown League"}</p>
                              </div>
                              <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30 border">1X2</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {market1X2.outcomes.slice(0, 3).map((outcome, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => addBetToSlip(match, market1X2._id, outcome.name, outcome.odds)}
                                  disabled={!selectedPlayer}
                                  className="p-2 bg-[#0A1A2F] hover:bg-[#FFD700]/20 border border-[#2A3F55] hover:border-[#FFD700] rounded transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <p className="text-[#B8C5D6] text-xs">{outcome.name}</p>
                                  <p className="text-[#FFD700] font-bold">{outcome.odds}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Betslip */}
              <div className="space-y-4">
                <Card className="bg-[#0D1F35]/80 border border-[#2A3F55] sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-[#FFD700]">Bet Slip</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selected Bets */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {selectedBets.length === 0 ? (
                        <p className="text-[#B8C5D6] text-sm text-center py-4">No selections yet</p>
                      ) : (
                        selectedBets.map((bet) => (
                          <div
                            key={bet.eventId}
                            className="p-2 bg-[#1A2F45]/50 rounded border border-[#2A3F55] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[#F5F5F5] text-xs font-bold truncate">{bet.selectionName}</p>
                              <p className="text-[#B8C5D6] text-xs truncate">{bet.eventName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[#FFD700] font-bold text-sm">{bet.odds}</p>
                              <button
                                onClick={() => removeBet(bet.eventId)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {selectedBets.length > 0 && (
                      <>
                        {/* Stats */}
                        <div className="space-y-2 py-3 border-t border-[#2A3F55]">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#B8C5D6]">Selections:</span>
                            <span className="text-[#FFD700] font-bold">{selectedBets.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#B8C5D6]">Total Odds:</span>
                            <span className="text-[#FFD700] font-bold">
                              {selectedBets.reduce((acc, b) => acc * b.odds, 1).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Stake Input */}
                        <div>
                          <label className="text-[#B8C5D6] text-sm font-medium">Stake ({currency})</label>
                          <Input
                            type="number"
                            value={stake}
                            onChange={(e) => setStake(e.target.value)}
                            placeholder="Enter stake"
                            className="mt-2 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>

                        {/* Potential Win */}
                        {stake && (
                          <div className="p-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded">
                            <p className="text-[#B8C5D6] text-sm mb-1">Potential Win</p>
                            <p className="text-[#FFD700] text-2xl font-bold">
                              {calculatePotentialWin()} {currency}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-2">
                          <Button
                            onClick={() => {
                              setSelectedBets([])
                              setStake("")
                            }}
                            variant="outline"
                            className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            Clear Slip
                          </Button>

                          <Button
                            onClick={handlePlaceBet}
                            disabled={selectedBets.length === 0 || !stake || !selectedPlayer || placingBet}
                            className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold disabled:opacity-50"
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            {placingBet ? "Placing Bet..." : "Place Bet"}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Success Modal */}
      {showSuccessModal && generatedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-[#0D1F35]/95 border border-[#FFD700] w-full max-w-md">
            <CardHeader className="text-center bg-gradient-to-r from-[#FFD700]/20 to-[#4A90E2]/20">
              <CardTitle className="text-[#FFD700] text-2xl">Bet Placed Successfully</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-[#1A2F45] p-6 rounded-lg border border-[#2A3F55] text-center">
                <p className="text-[#B8C5D6] text-sm mb-2">Ticket Number</p>
                <p className="text-[#FFD700] text-2xl font-bold font-mono mb-2">{generatedTicket.ticketNumber}</p>
                <p className="text-[#B8C5D6] text-xs">Keep this ticket safe</p>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-t border-[#2A3F55]">
                <div>
                  <p className="text-[#B8C5D6] text-xs">Stake</p>
                  <p className="text-[#FFD700] font-bold">
                    {generatedTicket.stake} {currency}
                  </p>
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-xs">Total Odds</p>
                  <p className="text-[#FFD700] font-bold">{generatedTicket.totalOdds}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[#B8C5D6] text-xs">Potential Win</p>
                  <p className="text-green-400 font-bold text-xl">
                    {generatedTicket.potentialWin} {currency}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.print()}
                  className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setGeneratedTicket(null)
                  }}
                  className="flex-1 bg-[#4A90E2] hover:bg-[#4A90E2]/90 text-white font-bold"
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
