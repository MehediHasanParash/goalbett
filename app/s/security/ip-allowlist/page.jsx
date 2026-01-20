"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Clock,
  Activity,
  Copy,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function IPAllowlistPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState([])
  const [clientIP, setClientIP] = useState("")
  const [isClientAllowed, setIsClientAllowed] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [newEntry, setNewEntry] = useState({
    ip: "",
    label: "",
    notes: "",
    expiresAt: "",
  })

  useEffect(() => {
    fetchIPAllowlist()
  }, [])

  const fetchIPAllowlist = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const res = await fetch("/api/super/ip-allowlist", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setEntries(data.entries || [])
        setClientIP(data.clientIP || "")
        setIsClientAllowed(data.isAllowed)
      }
    } catch (error) {
      setError("Failed to fetch IP allowlist")
    } finally {
      setLoading(false)
    }
  }

  const addIP = async () => {
    if (!newEntry.ip || !newEntry.label) {
      setError("IP address and label are required")
      return
    }

    try {
      setSaving(true)
      setError("")
      const token = localStorage.getItem("token")
      const res = await fetch("/api/super/ip-allowlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEntry),
      })
      const data = await res.json()

      if (data.success) {
        setSuccess("IP added successfully")
        setShowAddDialog(false)
        setNewEntry({ ip: "", label: "", notes: "", expiresAt: "" })
        fetchIPAllowlist()
      } else {
        setError(data.error || "Failed to add IP")
      }
    } catch (error) {
      setError("Failed to add IP")
    } finally {
      setSaving(false)
    }
  }

  const toggleIP = async (entry) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/super/ip-allowlist", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: entry._id, isActive: !entry.isActive }),
      })
      const data = await res.json()

      if (data.success) {
        fetchIPAllowlist()
      }
    } catch (error) {
      setError("Failed to update IP")
    }
  }

  const deleteIP = async () => {
    if (!selectedEntry) return

    try {
      setSaving(true)
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/super/ip-allowlist?id=${selectedEntry._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setSuccess("IP removed successfully")
        setShowDeleteDialog(false)
        setSelectedEntry(null)
        fetchIPAllowlist()
      } else {
        setError(data.error || "Failed to delete IP")
      }
    } catch (error) {
      setError("Failed to delete IP")
    } finally {
      setSaving(false)
    }
  }

  const addCurrentIP = () => {
    setNewEntry({
      ip: clientIP,
      label: "My Current IP",
      notes: "Added automatically",
      expiresAt: "",
    })
    setShowAddDialog(true)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess("Copied to clipboard!")
    setTimeout(() => setSuccess(""), 2000)
  }

  const formatDate = (date) => {
    if (!date) return "Never"
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <SuperAdminLayout title="IP Allowlist" description="Manage allowed IP addresses">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-[#FFD700] animate-spin" />
        </div>
      </SuperAdminLayout>
    )
  }

  return (
    <SuperAdminLayout title="IP Allowlist" description="Manage allowed IP addresses for Super Admin access">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-[#B8C5D6] hover:text-[#F5F5F5]"
          onClick={() => router.push("/s/security")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Security
        </Button>

        {/* Status Messages */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* Current IP Info */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#1A2F45] rounded-lg">
                  <Globe className="w-6 h-6 text-[#FFD700]" />
                </div>
                <div>
                  <div className="text-sm text-[#B8C5D6]">Your Current IP Address</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono text-[#F5F5F5]">{clientIP}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#B8C5D6]"
                      onClick={() => copyToClipboard(clientIP)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    isClientAllowed
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  {isClientAllowed ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" /> Allowed
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" /> Not in List
                    </>
                  )}
                </Badge>
                {!isClientAllowed && (
                  <Button size="sm" className="bg-[#FFD700] hover:bg-[#E5C200] text-black" onClick={addCurrentIP}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add My IP
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#FFD700]" />
              <CardTitle className="text-[#F5F5F5]">How IP Allowlisting Works</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-[#B8C5D6] space-y-2">
              <li>• Only IP addresses in this list can access the Super Admin panel</li>
              <li>• If the list is empty, all IPs are allowed (for initial setup)</li>
              <li>• Localhost (127.0.0.1) is always allowed for development</li>
              <li>• CIDR notation is supported (e.g., 192.168.1.0/24)</li>
              <li>• You can set expiration dates for temporary access</li>
            </ul>
          </CardContent>
        </Card>

        {/* IP Allowlist Table */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#F5F5F5]">Allowed IP Addresses</CardTitle>
                <CardDescription className="text-[#B8C5D6]">
                  {entries.filter((e) => e.isActive).length} active of {entries.length} total
                </CardDescription>
              </div>
              <Button className="bg-[#FFD700] hover:bg-[#E5C200] text-black" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add IP
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-[#2A3F55] mx-auto mb-4" />
                <h3 className="text-[#F5F5F5] font-medium mb-2">No IP Restrictions</h3>
                <p className="text-[#B8C5D6] text-sm mb-4">
                  All IP addresses can currently access the Super Admin panel
                </p>
                <Button className="bg-[#FFD700] hover:bg-[#E5C200] text-black" onClick={addCurrentIP}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your Current IP
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A3F55]">
                      <TableHead className="text-[#B8C5D6]">Status</TableHead>
                      <TableHead className="text-[#B8C5D6]">IP Address</TableHead>
                      <TableHead className="text-[#B8C5D6]">Label</TableHead>
                      <TableHead className="text-[#B8C5D6]">Type</TableHead>
                      <TableHead className="text-[#B8C5D6]">Last Access</TableHead>
                      <TableHead className="text-[#B8C5D6]">Expires</TableHead>
                      <TableHead className="text-[#B8C5D6]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry._id} className="border-[#2A3F55]">
                        <TableCell>
                          <Switch checked={entry.isActive} onCheckedChange={() => toggleIP(entry)} />
                        </TableCell>
                        <TableCell className="font-mono text-[#F5F5F5]">
                          <div className="flex items-center gap-2">
                            {entry.ip}
                            {entry.ip === clientIP && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">You</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[#F5F5F5]">{entry.label}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#2A3F55] text-[#B8C5D6]">
                            {entry.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#B8C5D6] text-sm">
                          {entry.lastAccessedAt ? (
                            <div className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {formatDate(entry.lastAccessedAt)}
                            </div>
                          ) : (
                            "Never"
                          )}
                        </TableCell>
                        <TableCell className="text-[#B8C5D6] text-sm">
                          {entry.expiresAt ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(entry.expiresAt)}
                            </div>
                          ) : (
                            "Never"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => {
                              setSelectedEntry(entry)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add IP Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
            <DialogHeader>
              <DialogTitle>Add IP to Allowlist</DialogTitle>
              <DialogDescription className="text-[#B8C5D6]">
                Add a new IP address that can access the Super Admin panel
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">IP Address *</Label>
                <Input
                  placeholder="e.g., 192.168.1.1 or 192.168.1.0/24"
                  value={newEntry.ip}
                  onChange={(e) => setNewEntry({ ...newEntry, ip: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Label *</Label>
                <Input
                  placeholder="e.g., Office Network, Home IP"
                  value={newEntry.label}
                  onChange={(e) => setNewEntry({ ...newEntry, label: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Notes (optional)</Label>
                <Input
                  placeholder="Additional notes..."
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Expires At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newEntry.expiresAt}
                  onChange={(e) => setNewEntry({ ...newEntry, expiresAt: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-[#2A3F55] text-[#F5F5F5] bg-transparent"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button className="bg-[#FFD700] hover:bg-[#E5C200] text-black" onClick={addIP} disabled={saving}>
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Add IP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
            <DialogHeader>
              <DialogTitle>Remove IP from Allowlist</DialogTitle>
              <DialogDescription className="text-[#B8C5D6]">
                Are you sure you want to remove this IP address?
              </DialogDescription>
            </DialogHeader>
            {selectedEntry && (
              <div className="p-4 bg-[#1A2F45] rounded-lg">
                <div className="font-mono text-lg">{selectedEntry.ip}</div>
                <div className="text-sm text-[#B8C5D6]">{selectedEntry.label}</div>
              </div>
            )}
            {selectedEntry?.ip === clientIP && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  Warning: This is your current IP. Removing it may lock you out!
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                className="border-[#2A3F55] text-[#F5F5F5] bg-transparent"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteIP} disabled={saving}>
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Remove IP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}

