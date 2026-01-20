"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Wallet,
  Plus,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Eye,
  Flag,
  Check,
  X,
} from "lucide-react"

export default function B2BSettlementsPage() {
  const [settlements, setSettlements] = useState([])
  const [stats, setStats] = useState({ totalVolume: 0, totalTransactions: 0, pendingAML: 0, flaggedAML: 0 })
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState([])
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    amlStatus: "",
    txHash: "",
  })
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState(null)
  const [newSettlement, setNewSettlement] = useState({
    tenantId: "",
    type: "tenant_topup",
    amount: "",
    txHash: "",
    network: "TRC20",
    reference: "",
    description: "",
  })

  useEffect(() => {
    fetchSettlements()
    fetchTenants()
  }, [filters])

  const fetchSettlements = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v)
      })

      const res = await fetch(`/api/super/b2b-settlements?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setSettlements(data.settlements || [])
        setStats(data.stats || {})
      }
    } catch (error) {
      console.error("Failed to fetch settlements:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch("/api/super/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.tenants) {
        setTenants(data.tenants)
      } else {
        console.error("[v0] No tenants in response:", data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch tenants:", error)
    }
  }

  const createSettlement = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch("/api/super/b2b-settlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSettlement),
      })
      const data = await res.json()

      if (data.success) {
        setShowNewDialog(false)
        setNewSettlement({
          tenantId: "",
          type: "tenant_topup",
          amount: "",
          txHash: "",
          network: "TRC20",
          reference: "",
          description: "",
        })
        fetchSettlements()
      } else {
        alert(data.error || "Failed to create settlement")
      }
    } catch (error) {
      console.error("Failed to create settlement:", error)
    }
  }

  const updateSettlement = async (id, action, data = {}) => {
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch(`/api/super/b2b-settlements/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...data }),
      })
      const result = await res.json()

      if (result.success) {
        fetchSettlements()
        if (selectedSettlement?._id === id) {
          setSelectedSettlement(result.settlement)
        }
      } else {
        alert(result.error || "Failed to update settlement")
      }
    } catch (error) {
      console.error("Failed to update settlement:", error)
    }
  }

  const downloadAMLReport = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch("/api/super/b2b-settlements/aml-report?format=csv", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `aml-report-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    } catch (error) {
      console.error("Failed to download report:", error)
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: "bg-yellow-500", icon: Clock },
      confirming: { color: "bg-blue-500", icon: RefreshCw },
      confirmed: { color: "bg-green-500", icon: CheckCircle },
      completed: { color: "bg-green-600", icon: Check },
      failed: { color: "bg-red-500", icon: X },
      flagged: { color: "bg-orange-500", icon: AlertTriangle },
    }
    const c = config[status] || config.pending
    const Icon = c.icon
    return (
      <Badge className={`${c.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  const getAMLBadge = (status) => {
    const config = {
      pending: { color: "bg-gray-500", text: "Pending Review" },
      passed: { color: "bg-green-500", text: "Passed" },
      flagged: { color: "bg-red-500", text: "Flagged" },
      failed: { color: "bg-red-700", text: "Failed" },
      manual_review: { color: "bg-orange-500", text: "Manual Review" },
    }
    const c = config[status] || config.pending
    return <Badge className={`${c.color} text-white`}>{c.text}</Badge>
  }

  return (
    <SuperAdminLayout title="USDT Settlement Hub" description="B2B crypto settlements with AML compliance">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Total Volume</p>
                  <p className="text-2xl font-bold text-white">${stats.totalVolume?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Transactions</p>
                  <p className="text-2xl font-bold text-white">{stats.totalTransactions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Pending AML</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingAML || 0}</p>
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
                  <p className="text-[#B8C5D6] text-sm">Flagged</p>
                  <p className="text-2xl font-bold text-white">{stats.flaggedAML || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for flagged transactions */}
        {stats.flaggedAML > 0 && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {stats.flaggedAML} transaction(s) require AML review. Please review flagged settlements.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions & Filters */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]">
                    <Plus className="w-4 h-4 mr-2" />
                    Record Settlement
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-[#FFD700]">Record USDT Settlement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[#B8C5D6]">Tenant</Label>
                      <Select
                        value={newSettlement.tenantId}
                        onValueChange={(v) => setNewSettlement({ ...newSettlement, tenantId: v })}
                      >
                        <SelectTrigger className="bg-[#0A1A2F] border-[#2A3F55]">
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                          {tenants.map((t) => (
                            <SelectItem key={t._id} value={t._id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[#B8C5D6]">Type</Label>
                      <Select
                        value={newSettlement.type}
                        onValueChange={(v) => setNewSettlement({ ...newSettlement, type: v })}
                      >
                        <SelectTrigger className="bg-[#0A1A2F] border-[#2A3F55]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                          <SelectItem value="tenant_topup">Tenant Top-up</SelectItem>
                          <SelectItem value="tenant_withdrawal">Tenant Withdrawal</SelectItem>
                          <SelectItem value="agent_payout">Agent Payout</SelectItem>
                          <SelectItem value="provider_settlement">Provider Settlement</SelectItem>
                          <SelectItem value="platform_fee">Platform Fee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#B8C5D6]">Amount (USDT)</Label>
                        <Input
                          type="number"
                          value={newSettlement.amount}
                          onChange={(e) => setNewSettlement({ ...newSettlement, amount: e.target.value })}
                          className="bg-[#0A1A2F] border-[#2A3F55]"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label className="text-[#B8C5D6]">Network</Label>
                        <Select
                          value={newSettlement.network}
                          onValueChange={(v) => setNewSettlement({ ...newSettlement, network: v })}
                        >
                          <SelectTrigger className="bg-[#0A1A2F] border-[#2A3F55]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                            <SelectItem value="TRC20">TRC-20 (Tron)</SelectItem>
                            <SelectItem value="ERC20">ERC-20 (Ethereum)</SelectItem>
                            <SelectItem value="BEP20">BEP-20 (BSC)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-[#B8C5D6]">Transaction Hash (TxHash)</Label>
                      <Input
                        value={newSettlement.txHash}
                        onChange={(e) => setNewSettlement({ ...newSettlement, txHash: e.target.value })}
                        className="bg-[#0A1A2F] border-[#2A3F55] font-mono text-sm"
                        placeholder="0x..."
                      />
                      <p className="text-xs text-[#B8C5D6] mt-1">Required for AML compliance</p>
                    </div>

                    <div>
                      <Label className="text-[#B8C5D6]">Reference / Invoice</Label>
                      <Input
                        value={newSettlement.reference}
                        onChange={(e) => setNewSettlement({ ...newSettlement, reference: e.target.value })}
                        className="bg-[#0A1A2F] border-[#2A3F55]"
                        placeholder="INV-2024-001"
                      />
                    </div>

                    <div>
                      <Label className="text-[#B8C5D6]">Description</Label>
                      <Textarea
                        value={newSettlement.description}
                        onChange={(e) => setNewSettlement({ ...newSettlement, description: e.target.value })}
                        className="bg-[#0A1A2F] border-[#2A3F55]"
                        placeholder="Settlement description..."
                      />
                    </div>

                    <Button
                      onClick={createSettlement}
                      className="w-full bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Record Settlement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={downloadAMLReport}
                variant="outline"
                className="border-[#2A3F55] text-[#B8C5D6] bg-transparent hover:bg-[#2A3F55]"
              >
                <Download className="w-4 h-4 mr-2" />
                AML Report (CSV)
              </Button>

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search TxHash..."
                  value={filters.txHash}
                  onChange={(e) => setFilters({ ...filters, txHash: e.target.value })}
                  className="bg-[#0A1A2F] border-[#2A3F55] w-48"
                />

                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger className="bg-[#0A1A2F] border-[#2A3F55] w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.amlStatus} onValueChange={(v) => setFilters({ ...filters, amlStatus: v })}>
                  <SelectTrigger className="bg-[#0A1A2F] border-[#2A3F55] w-36">
                    <SelectValue placeholder="AML Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                    <SelectItem value="all">All AML</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="manual_review">Manual Review</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={fetchSettlements} variant="ghost" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settlements List */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Settlement Records</CardTitle>
            <CardDescription className="text-[#B8C5D6]">
              All B2B USDT settlements with blockchain verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A3F55]">
                    <th className="text-left p-3 text-[#B8C5D6] font-medium">Settlement ID</th>
                    <th className="text-left p-3 text-[#B8C5D6] font-medium">Tenant</th>
                    <th className="text-left p-3 text-[#B8C5D6] font-medium">Type</th>
                    <th className="text-right p-3 text-[#B8C5D6] font-medium">Amount</th>
                    <th className="text-left p-3 text-[#B8C5D6] font-medium">TxHash</th>
                    <th className="text-center p-3 text-[#B8C5D6] font-medium">Status</th>
                    <th className="text-center p-3 text-[#B8C5D6] font-medium">AML</th>
                    <th className="text-center p-3 text-[#B8C5D6] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-[#B8C5D6]">
                        Loading settlements...
                      </td>
                    </tr>
                  ) : settlements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-[#B8C5D6]">
                        No settlements found
                      </td>
                    </tr>
                  ) : (
                    settlements.map((s) => (
                      <tr key={s._id} className="border-b border-[#2A3F55]/50 hover:bg-[#0A1A2F]/50">
                        <td className="p-3">
                          <span className="font-mono text-white">{s.settlementId}</span>
                          <br />
                          <span className="text-xs text-[#B8C5D6]">{new Date(s.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3 text-white">{s.tenant_id?.name || "Unknown"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="border-[#2A3F55] text-[#B8C5D6]">
                            {s.type?.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-white font-medium">${s.amount?.value?.toLocaleString()}</span>
                          <br />
                          <span className="text-xs text-[#B8C5D6]">{s.amount?.network}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-white truncate max-w-[120px]">
                              {s.blockchain?.txHash}
                            </span>
                            {s.blockchain?.explorerUrl && (
                              <a
                                href={s.blockchain.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#FFD700] hover:text-[#E5C100]"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">{getStatusBadge(s.status)}</td>
                        <td className="p-3 text-center">{getAMLBadge(s.compliance?.amlScreeningStatus)}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSettlement(s)
                                setShowDetailDialog(true)
                              }}
                              className="text-[#B8C5D6] hover:bg-[#2A3F55]"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {s.compliance?.amlScreeningStatus === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateSettlement(s._id, "updateAML", { amlStatus: "passed" })}
                                  className="text-green-400 hover:bg-green-500/20"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateSettlement(s._id, "flag", { reason: "Manual review required" })}
                                  className="text-red-400 hover:bg-red-500/20"
                                >
                                  <Flag className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Settlement Details</DialogTitle>
            </DialogHeader>
            {selectedSettlement && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#B8C5D6]">Settlement ID</Label>
                    <p className="font-mono">{selectedSettlement.settlementId}</p>
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6]">Status</Label>
                    <div>{getStatusBadge(selectedSettlement.status)}</div>
                  </div>
                </div>

                <div className="p-4 bg-[#0A1A2F] rounded-lg">
                  <Label className="text-[#B8C5D6]">Transaction Hash</Label>
                  <p className="font-mono text-sm break-all">{selectedSettlement.blockchain?.txHash}</p>
                  {selectedSettlement.blockchain?.explorerUrl && (
                    <a
                      href={selectedSettlement.blockchain.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFD700] text-sm flex items-center gap-1 mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Explorer
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[#B8C5D6]">Amount</Label>
                    <p className="text-xl font-bold">${selectedSettlement.amount?.value?.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6]">Network</Label>
                    <p>{selectedSettlement.amount?.network}</p>
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6]">Confirmations</Label>
                    <p>{selectedSettlement.blockchain?.confirmations || 0}</p>
                  </div>
                </div>

                <div className="p-4 bg-[#0A1A2F] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[#B8C5D6]">AML Compliance</Label>
                    {getAMLBadge(selectedSettlement.compliance?.amlScreeningStatus)}
                  </div>
                  {selectedSettlement.compliance?.riskScore !== undefined && (
                    <p className="text-sm">
                      Risk Score:{" "}
                      <span
                        className={
                          selectedSettlement.compliance.riskScore > 70
                            ? "text-red-400"
                            : selectedSettlement.compliance.riskScore > 40
                              ? "text-yellow-400"
                              : "text-green-400"
                        }
                      >
                        {selectedSettlement.compliance.riskScore}/100
                      </span>
                    </p>
                  )}
                  {selectedSettlement.compliance?.amlNotes && (
                    <p className="text-sm text-[#B8C5D6] mt-2">{selectedSettlement.compliance.amlNotes}</p>
                  )}
                </div>

                {selectedSettlement.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateSettlement(selectedSettlement._id, "approve")}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() =>
                        updateSettlement(selectedSettlement._id, "reject", { reason: "Rejected by admin" })
                      }
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}
