"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Zap,
  ZapOff,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  TrendingDown,
  Calendar,
  Clock,
  History,
  Shield,
  Bell,
  Ban,
} from "lucide-react"

export default function CircuitBreakerPage() {
  const [circuitBreakers, setCircuitBreakers] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, tripped: 0, warning: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Settings form state
  const [settings, setSettings] = useState({
    dailyNetLossLimit: 50000,
    weeklyNetLossLimit: 200000,
    monthlyNetLossLimit: 500000,
    alertThresholds: { warning: 70, critical: 90 },
    tripActions: {
      blockNewBets: true,
      blockDeposits: false,
      notifyAdmin: true,
      notifySuper: true,
    },
    autoReset: true,
  })

  useEffect(() => {
    fetchCircuitBreakers()
  }, [])

  const fetchCircuitBreakers = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/super/circuit-breaker")
      const data = await res.json()
      if (data.success) {
        setCircuitBreakers(data.data || [])
        setSummary(data.summary || { total: 0, active: 0, tripped: 0, warning: 0 })
      }
    } catch (error) {
      console.error("Failed to fetch circuit breakers:", error)
    } finally {
      setLoading(false)
    }
  }

  const openSettings = (tenant) => {
    setSelectedTenant(tenant)
    setSettings({
      dailyNetLossLimit: tenant.dailyNetLossLimit,
      weeklyNetLossLimit: tenant.weeklyNetLossLimit,
      monthlyNetLossLimit: tenant.monthlyNetLossLimit,
      alertThresholds: tenant.alertThresholds,
      tripActions: tenant.tripActions,
      autoReset: tenant.autoReset,
    })
    setShowSettingsModal(true)
  }

  const saveSettings = async () => {
    if (!selectedTenant) return

    try {
      setSaving(true)
      const res = await fetch("/api/super/circuit-breaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenant.tenantId,
          ...settings,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowSettingsModal(false)
        fetchCircuitBreakers()
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const resetCircuitBreaker = async (resetType) => {
    if (!selectedTenant) return

    try {
      setSaving(true)
      const res = await fetch("/api/super/circuit-breaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenant.tenantId,
          action: "reset",
          resetType,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowResetModal(false)
        fetchCircuitBreakers()
      }
    } catch (error) {
      console.error("Failed to reset:", error)
    } finally {
      setSaving(false)
    }
  }

  const toggleCircuitBreaker = async (tenant, enable) => {
    try {
      const res = await fetch("/api/super/circuit-breaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.tenantId,
          action: enable ? "enable" : "disable",
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchCircuitBreakers()
      }
    } catch (error) {
      console.error("Failed to toggle:", error)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case "tripped_daily":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <ZapOff className="w-3 h-3 mr-1" />
            Tripped (Daily)
          </Badge>
        )
      case "tripped_weekly":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <ZapOff className="w-3 h-3 mr-1" />
            Tripped (Weekly)
          </Badge>
        )
      case "tripped_monthly":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <ZapOff className="w-3 h-3 mr-1" />
            Tripped (Monthly)
          </Badge>
        )
      case "manually_disabled":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            <Ban className="w-3 h-3 mr-1" />
            Disabled
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getProgressColor = (percentage, thresholds) => {
    if (percentage >= 100) return "bg-red-500"
    if (percentage >= thresholds.critical) return "bg-red-500"
    if (percentage >= thresholds.warning) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <SuperAdminLayout title="Circuit Breaker" description="Daily net loss limits and automatic halt system">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Total Tenants</p>
                  <p className="text-2xl font-bold text-white">{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Active</p>
                  <p className="text-2xl font-bold text-green-400">{summary.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <ZapOff className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Tripped</p>
                  <p className="text-2xl font-bold text-red-400">{summary.tripped}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Warning</p>
                  <p className="text-2xl font-bold text-yellow-400">{summary.warning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Circuit Breakers List */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Tenant Circuit Breakers
                </CardTitle>
                <CardDescription className="text-[#B8C5D6]">
                  Manage daily net loss limits for each tenant
                </CardDescription>
              </div>
              <Button
                onClick={fetchCircuitBreakers}
                variant="outline"
                className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-[#B8C5D6]">Loading circuit breakers...</div>
            ) : circuitBreakers.length === 0 ? (
              <div className="text-center py-8 text-[#B8C5D6]">No tenants found</div>
            ) : (
              <div className="space-y-4">
                {circuitBreakers.map((cb) => (
                  <div key={cb._id} className="p-4 bg-[#0A1A2F] rounded-lg border border-[#2A3F55]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-[#FFD700]" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{cb.tenantName}</h3>
                          <p className="text-[#B8C5D6] text-sm">{cb.tenantSubdomain}.goalbett.com</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(cb.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                          onClick={() => openSettings(cb)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                          onClick={() => {
                            setSelectedTenant(cb)
                            setShowResetModal(true)
                          }}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Daily */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#B8C5D6] text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Daily
                          </span>
                          <span className="text-white text-sm">
                            ${cb.currentDailyNetLoss.toLocaleString()} / ${cb.dailyNetLossLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-[#1A2F45] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(cb.statusPercentages.daily.percentage, cb.alertThresholds)} transition-all`}
                            style={{ width: `${Math.min(100, cb.statusPercentages.daily.percentage)}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#B8C5D6] mt-1">
                          {cb.statusPercentages.daily.percentage.toFixed(1)}% used
                        </p>
                      </div>

                      {/* Weekly */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#B8C5D6] text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Weekly
                          </span>
                          <span className="text-white text-sm">
                            ${cb.currentWeeklyNetLoss.toLocaleString()} / ${cb.weeklyNetLossLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-[#1A2F45] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(cb.statusPercentages.weekly.percentage, cb.alertThresholds)} transition-all`}
                            style={{ width: `${Math.min(100, cb.statusPercentages.weekly.percentage)}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#B8C5D6] mt-1">
                          {cb.statusPercentages.weekly.percentage.toFixed(1)}% used
                        </p>
                      </div>

                      {/* Monthly */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#B8C5D6] text-sm flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            Monthly
                          </span>
                          <span className="text-white text-sm">
                            ${cb.currentMonthlyNetLoss.toLocaleString()} / ${cb.monthlyNetLossLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-[#1A2F45] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(cb.statusPercentages.monthly.percentage, cb.alertThresholds)} transition-all`}
                            style={{ width: `${Math.min(100, cb.statusPercentages.monthly.percentage)}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#B8C5D6] mt-1">
                          {cb.statusPercentages.monthly.percentage.toFixed(1)}% used
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#2A3F55]">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cb.status !== "manually_disabled"}
                          onCheckedChange={(checked) => toggleCircuitBreaker(cb, checked)}
                        />
                        <Label className="text-[#B8C5D6] text-sm">Protection Enabled</Label>
                      </div>
                      <div className="flex items-center gap-2 text-[#B8C5D6] text-xs">
                        <Bell className="w-3 h-3" />
                        Alert at {cb.alertThresholds.warning}%
                      </div>
                      <div className="flex items-center gap-2 text-[#B8C5D6] text-xs">
                        <History className="w-3 h-3" />
                        {cb.tripHistory.length} trips recorded
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Modal */}
        <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Circuit Breaker Settings</DialogTitle>
              <DialogDescription className="text-[#B8C5D6]">
                Configure loss limits for {selectedTenant?.tenantName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Loss Limits */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#FFD700]">Net Loss Limits</h4>

                <div>
                  <Label className="text-[#B8C5D6]">Daily Limit ($)</Label>
                  <Input
                    type="number"
                    value={settings.dailyNetLossLimit}
                    onChange={(e) => setSettings({ ...settings, dailyNetLossLimit: Number(e.target.value) })}
                    className="mt-1 bg-[#0A1A2F] border-[#2A3F55] text-white"
                  />
                </div>

                <div>
                  <Label className="text-[#B8C5D6]">Weekly Limit ($)</Label>
                  <Input
                    type="number"
                    value={settings.weeklyNetLossLimit}
                    onChange={(e) => setSettings({ ...settings, weeklyNetLossLimit: Number(e.target.value) })}
                    className="mt-1 bg-[#0A1A2F] border-[#2A3F55] text-white"
                  />
                </div>

                <div>
                  <Label className="text-[#B8C5D6]">Monthly Limit ($)</Label>
                  <Input
                    type="number"
                    value={settings.monthlyNetLossLimit}
                    onChange={(e) => setSettings({ ...settings, monthlyNetLossLimit: Number(e.target.value) })}
                    className="mt-1 bg-[#0A1A2F] border-[#2A3F55] text-white"
                  />
                </div>
              </div>

              {/* Alert Thresholds */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#FFD700]">Alert Thresholds</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#B8C5D6]">Warning (%)</Label>
                    <Input
                      type="number"
                      value={settings.alertThresholds.warning}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          alertThresholds: { ...settings.alertThresholds, warning: Number(e.target.value) },
                        })
                      }
                      className="mt-1 bg-[#0A1A2F] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6]">Critical (%)</Label>
                    <Input
                      type="number"
                      value={settings.alertThresholds.critical}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          alertThresholds: { ...settings.alertThresholds, critical: Number(e.target.value) },
                        })
                      }
                      className="mt-1 bg-[#0A1A2F] border-[#2A3F55] text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Trip Actions */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#FFD700]">When Tripped</h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#B8C5D6]">Block New Bets</Label>
                    <Switch
                      checked={settings.tripActions.blockNewBets}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          tripActions: { ...settings.tripActions, blockNewBets: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[#B8C5D6]">Block Deposits</Label>
                    <Switch
                      checked={settings.tripActions.blockDeposits}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          tripActions: { ...settings.tripActions, blockDeposits: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[#B8C5D6]">Notify Tenant Admin</Label>
                    <Switch
                      checked={settings.tripActions.notifyAdmin}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          tripActions: { ...settings.tripActions, notifyAdmin: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[#B8C5D6]">Notify Super Admin</Label>
                    <Switch
                      checked={settings.tripActions.notifySuper}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          tripActions: { ...settings.tripActions, notifySuper: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[#B8C5D6]">Auto-Reset on Period End</Label>
                    <Switch
                      checked={settings.autoReset}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoReset: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSettingsModal(false)}
                className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Modal */}
        <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Reset Circuit Breaker</DialogTitle>
              <DialogDescription className="text-[#B8C5D6]">
                Reset counters for {selectedTenant?.tenantName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Button
                onClick={() => resetCircuitBreaker("daily")}
                disabled={saving}
                variant="outline"
                className="w-full justify-start border-[#2A3F55] text-white bg-transparent hover:bg-[#1A2F45]"
              >
                <Clock className="w-4 h-4 mr-2 text-blue-400" />
                Reset Daily Counter Only
              </Button>

              <Button
                onClick={() => resetCircuitBreaker("weekly")}
                disabled={saving}
                variant="outline"
                className="w-full justify-start border-[#2A3F55] text-white bg-transparent hover:bg-[#1A2F45]"
              >
                <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                Reset Weekly Counter Only
              </Button>

              <Button
                onClick={() => resetCircuitBreaker("monthly")}
                disabled={saving}
                variant="outline"
                className="w-full justify-start border-[#2A3F55] text-white bg-transparent hover:bg-[#1A2F45]"
              >
                <TrendingDown className="w-4 h-4 mr-2 text-orange-400" />
                Reset Monthly Counter Only
              </Button>

              <Button
                onClick={() => resetCircuitBreaker("all")}
                disabled={saving}
                className="w-full bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All Counters
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}
