"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Users,
  RefreshCw,
  Bell,
  Shield,
  X,
  Calendar,
  Activity,
  Percent,
  Wallet,
  Building2,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

export default function InsolvencyAlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMonitored: 0,
    atRisk: 0,
    critical: 0,
    healthy: 0,
  })
  const [detailsModal, setDetailsModal] = useState({ open: false, tenant: null })

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 300000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/super/insolvency-alerts")
      const data = await res.json()

      if (data.success) {
        setAlerts(data.alerts || [])
        setStats(data.stats || { totalMonitored: 0, atRisk: 0, critical: 0, healthy: 0 })
      }
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
      setLoading(false)
    }
  }

  const getRiskBadge = (level) => {
    const config = {
      critical: { color: "bg-red-500", text: "Critical - <48h" },
      high: { color: "bg-orange-500", text: "High Risk" },
      medium: { color: "bg-yellow-500", text: "Medium Risk" },
      healthy: { color: "bg-green-500", text: "Healthy" },
    }
    const c = config[level] || config.healthy
    return <Badge className={`${c.color} text-white`}>{c.text}</Badge>
  }

  const formatDaysToInsolvency = (days) => {
    if (days === null || days === undefined || days === "N/A (Profit)") {
      return { text: "Profitable", color: "text-green-400" }
    }
    if (typeof days === "number") {
      if (days < 2) return { text: `${days} days`, color: "text-red-400" }
      if (days < 7) return { text: `${days} days`, color: "text-yellow-400" }
      return { text: `${days} days`, color: "text-white" }
    }
    return { text: "Profitable", color: "text-green-400" }
  }

  return (
    <SuperAdminLayout title="Insolvency Alerts" description="Monitor tenant credit health and runway">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Total Monitored</p>
                  <p className="text-2xl font-bold text-white">{stats.totalMonitored}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Critical (&lt;48h)</p>
                  <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">At Risk</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.atRisk}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Healthy</p>
                  <p className="text-2xl font-bold text-green-400">{stats.healthy}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Tenant Health Monitor</h2>
            <Button onClick={fetchAlerts} variant="outline" className="border-[#2A3F55] text-[#B8C5D6] bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-[#B8C5D6]">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-green-400 mb-4" />
                <p className="text-[#F5F5F5] font-medium">All tenants are healthy</p>
                <p className="text-[#B8C5D6] text-sm">No insolvency risks detected</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => {
              const daysInfo = formatDaysToInsolvency(alert.daysToInsolvency)
              return (
                <Card
                  key={alert._id}
                  className={`bg-[#0D1F35] border-[#2A3F55] ${
                    alert.riskLevel === "critical" ? "border-l-4 border-l-red-500" : ""
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getRiskBadge(alert.riskLevel)}
                          {alert.riskLevel === "critical" && (
                            <Badge className="bg-red-500/20 text-red-400 border border-red-500">
                              <Bell className="w-3 h-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-white">{alert.tenantName}</CardTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-[#B8C5D6] text-sm">Current Balance</p>
                        <p
                          className={`text-2xl font-bold ${alert.currentBalance < 50000 ? "text-red-400" : "text-green-400"}`}
                        >
                          ${alert.currentBalance?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-[#0A1A2F] rounded-lg p-3">
                        <p className="text-[#B8C5D6] text-xs mb-1">Days to Insolvency</p>
                        <p className={`text-xl font-bold ${daysInfo.color}`}>{daysInfo.text}</p>
                      </div>
                      <div className="bg-[#0A1A2F] rounded-lg p-3">
                        <p className="text-[#B8C5D6] text-xs mb-1">Daily Burn Rate</p>
                        <p className={`text-xl font-bold ${alert.burnRate > 0 ? "text-red-400" : "text-green-400"}`}>
                          {alert.burnRate > 0 ? "-" : "+"}${Math.abs(alert.burnRate || 0).toLocaleString()}/day
                        </p>
                      </div>
                      <div className="bg-[#0A1A2F] rounded-lg p-3">
                        <p className="text-[#B8C5D6] text-xs mb-1">Player Win Rate</p>
                        <p className={`text-xl font-bold ${alert.winRate > 50 ? "text-red-400" : "text-green-400"}`}>
                          {alert.winRate || 50}%
                        </p>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    {alert.trend?.length > 0 && (
                      <div className="h-32 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={alert.trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                            <XAxis dataKey="day" stroke="#B8C5D6" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#B8C5D6" tick={{ fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#0D1F35", border: "1px solid #2A3F55" }}
                              labelStyle={{ color: "#FFD700" }}
                            />
                            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                            <Line
                              type="monotone"
                              dataKey="balance"
                              stroke={
                                alert.riskLevel === "critical"
                                  ? "#ef4444"
                                  : alert.riskLevel === "healthy"
                                    ? "#22c55e"
                                    : "#f59e0b"
                              }
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-[#2A3F55] text-[#B8C5D6] bg-transparent hover:bg-[#1A2F45]"
                        onClick={() => setDetailsModal({ open: true, tenant: alert })}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {alert.riskLevel === "critical" && <Button variant="destructive">Suspend Operations</Button>}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {detailsModal.open && detailsModal.tenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0D1F35] border-b border-[#2A3F55] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FFD700]/20 rounded-lg">
                  <Building2 className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{detailsModal.tenant.tenantName}</h3>
                  <p className="text-[#B8C5D6] text-sm">Tenant Financial Overview</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailsModal({ open: false, tenant: null })}
                className="text-[#B8C5D6] hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Risk Status */}
              <div className="flex items-center justify-between p-4 bg-[#0A1A2F] rounded-lg">
                <div>
                  <p className="text-[#B8C5D6] text-sm">Risk Status</p>
                  <div className="mt-1">{getRiskBadge(detailsModal.tenant.riskLevel)}</div>
                </div>
                <div className="text-right">
                  <p className="text-[#B8C5D6] text-sm">Tenant ID</p>
                  <p className="text-white font-mono text-sm">{detailsModal.tenant.tenantId?.slice(0, 12)}...</p>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0A1A2F] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-green-400" />
                    <p className="text-[#B8C5D6] text-sm">Current Balance</p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${detailsModal.tenant.currentBalance < 50000 ? "text-red-400" : "text-green-400"}`}
                  >
                    ${detailsModal.tenant.currentBalance?.toLocaleString() || 0}
                  </p>
                </div>

                <div className="p-4 bg-[#0A1A2F] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-yellow-400" />
                    <p className="text-[#B8C5D6] text-sm">Days to Insolvency</p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${formatDaysToInsolvency(detailsModal.tenant.daysToInsolvency).color}`}
                  >
                    {formatDaysToInsolvency(detailsModal.tenant.daysToInsolvency).text}
                  </p>
                </div>

                <div className="p-4 bg-[#0A1A2F] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <p className="text-[#B8C5D6] text-sm">Daily Burn Rate</p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${detailsModal.tenant.burnRate > 0 ? "text-red-400" : "text-green-400"}`}
                  >
                    {detailsModal.tenant.burnRate > 0 ? "-" : "+"}$
                    {Math.abs(detailsModal.tenant.burnRate || 0).toLocaleString()}/day
                  </p>
                </div>

                <div className="p-4 bg-[#0A1A2F] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-4 h-4 text-blue-400" />
                    <p className="text-[#B8C5D6] text-sm">Player Win Rate</p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${detailsModal.tenant.winRate > 50 ? "text-red-400" : "text-green-400"}`}
                  >
                    {detailsModal.tenant.winRate || 50}%
                  </p>
                </div>
              </div>

              {/* Projected Balance */}
              <div className="p-4 bg-[#0A1A2F] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <p className="text-[#B8C5D6] text-sm">7-Day Projected Balance</p>
                </div>
                <p
                  className={`text-2xl font-bold ${detailsModal.tenant.projectedBalance < 0 ? "text-red-400" : "text-green-400"}`}
                >
                  ${detailsModal.tenant.projectedBalance?.toLocaleString() || 0}
                </p>
                <p className="text-[#B8C5D6] text-xs mt-1">
                  {detailsModal.tenant.projectedBalance < detailsModal.tenant.currentBalance
                    ? `Projected loss of $${(detailsModal.tenant.currentBalance - detailsModal.tenant.projectedBalance).toLocaleString()} over 7 days`
                    : `Projected gain of $${(detailsModal.tenant.projectedBalance - detailsModal.tenant.currentBalance).toLocaleString()} over 7 days`}
                </p>
              </div>

              {/* Last 7 Days GGR */}
              <div className="p-4 bg-[#0A1A2F] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#FFD700]" />
                  <p className="text-[#B8C5D6] text-sm">Last 7 Days GGR</p>
                </div>
                <p
                  className={`text-2xl font-bold ${detailsModal.tenant.last7DaysGGR >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  ${detailsModal.tenant.last7DaysGGR?.toLocaleString() || 0}
                </p>
                <p className="text-[#B8C5D6] text-xs mt-1">Gross Gaming Revenue (Stakes - Payouts)</p>
              </div>

              {/* Balance Trend Chart */}
              {detailsModal.tenant.trend?.length > 0 && (
                <div className="p-4 bg-[#0A1A2F] rounded-lg">
                  <p className="text-[#B8C5D6] text-sm mb-3">Balance Trend (7 Days)</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={detailsModal.tenant.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                        <XAxis dataKey="day" stroke="#B8C5D6" tick={{ fontSize: 11 }} />
                        <YAxis
                          stroke="#B8C5D6"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0D1F35", border: "1px solid #2A3F55" }}
                          labelStyle={{ color: "#FFD700" }}
                          formatter={(value) => [`$${value.toLocaleString()}`, "Balance"]}
                        />
                        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          stroke={
                            detailsModal.tenant.riskLevel === "critical"
                              ? "#ef4444"
                              : detailsModal.tenant.riskLevel === "healthy"
                                ? "#22c55e"
                                : "#f59e0b"
                          }
                          strokeWidth={2}
                          dot={{ fill: "#FFD700", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-[#0D1F35] border-t border-[#2A3F55] p-4 flex justify-end">
              <Button
                onClick={() => setDetailsModal({ open: false, tenant: null })}
                className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
