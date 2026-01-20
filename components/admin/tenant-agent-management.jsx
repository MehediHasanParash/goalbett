"use client"

import { useState, useEffect } from "react"
import { Plus, Search, TrendingUp, Users, Shield, Eye, Pencil, Ban, Trash2, MoreHorizontal, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAuthToken } from "@/lib/auth-service"

export function TenantAgentManagement() {
  const [agents, setAgents] = useState([])
  const [admins, setAdmins] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false)
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("agents")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [agentFormData, setAgentFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    profitPercentage: 5,
    role: "agent",
  })

  const [adminFormData, setAdminFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    permissions: {
      financialControls: false,
      currencyLanguage: false,
      posMasking: false,
      matchRouting: false,
      agentControls: false,
    },
  })

  useEffect(() => {
    loadAgents()
    loadAdmins()
  }, [])

  const loadAgents = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()

      const response = await fetch("/api/users/agents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAgents(data.data || data.agents || [])
      } else {
        const error = await response.json()
        console.error("Failed to load agents:", error)
      }
    } catch (error) {
      console.error("Load agents error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAdmins = async () => {
    try {
      const token = getAuthToken()

      const response = await fetch("/api/users/admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins || [])
      } else {
        const error = await response.json()
        console.error("Failed to load admins:", error)
      }
    } catch (error) {
      console.error("Load admins error:", error)
    }
  }

  const handleAddAgent = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = getAuthToken()
      const response = await fetch("/api/users/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(agentFormData),
      })

      if (response.ok) {
        setIsAddAgentModalOpen(false)
        setAgentFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          profitPercentage: 5,
          role: "agent",
        })
        loadAgents()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create agent")
      }
    } catch (error) {
      console.error("Add agent error:", error)
      alert("Failed to create agent")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = getAuthToken()
      const response = await fetch("/api/users/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(adminFormData),
      })

      if (response.ok) {
        setIsAddAdminModalOpen(false)
        setAdminFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          permissions: {
            financialControls: false,
            currencyLanguage: false,
            posMasking: false,
            matchRouting: false,
            agentControls: false,
          },
        })
        loadAdmins()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create admin")
      }
    } catch (error) {
      console.error("Add admin error:", error)
      alert("Failed to create admin")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      (agent.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || agent.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      (admin.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const agentStats = {
    total: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    subAgents: agents.filter((a) => a.role === "sub_agent").length,
  }

  const handleViewAgent = (agent) => {
    setSelectedAgent(agent)
    setShowDetailsModal(true)
  }

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent)
    setEditFormData({
      fullName: agent.fullName || "",
      email: agent.email || "",
      phone: agent.phone || "",
      profitPercentage: agent.profitPercentage || 0,
      status: agent.status || "active",
    })
    setShowEditModal(true)
  }

  const handleUpdateAgent = async (e) => {
    e.preventDefault()
    if (!selectedAgent) return

    setIsSubmitting(true)
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/users/agents/${selectedAgent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedAgent(null)
        loadAgents()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update agent")
      }
    } catch (error) {
      console.error("Update agent error:", error)
      alert("Failed to update agent")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (agent) => {
    const newStatus = agent.status === "active" ? "suspended" : "active"

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/users/agents/${agent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, isActive: newStatus === "active" }),
      })

      if (response.ok) {
        loadAgents()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Toggle status error:", error)
      alert("Failed to update status")
    }
  }

  const handleDeleteAgent = async (agent) => {
    if (!confirm(`Are you sure you want to delete ${agent.fullName}? This action cannot be undone.`)) {
      return
    }

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/users/agents/${agent._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        loadAgents()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete agent")
      }
    } catch (error) {
      console.error("Delete agent error:", error)
      alert("Failed to delete agent")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Agent Management</h1>
          <p className="text-[#B8C5D6]">Manage your agents, sub-agents, and admins</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Agents</p>
                <p className="text-3xl font-bold text-[#FFD700] mt-2">{agentStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-[#FFD700]/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#FFD700]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Active Agents</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{agentStats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Sub-Agents</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{agentStats.subAgents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Admins</p>
                <p className="text-3xl font-bold text-purple-400 mt-2">{admins.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList className="bg-[#1A2F45] border border-[#2A3F55]">
            <TabsTrigger value="agents" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              Agents
            </TabsTrigger>
            <TabsTrigger
              value="subagents"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Sub-Agents
            </TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              Admins
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === "agents" && (
              <Dialog open={isAddAgentModalOpen} onOpenChange={setIsAddAgentModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Agent
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
                  <DialogHeader>
                    <DialogTitle className="text-[#FFD700]">Add New Agent</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddAgent} className="space-y-4">
                    <div>
                      <Label htmlFor="agent-name" className="text-[#B8C5D6]">
                        Full Name *
                      </Label>
                      <Input
                        id="agent-name"
                        value={agentFormData.name}
                        onChange={(e) => setAgentFormData({ ...agentFormData, name: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="agent-email" className="text-[#B8C5D6]">
                        Email *
                      </Label>
                      <Input
                        id="agent-email"
                        type="email"
                        value={agentFormData.email}
                        onChange={(e) => setAgentFormData({ ...agentFormData, email: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="agent-password" className="text-[#B8C5D6]">
                        Password *
                      </Label>
                      <Input
                        id="agent-password"
                        type="password"
                        value={agentFormData.password}
                        onChange={(e) => setAgentFormData({ ...agentFormData, password: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="agent-phone" className="text-[#B8C5D6]">
                        Phone
                      </Label>
                      <Input
                        id="agent-phone"
                        value={agentFormData.phone}
                        onChange={(e) => setAgentFormData({ ...agentFormData, phone: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="agent-profit" className="text-[#B8C5D6]">
                        Profit Percentage (%)
                      </Label>
                      <Input
                        id="agent-profit"
                        type="number"
                        min="0"
                        max="100"
                        value={agentFormData.profitPercentage}
                        onChange={(e) =>
                          setAgentFormData({ ...agentFormData, profitPercentage: Number(e.target.value) })
                        }
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddAgentModalOpen(false)}
                        className="border-[#2A3F55] text-[#B8C5D6]"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                      >
                        {isSubmitting ? "Creating..." : "Create Agent"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === "subagents" && (
              <Dialog open={isAddAgentModalOpen} onOpenChange={setIsAddAgentModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Sub-Agent
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
                  <DialogHeader>
                    <DialogTitle className="text-[#FFD700]">Add New Sub-Agent</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      setAgentFormData({ ...agentFormData, role: "sub_agent" })
                      handleAddAgent(e)
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="subagent-name" className="text-[#B8C5D6]">
                        Full Name *
                      </Label>
                      <Input
                        id="subagent-name"
                        value={agentFormData.name}
                        onChange={(e) =>
                          setAgentFormData({ ...agentFormData, name: e.target.value, role: "sub_agent" })
                        }
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="subagent-email" className="text-[#B8C5D6]">
                        Email *
                      </Label>
                      <Input
                        id="subagent-email"
                        type="email"
                        value={agentFormData.email}
                        onChange={(e) =>
                          setAgentFormData({ ...agentFormData, email: e.target.value, role: "sub_agent" })
                        }
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="subagent-password" className="text-[#B8C5D6]">
                        Password *
                      </Label>
                      <Input
                        id="subagent-password"
                        type="password"
                        value={agentFormData.password}
                        onChange={(e) =>
                          setAgentFormData({ ...agentFormData, password: e.target.value, role: "sub_agent" })
                        }
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="subagent-phone" className="text-[#B8C5D6]">
                        Phone
                      </Label>
                      <Input
                        id="subagent-phone"
                        value={agentFormData.phone}
                        onChange={(e) =>
                          setAgentFormData({ ...agentFormData, phone: e.target.value, role: "sub_agent" })
                        }
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subagent-profit" className="text-[#B8C5D6]">
                        Profit Percentage (%)
                      </Label>
                      <Input
                        id="subagent-profit"
                        type="number"
                        min="0"
                        max="100"
                        value={agentFormData.profitPercentage}
                        onChange={(e) =>
                          setAgentFormData({
                            ...agentFormData,
                            profitPercentage: Number(e.target.value),
                            role: "sub_agent",
                          })
                        }
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddAgentModalOpen(false)}
                        className="border-[#2A3F55] text-[#B8C5D6]"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                      >
                        {isSubmitting ? "Creating..." : "Create Sub-Agent"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === "admins" && (
              <Dialog open={isAddAdminModalOpen} onOpenChange={setIsAddAdminModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
                  <DialogHeader>
                    <DialogTitle className="text-[#FFD700]">Add New Admin</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="admin-name" className="text-[#B8C5D6]">
                        Full Name *
                      </Label>
                      <Input
                        id="admin-name"
                        value={adminFormData.name}
                        onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-email" className="text-[#B8C5D6]">
                        Email *
                      </Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={adminFormData.email}
                        onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-password" className="text-[#B8C5D6]">
                        Password *
                      </Label>
                      <Input
                        id="admin-password"
                        type="password"
                        value={adminFormData.password}
                        onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-phone" className="text-[#B8C5D6]">
                        Phone
                      </Label>
                      <Input
                        id="admin-phone"
                        value={adminFormData.phone}
                        onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddAdminModalOpen(false)}
                        className="border-[#2A3F55] text-[#B8C5D6]"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                      >
                        {isSubmitting ? "Creating..." : "Create Admin"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search */}
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B8C5D6] w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5] placeholder-[#B8C5D6] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Agent Details</DialogTitle>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] text-2xl font-bold">
                    {(selectedAgent.fullName || "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#F5F5F5]">{selectedAgent.fullName}</h3>
                    <Badge
                      className={
                        selectedAgent.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }
                    >
                      {selectedAgent.status || "active"}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2A3F55]">
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Email</p>
                    <p className="text-[#F5F5F5]">{selectedAgent.email}</p>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Phone</p>
                    <p className="text-[#F5F5F5]">{selectedAgent.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Role</p>
                    <p className="text-[#F5F5F5] capitalize">{selectedAgent.role?.replace("_", " ") || "Agent"}</p>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Profit Percentage</p>
                    <p className="text-[#FFD700] font-medium">{selectedAgent.profitPercentage || 0}%</p>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Balance</p>
                    <p className="text-[#F5F5F5]">${(selectedAgent.balance || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Commission Rate</p>
                    <p className="text-[#F5F5F5]">{selectedAgent.commissionRate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Created At</p>
                    <p className="text-[#F5F5F5]">
                      {selectedAgent.createdAt ? new Date(selectedAgent.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-sm">Last Login</p>
                    <p className="text-[#F5F5F5]">
                      {selectedAgent.lastLogin ? new Date(selectedAgent.lastLogin).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                    className="border-[#2A3F55] text-[#B8C5D6]"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false)
                      handleEditAgent(selectedAgent)
                    }}
                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                  >
                    Edit Agent
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Edit Agent</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateAgent} className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-[#B8C5D6]">
                  Full Name
                </Label>
                <Input
                  id="edit-name"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-[#B8C5D6]">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone" className="text-[#B8C5D6]">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label htmlFor="edit-profit" className="text-[#B8C5D6]">
                  Profit Percentage (%)
                </Label>
                <Input
                  id="edit-profit"
                  type="number"
                  min="0"
                  max="100"
                  value={editFormData.profitPercentage}
                  onChange={(e) => setEditFormData({ ...editFormData, profitPercentage: Number(e.target.value) })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label htmlFor="edit-status" className="text-[#B8C5D6]">
                  Status
                </Label>
                <select
                  id="edit-status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="border-[#2A3F55] text-[#B8C5D6]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8 text-[#B8C5D6]">Loading agents...</div>
              ) : filteredAgents.filter((a) => a.role === "agent").length === 0 ? (
                <div className="text-center py-8 text-[#B8C5D6]">
                  {agents.filter((a) => a.role === "agent").length === 0
                    ? "No agents yet. Add your first agent!"
                    : "No agents match your filters"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A3F55]">
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Agent</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Contact</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Profit %</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Balance</th>
                        <th className="text-right py-3 px-4 text-[#B8C5D6] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents
                        .filter((a) => a.role === "agent")
                        .map((agent) => (
                          <tr key={agent._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold">
                                  {(agent.fullName || "A").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-[#F5F5F5] font-medium">{agent.fullName}</p>
                                  <p className="text-[#B8C5D6] text-sm">Agent</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-[#F5F5F5] text-sm">{agent.email}</p>
                              <p className="text-[#B8C5D6] text-sm">{agent.phone || "N/A"}</p>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                className={
                                  agent.status === "active"
                                    ? "bg-green-500/20 text-green-400"
                                    : agent.status === "suspended"
                                      ? "bg-orange-500/20 text-orange-400"
                                      : "bg-red-500/20 text-red-400"
                                }
                              >
                                {agent.status || "active"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[#FFD700] font-medium">{agent.profitPercentage || 0}%</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[#F5F5F5]">${(agent.balance || 0).toFixed(2)}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-[#B8C5D6] hover:text-[#F5F5F5]">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0D1F35] border-[#2A3F55]">
                                  <DropdownMenuItem
                                    onClick={() => handleViewAgent(agent)}
                                    className="text-[#F5F5F5] hover:bg-[#1A2F45] cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditAgent(agent)}
                                    className="text-[#F5F5F5] hover:bg-[#1A2F45] cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[#2A3F55]" />
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(agent)}
                                    className={
                                      agent.status === "active"
                                        ? "text-orange-400 hover:bg-[#1A2F45] cursor-pointer"
                                        : "text-green-400 hover:bg-[#1A2F45] cursor-pointer"
                                    }
                                  >
                                    {agent.status === "active" ? (
                                      <>
                                        <Ban className="w-4 h-4 mr-2" />
                                        Suspend
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteAgent(agent)}
                                    className="text-red-400 hover:bg-[#1A2F45] cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

        {/* Sub-Agents Tab */}
        <TabsContent value="subagents">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8 text-[#B8C5D6]">Loading sub-agents...</div>
              ) : filteredAgents.filter((a) => a.role === "sub_agent").length === 0 ? (
                <div className="text-center py-8 text-[#B8C5D6]">
                  {agents.filter((a) => a.role === "sub_agent").length === 0
                    ? "No sub-agents yet. Add your first sub-agent!"
                    : "No sub-agents match your filters"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A3F55]">
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Sub-Agent</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Contact</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Profit %</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Balance</th>
                        <th className="text-right py-3 px-4 text-[#B8C5D6] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents
                        .filter((a) => a.role === "sub_agent")
                        .map((agent) => (
                          <tr key={agent._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                  {(agent.fullName || "S").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-[#F5F5F5] font-medium">{agent.fullName}</p>
                                  <p className="text-[#B8C5D6] text-sm">Sub-Agent</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-[#F5F5F5] text-sm">{agent.email}</p>
                              <p className="text-[#B8C5D6] text-sm">{agent.phone || "N/A"}</p>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                className={
                                  agent.status === "active"
                                    ? "bg-green-500/20 text-green-400"
                                    : agent.status === "suspended"
                                      ? "bg-orange-500/20 text-orange-400"
                                      : "bg-red-500/20 text-red-400"
                                }
                              >
                                {agent.status || "active"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[#FFD700] font-medium">{agent.profitPercentage || 0}%</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[#F5F5F5]">${(agent.balance || 0).toFixed(2)}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-[#B8C5D6] hover:text-[#F5F5F5]">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0D1F35] border-[#2A3F55]">
                                  <DropdownMenuItem
                                    onClick={() => handleViewAgent(agent)}
                                    className="text-[#F5F5F5] hover:bg-[#1A2F45] cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditAgent(agent)}
                                    className="text-[#F5F5F5] hover:bg-[#1A2F45] cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[#2A3F55]" />
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(agent)}
                                    className={
                                      agent.status === "active"
                                        ? "text-orange-400 hover:bg-[#1A2F45] cursor-pointer"
                                        : "text-green-400 hover:bg-[#1A2F45] cursor-pointer"
                                    }
                                  >
                                    {agent.status === "active" ? (
                                      <>
                                        <Ban className="w-4 h-4 mr-2" />
                                        Suspend
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteAgent(agent)}
                                    className="text-red-400 hover:bg-[#1A2F45] cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

        {/* Admins Tab */}
        <TabsContent value="admins">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="pt-6">
              {filteredAdmins.length === 0 ? (
                <div className="text-center py-8 text-[#B8C5D6]">
                  {admins.length === 0
                    ? "No additional admins yet. Add your first admin!"
                    : "No admins match your filters"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A3F55]">
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Admin</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Contact</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Role</th>
                        <th className="text-right py-3 px-4 text-[#B8C5D6] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.map((admin) => (
                        <tr key={admin._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                                {(admin.fullName || "A").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[#F5F5F5] font-medium">{admin.fullName}</p>
                                <p className="text-[#B8C5D6] text-sm">Admin</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-[#F5F5F5] text-sm">{admin.email}</p>
                            <p className="text-[#B8C5D6] text-sm">{admin.phone || "N/A"}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                admin.status === "active"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }
                            >
                              {admin.status || "active"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-purple-500/20 text-purple-400">{admin.role || "admin"}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-[#B8C5D6] hover:text-[#F5F5F5]">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#0D1F35] border-[#2A3F55]">
                                <DropdownMenuItem
                                  onClick={() => handleViewAgent(admin)}
                                  className="text-[#F5F5F5] hover:bg-[#1A2F45] cursor-pointer"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditAgent(admin)}
                                  className="text-[#F5F5F5] hover:bg-[#1A2F45] cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#2A3F55]" />
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(admin)}
                                  className={
                                    admin.status === "active"
                                      ? "text-orange-400 hover:bg-[#1A2F45] cursor-pointer"
                                      : "text-green-400 hover:bg-[#1A2F45] cursor-pointer"
                                  }
                                >
                                  {admin.status === "active" ? (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Suspend
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAgent(admin)}
                                  className="text-red-400 hover:bg-[#1A2F45] cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
      </Tabs>
    </div>
  )
}
