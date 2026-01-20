"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, User, DollarSign, Loader2, CheckCircle, XCircle, Search, Users } from "lucide-react"

function AgentWalletTopup() {
  const [playerIdentifier, setPlayerIdentifier] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [recentPlayers, setRecentPlayers] = useState([])

  useEffect(() => {
    loadRecentPlayers()
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchPlayers(searchQuery)
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const loadRecentPlayers = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/agent/players?limit=10", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setRecentPlayers(data.data.players)
      }
    } catch (err) {
      console.error("[v0] Failed to load recent players:", err)
    }
  }

  const searchPlayers = async (query) => {
    setSearchLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/agent/players?search=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setSearchResults(data.data.players)
        setShowDropdown(data.data.players.length > 0)
      }
    } catch (err) {
      console.error("[v0] Search error:", err)
    } finally {
      setSearchLoading(false)
    }
  }

  const selectPlayer = (player) => {
    setPlayerIdentifier(player.phone || player.email || player.username)
    setSearchQuery(player.fullName || player.username)
    setShowDropdown(false)
  }

  const handleTopup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    console.log("[v0] Topping up player:", { playerIdentifier, amount })

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/agent/topup/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerIdentifier,
          amount: Number.parseFloat(amount),
          currency: "USD",
        }),
      })

      const data = await response.json()
      console.log("[v0] Topup response:", data)

      if (data.success) {
        setResult(data.data)
        setPlayerIdentifier("")
        setAmount("")
        setSearchQuery("")
        await loadRecentPlayers()
        window.dispatchEvent(new Event("wallet-updated"))
        setTimeout(() => setResult(null), 5000)
      } else {
        setError(data.error || "Failed to top up player")
      }
    } catch (err) {
      console.error("[v0] Topup error:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-[#FFD700]" />
          Top Up Player Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTopup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchQuery" className="text-[#F5F5F5]">
              Search Player
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-[#FFD700]/50" />
              <Input
                id="searchQuery"
                type="text"
                placeholder="Search by name, phone, email, or username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true)
                }}
                className="pl-10 bg-[#0A1A2F] border-[#FFD700]/30 text-white"
              />
              {searchLoading && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-[#FFD700]" />}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((player) => (
                    <button
                      key={player._id}
                      type="button"
                      onClick={() => selectPlayer(player)}
                      className="w-full px-4 py-3 text-left hover:bg-[#FFD700]/10 border-b border-[#FFD700]/10 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-[#FFD700]" />
                        <div>
                          <p className="text-white font-medium">{player.fullName || player.username}</p>
                          <p className="text-xs text-[#B8C5D6]">{player.phone || player.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="playerIdentifier" className="text-[#F5F5F5]">
              Player Phone / Email / Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-[#FFD700]/50" />
              <Input
                id="playerIdentifier"
                type="text"
                placeholder="player2amnen"
                value={playerIdentifier}
                onChange={(e) => setPlayerIdentifier(e.target.value)}
                className="pl-10 bg-[#0A1A2F] border-[#FFD700]/30 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[#F5F5F5]">
              Amount (USD)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-[#FFD700]/50" />
              <Input
                id="amount"
                type="number"
                placeholder="20"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 bg-[#0A1A2F] border-[#FFD700]/30 text-white"
                min="1"
                step="0.01"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {result && (
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-sm text-green-300">
                <p className="font-semibold">Success! {result.playerName} topped up</p>
                <p className="text-xs mt-1">
                  New Balance: {result.newPlayerBalance} USD | Your Balance: {result.newAgentBalance} USD
                </p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Top Up Player
              </>
            )}
          </Button>
        </form>

        {recentPlayers.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-white font-semibold">Recent Players</h3>
            </div>
            <div className="space-y-2">
              {recentPlayers.slice(0, 5).map((player) => (
                <button
                  key={player._id}
                  type="button"
                  onClick={() => selectPlayer(player)}
                  className="w-full px-3 py-2 bg-[#0A1A2F]/50 hover:bg-[#0A1A2F] border border-[#FFD700]/20 rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#FFD700]" />
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">{player.fullName || player.username}</p>
                      <p className="text-xs text-[#B8C5D6]">{player.phone || player.email}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-[#0A1A2F]/50 rounded-lg border border-[#FFD700]/20">
          <p className="text-xs text-[#B8C5D6]">
            <strong>Note:</strong> Enter player's phone number, email, or username. The amount will be deducted from
            your wallet and added to the player's wallet instantly.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default AgentWalletTopup
