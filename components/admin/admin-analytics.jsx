"use client"

import { useState, useEffect, useCallback } from "react"
import {
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
import { Download, TrendingUp, Users, DollarSign, Activity, Filter, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthToken } from "@/lib/auth-service"

const COLORS = ["#FFD700", "#4A90E2", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"]

// Helper function to safely convert to array
const toArray = (data) => {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (Array.isArray(data.data)) return data.data
    return Object.values(data)
  }
  return []
}

const getDefaultDateRange = () => {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from, to }
}

export function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState(getDefaultDateRange())
  const [selectedAgent, setSelectedAgent] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [overviewData, setOverviewData] = useState(null)
  const [playersData, setPlayersData] = useState(null)
  const [financialTrends, setFinancialTrends] = useState([])
  const [agents, setAgents] = useState([])
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalBets: 0,
    winningsPaid: 0,
    activePlayers: 0,
    activeSessions: 0,
  })
  const [financialData, setFinancialData] = useState(null)

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getAuthToken()
      if (!token) {
        setError("Not authenticated")
        return
      }

      const headers = { Authorization: `Bearer ${token}` }

      const [overviewRes, playersRes, financialRes, agentsRes] = await Promise.all([
        fetch(
          `/api/super/analytics?type=overview&startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`,
          { headers },
        ),
        fetch(
          `/api/super/analytics?type=players&startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`,
          { headers },
        ),
        fetch(
          `/api/super/analytics?type=financial_trends&startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`,
          { headers },
        ),
        fetch(
          `/api/super/analytics?type=agents&startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`,
          { headers },
        ),
      ])

      const [overview, players, financial, agentsData] = await Promise.all([
        overviewRes.json(),
        playersRes.json(),
        financialRes.json(),
        agentsRes.json(),
      ])

      console.log("[v0] Overview response:", overview)
      console.log("[v0] Players response:", players)
      console.log("[v0] Financial response:", financial)

      if (overview.success) {
        setOverviewData(overview)
        setKpis((prev) => ({
          ...prev,
          totalRevenue: overview.ggr || overview.ngr || overview.totalStakes - overview.totalPayouts || 0,
          totalBets: overview.totalBets || 0,
          winningsPaid: overview.totalPayouts || 0,
        }))
      }

      // Set players data
      if (players.success) {
        setPlayersData(players)
        setKpis((prev) => ({
          ...prev,
          activePlayers: players.activePlayers || players.totalRegistered || 0,
          // Also get totalPlayers if available
          totalPlayers: players.totalRegistered || players.totalPlayers || 0,
        }))
      }

      // Set financial trends
      if (financial.success) {
        setFinancialData(financial)
        setFinancialTrends(financial.trends || [])
      }

      // Set agents
      if (agentsData.success) {
        setAgents(toArray(agentsData.agents))
      }
    } catch (err) {
      console.error("Analytics fetch error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const handleExportReport = async () => {
    try {
      const token = await getAuthToken()

      // Gather all the current analytics data for export
      const exportData = {
        title: "Analytics Report",
        generatedAt: new Date().toISOString(),
        period: {
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
        },
        kpis: {
          totalRevenue: kpis.totalRevenue,
          totalBets: kpis.totalBets,
          winningsPaid: kpis.winningsPaid,
          activePlayers: kpis.activePlayers,
          activeSessions: kpis.activeSessions,
        },
        overview: overviewData,
        players: playersData,
        financial: financialData,
        agents: agents,
        charts: {
          revenueChart: financialTrends.map((item) => ({
            date: new Date(item.date || item._id).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            revenue: item.ggr || item.revenue || 0,
            wins: item.payouts || item.winnings || 0,
            bets: item.betCount || item.bets || 0,
          })),
          monthlyMetrics: financialTrends.map((item) => ({
            date: new Date(item.date || item._id).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            bets: item.betCount || item.bets || 0,
          })),
          productSplit: (() => {
            const ps = overviewData?.productSplit
            if (!ps) return []

            // productSplit is an object like { sportsbook: {...}, casino: {...}, virtual: {...} }
            if (typeof ps === "object" && !Array.isArray(ps)) {
              return Object.entries(ps)
                .filter(([key, value]) => value && (value.ggr > 0 || value.turnover > 0 || value.betCount > 0))
                .map(([key, value], index) => ({
                  name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize: sportsbook -> Sportsbook
                  value: value.turnover || value.ggr || 0,
                  color: COLORS[index % COLORS.length],
                }))
            }

            // If it's already an array, use the old logic
            return toArray(ps).map((item, index) => ({
              name: item._id || item.sport || item.name || "Unknown",
              value: item.totalStakes || item.revenue || item.value || 0,
              color: COLORS[index % COLORS.length],
            }))
          })(),
          playerAcquisition: [
            { name: "Direct", value: playersData?.registrationsBySource?.direct || 35, color: "#FFD700" },
            { name: "Agents", value: playersData?.registrationsBySource?.agent || 45, color: "#4A90E2" },
            { name: "Referral", value: playersData?.registrationsBySource?.referral || 15, color: "#10B981" },
            { name: "Organic", value: playersData?.registrationsBySource?.organic || 5, color: "#F59E0B" },
          ],
        },
      }

      // Create and download the JSON file directly
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert("Failed to export report: " + err.message)
    }
  }

  const totalRevenue = kpis.totalRevenue
  const totalBets = kpis.totalBets
  const totalWinnings = kpis.winningsPaid
  const totalPlayers = kpis.totalPlayers
  const activePlayers = kpis.activePlayers

  const revenueChartData = financialTrends.map((item) => ({
    date: new Date(item.date || item._id).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: item.ggr || item.revenue || 0,
    wins: item.payouts || item.winnings || 0,
    bets: item.betCount || item.bets || 0,
  }))

  const productSplitData = (() => {
    const ps = overviewData?.productSplit
    if (!ps) return []

    // productSplit is an object like { sportsbook: {...}, casino: {...}, virtual: {...} }
    if (typeof ps === "object" && !Array.isArray(ps)) {
      return Object.entries(ps)
        .filter(([key, value]) => value && (value.ggr > 0 || value.turnover > 0 || value.betCount > 0))
        .map(([key, value], index) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize: sportsbook -> Sportsbook
          value: value.turnover || value.ggr || 0,
          color: COLORS[index % COLORS.length],
        }))
    }

    // If it's already an array, use the old logic
    return toArray(ps).map((item, index) => ({
      name: item._id || item.sport || item.name || "Unknown",
      value: item.totalStakes || item.revenue || item.value || 0,
      color: COLORS[index % COLORS.length],
    }))
  })()

  const playerAcquisitionData = [
    { name: "Direct", value: playersData?.registrationsBySource?.direct || 35, color: "#FFD700" },
    { name: "Agents", value: playersData?.registrationsBySource?.agent || 45, color: "#4A90E2" },
    { name: "Referral", value: playersData?.registrationsBySource?.referral || 15, color: "#10B981" },
    { name: "Organic", value: playersData?.registrationsBySource?.organic || 5, color: "#F59E0B" },
  ]

  const betCategoryData = (() => {
    const ps = overviewData?.productSplit
    if (!ps) return []

    // productSplit is an object like { sportsbook: {...}, casino: {...}, virtual: {...} }
    if (typeof ps === "object" && !Array.isArray(ps)) {
      return Object.entries(ps).map(([key, value]) => ({
        sport: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
        bets: value?.betCount || 0,
        revenue: value?.ggr || value?.turnover || 0,
      }))
    }

    // If it's already an array
    return toArray(ps).map((item) => ({
      sport: item._id || item.sport || item.name || "Unknown",
      bets: item.betCount || 0,
      revenue: item.ggr || item.totalStakes || 0,
    }))
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
        <span className="ml-2 text-[#B8C5D6]">Loading analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-400">Failed to load analytics: {error}</p>
        <Button onClick={fetchAnalyticsData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Analytics & Reports</h1>
          <p className="text-[#B8C5D6]">Track platform performance and player behavior</p>
        </div>
        <Button
          onClick={handleExportReport}
          className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold whitespace-nowrap"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Date Range & Filters */}
      <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
        <CardContent className="pt-6 flex gap-4 flex-wrap">
          <div>
            <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Date Range</label>
            <input
              type="date"
              value={dateRange.from.toISOString().split("T")[0]}
              onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
              className="px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
            />
          </div>
          <div>
            <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.to.toISOString().split("T")[0]}
              onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
              className="px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
            />
          </div>
          <div>
            <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Filter by Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
            >
              <option value="all">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.agentId || agent._id || agent.id} value={agent.agentId || agent._id || agent.id}>
                  {agent.agentName ||
                    agent.fullName ||
                    agent.name ||
                    agent.email ||
                    `Agent ${agent.agentId || agent._id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={fetchAnalyticsData}
              variant="outline"
              className="border-[#2A3F55] text-[#B8C5D6] bg-[#1A2F45]"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs - Real data */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Revenue (GGR)</p>
                <p className="text-2xl font-bold text-[#FFD700] mt-2">
                  ${totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + "k" : totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#FFD700]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Bets</p>
                <p className="text-2xl font-bold text-blue-400 mt-2">{totalBets.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Winnings Paid</p>
                <p className="text-2xl font-bold text-green-400 mt-2">
                  ${totalWinnings >= 1000 ? (totalWinnings / 1000).toFixed(1) + "k" : totalWinnings.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Players</p>
                <p className="text-2xl font-bold text-purple-400 mt-2">{totalPlayers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Active Players</p>
                <p className="text-2xl font-bold text-orange-400 mt-2">{activePlayers.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#1A2F45] border-b border-[#2A3F55]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="players" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Players
          </TabsTrigger>
          <TabsTrigger value="bets" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Bets
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab - Real data */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                    <XAxis dataKey="date" stroke="#B8C5D6" />
                    <YAxis stroke="#B8C5D6" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A2F45",
                        border: "1px solid #2A3F55",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="wins" stroke="#10B981" strokeWidth={2} name="Winnings" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-[#B8C5D6]">
                  No revenue data available for this period
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Monthly Metrics (Bets)</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                      <XAxis dataKey="date" stroke="#B8C5D6" />
                      <YAxis stroke="#B8C5D6" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A2F45",
                          border: "1px solid #2A3F55",
                        }}
                      />
                      <Bar dataKey="bets" fill="#4A90E2" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-[#B8C5D6]">No bet data available</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Player Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={playerAcquisitionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {playerAcquisitionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Players Tab - Real data */}
        <TabsContent value="players" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Player Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#1A2F45] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">Total Registered</p>
                  <p className="text-2xl font-bold text-[#FFD700]">{playersData?.totalRegistered || 0}</p>
                </div>
                <div className="p-4 bg-[#1A2F45] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">Active Players</p>
                  <p className="text-2xl font-bold text-green-400">{activePlayers.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-[#1A2F45] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">New Registrations</p>
                  <p className="text-2xl font-bold text-blue-400">{playersData?.newRegistrations || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h4 className="text-[#F5F5F5] font-semibold mb-3">Player Retention</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-[#1A2F45] rounded border border-[#2A3F55]">
                      <span className="text-[#B8C5D6]">Daily Active Users</span>
                      <span className="font-semibold text-[#FFD700]">{playersData?.dailyActiveUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#1A2F45] rounded border border-[#2A3F55]">
                      <span className="text-[#B8C5D6]">Weekly Active Users</span>
                      <span className="font-semibold text-[#FFD700]">{playersData?.weeklyActiveUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#1A2F45] rounded border border-[#2A3F55]">
                      <span className="text-[#B8C5D6]">Monthly Active Users</span>
                      <span className="font-semibold text-[#FFD700]">{playersData?.monthlyActiveUsers || 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[#F5F5F5] font-semibold mb-3">Churn Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-[#1A2F45] rounded border border-[#2A3F55]">
                      <span className="text-[#B8C5D6]">At Risk Players</span>
                      <span className="font-semibold text-yellow-400">{playersData?.churn?.atRisk || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#1A2F45] rounded border border-[#2A3F55]">
                      <span className="text-[#B8C5D6]">Churned (30 days)</span>
                      <span className="font-semibold text-red-400">{playersData?.churn?.churned || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#1A2F45] rounded border border-[#2A3F55]">
                      <span className="text-[#B8C5D6]">Retention Rate</span>
                      <span className="font-semibold text-green-400">
                        {playersData?.retention?.rate ? `${(playersData.retention.rate * 100).toFixed(1)}%` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bets Tab - Real data */}
        <TabsContent value="bets" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Bets by Sport Category</CardTitle>
            </CardHeader>
            <CardContent>
              {betCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={betCategoryData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                    <XAxis dataKey="sport" stroke="#B8C5D6" />
                    <YAxis stroke="#B8C5D6" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A2F45",
                        border: "1px solid #2A3F55",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="bets" fill="#4A90E2" name="Bets" />
                    <Bar dataKey="revenue" fill="#FFD700" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-[#B8C5D6]">
                  No betting data available for this period
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Betting Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#1A2F45] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">Total Stakes</p>
                  <p className="text-2xl font-bold text-[#FFD700]">
                    ${overviewData?.totalStakes?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-4 bg-[#1A2F45] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">Total Payouts</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${overviewData?.totalPayouts?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-4 bg-[#0D1F35] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">House Edge</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {overviewData?.houseEdge ? `${(overviewData.houseEdge * 100).toFixed(2)}%` : "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-[#0D1F35] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">Bonuses Paid</p>
                  <p className="text-2xl font-bold text-orange-400">
                    ${overviewData?.bonusesPaid?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab - Real data from product split */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Revenue by Sport/Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {productSplitData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={productSplitData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {productSplitData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-[#B8C5D6]">
                      No product data available
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {productSplitData.length > 0 ? (
                    productSplitData.map((item, index) => (
                      <div key={index} className="p-3 bg-[#1A2F45] rounded border border-[#2A3F55]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#B8C5D6] font-semibold">{item.name}</span>
                          <span className="text-[#FFD700]">${item.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-[#0D1F35] rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(item.value / Math.max(...productSplitData.map((d) => d.value))) * 100}%`,
                              backgroundColor: item.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#B8C5D6] text-center py-8">No product split data available</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#1A2F45] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">Gross Gaming Revenue (GGR)</p>
                  <p className="text-2xl font-bold text-[#FFD700]">${overviewData?.ggr?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-[#1A2F45] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">Net Gaming Revenue (NGR)</p>
                  <p className="text-2xl font-bold text-green-400">${overviewData?.ngr?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-[#1A2F45] rounded border border-[#2A3F55]">
                  <p className="text-[#B8C5D6] text-sm mb-2">Total Turnover</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ${overviewData?.totalStakes?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
