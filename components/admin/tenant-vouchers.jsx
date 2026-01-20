"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, RefreshCw, Ticket, Copy, X, CheckCircle, Clock, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TenantVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [stats, setStats] = useState({ total: 0, unused: 0, redeemed: 0, expired: 0, redeemedValue: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast()

  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    amount: 10,
    quantity: 1,
    prefix: "VCH",
    validDays: 30,
    description: "",
  })

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)

      const res = await fetch(`/api/tenant/vouchers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setVouchers(data.vouchers || [])
        setStats(data.stats || { total: 0, unused: 0, redeemed: 0, expired: 0, redeemedValue: 0 })
      }
    } catch (error) {
      console.error("Failed to fetch vouchers:", error)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchVouchers()
  }, [fetchVouchers])

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const token = localStorage.getItem("token")
      const res = await fetch("/api/tenant/vouchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(generateForm),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMessage(`Successfully created ${data.count} voucher(s)!`)
        setShowGenerateDialog(false)
        setGenerateForm({ amount: 10, quantity: 1, prefix: "VCH", validDays: 30, description: "" })
        fetchVouchers()
        setTimeout(() => setSuccessMessage(""), 5000)
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate vouchers", variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  const handleCancel = async (voucherId) => {
    if (!confirm("Are you sure you want to cancel this voucher?")) return
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tenant/vouchers/${voucherId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "cancel" }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Voucher cancelled" })
        fetchVouchers()
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel voucher", variant: "destructive" })
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    toast({ title: "Copied", description: "Voucher code copied to clipboard" })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "unused":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            unused
          </Badge>
        )
      case "redeemed":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Clock className="w-3 h-3 mr-1" />
            redeemed
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            expired
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            <X className="w-3 h-3 mr-1" />
            cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalCost = generateForm.amount * generateForm.quantity

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Vouchers</p>
            <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Unused</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.unused}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Redeemed</p>
            <p className="text-2xl font-bold text-blue-400">{stats.redeemed}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Expired</p>
            <p className="text-2xl font-bold text-orange-400">{stats.expired}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Redeemed Value</p>
            <p className="text-2xl font-bold text-yellow-400">${stats.redeemedValue?.toFixed(2) || "0.00"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by voucher code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background/50">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unused">Unused</SelectItem>
              <SelectItem value="redeemed">Redeemed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchVouchers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Generate Vouchers
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-yellow-400">Generate Vouchers</DialogTitle>
                <DialogDescription>Create prepaid vouchers for customers to redeem</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (USD)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={generateForm.amount}
                      onChange={(e) => setGenerateForm({ ...generateForm, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      value={generateForm.quantity}
                      onChange={(e) =>
                        setGenerateForm({ ...generateForm, quantity: Math.min(200, Number(e.target.value)) })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code Prefix</Label>
                    <Input
                      value={generateForm.prefix}
                      onChange={(e) => setGenerateForm({ ...generateForm, prefix: e.target.value.toUpperCase() })}
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid for (days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={generateForm.validDays}
                      onChange={(e) => setGenerateForm({ ...generateForm, validDays: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="e.g., Holiday promotion vouchers"
                    value={generateForm.description}
                    onChange={(e) => setGenerateForm({ ...generateForm, description: e.target.value })}
                  />
                </div>
                <div className="bg-muted/50 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Total Cost:</p>
                    <p className="text-xs text-muted-foreground">This will be deducted from tenant funds</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">${totalCost.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={generating} className="bg-primary hover:bg-primary/90">
                  <Ticket className="w-4 h-4 mr-2" />
                  {generating
                    ? "Generating..."
                    : `Generate ${generateForm.quantity} Voucher${generateForm.quantity > 1 ? "s" : ""}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vouchers Table */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">CODE</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">AMOUNT</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">STATUS</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">CREATED</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">EXPIRES</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">REDEEMED BY</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading vouchers...
                    </td>
                  </tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <Ticket className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No vouchers found</p>
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => setShowGenerateDialog(true)}
                      >
                        Generate Your First Voucher
                      </Button>
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => (
                    <tr key={voucher._id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-yellow-400">{voucher.code}</span>
                          <button
                            onClick={() => copyCode(voucher.code)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-medium">${voucher.amount?.toFixed(2)}</td>
                      <td className="p-4">{getStatusBadge(voucher.status)}</td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {new Date(voucher.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {new Date(voucher.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {voucher.redeemedBy ? (
                          <div className="text-sm">
                            <p>{voucher.redeemedBy.username || voucher.redeemedBy.fullName}</p>
                            <p className="text-xs text-muted-foreground">{voucher.redeemedBy.phone}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {voucher.status === "unused" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(voucher._id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
