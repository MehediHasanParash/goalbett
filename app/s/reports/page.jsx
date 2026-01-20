"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  Download,
  BarChart3,
  PieChartIcon,
  Wallet,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  AlertTriangle,
  UserCheck,
  UserMinus,
  Calendar,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({})
  const [tenantData, setTenantData] = useState({ tenants: [], trend: [], totals: {} })

  const getDateRange = () => {
    const end = new Date()
    const start = new Date()
    switch (dateRange) {
      case "7d":
        start.setDate(end.getDate() - 7)
        break
      case "30d":
        start.setDate(end.getDate() - 30)
        break
      case "90d":
        start.setDate(end.getDate() - 90)
        break
      case "1y":
        start.setFullYear(end.getFullYear() - 1)
        break
      default:
        start.setDate(end.getDate() - 30)
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      const headers = { Authorization: `Bearer ${token}` }
      const { startDate, endDate } = getDateRange()
      const params = `&startDate=${startDate}&endDate=${endDate}`

      const [overviewRes, playersRes, agentsRes, financialRes, tenantsRes] = await Promise.all([
        fetch(`/api/super/analytics?type=overview${params}`, { headers }),
        fetch(`/api/super/analytics?type=players${params}`, { headers }),
        fetch(`/api/super/analytics?type=agents${params}`, { headers }),
        fetch(`/api/super/analytics?type=financial_trends${params}`, { headers }),
        fetch(`/api/super/analytics?type=tenants${params}`, { headers }),
      ])

      const [overview, players, agents, financial, tenants] = await Promise.all([
        overviewRes.json(),
        playersRes.json(),
        agentsRes.json(),
        financialRes.json(),
        tenantsRes.json(),
      ])

      console.log("[v0] Overview response:", overview)
      console.log("[v0] Players response:", players)
      console.log("[v0] Financial response:", financial)

      setData({
        ...overview,
        playerDetails: players,
        agents: Array.isArray(agents.agents) ? agents.agents : Array.isArray(agents) ? agents : [],
        financialTrends: Array.isArray(financial.trends) ? financial.trends : Array.isArray(financial) ? financial : [],
      })

      setTenantData(tenants)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  const formatPercent = (value) => {
    const num = typeof value === "number" ? value : Number.parseFloat(value) || 0
    return `${num.toFixed(2)}%`
  }

  const productSplitData = data.productSplit
    ? [
        { name: "Sportsbook", value: data.productSplit.sportsbook?.ggr || 0, color: "#FFD700" },
        { name: "Casino", value: data.productSplit.casino?.ggr || 0, color: "#4A90E2" },
        { name: "Virtual", value: data.productSplit.virtual?.ggr || 0, color: "#50C878" },
      ].filter((d) => d.value > 0)
    : []

  const tenantChartData =
    tenantData.tenants?.slice(0, 10).map((t) => ({
      name: t.tenantName?.substring(0, 15) || "Unknown",
      ggr: t.ggr,
      ngr: t.ngr,
      turnover: t.turnover,
    })) || []

  const COLORS = ["#FFD700", "#4A90E2", "#50C878", "#FF6B6B", "#9B59B6", "#E74C3C", "#1ABC9C", "#34495E"]

  const sumTrends = (trends, key) => {
    if (!Array.isArray(trends)) return 0
    return trends.reduce((sum, t) => sum + (t[key] || 0), 0)
  }

  const handleExport = async (format) => {
    try {
      const token = getAuthToken()
      const { startDate, endDate } = getDateRange()
      const response = await fetch(
        `/api/super/analytics/export?format=${format}&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-${new Date().toISOString().split("T")[0]}.${format}`
      a.click()
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  return (
    <SuperAdminLayout
      title="Reports & Business Intelligence"
      description="Comprehensive analytics and reporting for operators"
    >
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] bg-[#1A2F45] border-[#2A3F55] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-[#2A3F55] text-white bg-transparent"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <Button className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E6C200]" onClick={() => handleExport("json")}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FFD700]/20">
                <DollarSign className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-xs text-[#8B9DB6]">GGR</p>
                <p className="text-lg font-bold text-[#FFD700]">{formatCurrency(data.ggr)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#4A90E2]/20">
                <TrendingUp className="w-5 h-5 text-[#4A90E2]" />
              </div>
              <div>
                <p className="text-xs text-[#8B9DB6]">NGR</p>
                <p className="text-lg font-bold text-[#4A90E2]">{formatCurrency(data.ngr)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#50C878]/20">
                <BarChart3 className="w-5 h-5 text-[#50C878]" />
              </div>
              <div>
                <p className="text-xs text-[#8B9DB6]">Turnover</p>
                <p className="text-lg font-bold text-[#50C878]">{formatCurrency(data.totalStakes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#9B59B6]/20">
                <Users className="w-5 h-5 text-[#9B59B6]" />
              </div>
              <div>
                <p className="text-xs text-[#8B9DB6]">Active Players</p>
                <p className="text-lg font-bold text-white">
                  {data.players?.activePlayers || data.playerDetails?.activePlayers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1ABC9C]/20">
                <ArrowUpRight className="w-5 h-5 text-[#1ABC9C]" />
              </div>
              <div>
                <p className="text-xs text-[#8B9DB6]">Deposits</p>
                <p className="text-lg font-bold text-[#1ABC9C]">
                  {formatCurrency(sumTrends(data.financialTrends, "deposits"))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E74C3C]/20">
                <ArrowDownRight className="w-5 h-5 text-[#E74C3C]" />
              </div>
              <div>
                <p className="text-xs text-[#8B9DB6]">Withdrawals</p>
                <p className="text-lg font-bold text-[#E74C3C]">
                  {formatCurrency(sumTrends(data.financialTrends, "withdrawals"))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1A2F45] border border-[#2A3F55] mb-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <BarChart3 className="w-4 h-4 mr-2" />
            Operator Reports
          </TabsTrigger>
          <TabsTrigger value="tenants" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Building2 className="w-4 h-4 mr-2" />
            Tenant Reports
          </TabsTrigger>
          <TabsTrigger value="players" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Users className="w-4 h-4 mr-2" />
            Player Reports
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <TrendingUp className="w-4 h-4 mr-2" />
            Agent Performance
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Financial Trends
          </TabsTrigger>
        </TabsList>

        {/* Operator Reports Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  GGR / NGR Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.turnoverTrend?.slice(-14) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                    <XAxis dataKey="_id" stroke="#8B9DB6" fontSize={12} />
                    <YAxis stroke="#8B9DB6" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1A2F45", border: "1px solid #2A3F55" }}
                      formatter={(value) => [`$${value?.toFixed?.(2) || 0}`, ""]}
                    />
                    <Area
                      type="monotone"
                      dataKey="turnover"
                      stroke="#FFD700"
                      fill="#FFD700"
                      fillOpacity={0.2}
                      name="Turnover"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Split */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Sportsbook vs Casino Split
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productSplitData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={productSplitData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {productSplitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1A2F45", border: "1px solid #2A3F55" }}
                        formatter={(value) => [formatCurrency(value), "GGR"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-[#8B9DB6]">
                    No product data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Key Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <p className="text-sm text-[#8B9DB6]">Total Bets</p>
                  <p className="text-2xl font-bold text-white">{data.totalBets || 0}</p>
                </div>
                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <p className="text-sm text-[#8B9DB6]">Total Payouts</p>
                  <p className="text-2xl font-bold text-[#E74C3C]">{formatCurrency(data.totalPayouts)}</p>
                </div>
                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <p className="text-sm text-[#8B9DB6]">House Edge</p>
                  <p className="text-2xl font-bold text-[#50C878]">{formatPercent(data.houseEdge)}</p>
                </div>
                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <p className="text-sm text-[#8B9DB6]">Bonuses Paid</p>
                  <p className="text-2xl font-bold text-[#9B59B6]">{formatCurrency(data.bonusesPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenant Reports Tab */}
        <TabsContent value="tenants" className="space-y-6">
          {/* Tenant Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#FFD700]/20">
                    <Building2 className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8B9DB6]">Active Tenants</p>
                    <p className="text-lg font-bold text-white">{tenantData.totals?.activeTenants || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#50C878]/20">
                    <DollarSign className="w-5 h-5 text-[#50C878]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8B9DB6]">Total GGR</p>
                    <p className="text-lg font-bold text-[#50C878]">{formatCurrency(tenantData.totals?.totalGGR)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#4A90E2]/20">
                    <TrendingUp className="w-5 h-5 text-[#4A90E2]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8B9DB6]">Total Turnover</p>
                    <p className="text-lg font-bold text-[#4A90E2]">
                      {formatCurrency(tenantData.totals?.totalTurnover)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#9B59B6]/20">
                    <Percent className="w-5 h-5 text-[#9B59B6]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8B9DB6]">Provider Revenue</p>
                    <p className="text-lg font-bold text-[#9B59B6]">
                      {formatCurrency(tenantData.totals?.totalProviderRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tenant GGR Chart */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  GGR by Tenant
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tenantChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tenantChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                      <XAxis type="number" stroke="#8B9DB6" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="name" stroke="#8B9DB6" fontSize={12} width={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1A2F45", border: "1px solid #2A3F55" }}
                        formatter={(value) => [formatCurrency(value), ""]}
                      />
                      <Bar dataKey="ggr" fill="#FFD700" name="GGR" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-[#8B9DB6]">No tenant data</div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Distribution Pie */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Revenue Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tenantChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tenantChartData.filter((t) => t.ggr > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="ggr"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tenantChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1A2F45", border: "1px solid #2A3F55" }}
                        formatter={(value) => [formatCurrency(value), "GGR"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-[#8B9DB6]">No tenant data</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tenant Table */}
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Tenant Performance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A3F55]">
                      <TableHead className="text-[#8B9DB6]">Tenant</TableHead>
                      <TableHead className="text-[#8B9DB6]">Status</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">GGR</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">NGR</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">Turnover</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">Bets</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">Players</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">House Edge</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">Provider Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenantData.tenants?.map((tenant) => (
                      <TableRow key={tenant.tenantId} className="border-[#2A3F55]">
                        <TableCell className="text-white font-medium">{tenant.tenantName}</TableCell>
                        <TableCell>
                          <Badge className={tenant.status === "active" ? "bg-green-500" : "bg-gray-500"}>
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-[#FFD700]">{formatCurrency(tenant.ggr)}</TableCell>
                        <TableCell className="text-right text-[#4A90E2]">{formatCurrency(tenant.ngr)}</TableCell>
                        <TableCell className="text-right text-white">{formatCurrency(tenant.turnover)}</TableCell>
                        <TableCell className="text-right text-white">{tenant.totalBets || 0}</TableCell>
                        <TableCell className="text-right text-white">{tenant.uniquePlayers || 0}</TableCell>
                        <TableCell className="text-right text-[#50C878]">{formatPercent(tenant.houseEdge)}</TableCell>
                        <TableCell className="text-right text-[#9B59B6]">
                          {formatCurrency(tenant.revenueShare?.providerAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!tenantData.tenants || tenantData.tenants.length === 0) && (
                      <TableRow className="border-[#2A3F55]">
                        <TableCell colSpan={9} className="text-center text-[#8B9DB6] py-8">
                          No tenant data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Player Reports Tab - Restored full design with charts */}
        <TabsContent value="players" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Users Card */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#8B9DB6]" />
                    <span className="text-[#8B9DB6]">DAU (Daily)</span>
                  </div>
                  <span className="text-xl font-bold text-white">{data.playerDetails?.dailyActiveUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#8B9DB6]" />
                    <span className="text-[#8B9DB6]">WAU (Weekly)</span>
                  </div>
                  <span className="text-xl font-bold text-white">{data.playerDetails?.weeklyActiveUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#8B9DB6]" />
                    <span className="text-[#8B9DB6]">MAU (Monthly)</span>
                  </div>
                  <span className="text-xl font-bold text-white">{data.playerDetails?.monthlyActiveUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg border border-[#50C878]/30">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-[#50C878]" />
                    <span className="text-[#8B9DB6]">Active Accounts</span>
                  </div>
                  <span className="text-xl font-bold text-[#50C878]">{data.playerDetails?.activePlayers || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Retention & Churn */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Retention & Churn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#8B9DB6]">Retention Rate</span>
                  <span className="text-xl font-bold text-[#50C878]">
                    {formatPercent(data.playerDetails?.retention?.retentionRate)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#8B9DB6]">Churn Rate</span>
                  <span className="text-xl font-bold text-[#E74C3C]">
                    {formatPercent(data.playerDetails?.churn?.churnRate)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-[#8B9DB6]">At Risk Players</span>
                  </div>
                  <span className="text-xl font-bold text-orange-400">
                    {data.playerDetails?.churn?.atRiskPlayers?.length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Registration Stats */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <UserMinus className="w-5 h-5" />
                  Registration Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#8B9DB6]">Total Registered</span>
                  <span className="text-xl font-bold text-white">{data.playerDetails?.totalRegistered || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#8B9DB6]">New This Period</span>
                  <span className="text-xl font-bold text-[#4A90E2]">{data.playerDetails?.newRegistrations || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#8B9DB6]">First Time Depositors</span>
                  <span className="text-xl font-bold text-[#50C878]">
                    {data.playerDetails?.firstTimeDepositors || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Users className="w-5 h-5" />
                Player Performance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A3F55]">
                      <TableHead className="text-[#8B9DB6]">Player</TableHead>
                      <TableHead className="text-[#8B9DB6]">Tenant</TableHead>
                      <TableHead className="text-[#8B9DB6]">Status</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">Bets</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">Turnover</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">Won</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">GGR</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">Deposits</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">Withdrawals</TableHead>
                      <TableHead className="text-[#8B9DB6] text-right">LTV</TableHead>
                      <TableHead className="text-[#8B9DB6]">Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.playerDetails?.playerList || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-[#8B9DB6] py-8">
                          No player data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      (data.playerDetails?.playerList || []).map((player) => (
                        <TableRow key={player._id} className="border-[#2A3F55]">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{player.name}</p>
                              <p className="text-xs text-[#8B9DB6]">{player.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded bg-[#FFD700]/20 text-[#FFD700] text-xs">
                              {player.tenant?.theme?.brandName || player.tenant?.name || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                player.status === "active"
                                  ? "bg-[#50C878]/20 text-[#50C878]"
                                  : player.status === "suspended"
                                    ? "bg-[#E74C3C]/20 text-[#E74C3C]"
                                    : "bg-[#8B9DB6]/20 text-[#8B9DB6]"
                              }`}
                            >
                              {player.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-white">{player.totalBets}</TableCell>
                          <TableCell className="text-right text-white">{formatCurrency(player.totalStakes)}</TableCell>
                          <TableCell className="text-right text-[#50C878]">{formatCurrency(player.totalWon)}</TableCell>
                          <TableCell className={`text-right ${player.ggr >= 0 ? "text-[#50C878]" : "text-[#E74C3C]"}`}>
                            {formatCurrency(player.ggr)}
                          </TableCell>
                          <TableCell className="text-right text-[#1ABC9C]">{formatCurrency(player.deposits)}</TableCell>
                          <TableCell className="text-right text-[#E74C3C]">
                            {formatCurrency(player.withdrawals)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold ${player.ltv >= 0 ? "text-[#50C878]" : "text-[#E74C3C]"}`}
                          >
                            {formatCurrency(player.ltv)}
                          </TableCell>
                          <TableCell className="text-[#8B9DB6]">
                            {player.lastActive ? new Date(player.lastActive).toLocaleDateString() : "Never"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* At Risk Players Table */}
          {data.playerDetails?.churn?.atRiskPlayers?.length > 0 && (
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  At Risk Players (Potential Churn)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A3F55]">
                      <TableHead className="text-[#8B9DB6]">Player</TableHead>
                      <TableHead className="text-[#8B9DB6]">Email</TableHead>
                      <TableHead className="text-[#8B9DB6]">Last Active</TableHead>
                      <TableHead className="text-[#8B9DB6]">Days Inactive</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.playerDetails?.churn?.atRiskPlayers?.slice(0, 10).map((player) => (
                      <TableRow key={player._id} className="border-[#2A3F55]">
                        <TableCell className="text-white">{player.name || "Unknown"}</TableCell>
                        <TableCell className="text-[#8B9DB6]">{player.email}</TableCell>
                        <TableCell className="text-[#8B9DB6]">
                          {player.lastActive ? new Date(player.lastActive).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell className="text-orange-400">{player.daysInactive || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="agents" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Agent Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(data.agents) && data.agents.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.agents.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                    <XAxis dataKey="agentName" stroke="#8B9DB6" fontSize={12} />
                    <YAxis stroke="#8B9DB6" fontSize={12} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1A2F45", border: "1px solid #2A3F55" }}
                      formatter={(value) => [formatCurrency(value), ""]}
                    />
                    <Legend />
                    <Bar dataKey="turnover" fill="#4A90E2" name="Turnover" />
                    <Bar dataKey="ggr" fill="#FFD700" name="GGR" />
                    <Bar dataKey="commission" fill="#50C878" name="Commission" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-[#8B9DB6]">No agent data available</div>
              )}
            </CardContent>
          </Card>

          {/* Agent Details Table */}
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Agent Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2A3F55]">
                    <TableHead className="text-[#8B9DB6]">Agent</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">Players</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">Turnover</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">GGR</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">Commission</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(data.agents) &&
                    data.agents.map((agent) => (
                      <TableRow key={agent.agentId} className="border-[#2A3F55]">
                        <TableCell className="text-white font-medium">{agent.agentName}</TableCell>
                        <TableCell className="text-right text-white">{agent.playerCount || 0}</TableCell>
                        <TableCell className="text-right text-[#4A90E2]">{formatCurrency(agent.turnover)}</TableCell>
                        <TableCell className="text-right text-[#FFD700]">{formatCurrency(agent.ggr)}</TableCell>
                        <TableCell className="text-right text-[#50C878]">{formatCurrency(agent.commission)}</TableCell>
                        <TableCell className="text-right text-white">{formatCurrency(agent.profit)}</TableCell>
                      </TableRow>
                    ))}
                  {(!Array.isArray(data.agents) || data.agents.length === 0) && (
                    <TableRow className="border-[#2A3F55]">
                      <TableCell colSpan={6} className="text-center text-[#8B9DB6] py-8">
                        No agent data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Trends Tab */}
        <TabsContent value="financial" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Deposit & Withdrawal Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(data.financialTrends) && data.financialTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.financialTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                    <XAxis dataKey="_id" stroke="#8B9DB6" fontSize={12} />
                    <YAxis stroke="#8B9DB6" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1A2F45", border: "1px solid #2A3F55" }}
                      formatter={(value) => [formatCurrency(value), ""]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="deposits" stroke="#1ABC9C" strokeWidth={2} name="Deposits" dot />
                    <Line
                      type="monotone"
                      dataKey="withdrawals"
                      stroke="#E74C3C"
                      strokeWidth={2}
                      name="Withdrawals"
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-[#8B9DB6]">
                  No financial trend data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-6">
                <p className="text-sm text-[#8B9DB6]">Net Flow</p>
                <p
                  className={`text-3xl font-bold ${
                    sumTrends(data.financialTrends, "deposits") - sumTrends(data.financialTrends, "withdrawals") >= 0
                      ? "text-[#1ABC9C]"
                      : "text-[#E74C3C]"
                  }`}
                >
                  {formatCurrency(
                    sumTrends(data.financialTrends, "deposits") - sumTrends(data.financialTrends, "withdrawals"),
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-6">
                <p className="text-sm text-[#8B9DB6]">Total Deposits</p>
                <p className="text-3xl font-bold text-[#1ABC9C]">
                  {formatCurrency(sumTrends(data.financialTrends, "deposits"))}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-6">
                <p className="text-sm text-[#8B9DB6]">Total Withdrawals</p>
                <p className="text-3xl font-bold text-[#E74C3C]">
                  {formatCurrency(sumTrends(data.financialTrends, "withdrawals"))}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </SuperAdminLayout>
  )
}
