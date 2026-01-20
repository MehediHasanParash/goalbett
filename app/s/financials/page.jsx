"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Search,
  MoreVertical,
  Eye,
  RotateCcw,
  Ban,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { getAuthToken, getUser } from "@/lib/auth-service"

export default function FinancialsPage() {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayouts: 0,
    pendingPayoutsCount: 0,
    todayDeposits: 0,
    commissionPaid: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })

  // Dialogs
  const [detailsDialog, setDetailsDialog] = useState({ open: false, transaction: null })
  const [actionDialog, setActionDialog] = useState({ open: false, transaction: null, action: null })
  const [actionReason, setActionReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [filter, pagination.page])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()

      let url = `/api/super/transactions?page=${pagination.page}&limit=${pagination.limit}`
      if (filter !== "all") {
        if (filter === "pending") {
          url += `&status=pending`
        } else {
          url += `&type=${filter}`
        }
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setTransactions(data.data)
        setStats(data.stats)
        setPagination((prev) => ({ ...prev, ...data.pagination }))
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!actionDialog.transaction || !actionDialog.action) return

    try {
      setActionLoading(true)
      const token = getAuthToken()
      const user = getUser()

      const res = await fetch(`/api/super/transactions/${actionDialog.transaction._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: actionDialog.action,
          reason: actionReason,
          adminId: user?.id,
        }),
      })

      const data = await res.json()
      if (data.success) {
        fetchTransactions()
        setActionDialog({ open: false, transaction: null, action: null })
        setActionReason("")
      } else {
        alert(data.error || "Action failed")
      }
    } catch (error) {
      console.error("Error performing action:", error)
      alert("Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const formatAmount = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
    return `$${amount.toFixed(2)}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeLabel = (type) => {
    const labels = {
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      bet_placed: "Bet Placed",
      bet_won: "Bet Won",
      bet_lost: "Bet Lost",
      bet_refund: "Bet Refund",
      bonus_credit: "Bonus Credit",
      bonus_debit: "Bonus Debit",
      commission: "Commission",
      adjustment: "Adjustment",
      tenant_topup: "Tenant Topup",
      tenant_credit_line: "Credit Line",
      tenant_adjustment: "Tenant Adj.",
      agent_topup: "Agent Topup",
      transfer_in: "Transfer In",
      transfer_out: "Transfer Out",
    }
    return labels[type] || type
  }

  const getTypeColor = (type) => {
    if (["deposit", "tenant_topup", "agent_topup", "bet_won", "bonus_credit", "transfer_in"].includes(type)) {
      return "bg-green-500/20 text-green-400"
    }
    if (["withdrawal", "bet_placed", "bet_lost", "bonus_debit", "transfer_out"].includes(type)) {
      return "bg-orange-500/20 text-orange-400"
    }
    if (["commission"].includes(type)) {
      return "bg-cyan-500/20 text-cyan-400"
    }
    return "bg-blue-500/20 text-blue-400"
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "failed":
        return "bg-red-500/20 text-red-400"
      case "cancelled":
        return "bg-gray-500/20 text-gray-400"
      case "reversed":
        return "bg-purple-500/20 text-purple-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      t._id?.toLowerCase().includes(searchLower) ||
      t.userId?.username?.toLowerCase().includes(searchLower) ||
      t.userId?.email?.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower)
    )
  })

  const exportCSV = () => {
    const headers = ["ID", "Type", "User", "Amount", "Currency", "Status", "Description", "Date"]
    const rows = filteredTransactions.map((t) => [
      t._id,
      t.type,
      t.userId?.username || "N/A",
      t.amount,
      t.currency,
      t.status,
      t.description || "",
      new Date(t.createdAt).toISOString(),
    ])

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <SuperAdminLayout title="Financial Management" description="Monitor revenue, payments, and reconciliation">
      <div className="space-y-6">
        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-[#B8C5D6]">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-400">{formatAmount(stats.totalRevenue)}</p>
                  <p className="text-xs text-green-400 mt-1">All time deposits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700]/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#FFD700]/20">
                  <Clock className="h-6 w-6 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-sm text-[#B8C5D6]">Pending Payouts</p>
                  <p className="text-3xl font-bold text-[#FFD700]">{formatAmount(stats.pendingPayouts)}</p>
                  <p className="text-xs text-[#FFD700] mt-1">{stats.pendingPayoutsCount} transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-cyan-500/20">
                  <TrendingUp className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-[#B8C5D6]">Commission Paid</p>
                  <p className="text-3xl font-bold text-cyan-400">{formatAmount(stats.commissionPaid)}</p>
                  <p className="text-xs text-cyan-400 mt-1">Last 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <CreditCard className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-[#B8C5D6]">Today's Deposits</p>
                  <p className="text-3xl font-bold text-purple-400">{formatAmount(stats.todayDeposits)}</p>
                  <p className="text-xs text-purple-400 mt-1">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#FFD700]">Recent Transactions</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-[#1A2F45] border-[#2A3F55] text-white w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                onClick={fetchTransactions}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                onClick={exportCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { key: "all", label: "All" },
                { key: "deposits", label: "Deposits" },
                { key: "withdrawals", label: "Withdrawals" },
                { key: "bets", label: "Bets" },
                { key: "pending", label: "Pending" },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  size="sm"
                  variant={filter === tab.key ? "default" : "outline"}
                  onClick={() => setFilter(tab.key)}
                  className={
                    filter === tab.key
                      ? "bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
                      : "border-[#2A3F55] text-[#B8C5D6] bg-transparent hover:bg-[#1A2F45]"
                  }
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Transactions Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2A3F55]">
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Transaction ID</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">User</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Tenant</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Balance Change</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-[#B8C5D6]">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((txn) => (
                        <tr key={txn._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                          <td className="py-3 px-4 text-[#F5F5F5] font-mono text-sm">
                            {txn._id?.slice(-8).toUpperCase()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getTypeColor(txn.type)}>
                              {["deposit", "bet_won", "bonus_credit", "transfer_in"].includes(txn.type) ? (
                                <ArrowDownLeft className="w-3 h-3 mr-1" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                              )}
                              {getTypeLabel(txn.type)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-[#F5F5F5] text-sm">{txn.userId?.username || "N/A"}</p>
                              <p className="text-[#B8C5D6] text-xs">{txn.userId?.email || ""}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#B8C5D6]">{txn.tenantId?.name || "N/A"}</td>
                          <td className="py-3 px-4">
                            <span className={txn.amount >= 0 ? "text-green-400" : "text-red-400"}>
                              {txn.amount >= 0 ? "+" : ""}
                              {txn.currency} {Math.abs(txn.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#B8C5D6] text-sm">
                            {txn.balanceBefore?.toFixed(2)} → {txn.balanceAfter?.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(txn.status)}>
                              {txn.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {txn.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                              {txn.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {txn.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-[#B8C5D6] text-sm">{formatDate(txn.createdAt)}</td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4 text-[#B8C5D6]" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#1A2F45] border-[#2A3F55]">
                                <DropdownMenuItem
                                  className="text-[#B8C5D6] hover:bg-[#2A3F55]"
                                  onClick={() => setDetailsDialog({ open: true, transaction: txn })}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {txn.status === "pending" && (
                                  <>
                                    <DropdownMenuSeparator className="bg-[#2A3F55]" />
                                    <DropdownMenuItem
                                      className="text-green-400 hover:bg-[#2A3F55]"
                                      onClick={() =>
                                        setActionDialog({ open: true, transaction: txn, action: "approve" })
                                      }
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-400 hover:bg-[#2A3F55]"
                                      onClick={() =>
                                        setActionDialog({ open: true, transaction: txn, action: "reject" })
                                      }
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-gray-400 hover:bg-[#2A3F55]"
                                      onClick={() =>
                                        setActionDialog({ open: true, transaction: txn, action: "cancel" })
                                      }
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {txn.status === "completed" && (
                                  <>
                                    <DropdownMenuSeparator className="bg-[#2A3F55]" />
                                    <DropdownMenuItem
                                      className="text-purple-400 hover:bg-[#2A3F55]"
                                      onClick={() =>
                                        setActionDialog({ open: true, transaction: txn, action: "reverse" })
                                      }
                                    >
                                      <RotateCcw className="w-4 h-4 mr-2" />
                                      Reverse
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-[#B8C5D6]">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ open, transaction: null })}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">Transaction Details</DialogTitle>
          </DialogHeader>
          {detailsDialog.transaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Transaction ID</p>
                  <p className="font-mono text-sm">{detailsDialog.transaction._id}</p>
                </div>
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Status</p>
                  <Badge className={getStatusColor(detailsDialog.transaction.status)}>
                    {detailsDialog.transaction.status}
                  </Badge>
                </div>
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Type</p>
                  <Badge className={getTypeColor(detailsDialog.transaction.type)}>
                    {getTypeLabel(detailsDialog.transaction.type)}
                  </Badge>
                </div>
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Amount</p>
                  <p
                    className={`font-bold ${detailsDialog.transaction.amount >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {detailsDialog.transaction.currency} {detailsDialog.transaction.amount}
                  </p>
                </div>
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">User</p>
                  <p>{detailsDialog.transaction.userId?.username || "N/A"}</p>
                  <p className="text-xs text-[#B8C5D6]">{detailsDialog.transaction.userId?.email}</p>
                </div>
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Tenant</p>
                  <p>{detailsDialog.transaction.tenantId?.name || "N/A"}</p>
                </div>
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Balance Before</p>
                  <p>
                    {detailsDialog.transaction.currency} {detailsDialog.transaction.balanceBefore}
                  </p>
                </div>
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Balance After</p>
                  <p>
                    {detailsDialog.transaction.currency} {detailsDialog.transaction.balanceAfter}
                  </p>
                </div>
              </div>
              {detailsDialog.transaction.description && (
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Description</p>
                  <p>{detailsDialog.transaction.description}</p>
                </div>
              )}
              {detailsDialog.transaction.betId && (
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Related Bet</p>
                  <p className="font-mono">
                    {detailsDialog.transaction.betId?.ticketNumber || detailsDialog.transaction.betId}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Created At</p>
                  <p>{formatDate(detailsDialog.transaction.createdAt)}</p>
                </div>
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6]">Processed By</p>
                  <p>{detailsDialog.transaction.processedBy?.username || "System"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          setActionDialog({ open, transaction: null, action: null })
          setActionReason("")
        }}
      >
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700] capitalize">{actionDialog.action} Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[#B8C5D6]">
              Are you sure you want to <span className="font-bold">{actionDialog.action}</span> this transaction?
            </p>
            {actionDialog.transaction && (
              <div className="p-3 bg-[#1A2F45] rounded-lg">
                <p className="text-sm">
                  <span className="text-[#B8C5D6]">Amount:</span>{" "}
                  <span className="text-[#FFD700]">
                    {actionDialog.transaction.currency} {actionDialog.transaction.amount}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-[#B8C5D6]">Type:</span> {getTypeLabel(actionDialog.transaction.type)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-[#B8C5D6]">Reason (optional)</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                className="mt-1 bg-[#1A2F45] border-[#2A3F55] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, transaction: null, action: null })
                setActionReason("")
              }}
              className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              className={
                actionDialog.action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : actionDialog.action === "reject" || actionDialog.action === "cancel"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-purple-600 hover:bg-purple-700"
              }
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm {actionDialog.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}
