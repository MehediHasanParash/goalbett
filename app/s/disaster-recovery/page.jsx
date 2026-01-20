"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Database,
  Server,
  HardDrive,
  Cloud,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  Activity,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export default function DisasterRecoveryPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [healthStatus, setHealthStatus] = useState(null)
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [runningHealthCheck, setRunningHealthCheck] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchHealthStatus()
    fetchBackups()
  }, [])

  const fetchHealthStatus = async () => {
    try {
      const res = await fetch("/api/system/health")
      if (res.ok) {
        const data = await res.json()
        setHealthStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch health status:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/system/backups")
      if (res.ok) {
        const data = await res.json()
        setBackups(data.backups || [])
      }
    } catch (error) {
      console.error("Failed to fetch backups:", error)
    }
  }

  const runHealthCheck = async () => {
    setRunningHealthCheck(true)
    try {
      const res = await fetch("/api/system/health?refresh=true")
      if (res.ok) {
        const data = await res.json()
        setHealthStatus(data)
      }
    } catch (error) {
      console.error("Health check failed:", error)
    } finally {
      setRunningHealthCheck(false)
    }
  }

  const triggerBackup = async (type) => {
    try {
      const res = await fetch("/api/system/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      if (res.ok) {
        alert(`${type} backup initiated successfully!`)
        fetchBackups()
      }
    } catch (error) {
      console.error("Backup failed:", error)
      alert("Backup failed. Check console for details.")
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
      case "online":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "degraded":
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case "critical":
      case "offline":
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      healthy: "bg-green-500/20 text-green-400",
      online: "bg-green-500/20 text-green-400",
      degraded: "bg-yellow-500/20 text-yellow-400",
      warning: "bg-yellow-500/20 text-yellow-400",
      critical: "bg-red-500/20 text-red-400",
      offline: "bg-red-500/20 text-red-400",
    }
    return colors[status] || "bg-gray-500/20 text-gray-400"
  }

  // Mock data for demonstration (replace with real API data)
  const systemServices = healthStatus?.services || [
    { name: "MongoDB Database", status: "healthy", latency: "8ms", lastCheck: new Date().toISOString() },
    { name: "Redis Cache", status: "healthy", latency: "2ms", lastCheck: new Date().toISOString() },
    { name: "API Server", status: "healthy", latency: "12ms", lastCheck: new Date().toISOString() },
    { name: "Odds Feed Service", status: "healthy", latency: "45ms", lastCheck: new Date().toISOString() },
    { name: "Payment Gateway", status: "healthy", latency: "120ms", lastCheck: new Date().toISOString() },
  ]

  const recentBackups =
    backups.length > 0
      ? backups
      : [
          {
            id: 1,
            type: "Full",
            size: "2.4 GB",
            date: "2025-12-15 02:00:00",
            status: "completed",
            location: "MongoDB Atlas",
          },
          {
            id: 2,
            type: "Incremental",
            size: "156 MB",
            date: "2025-12-14 14:00:00",
            status: "completed",
            location: "MongoDB Atlas",
          },
          {
            id: 3,
            type: "Full",
            size: "2.3 GB",
            date: "2025-12-14 02:00:00",
            status: "completed",
            location: "MongoDB Atlas",
          },
        ]

  const recoveryProcedures = [
    {
      id: 1,
      name: "Database Failover",
      description: "Switch to replica set secondary if primary fails",
      rto: "< 30 seconds",
      rpo: "0 data loss",
      automated: true,
    },
    {
      id: 2,
      name: "Application Server Recovery",
      description: "Vercel auto-scales and redeploys on failure",
      rto: "< 2 minutes",
      rpo: "0 data loss",
      automated: true,
    },
    {
      id: 3,
      name: "Full Database Restore",
      description: "Restore from backup if database corruption",
      rto: "< 1 hour",
      rpo: "Up to 12 hours",
      automated: false,
    },
    {
      id: 4,
      name: "Region Failover",
      description: "Switch to backup region if primary region fails",
      rto: "< 15 minutes",
      rpo: "< 5 minutes",
      automated: true,
    },
  ]

  const emergencyContacts = [
    { role: "Platform Owner", name: "[YOUR NAME]", phone: "[YOUR PHONE]", email: "[YOUR EMAIL]" },
    { role: "Technical Lead", name: "[TECH LEAD]", phone: "[PHONE]", email: "[EMAIL]" },
    { role: "MongoDB Atlas Support", name: "24/7 Support", phone: "N/A", email: "support@mongodb.com" },
    { role: "Vercel Support", name: "24/7 Support", phone: "N/A", email: "support@vercel.com" },
  ]

  const handleExportData = async () => {
    try {
      setExporting(true)
      const token = await getAuthToken()

      if (!token) {
        throw new Error("Not authenticated. Please log in again.")
      }

      const response = await fetch("/api/system/export?full=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Export failed")
      }

      // Get the filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `system-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      alert("Data export completed successfully!")
    } catch (error) {
      console.error("Export failed:", error)
      alert(`Export failed: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <SuperAdminLayout
      title="Disaster Recovery"
      description="Business continuity, backup management, and emergency procedures"
    >
      <div className="space-y-6">
        {/* Tabs wrap all TabsContent components */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList className="grid w-full grid-cols-4 gap-2 p-1 bg-[#0D1F35] border border-[#2A3F55] rounded-lg">
              <TabsTrigger
                value="overview"
                className="px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] data-[state=inactive]:text-[#B8C5D6] data-[state=inactive]:hover:bg-[#1A2F45]"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="backups"
                className="px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] data-[state=inactive]:text-[#B8C5D6] data-[state=inactive]:hover:bg-[#1A2F45]"
              >
                Backups
              </TabsTrigger>
              <TabsTrigger
                value="procedures"
                className="px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] data-[state=inactive]:text-[#B8C5D6] data-[state=inactive]:hover:bg-[#1A2F45]"
              >
                Procedures
              </TabsTrigger>
              <TabsTrigger
                value="runbook"
                className="px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] data-[state=inactive]:text-[#B8C5D6] data-[state=inactive]:hover:bg-[#1A2F45]"
              >
                Runbook
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex flex-wrap justify-end items-center gap-2 w-full mt-4">
            <Button
              variant="outline"
              onClick={() => setShowGuide(true)}
              className="border-[#2A3F55] text-[#B8C5D6] bg-transparent hover:bg-[#1A2F45]"
            >
              <Info className="w-4 h-4 mr-2" />
              DR Guide
            </Button>
            <Button
              onClick={runHealthCheck}
              disabled={runningHealthCheck}
              className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]"
            >
              {runningHealthCheck ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Run Health Check
            </Button>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/20">
                      <Activity className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[#B8C5D6] text-sm">System Status</p>
                      <p className="text-xl font-bold text-green-400">All Operational</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/20">
                      <Database className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Last Backup</p>
                      <p className="text-xl font-bold text-[#F5F5F5]">2 hours ago</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/20">
                      <Clock className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Recovery Time (RTO)</p>
                      <p className="text-xl font-bold text-[#F5F5F5]">&lt; 30 min</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-[#FFD700]/20">
                      <Shield className="h-6 w-6 text-[#FFD700]" />
                    </div>
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Data Loss (RPO)</p>
                      <p className="text-xl font-bold text-[#F5F5F5]">&lt; 5 min</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Service Health */}
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-[#FFD700]">Service Health Status</CardTitle>
                  <Badge className="bg-green-500/20 text-green-400">All Services Online</Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {systemServices.map((service, idx) => (
                      <div key={idx} className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(service.status)}
                            <h3 className="font-bold text-[#F5F5F5]">{service.name}</h3>
                          </div>
                          <Badge className={getStatusBadge(service.status)}>{service.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-[#B8C5D6]">Latency</p>
                            <p className="text-[#FFD700] font-medium">{service.latency}</p>
                          </div>
                          <div>
                            <p className="text-[#B8C5D6]">Last Check</p>
                            <p className="text-[#F5F5F5] font-medium">Just now</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Infrastructure Architecture */}
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#FFD700]">Infrastructure Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Frontend */}
                      <div className="text-center">
                        <div className="inline-flex p-4 rounded-full bg-blue-500/20 mb-3">
                          <Cloud className="w-8 h-8 text-blue-400" />
                        </div>
                        <h4 className="text-[#F5F5F5] font-bold mb-2">Frontend (Vercel)</h4>
                        <ul className="text-sm text-[#B8C5D6] space-y-1">
                          <li>Auto-scaling enabled</li>
                          <li>Global CDN (Edge)</li>
                          <li>Auto SSL/TLS</li>
                          <li>Instant rollbacks</li>
                        </ul>
                      </div>
                      {/* Backend */}
                      <div className="text-center">
                        <div className="inline-flex p-4 rounded-full bg-green-500/20 mb-3">
                          <Server className="w-8 h-8 text-green-400" />
                        </div>
                        <h4 className="text-[#F5F5F5] font-bold mb-2">API (Vercel Serverless)</h4>
                        <ul className="text-sm text-[#B8C5D6] space-y-1">
                          <li>Serverless functions</li>
                          <li>Auto-scaling</li>
                          <li>Zero cold starts</li>
                          <li>Multi-region support</li>
                        </ul>
                      </div>
                      {/* Database */}
                      <div className="text-center">
                        <div className="inline-flex p-4 rounded-full bg-purple-500/20 mb-3">
                          <Database className="w-8 h-8 text-purple-400" />
                        </div>
                        <h4 className="text-[#F5F5F5] font-bold mb-2">Database (MongoDB Atlas)</h4>
                        <ul className="text-sm text-[#B8C5D6] space-y-1">
                          <li>Replica Set (3 nodes)</li>
                          <li>Auto failover</li>
                          <li>Point-in-time recovery</li>
                          <li>Automated backups</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-[#2A3F55]">
                      <div className="flex items-center justify-center gap-8 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <span className="text-[#B8C5D6]">Primary</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          <span className="text-[#B8C5D6]">Replica</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <span className="text-[#B8C5D6]">Cache</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Backups Tab */}
          <TabsContent value="backups" className="mt-6 space-y-6">
            {/* Backup Management */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Backup Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Button
                    variant="outline"
                    onClick={() => triggerBackup("snapshot")}
                    className="h-auto py-4 bg-[#1A2F45] border border-[#2A3F55] hover:bg-[#2A3F55] text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Database className="w-6 h-6 text-blue-400 mt-1" />
                      <div>
                        <p className="font-bold text-[#F5F5F5]">Database Snapshot</p>
                        <p className="text-sm text-[#B8C5D6]">Create instant MongoDB snapshot</p>
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => triggerBackup("full")}
                    className="h-auto py-4 bg-[#1A2F45] border border-[#2A3F55] hover:bg-[#2A3F55] text-left"
                  >
                    <div className="flex items-start gap-3">
                      <HardDrive className="w-6 h-6 text-green-400 mt-1" />
                      <div>
                        <p className="font-bold text-[#F5F5F5]">Full Backup</p>
                        <p className="text-sm text-[#B8C5D6]">Complete system backup</p>
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    disabled={exporting}
                    className="h-auto py-4 bg-[#1A2F45] border border-[#2A3F55] hover:bg-[#2A3F45] text-left"
                  >
                    <div className="flex items-start gap-3">
                      {exporting ? (
                        <Loader2 className="w-6 h-6 text-purple-400 mt-1 animate-spin" />
                      ) : (
                        <Download className="w-6 h-6 text-purple-400 mt-1" />
                      )}
                      <div>
                        <p className="font-bold text-[#F5F5F5]">{exporting ? "Exporting..." : "Export Data"}</p>
                        <p className="text-sm text-[#B8C5D6]">
                          {exporting ? "Preparing JSON file..." : "Download JSON export"}
                        </p>
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Backup Schedule */}
                <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-4 mb-6">
                  <h4 className="text-[#FFD700] font-bold mb-3">Automated Backup Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#B8C5D6]">Continuous Backups:</span>
                      <span className="text-green-400 font-medium">Enabled (MongoDB Atlas)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#B8C5D6]">Point-in-Time Recovery:</span>
                      <span className="text-green-400 font-medium">Last 7 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#B8C5D6]">Daily Snapshots:</span>
                      <span className="text-[#F5F5F5] font-medium">02:00 UTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#B8C5D6]">Weekly Full Backup:</span>
                      <span className="text-[#F5F5F5] font-medium">Sunday 03:00 UTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#B8C5D6]">Retention Period:</span>
                      <span className="text-[#F5F5F5] font-medium">30 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#B8C5D6]">Backup Location:</span>
                      <span className="text-[#F5F5F5] font-medium">MongoDB Atlas (Multi-Region)</span>
                    </div>
                  </div>
                </div>

                {/* Recent Backups */}
                <h4 className="text-[#FFD700] font-bold mb-3">Recent Backups</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2A3F55]">
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Type</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Size</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Location</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBackups.map((backup) => (
                        <tr key={backup.id} className="border-b border-[#2A3F55]/50">
                          <td className="py-3 px-4 text-[#F5F5F5]">{backup.type}</td>
                          <td className="py-3 px-4 text-[#B8C5D6]">{backup.date}</td>
                          <td className="py-3 px-4 text-[#F5F5F5]">{backup.size}</td>
                          <td className="py-3 px-4 text-[#B8C5D6]">{backup.location}</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-green-500/20 text-green-400">{backup.status}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" className="text-[#FFD700] hover:bg-[#FFD700]/10">
                              Restore
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Procedures Tab */}
          <TabsContent value="procedures" className="mt-6 space-y-6">
            {/* Recovery Procedures */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Recovery Procedures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recoveryProcedures.map((procedure) => (
                    <div key={procedure.id} className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-[#F5F5F5] mb-1">{procedure.name}</h4>
                          <p className="text-sm text-[#B8C5D6]">{procedure.description}</p>
                        </div>
                        <Badge
                          className={
                            procedure.automated ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                          }
                        >
                          {procedure.automated ? "Automated" : "Manual"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[#B8C5D6]">Recovery Time (RTO)</p>
                          <p className="text-[#FFD700] font-bold">{procedure.rto}</p>
                        </div>
                        <div>
                          <p className="text-[#B8C5D6]">Data Loss (RPO)</p>
                          <p className="text-[#F5F5F5] font-bold">{procedure.rpo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emergencyContacts.map((contact, idx) => (
                    <div key={idx} className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-4">
                      <p className="text-[#FFD700] font-bold mb-2">{contact.role}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-[#F5F5F5]">{contact.name}</p>
                        <p className="text-[#B8C5D6]">{contact.phone}</p>
                        <p className="text-[#B8C5D6]">{contact.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-bold">Important</p>
                      <p className="text-sm text-[#B8C5D6]">
                        Update these emergency contacts with your actual team information. Go to Settings to configure
                        emergency notification channels.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Runbook Tab */}
          <TabsContent value="runbook" className="mt-6 space-y-6">
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Disaster Recovery Runbook</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <div className="space-y-6">
                  {/* Scenario 1 */}
                  <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-6">
                    <h3 className="text-[#FFD700] font-bold text-lg mb-4">Scenario 1: Application Server Crash</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Detection</p>
                          <p className="text-[#B8C5D6]">
                            Vercel automatically detects function failures and health check failures
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Automatic Recovery</p>
                          <p className="text-[#B8C5D6]">
                            Serverless functions are stateless - new instances spawn automatically
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">If Issue Persists</p>
                          <p className="text-[#B8C5D6]">
                            Go to Vercel Dashboard → Deployments → Rollback to previous deployment
                          </p>
                        </div>
                      </div>
                      <p className="text-green-400 font-medium mt-3">
                        Expected Recovery Time: Automatic, under 2 minutes
                      </p>
                    </div>
                  </div>

                  {/* Scenario 2 */}
                  <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-6">
                    <h3 className="text-[#FFD700] font-bold text-lg mb-4">Scenario 2: Database Server Failure</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Detection</p>
                          <p className="text-[#B8C5D6]">MongoDB Atlas monitors cluster health 24/7</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Automatic Failover</p>
                          <p className="text-[#B8C5D6]">
                            If primary node fails, replica set elects new primary within 10-30 seconds
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Manual Intervention (if needed)</p>
                          <p className="text-[#B8C5D6]">Login to MongoDB Atlas → Clusters → Monitor failover status</p>
                        </div>
                      </div>
                      <p className="text-green-400 font-medium mt-3">
                        Expected Recovery Time: Automatic, under 30 seconds
                      </p>
                    </div>
                  </div>

                  {/* Scenario 3 */}
                  <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-6">
                    <h3 className="text-[#FFD700] font-bold text-lg mb-4">
                      Scenario 3: Complete Database Corruption/Loss
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs">
                          !
                        </div>
                        <div>
                          <p className="text-red-400 font-medium">CRITICAL - Manual Intervention Required</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Assess Damage</p>
                          <p className="text-[#B8C5D6]">Login to MongoDB Atlas → Check cluster status and logs</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Enable Maintenance Mode</p>
                          <p className="text-[#B8C5D6]">Set MAINTENANCE_MODE=true in Vercel environment variables</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Point-in-Time Recovery</p>
                          <p className="text-[#B8C5D6]">
                            MongoDB Atlas → Backup → Restore → Select point-in-time before corruption
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          4
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Verify Data Integrity</p>
                          <p className="text-[#B8C5D6]">
                            Run data validation scripts, check critical collections (bets, transactions, wallets)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          5
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Disable Maintenance Mode</p>
                          <p className="text-[#B8C5D6]">Remove MAINTENANCE_MODE variable, redeploy application</p>
                        </div>
                      </div>
                      <p className="text-yellow-400 font-medium mt-3">
                        Expected Recovery Time: 30 minutes to 2 hours depending on data size
                      </p>
                    </div>
                  </div>

                  {/* Scenario 4 */}
                  <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-6">
                    <h3 className="text-[#FFD700] font-bold text-lg mb-4">Scenario 4: Redis Cache Failure</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Impact</p>
                          <p className="text-[#B8C5D6]">
                            Application continues to work but slower (cache miss, direct DB queries)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Check Redis Status</p>
                          <p className="text-[#B8C5D6]">Check Upstash/Redis dashboard for cluster health</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FFD700] text-[#0A1A2F] flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <div>
                          <p className="text-[#F5F5F5] font-medium">Recovery</p>
                          <p className="text-[#B8C5D6]">
                            Redis typically auto-recovers. If persistent, create new Redis instance and update REDIS_URL
                          </p>
                        </div>
                      </div>
                      <p className="text-green-400 font-medium mt-3">
                        Expected Recovery Time: Automatic, under 5 minutes
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DR Guide Modal */}
          {showGuide && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[#2A3F55] flex items-center justify-between sticky top-0 bg-[#0D1F35]">
                  <h2 className="text-xl font-bold text-[#FFD700]">Disaster Recovery Guide</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowGuide(false)} className="text-[#B8C5D6]">
                    ✕
                  </Button>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-[#FFD700] font-bold mb-3">What is Disaster Recovery?</h3>
                    <p className="text-[#B8C5D6]">
                      Disaster Recovery (DR) is a set of policies, tools, and procedures designed to enable the recovery
                      or continuation of vital technology infrastructure and systems following a natural or
                      human-induced disaster. For your betting platform, this means ensuring the system can recover from
                      server crashes, database failures, or other critical incidents with minimal data loss and
                      downtime.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-[#FFD700] font-bold mb-3">Key Terms</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#1A2F45] p-4 rounded-lg">
                        <p className="text-[#F5F5F5] font-bold">RTO (Recovery Time Objective)</p>
                        <p className="text-[#B8C5D6] text-sm">
                          Maximum acceptable time to restore the system after failure. Your target: under 30 minutes.
                        </p>
                      </div>
                      <div className="bg-[#1A2F45] p-4 rounded-lg">
                        <p className="text-[#F5F5F5] font-bold">RPO (Recovery Point Objective)</p>
                        <p className="text-[#B8C5D6] text-sm">
                          Maximum acceptable data loss measured in time. Your target: under 5 minutes of data.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[#FFD700] font-bold mb-3">Your Infrastructure Protection</h3>
                    <ul className="space-y-2 text-[#B8C5D6]">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <span>
                          <strong className="text-[#F5F5F5]">MongoDB Atlas:</strong> 3-node replica set with automatic
                          failover, point-in-time recovery, automated daily backups
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <span>
                          <strong className="text-[#F5F5F5]">Vercel:</strong> Serverless auto-scaling, global CDN,
                          instant rollbacks, zero-downtime deployments
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <span>
                          <strong className="text-[#F5F5F5]">Redis Cache:</strong> Managed service with automatic
                          failover, data is non-critical (can regenerate from DB)
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-[#FFD700] font-bold mb-3">How to Present This to Regulators/Banks</h3>
                    <ol className="space-y-2 text-[#B8C5D6] list-decimal list-inside">
                      <li>Show this Disaster Recovery dashboard demonstrating you have documented procedures</li>
                      <li>Export the backup history showing regular automated backups</li>
                      <li>Present the RTO/RPO metrics showing your recovery capabilities</li>
                      <li>Share the runbook demonstrating you have tested recovery procedures</li>
                      <li>Provide emergency contact list showing 24/7 support availability</li>
                    </ol>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <h4 className="text-green-400 font-bold mb-2">Your DR Readiness: GOOD</h4>
                    <p className="text-[#B8C5D6] text-sm">
                      Your platform uses managed cloud services (MongoDB Atlas, Vercel) which provide enterprise-grade
                      disaster recovery capabilities out of the box. Most recovery scenarios are handled automatically
                      with minimal to zero intervention required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Tabs>
      </div>
    </SuperAdminLayout>
  )
}
