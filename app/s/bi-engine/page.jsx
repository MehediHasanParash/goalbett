"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calculator,
  Percent,
  CreditCard,
  Gift,
  Building2,
  Info,
  Settings,
} from "lucide-react"

export default function BIEnginePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [tenantData, setTenantData] = useState(null)
  const [trendData, setTrendData] = useState(null)
  const [dateRange, setDateRange] = useState("30d")
  const [activeTab, setActiveTab] = useState("summary")

  // Configurable fee rates
  const [providerFeeRate, setProviderFeeRate] = useState(12)
  const [gatewayFeeRate, setGatewayFeeRate] = useState(2.5)
  const [taxRate, setTaxRate] = useState(15)

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
      default:
        start.setDate(end.getDate() - 30)
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams({
        startDate,
        endDate,
        providerFeeRate: (providerFeeRate / 100).toString(),
        gatewayFeeRate: (gatewayFeeRate / 100).toString(),
        taxRate: (taxRate / 100).toString(),
      })

      const [summaryRes, tenantRes, trendRes] = await Promise.all([
        fetch(`/api/super/bi-engine?type=summary&${params}`),
        fetch(`/api/super/bi-engine?type=by_tenant&${params}`),
        fetch(`/api/super/bi-engine?type=trend&${params}`),
      ])

      const [summary, tenants, trend] = await Promise.all([summaryRes.json(), tenantRes.json(), trendRes.json()])

      setData(summary)
      setTenantData(tenants)
      setTrendData(trend)
    } catch (error) {
      console.error("Failed to fetch BI data:", error)
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatPercent = (value) => `${(value || 0).toFixed(1)}%`

  const revenue = data?.revenue || {}
  const deductions = revenue.deductions || {}

  // Pie chart data for deductions
  const deductionsPieData = [
    { name: "Provider Fees", value: deductions.providerFees?.amount || 0, color: "#FF6B6B" },
    { name: "Gateway Fees", value: deductions.gatewayFees?.amount || 0, color: "#4ECDC4" },
    { name: "Bonuses", value: deductions.bonusesPaid?.amount || 0, color: "#9B59B6" },
    { name: "Taxes", value: deductions.taxes?.amount || 0, color: "#F39C12" },
    { name: "Operations", value: deductions.operationalCosts?.amount || 0, color: "#3498DB" },
  ].filter((d) => d.value > 0)

  return (
    <SuperAdminLayout title="BI Engine" description="Business Intelligence with True Net Profit Calculator">
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
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FFD700]/20">
                <DollarSign className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-xs text-[#8B9DB6]">Gross Gaming Revenue</p>
                <p className="text-xl font-bold text-[#FFD700]">{formatCurrency(revenue.grossGamingRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#4A90E2]/20">
                <TrendingDown className="w-5 h-5 text-[#4A90E2]" />
              </div>
              <div>
                <p className="text-xs text-[#8B9DB6]">Total Deductions</p>
                <p className="text-xl font-bold text-[#E74C3C]">-{formatCurrency(revenue.totalDeductions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#50C878]/20">
                <TrendingUp className="w-5 h-5 text-[#50C878]" />
              </div>
              <div>
                <p className="text-xs text-[#8B9DB6]">Net Gaming Revenue</p>
                <p className="text-xl font-bold text-[#50C878]">{formatCurrency(revenue.netGamingRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55] border-2 border-[#FFD700]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FFD700]/30">
                <Calculator className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-xs text-[#FFD700]">TRUE NET PROFIT</p>
                <p className="text-xl font-bold text-white">{formatCurrency(revenue.trueNetProfit)}</p>
                <p className="text-xs text-[#50C878]">{formatPercent(revenue.profitMargin)} margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1A2F45] border border-[#2A3F55] mb-6">
          <TabsTrigger value="summary" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Calculator className="w-4 h-4 mr-2" />
            Revenue Breakdown
          </TabsTrigger>
          <TabsTrigger value="tenants" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Building2 className="w-4 h-4 mr-2" />
            By Tenant
          </TabsTrigger>
          <TabsTrigger value="trend" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trend Analysis
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Settings className="w-4 h-4 mr-2" />
            Fee Settings
          </TabsTrigger>
        </TabsList>

        {/* Revenue Breakdown Tab */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deductions Breakdown */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Deductions from GGR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provider Fees */}
                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-[#FF6B6B]" />
                      <span className="text-white">Game Provider Fees</span>
                      <Badge variant="outline" className="text-[#FF6B6B] border-[#FF6B6B]">
                        {formatPercent(deductions.providerFees?.rate)}
                      </Badge>
                    </div>
                    <span className="text-[#FF6B6B] font-bold">-{formatCurrency(deductions.providerFees?.amount)}</span>
                  </div>
                  <p className="text-xs text-[#8B9DB6]">{deductions.providerFees?.description}</p>
                </div>

                {/* Gateway Fees */}
                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#4ECDC4]" />
                      <span className="text-white">Payment Gateway Fees</span>
                      <Badge variant="outline" className="text-[#4ECDC4] border-[#4ECDC4]">
                        {formatPercent(deductions.gatewayFees?.rate)}
                      </Badge>
                    </div>
                    <span className="text-[#4ECDC4] font-bold">-{formatCurrency(deductions.gatewayFees?.amount)}</span>
                  </div>
                  <p className="text-xs text-[#8B9DB6]">
                    {deductions.gatewayFees?.description} • {deductions.gatewayFees?.transactions || 0} transactions
                  </p>
                </div>

                {/* Bonuses */}
                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#9B59B6]" />
                      <span className="text-white">Bonuses & Promotions</span>
                      <Badge variant="outline" className="text-[#9B59B6] border-[#9B59B6]">
                        {deductions.bonusesPaid?.count || 0} claims
                      </Badge>
                    </div>
                    <span className="text-[#9B59B6] font-bold">-{formatCurrency(deductions.bonusesPaid?.amount)}</span>
                  </div>
                  <p className="text-xs text-[#8B9DB6]">{deductions.bonusesPaid?.description}</p>
                </div>

                {/* Taxes */}
                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#F39C12]" />
                      <span className="text-white">Gaming Taxes</span>
                      <Badge variant="outline" className="text-[#F39C12] border-[#F39C12]">
                        {formatPercent(deductions.taxes?.rate)}
                      </Badge>
                    </div>
                    <span className="text-[#F39C12] font-bold">-{formatCurrency(deductions.taxes?.amount)}</span>
                  </div>
                  <p className="text-xs text-[#8B9DB6]">{deductions.taxes?.description}</p>
                </div>

                {/* Operational Costs */}
                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#3498DB]" />
                      <span className="text-white">Operational Costs</span>
                      <Badge variant="outline" className="text-[#3498DB] border-[#3498DB]">
                        {formatPercent(deductions.operationalCosts?.rate)}
                      </Badge>
                    </div>
                    <span className="text-[#3498DB] font-bold">
                      -{formatCurrency(deductions.operationalCosts?.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-[#8B9DB6]">{deductions.operationalCosts?.description}</p>
                </div>

                {/* Total */}
                <div className="p-4 bg-[#FFD700]/10 rounded-lg border border-[#FFD700]/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[#FFD700] font-bold">Total Deductions</span>
                    <span className="text-[#E74C3C] font-bold text-xl">-{formatCurrency(revenue.totalDeductions)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deductions Pie Chart */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Deductions Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deductionsPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deductionsPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {deductionsPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1A2F45", border: "1px solid #2A3F55" }}
                        formatter={(value) => [formatCurrency(value), ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-[#8B9DB6]">No deductions data</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Waterfall */}
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Revenue Waterfall: GGR to True Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
                <div className="flex flex-col items-center min-w-[120px]">
                  <div className="text-xs text-[#8B9DB6] mb-1">GGR</div>
                  <div className="w-24 h-32 bg-[#FFD700] rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-[#0A1A2F] font-bold text-sm">
                      {formatCurrency(revenue.grossGamingRevenue)}
                    </span>
                  </div>
                </div>
                <div className="text-2xl text-[#8B9DB6]">→</div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <div className="text-xs text-[#8B9DB6] mb-1">- Provider</div>
                  <div className="w-24 h-24 bg-[#FF6B6B] rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white font-bold text-sm">
                      {formatCurrency(deductions.providerFees?.amount)}
                    </span>
                  </div>
                </div>
                <div className="text-2xl text-[#8B9DB6]">→</div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <div className="text-xs text-[#8B9DB6] mb-1">- Gateway</div>
                  <div className="w-24 h-20 bg-[#4ECDC4] rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white font-bold text-sm">
                      {formatCurrency(deductions.gatewayFees?.amount)}
                    </span>
                  </div>
                </div>
                <div className="text-2xl text-[#8B9DB6]">→</div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <div className="text-xs text-[#8B9DB6] mb-1">- Bonuses</div>
                  <div className="w-24 h-16 bg-[#9B59B6] rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white font-bold text-sm">
                      {formatCurrency(deductions.bonusesPaid?.amount)}
                    </span>
                  </div>
                </div>
                <div className="text-2xl text-[#8B9DB6]">→</div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <div className="text-xs text-[#8B9DB6] mb-1">- Taxes</div>
                  <div className="w-24 h-16 bg-[#F39C12] rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white font-bold text-sm">{formatCurrency(deductions.taxes?.amount)}</span>
                  </div>
                </div>
                <div className="text-2xl text-[#8B9DB6]">→</div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <div className="text-xs text-[#50C878] mb-1 font-bold">NET PROFIT</div>
                  <div className="w-24 h-28 bg-[#50C878] rounded-t-lg flex items-end justify-center pb-2 border-2 border-[#FFD700]">
                    <span className="text-white font-bold text-sm">{formatCurrency(revenue.trueNetProfit)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Tenant Tab */}
        <TabsContent value="tenants" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Tenant Profitability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2A3F55]">
                    <TableHead className="text-[#8B9DB6]">Tenant</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">GGR</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">Provider Fees</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">Gateway Fees</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">Bonuses</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">NGR</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">Net Profit</TableHead>
                    <TableHead className="text-[#8B9DB6] text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantData?.tenants?.map((tenant) => (
                    <TableRow key={tenant.tenantId} className="border-[#2A3F55]">
                      <TableCell className="text-white font-medium">{tenant.tenantName}</TableCell>
                      <TableCell className="text-right text-[#FFD700]">{formatCurrency(tenant.ggr)}</TableCell>
                      <TableCell className="text-right text-[#FF6B6B]">
                        -{formatCurrency(tenant.deductions?.providerFees)}
                      </TableCell>
                      <TableCell className="text-right text-[#4ECDC4]">
                        -{formatCurrency(tenant.deductions?.gatewayFees)}
                      </TableCell>
                      <TableCell className="text-right text-[#9B59B6]">
                        -{formatCurrency(tenant.deductions?.bonusesPaid)}
                      </TableCell>
                      <TableCell className="text-right text-[#4A90E2]">{formatCurrency(tenant.ngr)}</TableCell>
                      <TableCell className="text-right text-[#50C878] font-bold">
                        {formatCurrency(tenant.trueNetProfit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            tenant.profitMargin > 30
                              ? "text-[#50C878] border-[#50C878]"
                              : tenant.profitMargin > 15
                                ? "text-[#F39C12] border-[#F39C12]"
                                : "text-[#E74C3C] border-[#E74C3C]"
                          }
                        >
                          {formatPercent(tenant.profitMargin)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              {tenantData?.totals && (
                <div className="mt-4 p-4 bg-[#1A2F45] rounded-lg">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-[#8B9DB6]">Total GGR</p>
                      <p className="text-lg font-bold text-[#FFD700]">{formatCurrency(tenantData.totals.totalGGR)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B9DB6]">Total Deductions</p>
                      <p className="text-lg font-bold text-[#E74C3C]">
                        -
                        {formatCurrency(
                          tenantData.totals.totalProviderFees +
                            tenantData.totals.totalGatewayFees +
                            tenantData.totals.totalBonuses +
                            tenantData.totals.totalTaxes,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B9DB6]">Total NGR</p>
                      <p className="text-lg font-bold text-[#4A90E2]">{formatCurrency(tenantData.totals.totalNGR)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B9DB6]">Total Net Profit</p>
                      <p className="text-lg font-bold text-[#50C878]">
                        {formatCurrency(tenantData.totals.totalTrueNetProfit)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Tab */}
        <TabsContent value="trend" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Daily Revenue & Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                  <XAxis dataKey="date" stroke="#8B9DB6" fontSize={12} />
                  <YAxis stroke="#8B9DB6" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A2F45", border: "1px solid #2A3F55" }}
                    formatter={(value) => [formatCurrency(value), ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="ggr" stroke="#FFD700" fill="#FFD700" fillOpacity={0.2} name="GGR" />
                  <Area type="monotone" dataKey="ngr" stroke="#4A90E2" fill="#4A90E2" fillOpacity={0.2} name="NGR" />
                  <Area
                    type="monotone"
                    dataKey="trueNetProfit"
                    stroke="#50C878"
                    fill="#50C878"
                    fillOpacity={0.3}
                    name="True Net Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Daily Deductions Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                  <XAxis dataKey="date" stroke="#8B9DB6" fontSize={12} />
                  <YAxis stroke="#8B9DB6" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A2F45", border: "1px solid #2A3F55" }}
                    formatter={(value) => [formatCurrency(value), ""]}
                  />
                  <Legend />
                  <Bar dataKey="providerFees" stackId="a" fill="#FF6B6B" name="Provider Fees" />
                  <Bar dataKey="gatewayFees" stackId="a" fill="#4ECDC4" name="Gateway Fees" />
                  <Bar dataKey="bonusesPaid" stackId="a" fill="#9B59B6" name="Bonuses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configure Fee Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-[#1A2F45]/50 rounded-lg border border-[#2A3F55] mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#4A90E2] mt-0.5" />
                  <p className="text-sm text-[#8B9DB6]">
                    Adjust the fee rates below to match your actual costs. Changes will recalculate all revenue metrics.
                  </p>
                </div>
              </div>

              {/* Provider Fee Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-white font-medium">Game Provider Fee Rate</label>
                  <span className="text-[#FFD700] font-bold">{providerFeeRate}%</span>
                </div>
                <Slider
                  value={[providerFeeRate]}
                  onValueChange={([v]) => setProviderFeeRate(v)}
                  min={5}
                  max={25}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-[#8B9DB6]">
                  Typical range: 10-20%. This is the percentage of GGR paid to game providers (slots, live casino, etc.)
                </p>
              </div>

              {/* Gateway Fee Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-white font-medium">Payment Gateway Fee Rate</label>
                  <span className="text-[#FFD700] font-bold">{gatewayFeeRate}%</span>
                </div>
                <Slider
                  value={[gatewayFeeRate]}
                  onValueChange={([v]) => setGatewayFeeRate(v)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-[#8B9DB6]">
                  Typical range: 1.5-3%. This is applied to the total transaction volume (deposits + withdrawals)
                </p>
              </div>

              {/* Tax Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-white font-medium">Gaming Tax Rate</label>
                  <span className="text-[#FFD700] font-bold">{taxRate}%</span>
                </div>
                <Slider
                  value={[taxRate]}
                  onValueChange={([v]) => setTaxRate(v)}
                  min={0}
                  max={30}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-[#8B9DB6]">
                  Varies by jurisdiction: 0-30%. This is the gaming tax applied to GGR.
                </p>
              </div>

              <Button className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E6C200] w-full" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalculate with New Rates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SuperAdminLayout>
  )
}
