"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Shield,
  AlertTriangle,
  Activity,
  Info,
  Search,
  Filter,
  Download,
  Eye,
  User,
  FileText,
  Trash2,
} from "lucide-react"
import { SuperAdminSidebar } from "@/components/admin/super-admin-sidebar"

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filters, setFilters] = useState({
    severity: "",
    action: "",
    search: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  })
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  })

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [filters])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")

      const params = new URLSearchParams()
      if (filters.severity && filters.severity !== "all") params.append("severity", filters.severity)
      if (filters.action && filters.action !== "all") params.append("action", filters.action)
      if (filters.search) params.append("search", filters.search)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      params.append("page", filters.page)
      params.append("limit", filters.limit)

      const response = await fetch(`/api/super/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/super/audit-logs?stats=true", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const createTestLog = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/super/audit-logs/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      alert(data.message || "Test log created!")
      fetchLogs()
      fetchStats()
    } catch (error) {
      console.error("Test log creation error:", error)
      alert("Failed to create test log")
    }
  }

  const handleDeleteLog = async (logId) => {
    if (!confirm("Are you sure you want to delete this audit log? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/super/audit-logs/${logId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert("Audit log deleted successfully")
        fetchLogs()
        fetchStats()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete audit log")
      }
    } catch (error) {
      console.error("Delete audit log error:", error)
      alert("Failed to delete audit log")
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "high":
        return <Shield className="w-4 h-4 text-orange-500" />
      case "medium":
        return <Activity className="w-4 h-4 text-yellow-500" />
      case "low":
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const exportLogs = async () => {
    const token = localStorage.getItem("auth_token")
    const params = new URLSearchParams(filters)

    const response = await fetch(`/api/super/audit-logs/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${new Date().toISOString()}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-[#0A1A2F] flex">
      {/* Shared Sidebar */}
      <SuperAdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 pl-8 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Header */}
        <div className="border-b border-[#2A3F55] bg-[#0D1F35]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Audit Logs</h1>
                <p className="text-[#B8C5D6]">Track all administrative actions and system events</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={createTestLog} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Create Test Log
                </Button>
                <Button onClick={exportLogs} className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90">
                  <Download className="w-4 h-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#B8C5D6]">Total Logs</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-[#FFD700]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-400">Critical</p>
                    <p className="text-2xl font-bold text-white">{stats.critical}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-400">High</p>
                    <p className="text-2xl font-bold text-white">{stats.high}</p>
                  </div>
                  <Shield className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-400">Medium</p>
                    <p className="text-2xl font-bold text-white">{stats.medium}</p>
                  </div>
                  <Activity className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-400">Low</p>
                    <p className="text-2xl font-bold text-white">{stats.low}</p>
                  </div>
                  <Info className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-[#B8C5D6]" />
                  <Input
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-white"
                  />
                </div>

                <Select
                  value={filters.severity}
                  onValueChange={(value) => setFilters({ ...filters, severity: value === "all" ? "" : value })}
                >
                  <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-white">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.action}
                  onValueChange={(value) => setFilters({ ...filters, action: value === "all" ? "" : value })}
                >
                  <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-white">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="tenant.create">Tenant Create</SelectItem>
                    <SelectItem value="tenant.update">Tenant Update</SelectItem>
                    <SelectItem value="tenant.config.update">Config Update</SelectItem>
                    <SelectItem value="tenant.delete">Tenant Delete</SelectItem>
                    <SelectItem value="wallet.adjust">Wallet Adjust</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-white"
                />

                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-[#B8C5D6]">Loading logs...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-[#B8C5D6]">No audit logs found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A3F55]">
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-semibold">Timestamp</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-semibold">Severity</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-semibold">Actor</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-semibold">Action</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-semibold">Resource</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-semibold">IP Address</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id} className="border-b border-[#2A3F55] hover:bg-[#1A2F45] transition-colors">
                          <td className="py-4 px-4 text-white text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="py-4 px-4">
                            <Badge className={getSeverityColor(log.severity)}>
                              <div className="flex items-center gap-1">
                                {getSeverityIcon(log.severity)}
                                {log.severity}
                              </div>
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-[#B8C5D6]" />
                              <div>
                                <p className="text-white text-sm">{log.actor?.email || "System"}</p>
                                <p className="text-[#B8C5D6] text-xs">{log.actor?.role || "N/A"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <code className="text-[#FFD700] text-sm bg-[#1A2F45] px-2 py-1 rounded">{log.action}</code>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-white text-sm">{log.resource?.type}</p>
                              <p className="text-[#B8C5D6] text-xs">{log.resource?.name}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-[#B8C5D6] text-sm">
                            {log.actor?.ipAddress || log.metadata?.ipAddress || "N/A"}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                                className="text-[#FFD700] hover:bg-[#1A2F45]"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLog(log._id)}
                                className="text-red-400 hover:bg-red-400/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55] max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#FFD700]">Audit Log Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedLog(null)} className="text-[#B8C5D6]">
                  X
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-[#B8C5D6] text-sm">Timestamp</label>
                <p className="text-white">{new Date(selectedLog.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-[#B8C5D6] text-sm">Actor</label>
                <p className="text-white">
                  {selectedLog.actor?.email} ({selectedLog.actor?.role})
                </p>
              </div>

              <div>
                <label className="text-[#B8C5D6] text-sm">Action</label>
                <code className="text-[#FFD700] bg-[#1A2F45] px-2 py-1 rounded block mt-1">{selectedLog.action}</code>
              </div>

              <div>
                <label className="text-[#B8C5D6] text-sm">Resource</label>
                <p className="text-white">
                  {selectedLog.resource?.type}: {selectedLog.resource?.name}
                </p>
              </div>

              {selectedLog.changes && (
                <div>
                  <label className="text-[#B8C5D6] text-sm">Changes</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-red-400 text-sm mb-1">Before:</p>
                      <pre className="bg-[#1A2F45] p-3 rounded text-xs text-white overflow-x-auto">
                        {JSON.stringify(selectedLog.changes.before, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-green-400 text-sm mb-1">After:</p>
                      <pre className="bg-[#1A2F45] p-3 rounded text-xs text-white overflow-x-auto">
                        {JSON.stringify(selectedLog.changes.after, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[#B8C5D6] text-sm">Metadata</label>
                <pre className="bg-[#1A2F45] p-3 rounded text-xs text-white overflow-x-auto mt-1">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
