"use client"
import { useState, useEffect } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getAuthToken } from "@/lib/auth-service"
import { Search, MoreVertical, CheckCircle, XCircle, Ban, Flag, Eye, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function BetManagement() {
  const [filterStatus, setFilterStatus] = useState("all")
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedBet, setSelectedBet] = useState(null)
  const [actionDialog, setActionDialog] = useState({ open: false, action: null, bet: null })
  const [actionReason, setActionReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [detailsDialog, setDetailsDialog] = useState({ open: false, bet: null })

  useEffect(() => {
    fetchBets()
  }, [filterStatus])

  const fetchBets = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)

      const res = await fetch(`/api/super/bets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setBets(data.bets || [])
      }
    } catch (error) {
      console.error("Error fetching bets:", error)
      toast.error("Failed to load bets")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!actionDialog.bet || !actionDialog.action) return

    try {
      setActionLoading(true)
      const token = getAuthToken()

      const res = await fetch(`/api/super/bets/${actionDialog.bet._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: actionDialog.action,
          reason: actionReason,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Bet ${actionDialog.action.replace("_", " ")} successfully`)
        fetchBets()
        setActionDialog({ open: false, action: null, bet: null })
        setActionReason("")
      } else {
        toast.error(data.error || "Action failed")
      }
    } catch (error) {
      console.error("Error performing action:", error)
      toast.error("Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const getActionTitle = (action) => {
    switch (action) {
      case "void":
        return "Void Bet"
      case "settle_won":
        return "Settle as Won"
      case "settle_lost":
        return "Settle as Lost"
      case "flag_review":
        return "Flag for Review"
      default:
        return "Confirm Action"
    }
  }

  const getActionDescription = (action) => {
    switch (action) {
      case "void":
        return "This will void the bet and refund the stake to the user's wallet."
      case "settle_won":
        return "This will settle the bet as won and credit the winnings to the user's wallet."
      case "settle_lost":
        return "This will settle the bet as lost. No payout will be made."
      case "flag_review":
        return "This will flag the bet for manual review."
      default:
        return ""
    }
  }

  const filteredBets = bets.filter((bet) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      bet.ticketNumber?.toLowerCase().includes(searchLower) ||
      bet.userId?.username?.toLowerCase().includes(searchLower) ||
      bet.userId?.email?.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (amount) => {
    const rounded = Math.round((amount || 0) * 100) / 100
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(rounded)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="text-[#F5F5F5]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bet Management</h1>
        <p className="text-muted-foreground">Monitor and manage all betting activity</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "won", "lost", "void", "cashout"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterStatus === status
                  ? "bg-[#FFD700] text-[#0A1A2F]"
                  : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B8C5D6]" />
          <Input
            placeholder="Search by ticket or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
          />
        </div>
      </div>

      <Card3D>
        <div className="glass p-6 rounded-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
            </div>
          ) : filteredBets.length === 0 ? (
            <div className="text-center py-12 text-[#B8C5D6]">No bets found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A3F55]">
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Ticket #</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Selections</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Stake</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Odds</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Potential Win</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBets.map((bet) => (
                    <tr key={bet._id} className="border-b border-[#2A3F55]/50 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-mono text-sm">
                        {bet.ticketNumber || bet._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{bet.userId?.username || "Unknown"}</p>
                          <p className="text-xs text-[#B8C5D6]">{bet.userId?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize">{bet.type}</td>
                      <td className="py-4 px-4">
                        <div className="max-w-[200px]">
                          {bet.selections?.slice(0, 2).map((s, i) => (
                            <p key={i} className="text-sm truncate">
                              {s.eventName} - {s.selectionName}
                            </p>
                          ))}
                          {bet.selections?.length > 2 && (
                            <p className="text-xs text-[#B8C5D6]">+{bet.selections.length - 2} more</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold">{formatCurrency(bet.stake)}</td>
                      <td className="py-4 px-4 text-[#FFD700]">{bet.totalOdds?.toFixed(2)}</td>
                      <td className="py-4 px-4 font-bold text-green-400">{formatCurrency(bet.potentialWin)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            bet.status === "won"
                              ? "bg-green-500/20 text-green-400"
                              : bet.status === "lost"
                                ? "bg-red-500/20 text-red-400"
                                : bet.status === "void"
                                  ? "bg-gray-500/20 text-gray-400"
                                  : bet.status === "cashout"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {bet.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{formatDate(bet.createdAt)}</td>
                      <td className="py-4 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A2F45] border-[#2A3F55]">
                            <DropdownMenuItem
                              onClick={() => setDetailsDialog({ open: true, bet })}
                              className="text-[#F5F5F5] focus:bg-[#2A3F55]"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#2A3F55]" />
                            {bet.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setActionDialog({ open: true, action: "settle_won", bet })}
                                  className="text-green-400 focus:bg-[#2A3F55] focus:text-green-400"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Settle as Won
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setActionDialog({ open: true, action: "settle_lost", bet })}
                                  className="text-red-400 focus:bg-[#2A3F55] focus:text-red-400"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Settle as Lost
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setActionDialog({ open: true, action: "void", bet })}
                                  className="text-gray-400 focus:bg-[#2A3F55] focus:text-gray-400"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Void Bet
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => setActionDialog({ open: true, action: "flag_review", bet })}
                              className="text-yellow-400 focus:bg-[#2A3F55] focus:text-yellow-400"
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Flag for Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card3D>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => !open && setActionDialog({ open: false, action: null, bet: null })}
      >
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
          <DialogHeader>
            <DialogTitle>{getActionTitle(actionDialog.action)}</DialogTitle>
            <DialogDescription className="text-[#B8C5D6]">
              {getActionDescription(actionDialog.action)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[#1A2F45] p-4 rounded-lg space-y-2">
              <p>
                <span className="text-[#B8C5D6]">Ticket:</span> {actionDialog.bet?.ticketNumber}
              </p>
              <p>
                <span className="text-[#B8C5D6]">User:</span> {actionDialog.bet?.userId?.username}
              </p>
              <p>
                <span className="text-[#B8C5D6]">Stake:</span> {formatCurrency(actionDialog.bet?.stake)}
              </p>
              <p>
                <span className="text-[#B8C5D6]">Potential Win:</span> {formatCurrency(actionDialog.bet?.potentialWin)}
              </p>
            </div>
            <div>
              <label className="text-sm text-[#B8C5D6] mb-2 block">Reason (optional)</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: null, bet: null })}
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bet Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => !open && setDetailsDialog({ open: false, bet: null })}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bet Details</DialogTitle>
          </DialogHeader>
          {detailsDialog.bet && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Ticket Number</p>
                  <p className="font-mono">{detailsDialog.bet.ticketNumber}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Status</p>
                  <p className="capitalize font-bold">{detailsDialog.bet.status}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">User</p>
                  <p>{detailsDialog.bet.userId?.username}</p>
                  <p className="text-xs text-[#B8C5D6]">{detailsDialog.bet.userId?.email}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Tenant</p>
                  <p>{detailsDialog.bet.tenantId?.name || "N/A"}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Stake</p>
                  <p className="font-bold">{formatCurrency(detailsDialog.bet.stake)}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Potential Win</p>
                  <p className="font-bold text-green-400">{formatCurrency(detailsDialog.bet.potentialWin)}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Total Odds</p>
                  <p className="text-[#FFD700]">{detailsDialog.bet.totalOdds?.toFixed(2)}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Type</p>
                  <p className="capitalize">{detailsDialog.bet.type}</p>
                </div>
              </div>

              <div className="bg-[#1A2F45] p-4 rounded-lg">
                <p className="text-[#B8C5D6] text-sm mb-3">Selections ({detailsDialog.bet.selections?.length})</p>
                <div className="space-y-2">
                  {detailsDialog.bet.selections?.map((s, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center border-b border-[#2A3F55] pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{s.eventName}</p>
                        <p className="text-sm text-[#B8C5D6]">
                          {s.marketName} - {s.selectionName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#FFD700]">{s.odds?.toFixed(2)}</p>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            s.status === "won"
                              ? "bg-green-500/20 text-green-400"
                              : s.status === "lost"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#B8C5D6]">Placed:</span> {formatDate(detailsDialog.bet.createdAt)}
                </div>
                {detailsDialog.bet.settledAt && (
                  <div>
                    <span className="text-[#B8C5D6]">Settled:</span> {formatDate(detailsDialog.bet.settledAt)}
                    <span className="ml-2 text-xs">({detailsDialog.bet.settledBy})</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
