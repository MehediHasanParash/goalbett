"use client"

import { useState, useEffect } from "react"
import AgentSidebar from "@/components/agent/agent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChartIcon,
  BarChart3,
  Clock,
  CheckCircle,
  Info,
  Loader2,
  BanknoteIcon,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { getAuthToken, getUser } from "@/lib/auth-service"
import { toast } from "@/components/ui/use-toast"

export default function CommissionTracking() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState("week")
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  const [commissionWalletBalance, setCommissionWalletBalance] = useState(0)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawing, setWithdrawing] = useState(false)

  const [commissionData, setCommissionData] = useState({
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
    commissionRate: 0,
    thisWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    activeSources: 0,
    subAgentCount: 0,
  })

  const [weeklyData, setWeeklyData] = useState([])
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [sourceData, setSourceData] = useState([])
  const [recentCommissions, setRecentCommissions] = useState([])
  const [subAgentCommissions, setSubAgentCommissions] = useState([])
  const [settlementHistory, setSettlementHistory] = useState([])

  useEffect(() => {
    const authToken = getAuthToken()
    const currentUser = getUser()
    setToken(authToken)
    setUser(currentUser)
    if (authToken) {
      fetchCommissionData(authToken, currentUser)
      fetchCommissionWalletBalance(authToken)
      fetchSettlementHistory(authToken)
    }
  }, [period])

  const fetchCommissionWalletBalance = async (authToken) => {
    try {
      const response = await fetch("/api/agent/commission/balance", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCommissionWalletBalance(data.balance || 0)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch commission wallet balance:", error)
    }
  }

  const fetchSettlementHistory = async (authToken) => {
    try {
      const response = await fetch("/api/agent/commission/history", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSettlementHistory(data.settlements || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch settlement history:", error)
      // Demo data
      setSettlementHistory([
        { id: 1, date: "2025-01-06", amount: 245.5, ggr: 2455, rate: 10, status: "completed" },
        { id: 2, date: "2024-12-30", amount: 189.25, ggr: 1892.5, rate: 10, status: "completed" },
        { id: 3, date: "2024-12-23", amount: 312.0, ggr: 3120, rate: 10, status: "completed" },
      ])
    }
  }

  const handleWithdrawCommission = async () => {
    if (!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" })
      return
    }

    if (Number.parseFloat(withdrawAmount) > commissionWalletBalance) {
      toast({ title: "Error", description: "Insufficient commission balance", variant: "destructive" })
      return
    }

    setWithdrawing(true)
    try {
      const response = await fetch("/api/agent/commission/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(withdrawAmount),
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: `Withdrew $${withdrawAmount} from commission wallet to your main float`,
        })
        setWithdrawDialogOpen(false)
        setWithdrawAmount("")
        fetchCommissionWalletBalance(token)
      } else {
        toast({ title: "Error", description: data.error || "Withdrawal failed", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Withdraw error:", error)
      toast({ title: "Error", description: "Withdrawal failed. Please try again.", variant: "destructive" })
    } finally {
      setWithdrawing(false)
    }
  }

  const fetchCommissionData = async (authToken, currentUser) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/agent/commission?period=${period}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCommissionData(data.summary || commissionData)
        setWeeklyData(data.weeklyData || [])
        setMonthlyTrend(data.monthlyTrend || [])
        setSourceData(data.sourceData || [])
        setRecentCommissions(data.recentCommissions || [])
        setSubAgentCommissions(data.subAgentCommissions || [])
      } else {
        generateDemoData()
      }
    } catch (error) {
      console.error("Error fetching commission data:", error)
      generateDemoData()
    } finally {
      setLoading(false)
    }
  }

  const generateDemoData = () => {
    setCommissionData({
      totalCommission: 2845.5,
      pendingCommission: 320.0,
      paidCommission: 2525.5,
      commissionRate: 15,
      thisWeek: 384.0,
      thisMonth: 1245.0,
      lastMonth: 980.0,
      weeklyChange: 12.5,
      monthlyChange: 27.0,
      activeSources: 12,
      subAgentCount: 8,
    })

    setWeeklyData([
      { day: "Mon", commission: 45, sales: 450, bets: 32 },
      { day: "Tue", commission: 52, sales: 520, bets: 41 },
      { day: "Wed", commission: 38, sales: 380, bets: 28 },
      { day: "Thu", commission: 48, sales: 480, bets: 35 },
      { day: "Fri", commission: 65, sales: 650, bets: 48 },
      { day: "Sat", commission: 78, sales: 780, bets: 62 },
      { day: "Sun", commission: 58, sales: 580, bets: 45 },
    ])

    setMonthlyTrend([
      { month: "Jul", commission: 680, ggr: 4500 },
      { month: "Aug", commission: 750, ggr: 5000 },
      { month: "Sep", commission: 820, ggr: 5500 },
      { month: "Oct", commission: 980, ggr: 6500 },
      { month: "Nov", commission: 1100, ggr: 7300 },
      { month: "Dec", commission: 1245, ggr: 8300 },
    ])

    setSourceData([
      { name: "Direct Sales", value: 45, color: "#FFD700", amount: 560.25 },
      { name: "Sub-Agents", value: 35, color: "#06b6d4", amount: 435.75 },
      { name: "Player Bets", value: 15, color: "#10b981", amount: 186.75 },
      { name: "Bonuses", value: 5, color: "#8b5cf6", amount: 62.25 },
    ])

    setRecentCommissions([
      {
        id: 1,
        source: "Direct Credit Sale",
        type: "credit_sale",
        amount: 45.0,
        customer: "+254712345678",
        time: "2 hours ago",
        status: "paid",
      },
      {
        id: 2,
        source: "Sub-Agent: John Seller",
        type: "sub_agent",
        amount: 32.0,
        customer: "Commission share",
        time: "5 hours ago",
        status: "paid",
      },
      {
        id: 3,
        source: "Player Bet Win",
        type: "bet_commission",
        amount: 28.0,
        customer: "BET-ABC123",
        time: "1 day ago",
        status: "pending",
      },
    ])

    setSubAgentCommissions([
      { name: "John Seller", sales: 2500, commission: 125, rate: 5, status: "active" },
      { name: "Mary Agent", sales: 1800, commission: 90, rate: 5, status: "active" },
      { name: "Peter Sales", sales: 1200, commission: 60, rate: 5, status: "active" },
    ])
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCommissionData(token, user)
    await fetchCommissionWalletBalance(token)
    await fetchSettlementHistory(token)
    setRefreshing(false)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0)
  }

  const COLORS = ["#FFD700", "#06b6d4", "#10b981", "#8b5cf6", "#f97316"]

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0A1A2F]">
      <AgentSidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-6 w-full min-w-0">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">Commission & GGR Tracking</h1>
              <p className="text-[#B8C5D6] mt-1">Real-time earnings from sales, bets, and sub-agents</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px] bg-[#0D1F35] border-[#2A3F55] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-[#2A3F55] text-white hover:bg-[#1A2F45] bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="outline"
                className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-green-500/20 to-green-600/10 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Commission Wallet Balance</p>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(commissionWalletBalance)}</p>
                    <p className="text-[#B8C5D6] text-xs mt-1">Settled every Monday at 00:00 UTC</p>
                  </div>
                </div>
                <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white"
                      disabled={commissionWalletBalance <= 0}
                    >
                      <BanknoteIcon className="w-4 h-4 mr-2" />
                      Withdraw to Float
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white">
                    <DialogHeader>
                      <DialogTitle className="text-[#FFD700]">Withdraw Commission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                        <p className="text-sm text-[#B8C5D6]">Available Balance</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(commissionWalletBalance)}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount to Withdraw (USD)</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          max={commissionWalletBalance}
                          className="bg-[#0A1A2F] border-[#2A3F55] text-white"
                        />
                      </div>
                      <p className="text-xs text-[#8A9DB8]">
                        Commission will be transferred to your main float wallet instantly.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setWithdrawDialogOpen(false)}
                        className="border-[#2A3F55] text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleWithdrawCommission}
                        disabled={withdrawing}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        {withdrawing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Withdraw
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Info Banner */}
          <Card className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFD700]/5 border-[#FFD700]/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#FFD700] mt-0.5" />
                <div>
                  <p className="text-[#FFD700] font-medium">How Commission Works</p>
                  <p className="text-[#B8C5D6] text-sm mt-1">
                    You earn <span className="text-[#FFD700] font-bold">{commissionData.commissionRate}%</span>{" "}
                    commission on all GGR (Gross Gaming Revenue). GGR = Total Stakes - Total Payouts. Commission is
                    automatically calculated and settled to your Commission Wallet every Monday at 00:00 UTC.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700]/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Total Earned</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(commissionData.totalCommission)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-xs">+{commissionData.monthlyChange}% this month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-[#0A1A2F]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#B8C5D6] text-sm">This Week</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(commissionData.thisWeek)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {commissionData.weeklyChange >= 0 ? (
                        <>
                          <ArrowUpRight className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 text-xs">+{commissionData.weeklyChange}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3 text-red-400" />
                          <span className="text-red-400 text-xs">{commissionData.weeklyChange}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Commission Rate</p>
                    <p className="text-2xl font-bold text-[#FFD700]">{commissionData.commissionRate}%</p>
                    <p className="text-[#B8C5D6] text-xs mt-1">Of Net GGR</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Sub-Agents</p>
                    <p className="text-2xl font-bold text-white">{commissionData.subAgentCount}</p>
                    <p className="text-[#B8C5D6] text-xs mt-1">{commissionData.activeSources} active sources</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending vs Paid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-7 h-7 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#B8C5D6] text-sm">Pending Commission</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {formatCurrency(commissionData.pendingCommission)}
                    </p>
                    <p className="text-[#B8C5D6] text-xs">Awaiting weekly settlement</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#B8C5D6] text-sm">Paid Commission</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(commissionData.paidCommission)}</p>
                    <p className="text-[#B8C5D6] text-xs">Transferred to commission wallet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-[#0D1F35] border border-[#2A3F55]">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="settlements"
                className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black"
              >
                Settlement History
              </TabsTrigger>
              <TabsTrigger
                value="subagents"
                className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black"
              >
                Sub-Agents
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                Recent Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Commission Chart */}
                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#FFD700]" />
                      Weekly Commission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                        <XAxis dataKey="day" stroke="#B8C5D6" fontSize={12} />
                        <YAxis stroke="#B8C5D6" fontSize={12} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0D1F35",
                            border: "1px solid #FFD700",
                            borderRadius: "8px",
                          }}
                          formatter={(value, name) => [formatCurrency(value), name]}
                        />
                        <Bar dataKey="commission" fill="#FFD700" radius={[4, 4, 0, 0]} name="Commission" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Commission Sources Pie */}
                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-[#FFD700]" />
                      Commission Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="50%" height={250}>
                        <PieChart>
                          <Pie
                            data={sourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {sourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0D1F35",
                              border: "1px solid #2A3F55",
                              borderRadius: "8px",
                            }}
                            formatter={(value) => [`${value}%`, "Share"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {sourceData.map((source, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: source.color || COLORS[index % COLORS.length] }}
                              />
                              <span className="text-[#B8C5D6] text-sm">{source.name}</span>
                            </div>
                            <span className="text-white font-medium">{formatCurrency(source.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settlements" className="space-y-4">
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white">Weekly Settlement History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {settlementHistory.length === 0 ? (
                      <p className="text-center text-[#8A9DB8] py-8">
                        No settlement history yet. Settlements occur every Monday.
                      </p>
                    ) : (
                      settlementHistory.map((settlement) => (
                        <div
                          key={settlement.id || settlement._id}
                          className="flex items-center justify-between p-4 bg-[#0A1A2F]/50 rounded-lg border border-[#2A3F55]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">Weekly Settlement</p>
                              <p className="text-sm text-[#8A9DB8]">{new Date(settlement.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold text-lg">{formatCurrency(settlement.amount)}</p>
                            <p className="text-xs text-[#8A9DB8]">
                              {settlement.rate}% of {formatCurrency(settlement.ggr)} GGR
                            </p>
                          </div>
                          {getStatusBadge(settlement.status)}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subagents" className="space-y-4">
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white">Sub-Agent Commission</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subAgentCommissions.map((agent, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-[#0A1A2F]/50 rounded-lg border border-[#2A3F55]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center">
                            <span className="text-[#0A1A2F] font-bold text-sm">
                              {agent.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{agent.name}</p>
                            <p className="text-sm text-[#8A9DB8]">Sales: {formatCurrency(agent.sales)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#FFD700] font-bold">{formatCurrency(agent.commission)}</p>
                          <p className="text-xs text-[#8A9DB8]">{agent.rate}% rate</p>
                        </div>
                        <Badge
                          className={
                            agent.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white">Recent Commission Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentCommissions.map((commission) => (
                      <div
                        key={commission.id}
                        className="flex items-center justify-between p-4 bg-[#0A1A2F]/50 rounded-lg border border-[#2A3F55]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-[#FFD700]" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{commission.source}</p>
                            <p className="text-sm text-[#8A9DB8]">{commission.customer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">+{formatCurrency(commission.amount)}</p>
                          <p className="text-xs text-[#8A9DB8]">{commission.time}</p>
                        </div>
                        {getStatusBadge(commission.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
