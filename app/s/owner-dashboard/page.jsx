"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DollarSign,
  TrendingUp,
  Minus,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Calculator,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  Mail,
  Gift,
  BarChart3,
  Target,
  Zap,
} from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { getAuthToken, getUser } from "@/lib/auth-service"

export default function OwnerDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Data states
  const [biData, setBiData] = useState(null)
  const [tenantData, setTenantData] = useState(null)
  const [trendData, setTrendData] = useState(null)
  const [churnData, setChurnData] = useState(null)

  // Filters
  const [dateRange, setDateRange] = useState("30")
  const [selectedTenant, setSelectedTenant] = useState("all")

  useEffect(() => {
    const token = getAuthToken()
    const user = getUser()

    if (!token || !user) {
      router.replace("/s/login")
      return
    }

    if (user.role !== "superadmin" && user.role !== "super_admin") {
      router.replace("/s/login")
      return
    }

    fetchAllData()
  }, [router, dateRange, selectedTenant])

  const fetchAllData = async () => {
    try {
      setError(null)
      if (!loading) setRefreshing(true)

      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - Number.parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()
      const params = `startDate=${startDate}&endDate=${endDate}${selectedTenant !== "all" ? `&tenantId=${selectedTenant}` : ""}`

      const [biRes, tenantRes, trendRes, churnRes] = await Promise.all([
        fetch(`/api/super/bi-engine?type=summary&${params}`),
        fetch(`/api/super/bi-engine?type=by_tenant&${params}`),
        fetch(`/api/super/bi-engine?type=trend&${params}`),
        fetch(`/api/super/churn-predictor?inactiveDays=3`),
      ])

      const [bi, tenant, trend, churn] = await Promise.all([
        biRes.json(),
        tenantRes.json(),
        trendRes.json(),
        churnRes.json(),
      ])

      if (bi.success) setBiData(bi)
      if (tenant.success) setTenantData(tenant)
      if (trend.success) setTrendData(trend)
      if (churn.success) setChurnData(churn)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "$0"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value) => {
    if (value === undefined || value === null) return "0%"
    return `${Number(value).toFixed(1)}%`
  }

  if (loading) {
    return (
      <SuperAdminLayout title="Owner Dashboard" description="Real-time profit & churn analytics">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          <span className="ml-3 text-[#8B9DB6]">Loading business intelligence...</span>
        </div>
      </SuperAdminLayout>
    )
  }

  const revenue = biData?.revenue || {}
  const deductions = revenue.deductions || {}

  return (
    <SuperAdminLayout title="Owner Dashboard" description="Real-time profit & churn analytics">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#FFD700]">Owner Dashboard</h1>
            <p className="text-[#8B9DB6]">Real-time NGR/GGR with True Net Profit</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px] bg-[#1A2C38] border-[#2A3F55]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchAllData}
              variant="outline"
              disabled={refreshing}
              className="border-[#2A3F55] bg-transparent"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Profit Formula Card */}
        <Card className="bg-gradient-to-br from-[#0D1B24] to-[#1A2C38] border-[#FFD700]/30">
          <CardHeader>
            <CardTitle className="text-[#FFD700] flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Profit Formula Breakdown
            </CardTitle>
            <CardDescription>
              Total Bets - Total Wins - Bonus Costs - Provider Fees = Your Actual Profit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Visual Formula */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 py-6 bg-[#0D1B24] rounded-lg mb-6">
              <div className="text-center px-4 py-2">
                <p className="text-xs text-[#8B9DB6]">Total Stakes</p>
                <p className="text-xl md:text-2xl font-bold text-green-400">{formatCurrency(revenue.totalStakes)}</p>
              </div>
              <Minus className="w-6 h-6 text-[#8B9DB6]" />
              <div className="text-center px-4 py-2">
                <p className="text-xs text-[#8B9DB6]">Total Payouts</p>
                <p className="text-xl md:text-2xl font-bold text-red-400">{formatCurrency(revenue.totalPayouts)}</p>
              </div>
              <span className="text-[#8B9DB6] text-2xl">=</span>
              <div className="text-center px-4 py-2 bg-[#1A2C38] rounded-lg">
                <p className="text-xs text-[#8B9DB6]">GGR</p>
                <p className="text-xl md:text-2xl font-bold text-[#FFD700]">
                  {formatCurrency(revenue.grossGamingRevenue)}
                </p>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-[#0D1B24] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-xs text-[#8B9DB6]">Provider Fees</span>
                </div>
                <p className="text-lg font-bold text-orange-400">-{formatCurrency(deductions.providerFees?.amount)}</p>
                <p className="text-xs text-[#8B9DB6]">{deductions.providerFees?.rate}% of GGR</p>
              </div>
              <div className="bg-[#0D1B24] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-[#8B9DB6]">Gateway Fees</span>
                </div>
                <p className="text-lg font-bold text-blue-400">-{formatCurrency(deductions.gatewayFees?.amount)}</p>
                <p className="text-xs text-[#8B9DB6]">{deductions.gatewayFees?.rate}% of volume</p>
              </div>
              <div className="bg-[#0D1B24] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-xs text-[#8B9DB6]">Bonuses Paid</span>
                </div>
                <p className="text-lg font-bold text-purple-400">-{formatCurrency(deductions.bonusesPaid?.amount)}</p>
                <p className="text-xs text-[#8B9DB6]">{deductions.bonusesPaid?.count || 0} bonuses</p>
              </div>
              <div className="bg-[#0D1B24] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-[#8B9DB6]">Taxes</span>
                </div>
                <p className="text-lg font-bold text-red-400">-{formatCurrency(deductions.taxes?.amount)}</p>
                <p className="text-xs text-[#8B9DB6]">{deductions.taxes?.rate}% rate</p>
              </div>
              <div className="bg-[#0D1B24] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-xs text-[#8B9DB6]">Operational</span>
                </div>
                <p className="text-lg font-bold text-gray-400">
                  -{formatCurrency(deductions.operationalCosts?.amount)}
                </p>
                <p className="text-xs text-[#8B9DB6]">{deductions.operationalCosts?.rate}% estimate</p>
              </div>
            </div>

            {/* Final Profit */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-full">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-[#8B9DB6]">True Net Profit</p>
                  <p className="text-3xl md:text-4xl font-bold text-green-400">
                    {formatCurrency(revenue.trueNetProfit)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-[#8B9DB6]">NGR</p>
                  <p className="text-xl font-bold text-[#F5F5F5]">{formatCurrency(revenue.netGamingRevenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8B9DB6]">Profit Margin</p>
                  <p className="text-xl font-bold text-[#FFD700]">{formatPercent(revenue.profitMargin)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8B9DB6]">House Edge</p>
                  <p className="text-xl font-bold text-cyan-400">{formatPercent(revenue.houseEdge)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="churn" className="space-y-4">
          <TabsList className="bg-[#1A2C38]">
            <TabsTrigger value="churn" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
              <UserX className="w-4 h-4 mr-2" />
              Churn Predictor
            </TabsTrigger>
            <TabsTrigger value="trend" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
              <TrendingUp className="w-4 h-4 mr-2" />
              Profit Trend
            </TabsTrigger>
            <TabsTrigger value="tenants" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
              <BarChart3 className="w-4 h-4 mr-2" />
              By Tenant
            </TabsTrigger>
          </TabsList>

          {/* Churn Predictor Tab */}
          <TabsContent value="churn" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#1A2C38] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-[#8B9DB6] text-sm">At Risk</p>
                      <p className="text-2xl font-bold text-red-400">{churnData?.atRiskCount || 0}</p>
                      <p className="text-xs text-[#8B9DB6]">{formatPercent(churnData?.atRiskRate)} of players</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1A2C38] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[#8B9DB6] text-sm">Urgent</p>
                      <p className="text-2xl font-bold text-orange-400">{churnData?.summary?.urgent || 0}</p>
                      <p className="text-xs text-[#8B9DB6]">Need immediate action</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1A2C38] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-[#8B9DB6] text-sm">Warning</p>
                      <p className="text-2xl font-bold text-yellow-400">{churnData?.summary?.warning || 0}</p>
                      <p className="text-xs text-[#8B9DB6]">Send re-engagement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1A2C38] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-500/20 rounded-lg">
                      <XCircle className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[#8B9DB6] text-sm">Churned</p>
                      <p className="text-2xl font-bold text-gray-400">{churnData?.churnedCount || 0}</p>
                      <p className="text-xs text-[#8B9DB6]">{formatPercent(churnData?.churnRate)} churn rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* At Risk Players List */}
            <Card className="bg-[#1A2C38] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-400" />
                  At-Risk Players (Were Active Daily, Now Inactive 3+ Days)
                </CardTitle>
                <CardDescription>AI-flagged players who need re-engagement</CardDescription>
              </CardHeader>
              <CardContent>
                {churnData?.atRiskPlayers?.length > 0 ? (
                  <div className="space-y-3">
                    {churnData.atRiskPlayers.slice(0, 10).map((player, idx) => (
                      <div
                        key={player.userId || idx}
                        className="flex items-center justify-between p-4 bg-[#0D1B24] rounded-lg border border-[#2A3F55]"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              player.churnProbability > 80
                                ? "bg-red-500/20"
                                : player.churnProbability > 60
                                  ? "bg-orange-500/20"
                                  : "bg-yellow-500/20"
                            }`}
                          >
                            <UserX
                              className={`w-5 h-5 ${
                                player.churnProbability > 80
                                  ? "text-red-400"
                                  : player.churnProbability > 60
                                    ? "text-orange-400"
                                    : "text-yellow-400"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-[#F5F5F5]">{player.name}</p>
                            <p className="text-xs text-[#8B9DB6]">{player.email}</p>
                            <p className="text-xs text-[#8B9DB6] mt-1">{player.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-[#8B9DB6]">Churn Risk</p>
                            <p
                              className={`font-bold ${
                                player.churnProbability > 80
                                  ? "text-red-400"
                                  : player.churnProbability > 60
                                    ? "text-orange-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {player.churnProbability}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#8B9DB6]">Last Active</p>
                            <p className="text-[#F5F5F5]">{player.daysSinceActivity} days ago</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-[#2A3F55] bg-transparent">
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
                              <Gift className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {churnData.atRiskPlayers.length > 10 && (
                      <p className="text-center text-[#8B9DB6] text-sm py-2">
                        +{churnData.atRiskPlayers.length - 10} more at-risk players
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-[#F5F5F5] font-semibold">No at-risk players detected</p>
                    <p className="text-[#8B9DB6] text-sm">All active players are engaged</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit Trend Tab */}
          <TabsContent value="trend" className="space-y-4">
            <Card className="bg-[#1A2C38] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">Daily Profit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData?.trend || []}>
                      <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ggrGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                      <XAxis dataKey="date" stroke="#8B9DB6" fontSize={12} />
                      <YAxis stroke="#8B9DB6" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1A2C38", border: "1px solid #2A3F55" }}
                        labelStyle={{ color: "#F5F5F5" }}
                        formatter={(value) => [formatCurrency(value)]}
                      />
                      <Area type="monotone" dataKey="ggr" name="GGR" stroke="#FFD700" fill="url(#ggrGradient)" />
                      <Area
                        type="monotone"
                        dataKey="trueNetProfit"
                        name="Net Profit"
                        stroke="#22c55e"
                        fill="url(#profitGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Tenant Tab */}
          <TabsContent value="tenants" className="space-y-4">
            <Card className="bg-[#1A2C38] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">Profit by Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenantData?.tenants?.map((tenant, idx) => (
                    <div key={tenant.tenantId || idx} className="p-4 bg-[#0D1B24] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-[#F5F5F5]">{tenant.tenantName}</p>
                          <p className="text-xs text-[#8B9DB6]">{tenant.tenantSlug}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-400">{formatCurrency(tenant.trueNetProfit)}</p>
                          <p className="text-xs text-[#8B9DB6]">Net Profit</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[#8B9DB6]">GGR</p>
                          <p className="text-[#FFD700] font-semibold">{formatCurrency(tenant.ggr)}</p>
                        </div>
                        <div>
                          <p className="text-[#8B9DB6]">NGR</p>
                          <p className="text-[#F5F5F5] font-semibold">{formatCurrency(tenant.ngr)}</p>
                        </div>
                        <div>
                          <p className="text-[#8B9DB6]">Margin</p>
                          <p className="text-cyan-400 font-semibold">{formatPercent(tenant.profitMargin)}</p>
                        </div>
                        <div>
                          <p className="text-[#8B9DB6]">Deductions</p>
                          <p className="text-red-400 font-semibold">
                            {formatCurrency(
                              tenant.deductions.providerFees +
                                tenant.deductions.gatewayFees +
                                tenant.deductions.bonusesPaid +
                                tenant.deductions.taxes,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!tenantData?.tenants || tenantData.tenants.length === 0) && (
                    <div className="text-center py-8 text-[#8B9DB6]">No tenant data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  )
}
