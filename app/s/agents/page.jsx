"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Search,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Wallet,
  Shield,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    subAgents: 0,
    totalCommission: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState(null)
  const [tenants, setTenants] = useState([])
  const [collateralOpen, setCollateralOpen] = useState(false)
  const [collateralData, setCollateralData] = useState({
    collateralDeposit: 0,
    collateralRatio: 1.0,
    action: "set", // "set" or "add" or "deduct"
    amount: 0,
    reason: "",
  })
  const [collateralSubmitting, setCollateralSubmitting] = useState(false)
  const [successModal, setSuccessModal] = useState({ open: false, title: "", message: "", data: null, isError: false })
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "agent",
    tenant_id: "",
    commissionRate: 5,
    status: "active",
    collateralDeposit: 0,
    collateralRatio: 1.0,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAgents()
    fetchTenants()
  }, [])

  const fetchAgents = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/agents", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success || data.agents) {
        setAgents(data.agents || [])
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.tenants) {
        const mappedTenants = data.tenants.map((t) => ({
          ...t,
          _id: t._id || t.id,
        }))
        setTenants(mappedTenants)
      }
    } catch (error) {
      console.error("Failed to fetch tenants:", error)
    }
  }

  const formatCurrency = (amount) => {
    const rounded = Math.round((amount || 0) * 100) / 100
    if (rounded >= 1000000) {
      return `$${(rounded / 1000000).toFixed(1)}M`
    } else if (rounded >= 1000) {
      return `$${(rounded / 1000).toFixed(1)}K`
    }
    return `$${rounded.toFixed(2)}`
  }

  const handleViewAgent = (agent) => {
    setSelectedAgent(agent)
    setDetailsOpen(true)
  }

  const handleAddAgent = () => {
    setEditingAgent(null)
    setFormData({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      role: "agent",
      tenant_id: "",
      commissionRate: 5,
      status: "active",
      collateralDeposit: 0,
      collateralRatio: 1.0,
    })
    setDialogOpen(true)
  }

  const handleEditAgent = (agent) => {
    setEditingAgent(agent)
    setFormData({
      fullName: agent.fullName || "",
      username: agent.username || "",
      email: agent.email || "",
      phone: agent.phone || "",
      password: "",
      role: agent.role || "agent",
      tenant_id: agent.tenant_id || "",
      commissionRate: agent.commissionRate || 5,
      status: agent.status || "active",
      collateralDeposit: agent.collateralDeposit || 0,
      collateralRatio: agent.collateralRatio || 1.0,
    })
    setDetailsOpen(false)
    setDialogOpen(true)
  }

  const handleManageCollateral = (agent) => {
    setSelectedAgent(agent)
    setCollateralData({
      collateralDeposit: agent.collateralDeposit || 0,
      collateralRatio: agent.collateralRatio || 1.0,
      action: "set",
      amount: 0,
      reason: "",
    })
    setDetailsOpen(false)
    setCollateralOpen(true)
  }

  const handleCollateralSubmit = async () => {
    if (!selectedAgent) return

    try {
      setCollateralSubmitting(true)
      const token = getAuthToken()

      const res = await fetch(`/api/admin/agents/${selectedAgent._id}/collateral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(collateralData),
      })

      const data = await res.json()

      if (data.success) {
        setCollateralOpen(false)
        fetchAgents()
        setSuccessModal({
          open: true,
          title: "Collateral Updated",
          message: "Agent collateral has been updated successfully.",
          data: {
            agent: data.agent?.name || selectedAgent?.fullName,
            collateralDeposit: data.agent?.collateralDeposit || 0,
            creditLimit: data.agent?.creditLimit || 0,
            usedCredit: data.agent?.usedCredit || 0,
            availableCredit: data.agent?.availableCredit || 0,
          },
          isError: false,
        })
      } else {
        setSuccessModal({
          open: true,
          title: "Update Failed",
          message: data.error || "Failed to update collateral",
          data: null,
          isError: true,
        })
      }
    } catch (error) {
      console.error("Error updating collateral:", error)
      setSuccessModal({
        open: true,
        title: "Update Failed",
        message: "Failed to update collateral. Please try again.",
        data: null,
        isError: true,
      })
    } finally {
      setCollateralSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const token = getAuthToken()

      const url = editingAgent ? `/api/super/agents/${editingAgent._id}` : "/api/super/agents"
      const method = editingAgent ? "PUT" : "POST"

      const payload = { ...formData }
      if (editingAgent && !payload.password) {
        delete payload.password
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        setDialogOpen(false)
        fetchAgents()
      } else {
        alert(data.error || "Failed to save agent")
      }
    } catch (error) {
      console.error("Error saving agent:", error)
      alert("Failed to save agent")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAgent = async (agentId) => {
    if (!confirm("Are you sure you want to delete this agent?")) return

    try {
      const token = getAuthToken()
      const res = await fetch(`/api/super/agents/${agentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (data.success) {
        setDetailsOpen(false)
        fetchAgents()
      } else {
        alert(data.error || "Failed to delete agent")
      }
    } catch (error) {
      console.error("Error deleting agent:", error)
      alert("Failed to delete agent")
    }
  }

  const handleStatusToggle = async (agent) => {
    try {
      const token = getAuthToken()
      const newStatus = agent.status === "active" ? "suspended" : "active"

      const res = await fetch(`/api/super/agents/${agent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (data.success) {
        fetchAgents()
        if (selectedAgent && selectedAgent._id === agent._id) {
          setSelectedAgent({ ...selectedAgent, status: newStatus, isActive: newStatus === "active" })
        }
      } else {
        alert(data.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    }
  }

  const filteredAgents = agents.filter(
    (agent) =>
      agent.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.fullName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <SuperAdminLayout title="Agent Management" description="Manage agents and their hierarchies">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#FFD700]/20">
                <Users className="h-6 w-6 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Agents</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{stats.totalAgents}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Active Agents</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{stats.activeAgents}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Commission</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{formatCurrency(stats.totalCommission)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Sub-Agents</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{stats.subAgents}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
            />
          </div>
          <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]" onClick={handleAddAgent}>
            <Plus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        </div>

        {/* Agents Table */}
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">All Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-[#B8C5D6]">Loading agents...</div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-8 text-[#B8C5D6]">No agents found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2A3F55]">
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Agent</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Role</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Tenant</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Players</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Commission</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Credit Limit</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent) => (
                      <tr key={agent._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-[#F5F5F5] font-medium">{agent.fullName || agent.username}</p>
                            <p className="text-[#B8C5D6] text-sm">{agent.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              agent.role === "agent"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-purple-500/20 text-purple-400"
                            }
                          >
                            {agent.role === "agent" ? "Agent" : "Sub-Agent"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-[#B8C5D6]">
                          {agent.tenant?.brandName || agent.tenantName || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-[#F5F5F5]">{agent.playerCount || 0}</td>
                        <td className="py-3 px-4 text-[#FFD700]">{agent.commissionRate || 5}%</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-[#F5F5F5]">{formatCurrency(agent.creditLimit || 0)}</span>
                            {agent.creditLimit > 0 && (
                              <span className="text-xs text-[#B8C5D6]">
                                Used: {formatCurrency(agent.usedCredit || 0)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              agent.status === "active" || agent.isActive
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }
                          >
                            {agent.status || (agent.isActive ? "active" : "inactive")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#FFD700]"
                              onClick={() => handleViewAgent(agent)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-400"
                              onClick={() => handleManageCollateral(agent)}
                              title="Manage Collateral"
                            >
                              <Wallet className="w-4 h-4" />
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

      {/* Add/Edit Agent Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700] text-xl">
              {editingAgent ? "Edit Agent" : "Add New Agent"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Full Name *</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Username</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="johndoe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <label className="text-[#B8C5D6] text-sm mb-1 block">
                Password {editingAgent ? "(leave blank to keep current)" : "*"}
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-md px-3 py-2"
                >
                  <option value="agent">Agent</option>
                  <option value="sub_agent">Sub-Agent</option>
                </select>
              </div>
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-md px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Tenant *</label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  className="w-full bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-md px-3 py-2"
                >
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant, index) => (
                    <option key={tenant._id || `tenant-${index}`} value={tenant._id}>
                      {tenant.brandName || tenant.businessName || tenant.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Commission Rate (%)</label>
                <Input
                  type="number"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: Number.parseFloat(e.target.value) })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            <div className="border-t border-[#2A3F55] pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-[#FFD700]" />
                <h3 className="text-[#FFD700] font-medium">Collateral Settings</h3>
              </div>
              <p className="text-[#B8C5D6] text-xs mb-3">Agent credit limit = Collateral Deposit × Collateral Ratio</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[#B8C5D6] text-sm mb-1 block">Collateral Deposit ($)</label>
                  <Input
                    type="number"
                    value={formData.collateralDeposit}
                    onChange={(e) =>
                      setFormData({ ...formData, collateralDeposit: Number.parseFloat(e.target.value) || 0 })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    placeholder="0.00"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="text-[#B8C5D6] text-sm mb-1 block">Collateral Ratio (x)</label>
                  <Input
                    type="number"
                    value={formData.collateralRatio}
                    onChange={(e) =>
                      setFormData({ ...formData, collateralRatio: Number.parseFloat(e.target.value) || 1.0 })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    placeholder="1.0"
                    min="0.1"
                    max="10"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="mt-2 p-2 bg-[#1A2F45] rounded-lg">
                <p className="text-[#B8C5D6] text-sm">
                  Credit Limit:{" "}
                  <span className="text-[#FFD700] font-bold">
                    {formatCurrency((formData.collateralDeposit || 0) * (formData.collateralRatio || 1))}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#2A3F55]">
              <Button
                variant="outline"
                className="flex-1 border-[#2A3F55] text-[#B8C5D6] hover:bg-[#1A2F45] bg-transparent"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving..." : editingAgent ? "Update Agent" : "Create Agent"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Agent Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAgent ? (
            <div className="space-y-6">
              <DialogTitle className="text-2xl font-bold text-[#F5F5F5]">Agent Details</DialogTitle>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Full Name</p>
                  <p className="text-[#F5F5F5] font-medium">{selectedAgent.fullName || selectedAgent.username}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Email</p>
                  <p className="text-[#F5F5F5] font-medium">{selectedAgent.email}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Phone</p>
                  <p className="text-[#F5F5F5] font-medium">{selectedAgent.phone || "N/A"}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Username</p>
                  <p className="text-[#F5F5F5] font-medium">
                    {selectedAgent.username || selectedAgent.email?.split("@")[0] || "N/A"}
                  </p>
                </div>
              </div>

              {/* Role & Tenant */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Role</p>
                  <Badge
                    className={
                      selectedAgent.role === "agent"
                        ? "bg-blue-500/20 text-blue-400 mt-1"
                        : "bg-purple-500/20 text-purple-400 mt-1"
                    }
                  >
                    {selectedAgent.role === "agent" ? "Agent" : "Sub-Agent"}
                  </Badge>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Status</p>
                  <Badge
                    className={
                      selectedAgent.status === "active" || selectedAgent.isActive
                        ? "bg-green-500/20 text-green-400 mt-1"
                        : "bg-red-500/20 text-red-400 mt-1"
                    }
                  >
                    {selectedAgent.status || (selectedAgent.isActive ? "active" : "inactive")}
                  </Badge>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Tenant</p>
                  <p className="text-[#F5F5F5] font-medium">
                    {selectedAgent.tenant?.brandName || selectedAgent.tenantName || "N/A"}
                  </p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Tenant Domain</p>
                  <p className="text-[#F5F5F5] font-medium">
                    {selectedAgent.tenantDomain && selectedAgent.tenantDomain !== "-"
                      ? selectedAgent.tenantDomain
                      : selectedAgent.tenant?.brandName || "Not Set"}
                  </p>
                </div>
              </div>

              {/* Commission & Players */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Commission Rate</p>
                  <p className="text-[#FFD700] text-xl font-bold">{selectedAgent.commissionRate || 5}%</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Earned Commission</p>
                  <p className="text-green-400 text-xl font-bold">
                    {formatCurrency(selectedAgent.earnedCommission || 0)}
                  </p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Players</p>
                  <p className="text-[#F5F5F5] text-xl font-bold">{selectedAgent.playerCount || 0}</p>
                </div>
              </div>

              <div className="border-t border-[#2A3F55] pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-[#FFD700]" />
                  <h3 className="text-[#FFD700] font-medium">Collateral & Credit</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1A2F45] p-4 rounded-lg">
                    <p className="text-[#B8C5D6] text-sm">Collateral Deposit</p>
                    <p className="text-green-400 text-xl font-bold">
                      {formatCurrency(selectedAgent.collateralDeposit || 0)}
                    </p>
                  </div>
                  <div className="bg-[#1A2F45] p-4 rounded-lg">
                    <p className="text-[#B8C5D6] text-sm">Collateral Ratio</p>
                    <p className="text-[#F5F5F5] text-xl font-bold">{selectedAgent.collateralRatio || 1.0}x</p>
                  </div>
                  <div className="bg-[#1A2F45] p-4 rounded-lg">
                    <p className="text-[#B8C5D6] text-sm">Credit Limit</p>
                    <p className="text-[#FFD700] text-xl font-bold">{formatCurrency(selectedAgent.creditLimit || 0)}</p>
                  </div>
                  <div className="bg-[#1A2F45] p-4 rounded-lg">
                    <p className="text-[#B8C5D6] text-sm">Used Credit</p>
                    <p className="text-orange-400 text-xl font-bold">{formatCurrency(selectedAgent.usedCredit || 0)}</p>
                    {selectedAgent.creditLimit > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-[#2A3F55] rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              ((selectedAgent.usedCredit || 0) / selectedAgent.creditLimit) > 0.8
                                ? "bg-red-500"
                                : (selectedAgent.usedCredit || 0) / selectedAgent.creditLimit > 0.5
                                  ? "bg-orange-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(100, ((selectedAgent.usedCredit || 0) / selectedAgent.creditLimit) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-[#B8C5D6] mt-1">
                          {Math.round(((selectedAgent.usedCredit || 0) / selectedAgent.creditLimit) * 100)}% utilized
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 p-3 bg-[#1A2F45] rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">
                    Available Credit:{" "}
                    <span className="text-green-400 font-bold">
                      {formatCurrency((selectedAgent.creditLimit || 0) - (selectedAgent.usedCredit || 0))}
                    </span>
                  </p>
                </div>
              </div>

              {/* Balance & Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Current Balance</p>
                  <p className="text-[#F5F5F5] text-xl font-bold">{formatCurrency(selectedAgent.balance || 0)}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-[#B8C5D6] text-sm">Joined</p>
                  <p className="text-[#F5F5F5] font-medium">
                    {selectedAgent.createdAt
                      ? new Date(selectedAgent.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-[#2A3F55]">
                <Button
                  variant="outline"
                  className="flex-1 min-w-[120px] border-[#2A3F55] text-[#B8C5D6] hover:bg-[#1A2F45] bg-transparent"
                  onClick={() => setDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleManageCollateral(selectedAgent)}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Manage Collateral
                </Button>
                <Button
                  className="flex-1 min-w-[120px] bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                  onClick={() => handleEditAgent(selectedAgent)}
                >
                  Edit Agent
                </Button>
                <Button
                  variant="outline"
                  className={
                    selectedAgent.status === "active" || selectedAgent.isActive
                      ? "flex-1 min-w-[120px] border-red-500/50 text-red-400 hover:bg-red-500/10"
                      : "flex-1 min-w-[120px] border-green-500/50 text-green-400 hover:bg-green-500/10"
                  }
                  onClick={() => handleStatusToggle(selectedAgent)}
                >
                  {selectedAgent.status === "active" || selectedAgent.isActive ? "Suspend" : "Activate"}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                  onClick={() => handleDeleteAgent(selectedAgent._id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={collateralOpen} onOpenChange={setCollateralOpen}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700] text-xl flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Manage Collateral
            </DialogTitle>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4">
              {/* Agent Info */}
              <div className="bg-[#1A2F45] p-4 rounded-lg">
                <p className="text-[#B8C5D6] text-sm">Agent</p>
                <p className="text-[#F5F5F5] font-medium">{selectedAgent.fullName || selectedAgent.username}</p>
                <p className="text-[#B8C5D6] text-xs">{selectedAgent.email}</p>
              </div>

              {/* Current Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1A2F45] p-3 rounded-lg text-center">
                  <p className="text-[#B8C5D6] text-xs">Current Collateral</p>
                  <p className="text-green-400 font-bold">{formatCurrency(selectedAgent.collateralDeposit || 0)}</p>
                </div>
                <div className="bg-[#1A2F45] p-3 rounded-lg text-center">
                  <p className="text-[#B8C5D6] text-xs">Credit Limit</p>
                  <p className="text-[#FFD700] font-bold">{formatCurrency(selectedAgent.creditLimit || 0)}</p>
                </div>
                <div className="bg-[#1A2F45] p-3 rounded-lg text-center">
                  <p className="text-[#B8C5D6] text-xs">Used Credit</p>
                  <p className="text-orange-400 font-bold">{formatCurrency(selectedAgent.usedCredit || 0)}</p>
                </div>
              </div>

              {/* Warning if used credit */}
              {(selectedAgent.usedCredit || 0) > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <p className="text-orange-400 text-sm">
                    Agent has outstanding credit. Reducing collateral below used credit will affect operations.
                  </p>
                </div>
              )}

              {/* Action Selection */}
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Action</label>
                <select
                  value={collateralData.action}
                  onChange={(e) => setCollateralData({ ...collateralData, action: e.target.value })}
                  className="w-full bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-md px-3 py-2"
                >
                  <option value="set">Set New Collateral Amount</option>
                  <option value="add">Add to Collateral</option>
                  <option value="deduct">Deduct from Collateral</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">
                  {collateralData.action === "set" ? "New Collateral Amount ($)" : "Amount ($)"}
                </label>
                <Input
                  type="number"
                  value={collateralData.action === "set" ? collateralData.collateralDeposit : collateralData.amount}
                  onChange={(e) => {
                    const value = Number.parseFloat(e.target.value) || 0
                    if (collateralData.action === "set") {
                      setCollateralData({ ...collateralData, collateralDeposit: value })
                    } else {
                      setCollateralData({ ...collateralData, amount: value })
                    }
                  }}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="0.00"
                  min="0"
                  step="100"
                />
              </div>

              {/* Ratio */}
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Collateral Ratio (x)</label>
                <Input
                  type="number"
                  value={collateralData.collateralRatio}
                  onChange={(e) =>
                    setCollateralData({ ...collateralData, collateralRatio: Number.parseFloat(e.target.value) || 1.0 })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="1.0"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
                <p className="text-[#B8C5D6] text-xs mt-1">Credit Limit = Collateral × Ratio</p>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[#B8C5D6] text-sm mb-1 block">Reason (Optional)</label>
                <Input
                  value={collateralData.reason}
                  onChange={(e) => setCollateralData({ ...collateralData, reason: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="Initial deposit, top-up, etc."
                />
              </div>

              {/* New Credit Limit Preview */}
              <div className="bg-[#1A2F45] p-4 rounded-lg">
                <p className="text-[#B8C5D6] text-sm">New Credit Limit will be:</p>
                <p className="text-[#FFD700] text-2xl font-bold">
                  {formatCurrency(
                    (() => {
                      let newCollateral = selectedAgent.collateralDeposit || 0
                      if (collateralData.action === "set") {
                        newCollateral = collateralData.collateralDeposit
                      } else if (collateralData.action === "add") {
                        newCollateral += collateralData.amount
                      } else if (collateralData.action === "deduct") {
                        newCollateral = Math.max(0, newCollateral - collateralData.amount)
                      }
                      return newCollateral * collateralData.collateralRatio
                    })(),
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#2A3F55]">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2A3F55] text-[#B8C5D6] hover:bg-[#1A2F45] bg-transparent"
                  onClick={() => setCollateralOpen(false)}
                  disabled={collateralSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                  onClick={handleCollateralSubmit}
                  disabled={collateralSubmitting}
                >
                  {collateralSubmitting ? "Updating..." : "Update Collateral"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={successModal.open} onOpenChange={(open) => setSuccessModal({ ...successModal, open })}>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-900">
          <div className="flex flex-col items-center py-4">
            {successModal.isError ? (
              <div className="mb-4 rounded-full bg-red-500/20 p-3">
                <X className="h-8 w-8 text-red-500" />
              </div>
            ) : (
              <div className="mb-4 rounded-full bg-green-500/20 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            )}
            <DialogTitle className={`text-xl font-bold ${successModal.isError ? "text-red-500" : "text-white"}`}>
              {successModal.title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-center text-zinc-400">{successModal.message}</DialogDescription>

            {successModal.data && !successModal.isError && (
              <div className="mt-6 w-full space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Agent</span>
                  <span className="font-medium text-white">{successModal.data.agent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Collateral Deposit</span>
                  <span className="font-medium text-green-400">
                    {formatCurrency(successModal.data.collateralDeposit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">New Credit Limit</span>
                  <span className="font-medium text-yellow-400">{formatCurrency(successModal.data.creditLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Used Credit</span>
                  <span className="font-medium text-orange-400">{formatCurrency(successModal.data.usedCredit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Available Credit</span>
                  <span className="font-medium text-emerald-400">
                    {formatCurrency(successModal.data.availableCredit)}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={() => setSuccessModal({ ...successModal, open: false })}
              className={`mt-6 w-full ${successModal.isError ? "bg-red-600 hover:bg-red-700" : "bg-yellow-500 hover:bg-yellow-600"} text-black`}
            >
              {successModal.isError ? "Try Again" : "Done"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}
