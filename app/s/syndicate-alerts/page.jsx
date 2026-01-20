"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Shield,
  Clock,
  Ban,
  Eye,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

export default function SyndicateAlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    enabled: true,
    timeWindow: 5,
    minBets: 3,
    autoBlock: false,
    notifyEmail: true,
  })
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    blockedUsers: 0,
    resolvedToday: 0,
  })

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      const res = await fetch("/api/super/syndicate-alerts", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setAlerts(data.alerts || [])
        setStats(data.stats || { totalAlerts: 0, activeAlerts: 0, blockedUsers: 0, resolvedToday: 0 })
      }
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
      setLoading(false)
    }
  }

  const handleAlertAction = async (alertId, action, userIds = []) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      await fetch("/api/super/syndicate-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alertId, action, userIds }),
      })

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) => {
          if (alert._id === alertId) {
            return {
              ...alert,
              status: action === "resolve" ? "resolved" : action === "investigate" ? "investigating" : alert.status,
            }
          }
          return alert
        }),
      )
    } catch (error) {
      console.error("Failed to update alert:", error)
    }
  }

  const getRiskBadge = (level) => {
    const config = {
      low: { color: "bg-blue-500", text: "Low" },
      medium: { color: "bg-yellow-500", text: "Medium" },
      high: { color: "bg-orange-500", text: "High" },
      critical: { color: "bg-red-500", text: "Critical" },
    }
    const c = config[level] || config.low
    return <Badge className={`${c.color} text-white`}>{c.text}</Badge>
  }

  const getStatusBadge = (status) => {
    const config = {
      active: { color: "bg-red-500", icon: AlertCircle },
      investigating: { color: "bg-yellow-500", icon: Eye },
      resolved: { color: "bg-green-500", icon: CheckCircle },
    }
    const c = config[status] || config.active
    const Icon = c.icon
    return (
      <Badge className={`${c.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  return (
    <SuperAdminLayout title="Syndicate Alert System" description="Detect coordinated betting patterns">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Total Alerts</p>
                  <p className="text-2xl font-bold text-white">{stats.totalAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Active Alerts</p>
                  <p className="text-2xl font-bold text-white">{stats.activeAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Ban className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Blocked Users</p>
                  <p className="text-2xl font-bold text-white">{stats.blockedUsers}</p>
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
                  <p className="text-[#B8C5D6] text-sm">Resolved Today</p>
                  <p className="text-2xl font-bold text-white">{stats.resolvedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList className="bg-[#0D1F35] border border-[#2A3F55]">
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="settings">Detection Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            {/* Filters */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                    <Input placeholder="Search alerts..." className="pl-10 bg-[#0A1A2F] border-[#2A3F55] text-white" />
                  </div>
                  <Button variant="outline" className="border-[#2A3F55] text-[#B8C5D6] bg-transparent">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchAlerts}
                    className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alerts List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-[#B8C5D6]">Loading alerts...</div>
              ) : alerts.length === 0 ? (
                <Card className="bg-[#0D1F35] border-[#2A3F55]">
                  <CardContent className="p-8 text-center">
                    <Shield className="w-12 h-12 mx-auto text-green-400 mb-4" />
                    <p className="text-[#F5F5F5] font-medium">No syndicate activity detected</p>
                    <p className="text-[#B8C5D6] text-sm">System is monitoring for coordinated betting patterns</p>
                  </CardContent>
                </Card>
              ) : (
                alerts.map((alert) => (
                  <Card key={alert._id} className="bg-[#0D1F35] border-[#2A3F55]">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getRiskBadge(alert.riskLevel)}
                            {getStatusBadge(alert.status)}
                          </div>
                          <CardTitle className="text-white text-lg">{alert.eventName}</CardTitle>
                          <CardDescription className="text-[#B8C5D6]">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(alert.timestamp).toLocaleString()} • {alert.matchedBets?.length || 0} identical
                            bets
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-[#FFD700] font-bold text-xl">
                            ${(alert.totalAmount || 0).toLocaleString()}
                          </p>
                          <p className="text-[#B8C5D6] text-sm">@ {alert.odds} odds</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {alert.matchedBets?.length > 0 && (
                        <div className="bg-[#0A1A2F] rounded-lg p-4 mb-4">
                          <p className="text-[#FFD700] text-sm font-medium mb-3">Matched Bets</p>
                          <div className="space-y-2">
                            {alert.matchedBets.map((bet, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                  <span className="text-[#B8C5D6]">{bet.betId}</span>
                                  <span className="text-white">{bet.playerName}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[#B8C5D6]">
                                  <span className="font-mono text-xs">{bet.ip}</span>
                                  <span className="text-xs">{bet.device}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {alert.status !== "resolved" && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAlertAction(alert._id, "investigate")}
                            variant="outline"
                            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/20"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Investigate
                          </Button>
                          <Button
                            onClick={() => handleAlertAction(alert._id, "resolve")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Resolved
                          </Button>
                          <Button
                            onClick={() =>
                              handleAlertAction(
                                alert._id,
                                "block",
                                alert.matchedBets?.map((b) => b.playerId),
                              )
                            }
                            variant="destructive"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Block All Users
                          </Button>
                        </div>
                      )}

                      {alert.resolution && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Resolution: {alert.resolution}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Detection Settings</CardTitle>
                <CardDescription className="text-[#B8C5D6]">Configure syndicate detection parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Syndicate Detection</Label>
                    <p className="text-sm text-[#B8C5D6]">Monitor for coordinated betting patterns</p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#B8C5D6]">Time Window (seconds)</Label>
                    <Input
                      type="number"
                      value={settings.timeWindow}
                      onChange={(e) => setSettings({ ...settings, timeWindow: Number.parseInt(e.target.value) })}
                      className="bg-[#0A1A2F] border-[#2A3F55] text-white"
                    />
                    <p className="text-xs text-[#8A9DB8] mt-1">Detect identical bets within this window</p>
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6]">Minimum Identical Bets</Label>
                    <Input
                      type="number"
                      value={settings.minBets}
                      onChange={(e) => setSettings({ ...settings, minBets: Number.parseInt(e.target.value) })}
                      className="bg-[#0A1A2F] border-[#2A3F55] text-white"
                    />
                    <p className="text-xs text-[#8A9DB8] mt-1">Minimum bets to trigger alert</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Auto-Block Users</Label>
                    <p className="text-sm text-[#B8C5D6]">Automatically block users on critical alerts</p>
                  </div>
                  <Switch
                    checked={settings.autoBlock}
                    onCheckedChange={(v) => setSettings({ ...settings, autoBlock: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Email Notifications</Label>
                    <p className="text-sm text-[#B8C5D6]">Send email alerts for new detections</p>
                  </div>
                  <Switch
                    checked={settings.notifyEmail}
                    onCheckedChange={(v) => setSettings({ ...settings, notifyEmail: v })}
                  />
                </div>

                <Button className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]">Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  )
}
