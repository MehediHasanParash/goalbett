"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Calendar,
  RefreshCw,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  FileText,
  Settings,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"
import { toast } from "@/components/ui/use-toast"

export default function CommissionSettlementClientPage() {
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({
    totalAgents: 0,
    pendingSettlements: 0,
    totalPendingAmount: 0,
    lastSettlement: null,
    nextScheduled: null,
  })
  const [settlements, setSettlements] = useState([])
  const [agentBreakdown, setAgentBreakdown] = useState([])
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      const response = await fetch("/api/super/commission-settlement", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
        setSettlements(data.recentSettlements || [])
        setAgentBreakdown(data.agentBreakdown || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch settlement data:", error)
      // Demo data
      setStats({
        totalAgents: 45,
        pendingSettlements: 12,
        totalPendingAmount: 4520.5,
        lastSettlement: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextScheduled: getNextMonday().toISOString(),
      })
      setSettlements([
        {
          id: 1,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          agentsProcessed: 42,
          totalAmount: 3850.25,
          status: "completed",
        },
        {
          id: 2,
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          agentsProcessed: 40,
          totalAmount: 3210.0,
          status: "completed",
        },
        {
          id: 3,
          date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          agentsProcessed: 38,
          totalAmount: 2980.75,
          status: "completed",
        },
      ])
      setAgentBreakdown([
        { id: 1, name: "John Master Agent", ggr: 12500, rate: 15, commission: 1875, subAgents: 5 },
        { id: 2, name: "Mary Agent", ggr: 8200, rate: 10, commission: 820, subAgents: 3 },
        { id: 3, name: "Peter Sales", ggr: 5600, rate: 10, commission: 560, subAgents: 2 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getNextMonday = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    const nextMonday = new Date(now)
    nextMonday.setDate(now.getDate() + daysUntilMonday)
    nextMonday.setHours(0, 0, 0, 0)
    return nextMonday
  }

  const handlePreviewSettlement = async () => {
    setPreviewDialogOpen(true)
    try {
      const token = getAuthToken()
      const response = await fetch("/api/super/commission-settlement?preview=true", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPreview(data.preview)
      }
    } catch (error) {
      console.error("[v0] Preview error:", error)
      // Demo preview
      setPreview({
        totalAgents: 45,
        totalGGR: 45200,
        totalCommission: 4520.5,
        breakdown: agentBreakdown,
      })
    }
  }

  const handleRunSettlement = async () => {
    setRunning(true)
    setConfirmDialogOpen(false)
    try {
      const token = getAuthToken()
      const response = await fetch("/api/super/commission-settlement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "run_settlement" }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Settlement Complete",
          description: `Processed ${data.agentsProcessed} agents, total commission: $${data.totalCommission.toFixed(2)}`,
        })
        fetchData()
      } else {
        toast({
          title: "Settlement Failed",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Settlement error:", error)
      toast({
        title: "Error",
        description: "Failed to run settlement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRunning(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <SuperAdminLayout title="Commission Settlement" description="Automated weekly commission settlement for agents">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[#8A9DB8] text-sm">Total Agents</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalAgents}</p>
            <p className="text-xs text-[#8A9DB8] mt-1">Active in hierarchy</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-[#8A9DB8] text-sm">Pending Settlements</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pendingSettlements}</p>
            <p className="text-xs text-[#8A9DB8] mt-1">{formatCurrency(stats.totalPendingAmount)} pending</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-[#8A9DB8] text-sm">Last Settlement</span>
            </div>
            <p className="text-lg font-bold text-green-400">
              {stats.lastSettlement ? new Date(stats.lastSettlement).toLocaleDateString() : "Never"}
            </p>
            <p className="text-xs text-[#8A9DB8] mt-1">Completed successfully</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[#8A9DB8] text-sm">Next Scheduled</span>
            </div>
            <p className="text-lg font-bold text-purple-400">
              {stats.nextScheduled ? new Date(stats.nextScheduled).toLocaleDateString() : "Monday 00:00"}
            </p>
            <p className="text-xs text-[#8A9DB8] mt-1">Auto runs weekly</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="bg-[#0D1F35] border-[#2A3F55] mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold text-lg">Manual Settlement Control</h3>
              <p className="text-[#8A9DB8] text-sm mt-1">
                Run settlement manually or preview pending commissions before the scheduled run.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchData}
                className="border-[#2A3F55] text-white hover:bg-[#1A2F45] bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handlePreviewSettlement}
                className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent"
              >
                <FileText className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600 text-white" disabled={running}>
                    {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                    Run Settlement Now
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white">
                  <DialogHeader>
                    <DialogTitle className="text-[#FFD700]">Confirm Manual Settlement</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Are you sure?</p>
                        <p className="text-[#8A9DB8] text-sm mt-1">
                          This will calculate and distribute commissions to all agents based on their Net GGR. This
                          action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-[#0A1A2F] rounded-lg">
                      <p className="text-sm text-[#8A9DB8]">Estimated:</p>
                      <p className="text-xl font-bold text-green-400 mt-1">
                        {formatCurrency(stats.totalPendingAmount)}
                      </p>
                      <p className="text-xs text-[#8A9DB8]">to {stats.pendingSettlements} agents</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmDialogOpen(false)}
                      className="border-[#2A3F55] text-white"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleRunSettlement} className="bg-green-500 hover:bg-green-600 text-white">
                      Confirm & Run
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="bg-[#0D1F35] border border-[#2A3F55]">
          <TabsTrigger value="history" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Settlement History
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Agent Breakdown
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Recent Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {settlements.length === 0 ? (
                  <p className="text-center text-[#8A9DB8] py-8">No settlement history yet.</p>
                ) : (
                  settlements.map((settlement) => (
                    <div
                      key={settlement.id}
                      className="flex items-center justify-between p-4 bg-[#0A1A2F] rounded-lg border border-[#2A3F55]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Weekly Settlement</p>
                          <p className="text-sm text-[#8A9DB8]">{formatDate(settlement.date)}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium">{settlement.agentsProcessed}</p>
                        <p className="text-xs text-[#8A9DB8]">Agents</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-lg">{formatCurrency(settlement.totalAmount)}</p>
                        <p className="text-xs text-[#8A9DB8]">Total Paid</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{settlement.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Agent Commission Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2A3F55]">
                      <th className="text-left p-3 text-[#8A9DB8] font-medium">Agent</th>
                      <th className="text-right p-3 text-[#8A9DB8] font-medium">GGR</th>
                      <th className="text-right p-3 text-[#8A9DB8] font-medium">Rate</th>
                      <th className="text-right p-3 text-[#8A9DB8] font-medium">Commission</th>
                      <th className="text-right p-3 text-[#8A9DB8] font-medium">Sub-Agents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentBreakdown.map((agent) => (
                      <tr key={agent.id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center">
                              <span className="text-[#0A1A2F] font-bold text-xs">
                                {agent.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <span className="text-white">{agent.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right text-white">{formatCurrency(agent.ggr)}</td>
                        <td className="p-3 text-right text-[#FFD700]">{agent.rate}%</td>
                        <td className="p-3 text-right text-green-400 font-medium">
                          {formatCurrency(agent.commission)}
                        </td>
                        <td className="p-3 text-right text-[#8A9DB8]">{agent.subAgents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settlement Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Settlement Schedule</Label>
                  <p className="text-[#8A9DB8] text-sm">Every Monday at 00:00 UTC</p>
                  <p className="text-xs text-[#FFD700]">Configured via Vercel Cron</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Default Commission Rate</Label>
                  <p className="text-[#8A9DB8] text-sm">10% of Net GGR</p>
                  <p className="text-xs text-[#FFD700]">Per-agent rates may vary</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Minimum Payout</Label>
                  <p className="text-[#8A9DB8] text-sm">$1.00</p>
                  <p className="text-xs text-[#FFD700]">Commissions below this are carried forward</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Notification</Label>
                  <p className="text-[#8A9DB8] text-sm">Email + In-App</p>
                  <p className="text-xs text-[#FFD700]">Agents notified after settlement</p>
                </div>
              </div>

              <div className="p-4 bg-[#0A1A2F] rounded-lg border border-[#2A3F55]">
                <h4 className="text-white font-medium mb-2">Cron Endpoint</h4>
                <code className="text-sm text-[#FFD700] bg-[#0D1F35] px-2 py-1 rounded">
                  /api/cron/weekly-commission
                </code>
                <p className="text-xs text-[#8A9DB8] mt-2">
                  Requires CRON_SECRET header for authentication. Configured in vercel.json.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">Settlement Preview</DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[#0A1A2F] rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{preview.totalAgents}</p>
                  <p className="text-xs text-[#8A9DB8]">Agents</p>
                </div>
                <div className="p-4 bg-[#0A1A2F] rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(preview.totalGGR)}</p>
                  <p className="text-xs text-[#8A9DB8]">Total GGR</p>
                </div>
                <div className="p-4 bg-[#0A1A2F] rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(preview.totalCommission)}</p>
                  <p className="text-xs text-[#8A9DB8]">Total Commission</p>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2A3F55]">
                      <th className="text-left p-2 text-[#8A9DB8]">Agent</th>
                      <th className="text-right p-2 text-[#8A9DB8]">GGR</th>
                      <th className="text-right p-2 text-[#8A9DB8]">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.breakdown?.map((agent, i) => (
                      <tr key={i} className="border-b border-[#2A3F55]/50">
                        <td className="p-2 text-white">{agent.name}</td>
                        <td className="p-2 text-right text-[#8A9DB8]">{formatCurrency(agent.ggr)}</td>
                        <td className="p-2 text-right text-green-400">{formatCurrency(agent.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}
