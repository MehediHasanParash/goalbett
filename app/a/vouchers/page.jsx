"use client"

import { useState, useEffect, useCallback } from "react"
import { Ticket, Plus, RefreshCw, Search, Copy, Check, X, Clock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { getAuthToken } from "@/lib/auth-service"
import AgentSidebar from "@/components/agent/agent-sidebar"

const STATUS_COLORS = {
  unused: "bg-green-500/20 text-green-400 border-green-500/30",
  redeemed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  expired: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
}

const STATUS_ICONS = {
  unused: <Clock className="h-3 w-3" />,
  redeemed: <CheckCircle className="h-3 w-3" />,
  expired: <XCircle className="h-3 w-3" />,
  cancelled: <X className="h-3 w-3" />,
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Create form state
  const [createForm, setCreateForm] = useState({
    amount: 10,
    quantity: 1,
    prefix: "VCH",
    expiryDays: 30,
    description: "",
  })

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)

      const res = await fetch(`/api/agent/vouchers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setVouchers(data.data.vouchers)
        setStats(data.data.stats)
      }
    } catch (err) {
      console.error("Error fetching vouchers:", err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchVouchers()
  }, [fetchVouchers])

  const handleCreateVouchers = async () => {
    try {
      setCreating(true)
      setError("")
      const token = getAuthToken()

      const res = await fetch("/api/agent/vouchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(`Successfully created ${data.data.quantity} voucher(s)!`)
        setShowCreateDialog(false)
        setCreateForm({ amount: 10, quantity: 1, prefix: "VCH", expiryDays: 30, description: "" })
        fetchVouchers()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCancelVoucher = async (voucherId) => {
    if (!confirm("Are you sure you want to cancel this voucher? The amount will be refunded.")) return

    try {
      const token = getAuthToken()
      const res = await fetch(`/api/agent/vouchers/${voucherId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "cancel" }),
      })

      const data = await res.json()
      if (data.success) {
        setSuccess("Voucher cancelled and refunded")
        fetchVouchers()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredVouchers = vouchers.filter((v) => v.code.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex min-h-screen bg-[#0A1A2F]">
      <AgentSidebar />

      <div className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#FFD700]">Voucher Management</h1>
              <p className="text-[#F5F5F5]/70">Generate and manage prepaid vouchers for customers</p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Vouchers
            </Button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">{error}</div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-[#0D2137] border-[#FFD700]/20">
              <CardContent className="p-4">
                <p className="text-xs text-[#F5F5F5]/60">Total Vouchers</p>
                <p className="text-2xl font-bold text-[#FFD700]">{stats.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D2137] border-green-500/30">
              <CardContent className="p-4">
                <p className="text-xs text-[#F5F5F5]/60">Unused</p>
                <p className="text-2xl font-bold text-green-400">{stats.unused || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D2137] border-blue-500/30">
              <CardContent className="p-4">
                <p className="text-xs text-[#F5F5F5]/60">Redeemed</p>
                <p className="text-2xl font-bold text-blue-400">{stats.redeemed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D2137] border-red-500/30">
              <CardContent className="p-4">
                <p className="text-xs text-[#F5F5F5]/60">Expired</p>
                <p className="text-2xl font-bold text-red-400">{stats.expired || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D2137] border-[#FFD700]/20">
              <CardContent className="p-4">
                <p className="text-xs text-[#F5F5F5]/60">Redeemed Value</p>
                <p className="text-2xl font-bold text-[#FFD700]">${stats.redeemedValue || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F5F5]/50" />
              <Input
                placeholder="Search by voucher code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0D2137] border-[#FFD700]/20 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-[#0D2137] border-[#FFD700]/20 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D2137] border-[#FFD700]/20">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
                <SelectItem value="redeemed">Redeemed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={fetchVouchers}
              className="border-[#FFD700]/20 text-[#FFD700] bg-transparent"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Vouchers Table */}
          <Card className="bg-[#0D2137] border-[#FFD700]/20">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#FFD700]" />
                </div>
              ) : filteredVouchers.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="h-12 w-12 mx-auto text-[#FFD700]/30 mb-4" />
                  <p className="text-[#F5F5F5]/50">No vouchers found</p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="mt-4 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                  >
                    Generate Your First Voucher
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0A1A2F]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#F5F5F5]/60 uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#F5F5F5]/60 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#F5F5F5]/60 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#F5F5F5]/60 uppercase">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#F5F5F5]/60 uppercase">Expires</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#F5F5F5]/60 uppercase">
                          Redeemed By
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-[#F5F5F5]/60 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FFD700]/10">
                      {filteredVouchers.map((voucher) => (
                        <tr key={voucher._id} className="hover:bg-[#FFD700]/5">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-[#FFD700]">{voucher.code}</code>
                              <button
                                onClick={() => copyCode(voucher.code)}
                                className="p-1 hover:bg-[#FFD700]/10 rounded"
                              >
                                {copiedCode === voucher.code ? (
                                  <Check className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Copy className="h-4 w-4 text-[#F5F5F5]/50" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-white font-medium">${voucher.amount.toFixed(2)}</td>
                          <td className="px-4 py-4">
                            <Badge className={`${STATUS_COLORS[voucher.status]} flex items-center gap-1 w-fit`}>
                              {STATUS_ICONS[voucher.status]}
                              {voucher.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm text-[#F5F5F5]/70">{formatDate(voucher.createdAt)}</td>
                          <td className="px-4 py-4 text-sm text-[#F5F5F5]/70">{formatDate(voucher.expiresAt)}</td>
                          <td className="px-4 py-4 text-sm text-[#F5F5F5]/70">
                            {voucher.redeemedBy ? (
                              <div>
                                <p className="text-white">
                                  {voucher.redeemedBy.fullName || voucher.redeemedBy.username}
                                </p>
                                <p className="text-xs">{voucher.redeemedBy.phone}</p>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {voucher.status === "unused" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelVoucher(voucher._id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
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

      {/* Create Voucher Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#0D2137] border-[#FFD700]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">Generate Vouchers</DialogTitle>
            <DialogDescription className="text-[#F5F5F5]/70">
              Create prepaid vouchers for customers to redeem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#F5F5F5]/70">Amount (USD)</label>
                <Input
                  type="number"
                  min="1"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: Number.parseFloat(e.target.value) || 0 })}
                  className="mt-1 bg-[#0A1A2F] border-[#FFD700]/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#F5F5F5]/70">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={createForm.quantity}
                  onChange={(e) => setCreateForm({ ...createForm, quantity: Number.parseInt(e.target.value) || 1 })}
                  className="mt-1 bg-[#0A1A2F] border-[#FFD700]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#F5F5F5]/70">Code Prefix</label>
                <Input
                  value={createForm.prefix}
                  onChange={(e) => setCreateForm({ ...createForm, prefix: e.target.value.toUpperCase() })}
                  maxLength={5}
                  className="mt-1 bg-[#0A1A2F] border-[#FFD700]/20"
                  placeholder="VCH"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#F5F5F5]/70">Valid for (days)</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={createForm.expiryDays}
                  onChange={(e) => setCreateForm({ ...createForm, expiryDays: Number.parseInt(e.target.value) || 30 })}
                  className="mt-1 bg-[#0A1A2F] border-[#FFD700]/20"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#F5F5F5]/70">Description (optional)</label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="mt-1 bg-[#0A1A2F] border-[#FFD700]/20"
                placeholder="e.g., Holiday promotion vouchers"
              />
            </div>

            <div className="p-4 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20">
              <div className="flex justify-between items-center">
                <span className="text-[#F5F5F5]/70">Total Cost:</span>
                <span className="text-xl font-bold text-[#FFD700]">
                  ${(createForm.amount * createForm.quantity).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-[#F5F5F5]/50 mt-1">This will be deducted from your credit limit/balance</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-[#FFD700]/20">
              Cancel
            </Button>
            <Button
              onClick={handleCreateVouchers}
              disabled={creating || createForm.amount < 1 || createForm.quantity < 1}
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
            >
              {creating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Ticket className="mr-2 h-4 w-4" />
                  Generate {createForm.quantity} Voucher{createForm.quantity > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
