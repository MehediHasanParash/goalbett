"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Wallet,
  BookOpen,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  MoreVertical,
  Eye,
  RotateCcw,
  CheckCircle,
  Users,
  Building2,
  Briefcase,
  FileText,
  PieChart,
  RefreshCw,
  Plus,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

const formatCurrency = (amount, currency = "USD") => {
  const rounded = Math.round((amount || 0) * 100) / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(rounded)
}

const formatCompactNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num?.toFixed(2) || "0"
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

const transactionTypeLabels = {
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  BET_PLACEMENT: "Bet Placed",
  BET_WINNING: "Bet Won",
  BET_LOSS: "Bet Lost",
  BET_REFUND: "Bet Refund",
  BONUS_CREDIT: "Bonus Credit",
  AGENT_COMMISSION: "Agent Commission",
  AGENT_SETTLEMENT: "Agent Settlement",
  OPERATOR_REVENUE_SHARE: "Revenue Share",
  MANUAL_CREDIT: "Manual Credit",
  MANUAL_DEBIT: "Manual Debit",
  INTERNAL_TRANSFER: "Transfer",
}

const statusColors = {
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  reversed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  disputed: "bg-orange-500/20 text-orange-400 border-orange-500/30",
}

export default function WalletLedgerPage() {
  const [activeTab, setActiveTab] = useState("ledger")
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState([])
  const [wallets, setWallets] = useState([])
  const [settlements, setSettlements] = useState([])
  const [stats, setStats] = useState({})
  const [walletStats, setWalletStats] = useState({})
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false)
  const [showReversalDialog, setShowReversalDialog] = useState(false)
  const [showStatementDialog, setShowStatementDialog] = useState(false)
  const [statement, setStatement] = useState([])
  const [report, setReport] = useState(null)
  const [adjustmentForm, setAdjustmentForm] = useState({
    walletId: "",
    amount: "",
    type: "credit",
    description: "",
  })
  const [reversalReason, setReversalReason] = useState("")

  const handleApproveEntry = async (entryId) => {
    const token = getAuthToken()
    try {
      const res = await fetch("/api/super/ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "approve_entry",
          entryId: entryId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      }
    } catch (error) {
      console.error("Approval error:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, typeFilter, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    const token = getAuthToken()

    try {
      if (activeTab === "ledger") {
        const params = new URLSearchParams()
        if (typeFilter !== "all") params.set("type", typeFilter)
        if (statusFilter !== "all") params.set("status", statusFilter)
        if (search) params.set("search", search)

        const res = await fetch(`/api/super/ledger?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setEntries(data.entries || [])
          setStats(data.stats || {})
        }
      } else if (activeTab === "wallets") {
        const res = await fetch(`/api/super/ledger/wallets`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setWallets(data.wallets || [])
          setWalletStats(data.stats || {})
        }
      } else if (activeTab === "settlements") {
        const res = await fetch(`/api/super/ledger/settlements`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setSettlements(data.settlements || [])
        }
      } else if (activeTab === "reports") {
        const res = await fetch(`/api/super/ledger/reports?type=financial`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setReport(data.report || {})
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualAdjustment = async () => {
    const token = getAuthToken()
    try {
      const res = await fetch("/api/super/ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "manual_adjustment",
          ...adjustmentForm,
          amount: Number.parseFloat(adjustmentForm.amount),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowAdjustmentDialog(false)
        setAdjustmentForm({ walletId: "", amount: "", type: "credit", description: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Adjustment error:", error)
    }
  }

  const handleReverseEntry = async () => {
    if (!selectedEntry) return
    const token = getAuthToken()
    try {
      const res = await fetch("/api/super/ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "reverse_entry",
          entryId: selectedEntry._id,
          reason: reversalReason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowReversalDialog(false)
        setSelectedEntry(null)
        setReversalReason("")
        fetchData()
      }
    } catch (error) {
      console.error("Reversal error:", error)
    }
  }

  const fetchStatement = async (walletId) => {
    const token = getAuthToken()
    try {
      const res = await fetch(`/api/super/ledger/statements?walletId=${walletId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      console.log("[v0] Statement data:", data)
      if (data.success) {
        setStatement(data.statement || [])
        setShowStatementDialog(true)
      } else {
        console.error("[v0] Statement error:", data.error)
        setStatement([])
        setShowStatementDialog(true)
      }
    } catch (error) {
      console.error("Statement error:", error)
      setStatement([])
      setShowStatementDialog(true)
    }
  }

  const filteredEntries = entries.filter((entry) => {
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        entry.entryNumber?.toLowerCase().includes(searchLower) || entry.description?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <SuperAdminLayout title="Wallet & Ledger" description="Double-entry accounting system for financial tracking">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-[#8A9DB8] text-sm">Total Balance</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(stats.totalBalance || walletStats.totalBalance || 0)}
          </p>
          <p className="text-xs text-[#8A9DB8] mt-1">{walletStats.totalWallets || 0} wallets</p>
        </div>

        <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ArrowUpDown className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-[#8A9DB8] text-sm">Today's Volume</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(stats.todayVolume || 0)}</p>
          <p className="text-xs text-[#8A9DB8] mt-1">{stats.todayTransactions || 0} transactions</p>
        </div>

        <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-[#8A9DB8] text-sm">Pending Approvals</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{stats.pendingApprovals || 0}</p>
          <p className="text-xs text-[#8A9DB8] mt-1">Requires review</p>
        </div>

        <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-[#8A9DB8] text-sm">Locked Funds</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {formatCurrency(stats.totalLocked || walletStats.totalLocked || 0)}
          </p>
          <p className="text-xs text-[#8A9DB8] mt-1">In pending transactions</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="bg-[#0D1F35] border border-[#2A3F55]">
            <TabsTrigger value="ledger" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              <BookOpen className="w-4 h-4 mr-2" />
              Ledger Entries
            </TabsTrigger>
            <TabsTrigger
              value="wallets"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Wallets
            </TabsTrigger>
            <TabsTrigger
              value="settlements"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Settlements
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              <PieChart className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="border-[#2A3F55] text-[#B8C5D6] hover:bg-[#1A2F45] bg-transparent"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAdjustmentDialog(true)}
              className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manual Adjustment
            </Button>
          </div>
        </div>

        {/* Ledger Entries Tab */}
        <TabsContent value="ledger" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9DB8]" />
              <Input
                placeholder="Search by entry number or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DEPOSIT">Deposits</SelectItem>
                <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
                <SelectItem value="BET_PLACEMENT">Bets Placed</SelectItem>
                <SelectItem value="BET_WINNING">Bet Winnings</SelectItem>
                <SelectItem value="BONUS_CREDIT">Bonuses</SelectItem>
                <SelectItem value="AGENT_COMMISSION">Commissions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ledger Table */}
          <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1A2F45]">
                  <tr>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Entry #</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Type</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Debit</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Credit</th>
                    <th className="text-right p-4 text-[#8A9DB8] font-medium text-sm">Amount</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Status</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Date</th>
                    <th className="text-center p-4 text-[#8A9DB8] font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-[#8A9DB8]">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-[#8A9DB8]">
                        No ledger entries found
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry._id} className="border-t border-[#2A3F55] hover:bg-[#1A2F45]/50">
                        <td className="p-4">
                          <span className="text-[#F5F5F5] font-mono text-sm">
                            {entry.entryNumber || `LE-${entry._id.toString().slice(-8).toUpperCase()}`}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="border-[#2A3F55] text-[#B8C5D6]">
                            {transactionTypeLabels[entry.transactionType] || entry.transactionType}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <ArrowLeft className="w-3 h-3 text-red-400" />
                            <span className="text-[#F5F5F5] text-sm">
                              {entry.debitAccount?.accountName || entry.debitAccount?.userId?.name || "System"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-green-400" />
                            <span className="text-[#F5F5F5] text-sm">
                              {entry.creditAccount?.accountName || entry.creditAccount?.userId?.name || "System"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-[#F5F5F5] font-medium">
                            {formatCurrency(entry.amount, entry.currency)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={statusColors[entry.status]}>{entry.status}</Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-[#8A9DB8] text-sm">{formatDate(entry.createdAt)}</span>
                        </td>
                        <td className="p-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-[#8A9DB8]">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0D1F35] border-[#2A3F55]">
                              <DropdownMenuItem
                                onClick={() => setSelectedEntry(entry)}
                                className="text-[#F5F5F5] hover:bg-[#1A2F45]"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {entry.status === "completed" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedEntry(entry)
                                    setShowReversalDialog(true)
                                  }}
                                  className="text-red-400 hover:bg-[#1A2F45]"
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Reverse Entry
                                </DropdownMenuItem>
                              )}
                              {entry.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() => handleApproveEntry(entry._id)}
                                  className="text-green-400 hover:bg-[#1A2F45]"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
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
          </div>
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets" className="space-y-4">
          <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1A2F45]">
                  <tr>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">User</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Type</th>
                    <th className="text-right p-4 text-[#8A9DB8] font-medium text-sm">Available</th>
                    <th className="text-right p-4 text-[#8A9DB8] font-medium text-sm">Locked</th>
                    <th className="text-right p-4 text-[#8A9DB8] font-medium text-sm">Bonus</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Status</th>
                    <th className="text-center p-4 text-[#8A9DB8] font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-[#8A9DB8]">
                        Loading...
                      </td>
                    </tr>
                  ) : wallets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-[#8A9DB8]">
                        No wallets found
                      </td>
                    </tr>
                  ) : (
                    wallets.map((wallet) => (
                      <tr key={wallet._id} className="border-t border-[#2A3F55] hover:bg-[#1A2F45]/50">
                        <td className="p-4">
                          <div>
                            <p className="text-[#F5F5F5] font-medium">
                              {wallet.userId?.name ||
                                wallet.userId?.fullName ||
                                wallet.tenantId?.name ||
                                (wallet.userId?.email ? wallet.userId.email.split("@")[0] : null) ||
                                `Wallet #${wallet._id?.toString().slice(-6)}`}
                            </p>
                            <p className="text-[#8A9DB8] text-sm">
                              {wallet.userId?.email || wallet.tenantId?.email || ""}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="border-[#2A3F55] text-[#B8C5D6]">
                            {wallet.userId?.role || "tenant"}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-green-400 font-medium">
                            {formatCurrency(wallet.availableBalance, wallet.currency)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-yellow-400">
                            {formatCurrency(wallet.lockedBalance, wallet.currency)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-purple-400">
                            {formatCurrency(wallet.bonusBalance, wallet.currency)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={
                              wallet.status === "ACTIVE"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }
                          >
                            {wallet.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-[#8A9DB8]">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0D1F35] border-[#2A3F55]">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedWallet(wallet)
                                  fetchStatement(wallet._id)
                                }}
                                className="text-[#F5F5F5] hover:bg-[#1A2F45]"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Statement
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setAdjustmentForm({ ...adjustmentForm, walletId: wallet._id })
                                  setShowAdjustmentDialog(true)
                                }}
                                className="text-[#F5F5F5] hover:bg-[#1A2F45]"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Manual Adjustment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Settlements Tab */}
        <TabsContent value="settlements" className="space-y-4">
          <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1A2F45]">
                  <tr>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Settlement #</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Beneficiary</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Type</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Period</th>
                    <th className="text-right p-4 text-[#8A9DB8] font-medium text-sm">Gross</th>
                    <th className="text-right p-4 text-[#8A9DB8] font-medium text-sm">Net</th>
                    <th className="text-left p-4 text-[#8A9DB8] font-medium text-sm">Status</th>
                    <th className="text-center p-4 text-[#8A9DB8] font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-[#8A9DB8]">
                        Loading...
                      </td>
                    </tr>
                  ) : settlements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-[#8A9DB8]">
                        No settlements found
                      </td>
                    </tr>
                  ) : (
                    settlements.map((settlement) => (
                      <tr key={settlement._id} className="border-t border-[#2A3F55] hover:bg-[#1A2F45]/50">
                        <td className="p-4">
                          <span className="text-[#F5F5F5] font-mono text-sm">{settlement.settlementNumber}</span>
                        </td>
                        <td className="p-4">
                          <p className="text-[#F5F5F5]">{settlement.beneficiaryId?.name}</p>
                          <p className="text-[#8A9DB8] text-sm">{settlement.beneficiaryId?.email}</p>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="border-[#2A3F55] text-[#B8C5D6]">
                            {settlement.settlementType?.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-4 text-[#8A9DB8] text-sm">
                          {new Date(settlement.periodStart).toLocaleDateString()} -
                          {new Date(settlement.periodEnd).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right text-[#F5F5F5]">
                          {formatCurrency(settlement.grossAmount, settlement.currency)}
                        </td>
                        <td className="p-4 text-right text-green-400 font-medium">
                          {formatCurrency(settlement.netAmount, settlement.currency)}
                        </td>
                        <td className="p-4">
                          <Badge className={statusColors[settlement.status] || statusColors.pending}>
                            {settlement.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="sm" className="text-[#8A9DB8]">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Deposits Card */}
              <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-[#F5F5F5] font-semibold">Deposits</h3>
                </div>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(report.deposits?.total || 0)}</p>
                <p className="text-sm text-[#8A9DB8] mt-1">{report.deposits?.count || 0} transactions</p>
              </div>

              {/* Withdrawals Card */}
              <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-[#F5F5F5] font-semibold">Withdrawals</h3>
                </div>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(report.withdrawals?.total || 0)}</p>
                <p className="text-sm text-[#8A9DB8] mt-1">{report.withdrawals?.count || 0} transactions</p>
              </div>

              {/* Betting Card */}
              <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-[#F5F5F5] font-semibold">Betting Activity</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8A9DB8]">Stakes:</span>
                    <span className="text-[#F5F5F5]">{formatCurrency(report.bets?.stakes || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9DB8]">Payouts:</span>
                    <span className="text-[#F5F5F5]">{formatCurrency(report.bets?.payouts || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#2A3F55] pt-2 mt-2">
                    <span className="text-[#8A9DB8]">GGR:</span>
                    <span className="text-green-400 font-medium">
                      {formatCurrency((report.bets?.stakes || 0) - (report.bets?.payouts || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bonuses Card */}
              <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-[#F5F5F5] font-semibold">Bonuses</h3>
                </div>
                <p className="text-2xl font-bold text-purple-400">{formatCurrency(report.bonuses?.total || 0)}</p>
                <p className="text-sm text-[#8A9DB8] mt-1">{report.bonuses?.count || 0} bonuses issued</p>
              </div>

              {/* Commissions Card */}
              <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Briefcase className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-[#F5F5F5] font-semibold">Commissions</h3>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{formatCurrency(report.commissions?.total || 0)}</p>
                <p className="text-sm text-[#8A9DB8] mt-1">{report.commissions?.count || 0} payouts</p>
              </div>

              {/* Net Revenue Card */}
              <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#FFD700]/20 rounded-lg">
                    <Building2 className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <h3 className="text-[#F5F5F5] font-semibold">Net Revenue</h3>
                </div>
                <p
                  className={`text-2xl font-bold ${(report.revenue?.net || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {formatCurrency(report.revenue?.net || 0)}
                </p>
                <p className="text-sm text-[#8A9DB8] mt-1">After payouts & commissions</p>
              </div>
            </div>
          )}

          {/* Transaction Type Breakdown */}
          {report?.byType && Object.keys(report.byType).length > 0 && (
            <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-semibold mb-4">Transaction Type Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(report.byType).map(([type, data]) => (
                  <div key={type} className="bg-[#1A2F45] rounded-lg p-4">
                    <p className="text-[#8A9DB8] text-sm mb-1">
                      {transactionTypeLabels[type] || type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[#F5F5F5] font-medium">{formatCurrency(data.total)}</p>
                    <p className="text-xs text-[#8A9DB8]">{data.count} txns</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Manual Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
          <DialogHeader>
            <DialogTitle>Manual Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Wallet ID</Label>
              <Input
                value={adjustmentForm.walletId}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, walletId: e.target.value })}
                placeholder="Enter wallet ID"
                className="bg-[#1A2F45] border-[#2A3F55]"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={adjustmentForm.type}
                onValueChange={(v) => setAdjustmentForm({ ...adjustmentForm, type: v })}
              >
                <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                  <SelectItem value="credit">Credit (Add funds)</SelectItem>
                  <SelectItem value="debit">Debit (Remove funds)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={adjustmentForm.amount}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                placeholder="0.00"
                className="bg-[#1A2F45] border-[#2A3F55]"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={adjustmentForm.description}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })}
                placeholder="Reason for adjustment..."
                className="bg-[#1A2F45] border-[#2A3F55]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAdjustmentDialog(false)} className="border-[#2A3F55]">
                Cancel
              </Button>
              <Button onClick={handleManualAdjustment} className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]">
                Apply Adjustment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reversal Dialog */}
      <Dialog open={showReversalDialog} onOpenChange={setShowReversalDialog}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
          <DialogHeader>
            <DialogTitle>Reverse Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[#1A2F45] rounded-lg p-4">
              <p className="text-sm text-[#8A9DB8]">Entry Number</p>
              <p className="text-[#F5F5F5] font-mono">{selectedEntry?.entryNumber}</p>
              <p className="text-sm text-[#8A9DB8] mt-2">Amount</p>
              <p className="text-[#F5F5F5]">{formatCurrency(selectedEntry?.amount)}</p>
            </div>
            <div>
              <Label>Reason for Reversal</Label>
              <Textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Enter reason for reversal..."
                className="bg-[#1A2F45] border-[#2A3F55]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReversalDialog(false)} className="border-[#2A3F55]">
                Cancel
              </Button>
              <Button onClick={handleReverseEntry} className="bg-red-500 text-white hover:bg-red-600">
                Confirm Reversal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statement Dialog */}
      <Dialog open={showStatementDialog} onOpenChange={setShowStatementDialog}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-5xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">Account Statement</DialogTitle>
            {selectedWallet && (
              <p className="text-sm text-[#8A9DB8]">
                {selectedWallet.userId?.name || selectedWallet.userId?.email || "Wallet"} - Current Balance:{" "}
                <span className="text-green-400 font-medium">
                  {formatCurrency(selectedWallet.availableBalance, selectedWallet.currency)}
                </span>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 overflow-hidden">
            {statement.length === 0 ? (
              <div className="text-center py-8 text-[#8A9DB8]">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found for this wallet</p>
                <p className="text-sm mt-2">Transactions will appear here once activity occurs</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[50vh] overflow-y-auto border border-[#2A3F55] rounded-lg">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-[#1A2F45] sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-[#8A9DB8] text-sm font-medium w-[120px]">Date</th>
                      <th className="text-left p-3 text-[#8A9DB8] text-sm font-medium w-[120px]">Entry #</th>
                      <th className="text-left p-3 text-[#8A9DB8] text-sm font-medium">Description</th>
                      <th className="text-right p-3 text-[#8A9DB8] text-sm font-medium w-[100px]">Debit</th>
                      <th className="text-right p-3 text-[#8A9DB8] text-sm font-medium w-[100px]">Credit</th>
                      <th className="text-right p-3 text-[#8A9DB8] text-sm font-medium w-[120px]">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.map((entry, idx) => (
                      <tr key={entry._id || idx} className="border-t border-[#2A3F55] hover:bg-[#1A2F45]/50">
                        <td className="p-3 text-[#8A9DB8] text-sm whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3 text-[#F5F5F5] text-sm font-mono">{entry.entryNumber || "-"}</td>
                        <td className="p-3 text-[#F5F5F5] text-sm truncate max-w-[200px]" title={entry.description}>
                          {entry.description || entry.type?.replace(/_/g, " ") || "-"}
                        </td>
                        <td className="p-3 text-right text-red-400 text-sm font-medium whitespace-nowrap">
                          {entry.isDebit ? formatCurrency(entry.amount) : "-"}
                        </td>
                        <td className="p-3 text-right text-green-400 text-sm font-medium whitespace-nowrap">
                          {!entry.isDebit ? formatCurrency(entry.amount) : "-"}
                        </td>
                        <td className="p-3 text-right text-[#F5F5F5] font-medium text-sm whitespace-nowrap">
                          {entry.runningBalance != null ? formatCurrency(entry.runningBalance) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[#2A3F55]">
              <div className="text-sm text-[#8A9DB8]">
                {statement.length} transaction{statement.length !== 1 ? "s" : ""}
              </div>
              <Button variant="outline" onClick={() => setShowStatementDialog(false)} className="border-[#2A3F55]">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Details Dialog */}
      <Dialog open={!!selectedEntry && !showReversalDialog} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Ledger Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <p className="text-sm text-[#8A9DB8]">Entry Number</p>
                  <p className="text-[#F5F5F5] font-mono text-lg">
                    {selectedEntry.entryNumber || `LE-${selectedEntry._id?.toString().slice(-8).toUpperCase()}`}
                  </p>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <p className="text-sm text-[#8A9DB8]">Status</p>
                  <Badge className={`mt-1 ${statusColors[selectedEntry.status] || "bg-gray-600"}`}>
                    {selectedEntry.status?.toUpperCase() || "UNKNOWN"}
                  </Badge>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <p className="text-sm text-[#8A9DB8]">Type</p>
                  <p className="text-[#F5F5F5]">
                    {transactionTypeLabels[selectedEntry.transactionType] ||
                      selectedEntry.transactionType?.replace(/_/g, " ") ||
                      "Unknown"}
                  </p>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <p className="text-sm text-[#8A9DB8]">Amount</p>
                  <p className="text-green-400 font-medium text-lg">{formatCurrency(selectedEntry.amount)}</p>
                </div>
              </div>

              <div className="bg-[#1A2F45] rounded-lg p-4">
                <p className="text-sm text-[#8A9DB8] mb-3">Double-Entry</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-[#0D1F35] rounded-lg p-3">
                    <p className="text-xs text-red-400 mb-1 font-medium">DEBIT (From)</p>
                    <p className="text-[#F5F5F5] font-medium">
                      {selectedEntry.debitAccount?.accountName ||
                        selectedEntry.debitAccount?.userId?.name ||
                        selectedEntry.debitAccount?.userId?.email ||
                        selectedEntry.debitAccount?.accountType ||
                        "System Account"}
                    </p>
                    <p className="text-xs text-[#8A9DB8] mt-1">
                      {formatCurrency(selectedEntry.debitBalanceBefore || 0)} →{" "}
                      {formatCurrency(selectedEntry.debitBalanceAfter || 0)}
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#8A9DB8] flex-shrink-0" />
                  <div className="flex-1 bg-[#0D1F35] rounded-lg p-3">
                    <p className="text-xs text-green-400 mb-1 font-medium">CREDIT (To)</p>
                    <p className="text-[#F5F5F5] font-medium">
                      {selectedEntry.creditAccount?.accountName ||
                        selectedEntry.creditAccount?.userId?.name ||
                        selectedEntry.creditAccount?.userId?.email ||
                        selectedEntry.creditAccount?.accountType ||
                        "System Account"}
                    </p>
                    <p className="text-xs text-[#8A9DB8] mt-1">
                      {formatCurrency(selectedEntry.creditBalanceBefore || 0)} →{" "}
                      {formatCurrency(selectedEntry.creditBalanceAfter || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A2F45] rounded-lg p-4">
                <p className="text-sm text-[#8A9DB8]">Description</p>
                <p className="text-[#F5F5F5] mt-1">
                  {selectedEntry.description ||
                    selectedEntry.transactionType?.replace(/_/g, " ") ||
                    "No description available"}
                </p>
              </div>

              <div className="bg-[#1A2F45] rounded-lg p-4">
                <p className="text-sm text-[#8A9DB8]">Created</p>
                <p className="text-[#F5F5F5]">{formatDate(selectedEntry.createdAt)}</p>
                {selectedEntry.createdBy && (
                  <p className="text-xs text-[#8A9DB8] mt-1">
                    By: {selectedEntry.createdBy.name || selectedEntry.createdBy.email}
                  </p>
                )}
              </div>

              {selectedEntry.status === "completed" && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/20 bg-transparent"
                    onClick={() => setShowReversalDialog(true)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reverse Entry
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}
