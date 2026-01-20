"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Wallet,
  BarChart3,
  LogOut,
  Menu,
  X,
  Eye,
  RefreshCw,
  Loader2,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { getAuthToken, getUser, logout } from "@/lib/auth-service"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { PasswordChangeCard } from "@/components/admin/password-change-card"

export default function FinanceManagerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    ggr: 0,
    netRevenue: 0,
    depositCount: 0,
    withdrawalCount: 0,
    pendingCount: 0,
  })
  const [transactions, setTransactions] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [chartData, setChartData] = useState([])
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("7d")

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser || currentUser.role !== "finance_manager") {
      router.push("/staff/login")
      return
    }
    setUser(currentUser)
    fetchFinanceData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchFinanceData()
    }
  }, [dateRange])

  const fetchFinanceData = async () => {
    try {
      setRefreshing(true)
      const token = getAuthToken()

      // Fetch finance stats
      const statsRes = await fetch(`/api/staff/finance/stats?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.stats)
      } else {
        toast.error("Failed to load statistics")
      }

      // Fetch transactions
      const txRes = await fetch(`/api/staff/finance/transactions?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const txData = await txRes.json()
      if (txData.success) {
        setTransactions(txData.transactions || [])
        setPendingApprovals(
          (txData.transactions || []).filter((t) => t.status === "pending" && t.type === "withdrawal"),
        )
      }

      // Fetch chart data
      const chartRes = await fetch(`/api/staff/finance/chart?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const chartResult = await chartRes.json()
      if (chartResult.success) {
        setChartData(chartResult.chartData || [])
      }
    } catch (error) {
      console.error("Error fetching finance data:", error)
      toast.error("Failed to fetch finance data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleApproveWithdrawal = async (transactionId, action) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/staff/finance/withdrawals/${transactionId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }), // 'approve' or 'decline'
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Withdrawal ${action}d successfully`)
        fetchFinanceData()
        setShowApprovalModal(false)
      } else {
        toast.error(data.error || `Failed to ${action} withdrawal`)
      }
    } catch (error) {
      toast.error(`Failed to ${action} withdrawal`)
    }
  }

  const handleExportReport = async (format) => {
    toast.success(`Exporting ${format.toUpperCase()} report...`)
    // In production, this would trigger a download
  }

  const handleLogout = async () => {
    await logout()
    router.push("/staff/login")
  }

  const navigationItems = [
    { icon: BarChart3, label: "Overview", id: "overview" },
    { icon: ArrowDownRight, label: "Deposits", id: "deposits" },
    { icon: ArrowUpRight, label: "Withdrawals", id: "withdrawals" },
    { icon: Wallet, label: "Wallet Ledger", id: "ledger" },
    { icon: FileText, label: "Reports", id: "reports" },
    { icon: Settings, label: "Settings", id: "settings" },
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
        <div className="text-[#FFD700]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]">
      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-40 ${sidebarOpen ? "block" : "hidden"}`}>
        <button onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/50" />
        <div className="absolute left-0 top-0 h-screen w-64 bg-[#0D1F35] border-r border-[#2A3F55] p-4">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="mt-12 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id ? "bg-emerald-500 text-white" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:block lg:w-64 lg:h-screen lg:bg-[#0D1F35] lg:border-r lg:border-[#2A3F55] lg:p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">Finance Manager</h2>
            <p className="text-xs text-[#B8C5D6]">{user?.fullName}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? "bg-emerald-500 text-white" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-emerald-400">Finance Dashboard</h1>
              <p className="text-[#B8C5D6] text-sm">Manage deposits, withdrawals, and financial reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32 bg-[#1A2F45] border-[#2A3F55] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchFinanceData}
              variant="outline"
              size="icon"
              className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingApprovals.length > 0 && (
          <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-white font-semibold">{pendingApprovals.length} Pending Withdrawal Approvals</p>
                <p className="text-amber-200 text-sm">
                  Total: {formatCurrency(pendingApprovals.reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setActiveTab("withdrawals")}
              className="bg-amber-500 text-white hover:bg-amber-600"
              size="sm"
            >
              Review Now
            </Button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Total Deposits</p>
                      <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.totalDeposits)}</p>
                      <p className="text-xs text-[#B8C5D6]">{stats.depositCount || 0} transactions</p>
                    </div>
                    <ArrowDownRight className="w-8 h-8 text-emerald-400/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Total Withdrawals</p>
                      <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.totalWithdrawals)}</p>
                      <p className="text-xs text-[#B8C5D6]">{stats.withdrawalCount || 0} transactions</p>
                    </div>
                    <ArrowUpRight className="w-8 h-8 text-red-400/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Pending Withdrawals</p>
                      <p className="text-2xl font-bold text-amber-400">{formatCurrency(stats.pendingWithdrawals)}</p>
                      <p className="text-xs text-[#B8C5D6]">{stats.pendingCount || 0} awaiting</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-400/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">GGR</p>
                      <p className="text-2xl font-bold text-[#FFD700]">{formatCurrency(stats.ggr)}</p>
                      <p className="text-xs text-[#B8C5D6]">Gross Gaming Revenue</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-[#FFD700]/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Net Revenue</p>
                      <p className="text-2xl font-bold text-blue-400">{formatCurrency(stats.netRevenue)}</p>
                      <p className="text-xs text-[#B8C5D6]">After deductions</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-400/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">Deposits vs Withdrawals</CardTitle>
                <CardDescription className="text-[#B8C5D6]">Daily transaction volume comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                    <XAxis dataKey="name" stroke="#B8C5D6" />
                    <YAxis stroke="#B8C5D6" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A1A2F",
                        border: "1px solid #2A3F55",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="deposits" fill="#10B981" name="Deposits" />
                    <Bar dataKey="withdrawals" fill="#EF4444" name="Withdrawals" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Recent Transactions</CardTitle>
                  <CardDescription className="text-[#B8C5D6]">Latest deposits and withdrawals</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-[#2A3F55] text-[#B8C5D6] bg-transparent">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg hover:bg-[#1A2F45]/80"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            tx.type === "deposit" ? "bg-emerald-500/20" : "bg-red-500/20"
                          }`}
                        >
                          {tx.type === "deposit" ? (
                            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{tx.player?.fullName || "Unknown"}</p>
                          <p className="text-xs text-[#B8C5D6]">{tx.player?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === "deposit" ? "text-emerald-400" : "text-red-400"}`}>
                          {tx.type === "deposit" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </p>
                        <Badge
                          className={`text-xs ${
                            tx.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : tx.status === "pending"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Withdrawals Tab with Approval Functionality */}
        {activeTab === "withdrawals" && (
          <div className="space-y-6">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">Pending Withdrawal Approvals</CardTitle>
                <CardDescription className="text-[#B8C5D6]">
                  Review and approve or decline withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-white font-semibold">All Caught Up!</p>
                    <p className="text-[#B8C5D6]">No pending withdrawals to review</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApprovals.map((tx) => (
                      <div
                        key={tx._id}
                        className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg border border-amber-500/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-amber-500/20">
                            <ArrowUpRight className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">{tx.player?.fullName}</p>
                            <p className="text-sm text-[#B8C5D6]">{tx.player?.email}</p>
                            <p className="text-xs text-[#B8C5D6]">
                              Requested: {new Date(tx.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-amber-400">{formatCurrency(tx.amount)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setSelectedTransaction(tx)
                                setShowApprovalModal(true)
                              }}
                              variant="outline"
                              size="sm"
                              className="border-[#2A3F55] text-[#B8C5D6]"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                            <Button
                              onClick={() => handleApproveWithdrawal(tx._id, "approve")}
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleApproveWithdrawal(tx._id, "decline")}
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Withdrawals */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">All Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                    <Input
                      placeholder="Search withdrawals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40 bg-[#1A2F45] border-[#2A3F55] text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A3F55]">
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Player</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Amount</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter((t) => t.type === "withdrawal")
                        .map((tx) => (
                          <tr key={tx._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                            <td className="py-3 px-4">
                              <p className="text-white">{tx.player?.fullName}</p>
                              <p className="text-xs text-[#B8C5D6]">{tx.player?.email}</p>
                            </td>
                            <td className="py-3 px-4 text-red-400 font-semibold">{formatCurrency(tx.amount)}</td>
                            <td className="py-3 px-4">
                              <Badge
                                className={`${
                                  tx.status === "completed"
                                    ? "bg-green-500/20 text-green-400"
                                    : tx.status === "pending"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {tx.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-[#B8C5D6]">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="sm" className="text-[#B8C5D6]">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === "deposits" && (
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">All Deposits</CardTitle>
              <CardDescription className="text-[#B8C5D6]">View all deposit transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                  <Input placeholder="Search deposits..." className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-white" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2A3F55]">
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Player</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter((t) => t.type === "deposit")
                      .map((tx) => (
                        <tr key={tx._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                          <td className="py-3 px-4">
                            <p className="text-white">{tx.player?.fullName}</p>
                            <p className="text-xs text-[#B8C5D6]">{tx.player?.email}</p>
                          </td>
                          <td className="py-3 px-4 text-emerald-400 font-semibold">+{formatCurrency(tx.amount)}</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-green-500/20 text-green-400">{tx.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-[#B8C5D6]">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">Export Finance Reports</CardTitle>
                <CardDescription className="text-[#B8C5D6]">Generate and download financial reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                    <FileText className="w-8 h-8 text-emerald-400 mb-3" />
                    <h3 className="text-white font-semibold mb-1">Transaction Report</h3>
                    <p className="text-[#B8C5D6] text-sm mb-4">All deposits and withdrawals</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExportReport("csv")}
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        CSV
                      </Button>
                      <Button
                        onClick={() => handleExportReport("pdf")}
                        size="sm"
                        variant="outline"
                        className="border-emerald-500 text-emerald-400"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                    <TrendingUp className="w-8 h-8 text-[#FFD700] mb-3" />
                    <h3 className="text-white font-semibold mb-1">GGR Report</h3>
                    <p className="text-[#B8C5D6] text-sm mb-4">Gross Gaming Revenue breakdown</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExportReport("csv")}
                        size="sm"
                        className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        CSV
                      </Button>
                      <Button
                        onClick={() => handleExportReport("pdf")}
                        size="sm"
                        variant="outline"
                        className="border-[#FFD700] text-[#FFD700]"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                    <Wallet className="w-8 h-8 text-blue-400 mb-3" />
                    <h3 className="text-white font-semibold mb-1">Reconciliation Report</h3>
                    <p className="text-[#B8C5D6] text-sm mb-4">Balance reconciliation data</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExportReport("csv")}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        CSV
                      </Button>
                      <Button
                        onClick={() => handleExportReport("pdf")}
                        size="sm"
                        variant="outline"
                        className="border-blue-500 text-blue-400"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ledger Tab */}
        {activeTab === "ledger" && (
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Wallet Ledger</CardTitle>
              <CardDescription className="text-[#B8C5D6]">
                Complete history of all wallet transactions and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-[#2A3F55] mx-auto mb-4" />
                <p className="text-white font-semibold">Wallet Ledger Coming Soon</p>
                <p className="text-[#B8C5D6]">Detailed transaction ledger with full audit trail</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">Settings</CardTitle>
                <CardDescription className="text-[#B8C5D6]">Change your password</CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChangeCard />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white">
          <DialogHeader>
            <DialogTitle className="text-emerald-400">Review Withdrawal Request</DialogTitle>
            <DialogDescription className="text-[#B8C5D6]">
              Review the details before approving or declining
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="p-4 bg-[#1A2F45] rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#B8C5D6]">Player</p>
                    <p className="text-white font-semibold">{selectedTransaction.player?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#B8C5D6]">Email</p>
                    <p className="text-white">{selectedTransaction.player?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#B8C5D6]">Amount</p>
                    <p className="text-2xl font-bold text-amber-400">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#B8C5D6]">Requested</p>
                    <p className="text-white">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApprovalModal(false)}
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              Cancel
            </Button>
            <Button onClick={() => handleApproveWithdrawal(selectedTransaction?._id, "decline")} variant="destructive">
              <XCircle className="w-4 h-4 mr-1" />
              Decline
            </Button>
            <Button
              onClick={() => handleApproveWithdrawal(selectedTransaction?._id, "approve")}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
