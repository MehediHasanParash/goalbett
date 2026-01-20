"use client"
import { useState, useEffect, useCallback } from "react"
import { Card3D } from "@/components/ui/3d-card"
import {
  Trash2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  FileText,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export function AgentControls() {
  const [bets, setBets] = useState([])
  const [stats, setStats] = useState({ pendingBets: 0, betsToday: 0, totalStakeToday: 0 })
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedBet, setExpandedBet] = useState(null)
  const deletionWindow = 4 // 4 minutes

  const fetchBets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = getAuthToken()
      const response = await fetch("/api/super/bets/recent?status=pending&limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (data.success) {
        setBets(data.bets || [])
        setStats(data.stats || { pendingBets: 0, betsToday: 0, totalStakeToday: 0 })
      } else {
        setError(data.error || "Failed to fetch bets")
      }
    } catch (err) {
      setError("Failed to connect to server")
      console.error("Fetch bets error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBets()
    // Refresh every 30 seconds
    const interval = setInterval(fetchBets, 30000)
    return () => clearInterval(interval)
  }, [fetchBets])

  const deleteBet = async (betId, ticketNumber) => {
    if (!confirm(`Are you sure you want to delete bet ${ticketNumber}? The stake will be refunded to the player.`)) {
      return
    }

    try {
      setDeleting(betId)
      const token = getAuthToken()
      const response = await fetch(`/api/super/bets/${betId}/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (data.success) {
        setBets((prev) => prev.filter((bet) => bet.id !== betId))
        setStats((prev) => ({
          ...prev,
          pendingBets: Math.max(0, prev.pendingBets - 1),
        }))
      } else {
        alert(data.error || "Failed to delete bet")
      }
    } catch (err) {
      alert("Failed to delete bet")
      console.error("Delete bet error:", err)
    } finally {
      setDeleting(null)
    }
  }

  const filteredBets = bets.filter((bet) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      bet.ticketNumber?.toLowerCase().includes(search) ||
      bet.user?.username?.toLowerCase().includes(search) ||
      bet.user?.fullName?.toLowerCase().includes(search) ||
      bet.user?.phone?.includes(search)
    )
  })

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Agent Controls</h2>
          <p className="text-muted-foreground">Manage player slips and deletions</p>
        </div>
        <button
          onClick={fetchBets}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#2A3F55] hover:bg-[#3A5068] rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card3D>
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <FileText className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Bets</p>
                <p className="text-2xl font-bold">{stats.pendingBets}</p>
              </div>
            </div>
          </div>
        </Card3D>
        <Card3D>
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bets Today</p>
                <p className="text-2xl font-bold">{stats.betsToday}</p>
              </div>
            </div>
          </div>
        </Card3D>
        <Card3D>
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stake Today</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalStakeToday)}</p>
              </div>
            </div>
          </div>
        </Card3D>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by ticket number, username, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#1A2A3A] border border-[#2A3F55] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
        />
      </div>

      {/* Error Message */}
      {error && (
        <Card3D>
          <div className="glass p-4 rounded-2xl bg-red-500/20 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        </Card3D>
      )}

      {/* Loading State */}
      {loading && bets.length === 0 ? (
        <Card3D>
          <div className="glass p-8 rounded-2xl text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading bets...</p>
          </div>
        </Card3D>
      ) : filteredBets.length === 0 ? (
        <Card3D>
          <div className="glass p-8 rounded-2xl text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchTerm ? "No bets match your search" : "No active pending bets"}
            </p>
          </div>
        </Card3D>
      ) : (
        <div className="space-y-3">
          {filteredBets.map((bet) => (
            <Card3D key={bet.id}>
              <div className="glass p-6 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-lg">{bet.ticketNumber}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bet.type === "single"
                            ? "bg-blue-500/20 text-blue-400"
                            : bet.type === "multiple"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-orange-500/20 text-orange-400"
                        }`}
                      >
                        {bet.type?.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                        {bet.selectionsCount} selection{bet.selectionsCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Player</p>
                        <p className="font-medium">{bet.user?.username || bet.user?.fullName || "Unknown"}</p>
                        {bet.user?.phone && <p className="text-xs text-muted-foreground">{bet.user.phone}</p>}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stake</p>
                        <p className="font-bold text-[#FFD700]">{formatCurrency(bet.stake, bet.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Odds</p>
                        <p className="font-medium">{bet.totalOdds?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Potential Win</p>
                        <p className="font-medium text-green-400">{formatCurrency(bet.potentialWin, bet.currency)}</p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      <span>Created: {formatTime(bet.createdAt)}</span>
                      {bet.agent && <span className="ml-4">Agent: {bet.agent.username || bet.agent.fullName}</span>}
                      {bet.tenant && <span className="ml-4">Tenant: {bet.tenant.name}</span>}
                    </div>

                    {/* Expandable Selections */}
                    {bet.selections && bet.selections.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
                          className="flex items-center gap-2 text-sm text-[#FFD700] hover:underline"
                        >
                          {expandedBet === bet.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          View Selections
                        </button>
                        {expandedBet === bet.id && (
                          <div className="mt-2 space-y-2 p-3 bg-[#1A2A3A] rounded-lg">
                            {bet.selections.map((sel, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <div>
                                  <p className="font-medium">{sel.eventName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {sel.marketName}: {sel.selectionName}
                                  </p>
                                </div>
                                <span className="font-bold">{sel.odds?.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delete Action */}
                  <div className="text-right shrink-0">
                    {bet.canDelete ? (
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-orange-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-bold">{bet.timeRemaining}m left</span>
                        </div>
                        <button
                          onClick={() => deleteBet(bet.id, bet.ticketNumber)}
                          disabled={deleting === bet.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold text-sm disabled:opacity-50"
                        >
                          {deleting === bet.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete & Refund
                        </button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs">Window closed</span>
                        </div>
                        <button
                          disabled
                          className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg cursor-not-allowed font-bold text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      )}

      {/* Slip Deletion Rules */}
      <Card3D>
        <div className="glass p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          <h3 className="font-bold mb-2">Slip Deletion Rules</h3>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li>• Agents and admins can delete pending bets within {deletionWindow} minutes of creation</li>
            <li>• After {deletionWindow} minutes, the bet becomes permanent and cannot be deleted</li>
            <li>• Deleting a bet automatically refunds the stake to the player&apos;s balance</li>
            <li>• All deletions are logged in the audit trail for compliance</li>
            <li>• Only pending bets can be deleted - settled bets cannot be removed</li>
          </ul>
        </div>
      </Card3D>
    </div>
  )
}
