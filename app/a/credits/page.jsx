"use client"
import { useState, useEffect } from "react"
import AgentSidebar from "@/components/agent/agent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CreditCard,
  Send,
  CheckCircle,
  History,
  ArrowUpRight,
  Loader2,
  Search,
  User,
  Phone,
  Mail,
  AtSign,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getAuthToken } from "@/lib/auth-service"

export default function SellCredits() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("phone") // phone, username, email
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const [amount, setAmount] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [creditInfo, setCreditInfo] = useState({
    availableCredit: 0,
    creditLimit: 0,
    usedCredit: 0,
    walletBalance: 0,
  })
  const [salesStats, setSalesStats] = useState({
    todaySales: 0,
    todayCommission: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [lastSale, setLastSale] = useState(null)

  useEffect(() => {
    fetchCreditInfo()
    fetchSalesHistory()
    fetchPlayers() // Fetch players on mount
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchPlayers(searchQuery)
      } else if (searchQuery.length === 0) {
        fetchPlayers()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchPlayers = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch("/api/agent/players?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setPlayers(data.data.players)
      }
    } catch (err) {
      console.error("[v0] Failed to fetch players:", err)
    }
  }

  const searchPlayers = async (query) => {
    try {
      setSearchLoading(true)
      const token = getAuthToken()
      const response = await fetch(`/api/agent/players?search=${encodeURIComponent(query)}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setPlayers(data.data.players)
      }
    } catch (err) {
      console.error("[v0] Failed to search players:", err)
    } finally {
      setSearchLoading(false)
    }
  }

  const fetchCreditInfo = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch("/api/agent/credit", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setCreditInfo({
          availableCredit: data.credit.availableCredit,
          creditLimit: data.credit.creditLimit,
          usedCredit: data.credit.usedCredit,
          walletBalance: data.credit.walletBalance || 0,
        })
      }
    } catch (err) {
      console.error("[v0] Failed to fetch credit info:", err)
    }
  }

  const fetchSalesHistory = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const response = await fetch("/api/agent/sell-credits?today=true", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setRecentTransactions(data.data.transactions)
        setSalesStats({
          todaySales: data.data.stats.todaySales,
          todayCommission: data.data.stats.todayCommission,
        })
      }
    } catch (err) {
      console.error("[v0] Failed to fetch sales history:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player)
    setSearchQuery(player.phone || player.username || player.email || "")
    setShowPlayerDropdown(false)
  }

  const handleSellCredits = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const token = getAuthToken()

      const payload = {
        amount: Number.parseFloat(amount),
      }

      if (selectedPlayer) {
        payload.playerId = selectedPlayer._id
      } else {
        // Determine what type of identifier was entered
        if (searchQuery.includes("@")) {
          payload.email = searchQuery
        } else if (searchQuery.startsWith("+") || /^\d+$/.test(searchQuery)) {
          payload.customerPhone = searchQuery
        } else {
          payload.username = searchQuery
        }
      }

      const response = await fetch("/api/agent/sell-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to sell credits")
      }

      setLastSale({
        identifier: selectedPlayer?.fullName || selectedPlayer?.phone || searchQuery,
        amount: Number.parseFloat(amount),
        commission: data.data.commission,
      })
      setShowSuccess(true)

      fetchCreditInfo()
      fetchSalesHistory()
      fetchPlayers()

      setTimeout(() => {
        setShowSuccess(false)
        setSearchQuery("")
        setSelectedPlayer(null)
        setAmount("")
        setLastSale(null)
      }, 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return then.toLocaleDateString()
  }

  const commissionRate = 10

  const totalAvailable = creditInfo.availableCredit + creditInfo.walletBalance

  return (
    <div className="flex min-h-screen bg-[#0A1A2F]">
      <AgentSidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">Sell Credits</h1>
              <p className="text-[#F5F5F5]/70 text-sm">
                Distribute credits digitally to customers - No tickets required
              </p>
            </div>
            <Link href="/a/request-credits">
              <Button
                variant="outline"
                className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Request More Credits
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#0F2D4A] border-[#1A3A5C]">
              <CardContent className="p-4">
                <div className="text-[#F5F5F5]/70 text-sm">Available Credits</div>
                <div className="text-2xl font-bold text-[#FFD700]">${creditInfo.availableCredit.toLocaleString()}</div>
                <div className="text-xs text-[#F5F5F5]/50 mt-1">Limit: ${creditInfo.creditLimit.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#0F2D4A] border-[#1A3A5C]">
              <CardContent className="p-4">
                <div className="text-[#F5F5F5]/70 text-sm">Wallet Balance</div>
                <div className="text-2xl font-bold text-green-400">${creditInfo.walletBalance.toLocaleString()}</div>
                <div className="text-xs text-[#F5F5F5]/50 mt-1">
                  Total Available: ${totalAvailable.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0F2D4A] border-[#1A3A5C]">
              <CardContent className="p-4">
                <div className="text-[#F5F5F5]/70 text-sm">Today's Sales</div>
                <div className="text-2xl font-bold text-white">${salesStats.todaySales.toLocaleString()}</div>
                <div className="text-xs text-green-400 mt-1">
                  +${salesStats.todayCommission.toLocaleString()} commission
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sell Credits Form */}
          <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-[#FFD700]" />
                Digital Credit Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Credits Sent Successfully!</h3>
                  <p className="text-[#F5F5F5]">
                    ${lastSale?.amount} has been credited to {lastSale?.identifier}
                  </p>
                  <p className="text-green-400 mt-2">Your commission: ${lastSale?.commission?.toFixed(2)}</p>
                </div>
              ) : (
                <form onSubmit={handleSellCredits} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg">{error}</div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-white">Search Customer By</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={searchType === "phone" ? "default" : "outline"}
                        onClick={() => setSearchType("phone")}
                        className={
                          searchType === "phone"
                            ? "bg-[#FFD700] text-[#0A1A2F]"
                            : "border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                        }
                        size="sm"
                      >
                        <Phone className="w-4 h-4 mr-1" /> Phone
                      </Button>
                      <Button
                        type="button"
                        variant={searchType === "username" ? "default" : "outline"}
                        onClick={() => setSearchType("username")}
                        className={
                          searchType === "username"
                            ? "bg-[#FFD700] text-[#0A1A2F]"
                            : "border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                        }
                        size="sm"
                      >
                        <AtSign className="w-4 h-4 mr-1" /> Username
                      </Button>
                      <Button
                        type="button"
                        variant={searchType === "email" ? "default" : "outline"}
                        onClick={() => setSearchType("email")}
                        className={
                          searchType === "email"
                            ? "bg-[#FFD700] text-[#0A1A2F]"
                            : "border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                        }
                        size="sm"
                      >
                        <Mail className="w-4 h-4 mr-1" /> Email
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="customer" className="text-white">
                      Find Customer
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="customer"
                        type="text"
                        placeholder={
                          searchType === "phone"
                            ? "Enter phone number..."
                            : searchType === "username"
                              ? "Enter username..."
                              : "Enter email address..."
                        }
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setSelectedPlayer(null)
                          setShowPlayerDropdown(true)
                        }}
                        onFocus={() => setShowPlayerDropdown(true)}
                        required
                        className="pl-10 bg-white/5 border-[#FFD700]/30 text-white placeholder:text-gray-400"
                      />
                      {searchLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#FFD700]" />
                      )}
                    </div>

                    {/* Player Dropdown */}
                    {showPlayerDropdown && players.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg shadow-lg">
                        {players.map((player) => (
                          <button
                            key={player._id}
                            type="button"
                            onClick={() => handleSelectPlayer(player)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#FFD700]/10 transition-colors text-left border-b border-[#FFD700]/10 last:border-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-[#FFD700]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {player.fullName || player.username || "Unknown"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-[#F5F5F5]/70">
                                {player.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {player.phone}
                                  </span>
                                )}
                                {player.email && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Mail className="w-3 h-3" /> {player.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Player Display */}
                  {selectedPlayer && (
                    <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#FFD700]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{selectedPlayer.fullName || selectedPlayer.username}</p>
                        <p className="text-xs text-[#F5F5F5]/70">{selectedPlayer.phone || selectedPlayer.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPlayer(null)
                          setSearchQuery("")
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Clear
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-white">
                      Amount (USD)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      min="1"
                      max={totalAvailable}
                      className="bg-white/5 border-[#FFD700]/30 text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant={amount === value.toString() ? "default" : "outline"}
                        onClick={() => setAmount(value.toString())}
                        disabled={value > totalAvailable}
                        className={
                          amount === value.toString()
                            ? "bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
                            : "border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/10 hover:border-[#FFD700]"
                        }
                      >
                        ${value}
                      </Button>
                    ))}
                  </div>

                  {amount && Number.parseFloat(amount) > totalAvailable && (
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                      Insufficient funds. You have ${totalAvailable.toLocaleString()} available.
                    </div>
                  )}

                  {/* Commission Preview */}
                  {amount && Number.parseFloat(amount) <= totalAvailable && (
                    <div className="bg-[#FFD700]/10 border border-[#FFD700] rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#F5F5F5]">Customer receives:</span>
                        <span className="text-white font-bold">${amount}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[#F5F5F5]">Your commission ({commissionRate}%):</span>
                        <span className="text-green-400 font-bold">
                          ${((Number.parseFloat(amount) * commissionRate) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      !selectedPlayer ||
                      !amount ||
                      submitting ||
                      Number.parseFloat(amount) > totalAvailable ||
                      Number.parseFloat(amount) <= 0
                    }
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Credits
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-6 h-6 text-[#FFD700]" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-[#F5F5F5]/70">
                  No transactions yet. Start selling credits to see them here.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="relative flex items-center justify-between p-4 bg-[#0A1A2F]/50 rounded-lg border-4 border-[#FFD700]/20"
                    >
                      <Badge className="absolute -top-3 right-3 bg-green-500 text-white">{txn.status}</Badge>
                      <div>
                        <p className="text-white font-medium">{txn.playerName || txn.phone}</p>
                        <p className="text-sm text-[#F5F5F5]">
                          {txn.transactionId} • {formatTimeAgo(txn.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">${txn.amount}</p>
                        <p className="text-sm text-green-400">+${txn.commission} commission</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
