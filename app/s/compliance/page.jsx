"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Search,
  Users,
  Fingerprint,
  Smartphone,
  Globe,
  AlertOctagon,
  TrendingUp,
  RefreshCw,
  XCircle,
  UserX,
  Flag,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export default function CompliancePage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    kycVerified: 0,
    kycPending: 0,
    flaggedAccounts: 0,
    reportsGenerated: 0,
  })
  const [amlSummary, setAmlSummary] = useState({
    suspiciousActivityReports: 0,
    largeTransactionAlerts: 0,
    riskScoreReviews: 0,
  })
  const [fraudSummary, setFraudSummary] = useState({
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  })
  const [alerts, setAlerts] = useState([])
  const [largeTransactions, setLargeTransactions] = useState([])
  const [pendingKycReviews, setPendingKycReviews] = useState([])
  const [reports, setReports] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [alertDialog, setAlertDialog] = useState({ open: false, alert: null })
  const [reportDialog, setReportDialog] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/compliance", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setAmlSummary(data.amlSummary)
        setFraudSummary(data.fraudSummary)
        setAlerts(data.alerts || [])
        setLargeTransactions(data.largeTransactions || [])
        setPendingKycReviews(data.pendingKycReviews || [])
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching compliance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAlertAction = async (alertId, action, resolution = null) => {
    try {
      const token = getAuthToken()
      const res = await fetch(`/api/super/compliance/alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, resolution }),
      })
      if (res.ok) {
        fetchComplianceData()
        setAlertDialog({ open: false, alert: null })
      }
    } catch (error) {
      console.error("[v0] Error updating alert:", error)
    }
  }

  const handleGenerateReport = async (type) => {
    setGenerating(true)
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/compliance/reports", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      })
      if (res.ok) {
        fetchComplianceData()
        setReportDialog(false)
      }
    } catch (error) {
      console.error("[v0] Error generating report:", error)
    } finally {
      setGenerating(false)
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
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-500/20 text-blue-400"
      case "investigating":
        return "bg-yellow-500/20 text-yellow-400"
      case "resolved":
        return "bg-green-500/20 text-green-400"
      case "dismissed":
        return "bg-gray-500/20 text-gray-400"
      case "escalated":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const formatAlertType = (type) => {
    return type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Unknown"
  }

  if (loading) {
    return (
      <SuperAdminLayout title="Compliance & Regulations" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-[#FFD700] animate-spin" />
        </div>
      </SuperAdminLayout>
    )
  }

  return (
    <SuperAdminLayout
      title="Compliance & Regulations"
      description="AML/KYC policies, regulatory reporting, fraud monitoring, and audit trails"
    >
      <div className="space-y-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">KYC Verified</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{stats.kycVerified.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{stats.kycPending.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Flagged Accounts</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{stats.flaggedAccounts.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Reports Generated</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{stats.reportsGenerated.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0D1F35] border border-[#2A3F55]">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger value="kyc" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              KYC Verification
            </TabsTrigger>
            <TabsTrigger value="aml" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              AML Monitoring
            </TabsTrigger>
            <TabsTrigger value="fraud" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              Fraud Detection
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance Integrations */}
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Compliance Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="w-5 h-5 text-[#FFD700]" />
                      <span className="text-[#F5F5F5]">National ID Verification</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-[#FFD700]" />
                      <span className="text-[#F5F5F5]">Mobile Money Verification</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-[#FFD700]" />
                      <span className="text-[#F5F5F5]">Fraud Scoring Engine</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertOctagon className="w-5 h-5 text-[#FFD700]" />
                      <span className="text-[#F5F5F5]">AML Monitoring</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-[#FFD700]" />
                      <span className="text-[#F5F5F5]">IP/Device Fingerprinting</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Fraud Risk Distribution */}
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Fraud Risk Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#B8C5D6]">Low Risk</span>
                      <span className="text-green-400 font-semibold">{fraudSummary.low}</span>
                    </div>
                    <div className="w-full bg-[#1A2F45] rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(fraudSummary.low / (fraudSummary.low + fraudSummary.medium + fraudSummary.high + fraudSummary.critical || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#B8C5D6]">Medium Risk</span>
                      <span className="text-yellow-400 font-semibold">{fraudSummary.medium}</span>
                    </div>
                    <div className="w-full bg-[#1A2F45] rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${(fraudSummary.medium / (fraudSummary.low + fraudSummary.medium + fraudSummary.high + fraudSummary.critical || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#B8C5D6]">High Risk</span>
                      <span className="text-orange-400 font-semibold">{fraudSummary.high}</span>
                    </div>
                    <div className="w-full bg-[#1A2F45] rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${(fraudSummary.high / (fraudSummary.low + fraudSummary.medium + fraudSummary.high + fraudSummary.critical || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#B8C5D6]">Critical Risk</span>
                      <span className="text-red-400 font-semibold">{fraudSummary.critical}</span>
                    </div>
                    <div className="w-full bg-[#1A2F45] rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${(fraudSummary.critical / (fraudSummary.low + fraudSummary.medium + fraudSummary.high + fraudSummary.critical || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AML and Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    AML Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                    <span className="text-[#B8C5D6]">Suspicious Activity Reports</span>
                    <Badge
                      className={
                        amlSummary.suspiciousActivityReports > 0
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }
                    >
                      {amlSummary.suspiciousActivityReports > 0
                        ? `${amlSummary.suspiciousActivityReports} New`
                        : "Clear"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                    <span className="text-[#B8C5D6]">Large Transaction Alerts</span>
                    <Badge
                      className={
                        amlSummary.largeTransactionAlerts > 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                      }
                    >
                      {amlSummary.largeTransactionAlerts > 0 ? `${amlSummary.largeTransactionAlerts} Pending` : "Clear"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                    <span className="text-[#B8C5D6]">Risk Score Reviews</span>
                    <Badge
                      className={
                        amlSummary.riskScoreReviews > 0
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-green-500/20 text-green-400"
                      }
                    >
                      {amlSummary.riskScoreReviews > 0 ? `${amlSummary.riskScoreReviews} Overdue` : "Up to Date"}
                    </Badge>
                  </div>
                  <Button
                    className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                    onClick={() => setActiveTab("aml")}
                  >
                    View All Alerts
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Recent Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reports.length === 0 ? (
                    <p className="text-[#B8C5D6] text-center py-4">No reports generated yet</p>
                  ) : (
                    reports.slice(0, 3).map((report) => (
                      <div key={report._id} className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                        <div>
                          <p className="text-[#F5F5F5]">{report.title}</p>
                          <p className="text-[#B8C5D6] text-sm">
                            {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "Pending"}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-[#FFD700]">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                  <Button
                    className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                    onClick={() => setReportDialog(true)}
                  >
                    Generate New Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-6">
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Pending KYC Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingKycReviews.length === 0 ? (
                  <p className="text-[#B8C5D6] text-center py-8">No pending KYC reviews</p>
                ) : (
                  <div className="space-y-3">
                    {pendingKycReviews.map((kyc) => (
                      <div key={kyc._id} className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#FFD700]" />
                          </div>
                          <div>
                            <p className="text-[#F5F5F5] font-medium">{kyc.userId?.fullName || "Unknown"}</p>
                            <p className="text-[#B8C5D6] text-sm">{kyc.userId?.email || kyc.userId?.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-yellow-500/20 text-yellow-400">
                            {kyc.verificationLevel || "Level 0"}
                          </Badge>
                          <Button size="sm" className="bg-[#FFD700] text-[#0A1A2F]">
                            <Eye className="w-4 h-4 mr-1" /> Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AML Tab */}
          <TabsContent value="aml" className="space-y-6">
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#FFD700]">AML Alerts</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px] bg-[#1A2F45] border-[#2A3F55]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <p className="text-[#B8C5D6] text-center py-8">No active alerts</p>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert._id} className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(alert.severity)}`}
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[#F5F5F5] font-medium">{alert.title}</p>
                            <p className="text-[#B8C5D6] text-sm">
                              {alert.userId?.fullName || "Unknown"} • {formatAlertType(alert.type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          <Badge className={getStatusColor(alert.status)}>{alert.status}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#FFD700] text-[#FFD700] bg-transparent"
                            onClick={() => setAlertDialog({ open: true, alert })}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Large Transactions */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Large Transactions (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {largeTransactions.length === 0 ? (
                  <p className="text-[#B8C5D6] text-center py-8">No large transactions detected</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[#B8C5D6] text-sm border-b border-[#2A3F55]">
                          <th className="pb-3">User</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {largeTransactions.map((tx) => (
                          <tr key={tx._id} className="border-b border-[#2A3F55]/50">
                            <td className="py-3">
                              <p className="text-[#F5F5F5]">{tx.userId?.fullName || "Unknown"}</p>
                              <p className="text-[#B8C5D6] text-sm">{tx.userId?.email}</p>
                            </td>
                            <td className="py-3">
                              <span className={tx.amount >= 0 ? "text-green-400" : "text-red-400"}>
                                ${Math.abs(tx.amount).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3">
                              <Badge className="bg-[#2A3F55] text-[#B8C5D6]">{tx.type}</Badge>
                            </td>
                            <td className="py-3 text-[#B8C5D6]">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td className="py-3">
                              <Button size="sm" variant="ghost" className="text-[#FFD700]">
                                <Flag className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fraud Tab */}
          <TabsContent value="fraud" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{fraudSummary.low}</div>
                  <p className="text-[#B8C5D6] text-sm">Low Risk</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">{fraudSummary.medium}</div>
                  <p className="text-[#B8C5D6] text-sm">Medium Risk</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-orange-400">{fraudSummary.high}</div>
                  <p className="text-[#B8C5D6] text-sm">High Risk</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">{fraudSummary.critical}</div>
                  <p className="text-[#B8C5D6] text-sm">Critical Risk</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700]">Fraud Detection Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Fingerprint className="w-6 h-6 text-[#FFD700]" />
                      <h3 className="text-[#F5F5F5] font-medium">National ID Verification</h3>
                    </div>
                    <p className="text-[#B8C5D6] text-sm">
                      Verify government-issued IDs across Africa, Asia, and LATAM regions
                    </p>
                  </div>
                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Smartphone className="w-6 h-6 text-[#FFD700]" />
                      <h3 className="text-[#F5F5F5] font-medium">Mobile Money Verification</h3>
                    </div>
                    <p className="text-[#B8C5D6] text-sm">M-Pesa, MTN, Airtel Money, and other regional providers</p>
                  </div>
                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-6 h-6 text-[#FFD700]" />
                      <h3 className="text-[#F5F5F5] font-medium">Fraud Scoring</h3>
                    </div>
                    <p className="text-[#B8C5D6] text-sm">Real-time risk scoring based on behavioral patterns</p>
                  </div>
                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertOctagon className="w-6 h-6 text-[#FFD700]" />
                      <h3 className="text-[#F5F5F5] font-medium">AML Monitoring</h3>
                    </div>
                    <p className="text-[#B8C5D6] text-sm">PEP screening, sanctions lists, and adverse media checks</p>
                  </div>
                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-6 h-6 text-[#FFD700]" />
                      <h3 className="text-[#F5F5F5] font-medium">IP/Device Fingerprinting</h3>
                    </div>
                    <p className="text-[#B8C5D6] text-sm">Detect VPNs, proxies, and multiple account abuse</p>
                  </div>
                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <UserX className="w-6 h-6 text-[#FFD700]" />
                      <h3 className="text-[#F5F5F5] font-medium">Account Linking</h3>
                    </div>
                    <p className="text-[#B8C5D6] text-sm">
                      Detect duplicate accounts using device and behavioral signals
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#FFD700]">Regulatory Reports</CardTitle>
                <Button className="bg-[#FFD700] text-[#0A1A2F]" onClick={() => setReportDialog(true)}>
                  Generate Report
                </Button>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-[#B8C5D6] text-center py-8">No reports generated yet</p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report._id} className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-[#F5F5F5] font-medium">{report.title}</p>
                            <p className="text-[#B8C5D6] text-sm">
                              Generated:{" "}
                              {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "Pending"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={
                              report.status === "generated"
                                ? "bg-green-500/20 text-green-400"
                                : report.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-400"
                            }
                          >
                            {report.status}
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-[#FFD700]">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alert Details Dialog */}
        <Dialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ open, alert: alertDialog.alert })}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Alert Details</DialogTitle>
            </DialogHeader>
            {alertDialog.alert && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#1A2F45] rounded-lg">
                    <p className="text-[#B8C5D6] text-sm">Type</p>
                    <p className="text-[#F5F5F5]">{formatAlertType(alertDialog.alert.type)}</p>
                  </div>
                  <div className="p-3 bg-[#1A2F45] rounded-lg">
                    <p className="text-[#B8C5D6] text-sm">Severity</p>
                    <Badge className={getSeverityColor(alertDialog.alert.severity)}>{alertDialog.alert.severity}</Badge>
                  </div>
                  <div className="p-3 bg-[#1A2F45] rounded-lg">
                    <p className="text-[#B8C5D6] text-sm">User</p>
                    <p className="text-[#F5F5F5]">{alertDialog.alert.userId?.fullName || "Unknown"}</p>
                  </div>
                  <div className="p-3 bg-[#1A2F45] rounded-lg">
                    <p className="text-[#B8C5D6] text-sm">Status</p>
                    <Badge className={getStatusColor(alertDialog.alert.status)}>{alertDialog.alert.status}</Badge>
                  </div>
                </div>
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Description</p>
                  <p className="text-[#F5F5F5]">{alertDialog.alert.description || "No description"}</p>
                </div>
                {alertDialog.alert.status !== "resolved" && alertDialog.alert.status !== "dismissed" && (
                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-gray-500 text-gray-400 bg-transparent"
                      onClick={() => handleAlertAction(alertDialog.alert._id, "dismiss")}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Dismiss
                    </Button>
                    <Button
                      variant="outline"
                      className="border-yellow-500 text-yellow-400 bg-transparent"
                      onClick={() => handleAlertAction(alertDialog.alert._id, "investigate")}
                    >
                      <Search className="w-4 h-4 mr-1" /> Investigate
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() =>
                        handleAlertAction(alertDialog.alert._id, "resolve", { action: "account_suspended" })
                      }
                    >
                      <UserX className="w-4 h-4 mr-1" /> Suspend Account
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Generate Report Dialog */}
        <Dialog open={reportDialog} onOpenChange={setReportDialog}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55]">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Generate Compliance Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#B8C5D6]">Select the type of report to generate:</p>
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="justify-start border-[#2A3F55] text-[#F5F5F5] hover:bg-[#1A2F45] bg-transparent"
                  onClick={() => handleGenerateReport("monthly_ggr")}
                  disabled={generating}
                >
                  <FileText className="w-4 h-4 mr-2" /> Monthly GGR Report
                </Button>
                <Button
                  variant="outline"
                  className="justify-start border-[#2A3F55] text-[#F5F5F5] hover:bg-[#1A2F45] bg-transparent"
                  onClick={() => handleGenerateReport("player_activity")}
                  disabled={generating}
                >
                  <Users className="w-4 h-4 mr-2" /> Player Activity Report
                </Button>
                <Button
                  variant="outline"
                  className="justify-start border-[#2A3F55] text-[#F5F5F5] hover:bg-[#1A2F45] bg-transparent"
                  onClick={() => handleGenerateReport("kyc_summary")}
                  disabled={generating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> KYC Summary Report
                </Button>
                <Button
                  variant="outline"
                  className="justify-start border-[#2A3F55] text-[#F5F5F5] hover:bg-[#1A2F45] bg-transparent"
                  onClick={() => handleGenerateReport("transaction_summary")}
                  disabled={generating}
                >
                  <TrendingUp className="w-4 h-4 mr-2" /> Transaction Summary Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}
