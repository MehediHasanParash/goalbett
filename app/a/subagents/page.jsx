"use client"
import { useState, useEffect } from "react"
import AgentSidebar from "@/components/agent/agent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, DollarSign, TrendingUp, Edit, Trash2, Eye } from "lucide-react"
import { getAuthToken, parseToken } from "@/lib/auth-service"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { InviteLinkCard } from "@/components/agent/invite-link-card"

export default function SubAgentsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeView, setActiveView] = useState("list")
  const [subAgents, setSubAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    commissionRate: "5",
  })

  const [selectedSubAgent, setSelectedSubAgent] = useState(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({})

  useEffect(() => {
    const token = getAuthToken()
    console.log("[v0] Sub-agents page - checking auth token")
    console.log("[v0] Token value:", token)

    if (!token || token === "null" || token === null) {
      console.log("[v0] Sub-agents page - no valid token, redirecting to login")
      alert("Please login as an Agent first")
      router.push("/a/login")
      return
    }

    const userData = parseToken(token)
    console.log("[v0] Sub-agents page - parsed user data:", userData)

    if (!userData || userData.role !== "agent") {
      console.log("[v0] Sub-agents page - invalid role:", userData?.role)
      alert("You must be logged in as an Agent to access this page")
      router.push("/a/login")
      return
    }

    // Only fetch sub-agents if we have valid token
    fetchSubAgents()
  }, [router])

  const calculateStats = (subAgentsList) => {
    const activeToday = subAgentsList.filter((sa) => {
      // Check if sub-agent was active today (created today or has recent activity)
      const today = new Date()
      const createdDate = new Date(sa.createdAt)
      return createdDate.toDateString() === today.toDateString() || sa.isActive
    }).length

    // TODO: Calculate real sales and commission from transactions
    const totalSales = 0
    const totalCommission = 0

    return { activeToday, totalSales, totalCommission }
  }

  const fetchSubAgents = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()

      const response = await fetch("/api/users/subagents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const text = await response.text()
        if (!text || text.trim() === "") {
          console.log("[v0] Empty response from sub-agents API")
          setSubAgents([])
          return
        }

        const data = JSON.parse(text)
        console.log("[v0] Fetched sub-agents:", data)
        setSubAgents(data.subAgents || [])
      } else {
        console.error("[v0] Failed to fetch sub-agents:", response.status)
        throw new Error("Failed to fetch sub-agents")
      }
    } catch (error) {
      console.error("[v0] Error fetching sub-agents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch sub-agents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const stats = calculateStats(subAgents)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = getAuthToken()
      console.log("[v0] Creating sub-agent with token")

      const response = await fetch("/api/users/subagents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("[v0] Create sub-agent response:", response.status, data)

      if (response.ok) {
        alert(`Sub-agent ${formData.name} created successfully!`)
        setIsAddDialogOpen(false)
        setFormData({ name: "", email: "", password: "", phone: "", location: "", commissionRate: "5" })
        fetchSubAgents()
      } else {
        alert(data.error || "Failed to create sub-agent")
      }
    } catch (error) {
      console.error("[v0] Error creating sub-agent:", error)
      alert("Error creating sub-agent")
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (subAgentId) => {
    try {
      console.log("[v0] handleView - Fetching sub-agent:", subAgentId)
      const token = getAuthToken()
      console.log("[v0] handleView - Token exists?", !!token)

      const response = await fetch(`/api/users/subagents/${subAgentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("[v0] handleView - Response status:", response.status)
      console.log("[v0] handleView - Response ok?", response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] handleView - Received data:", data)
        setSelectedSubAgent(data.subAgent)
        setIsViewDialogOpen(true)
      } else {
        const errorData = await response.json()
        console.log("[v0] handleView - Error:", errorData)
        alert(errorData.error || "Failed to fetch sub-agent details")
      }
    } catch (error) {
      console.error("[v0] Error fetching sub-agent:", error)
      alert("Error fetching sub-agent details")
    }
  }

  const handleEdit = (subAgent) => {
    setEditFormData({
      id: subAgent._id,
      fullName: subAgent.fullName || "",
      email: subAgent.email || "",
      phone: subAgent.phone || "",
      location: subAgent.location || "",
      commissionRate: subAgent.commissionRate || 5,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] handleUpdateSubmit - Updating sub-agent:", editFormData.id)
      console.log("[v0] handleUpdateSubmit - Data:", editFormData)

      const token = getAuthToken()
      const response = await fetch(`/api/users/subagents/${editFormData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      })

      console.log("[v0] handleUpdateSubmit - Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] handleUpdateSubmit - Success:", data)
        alert("Sub-agent updated successfully!")
        setIsEditDialogOpen(false)
        fetchSubAgents()
      } else {
        const data = await response.json()
        console.log("[v0] handleUpdateSubmit - Error:", data)
        alert(data.error || "Failed to update sub-agent")
      }
    } catch (error) {
      console.error("[v0] Error updating sub-agent:", error)
      alert("Error updating sub-agent")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (subAgentId, subAgentName) => {
    if (!confirm(`Are you sure you want to delete ${subAgentName}? This action cannot be undone.`)) {
      return
    }

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/users/subagents/${subAgentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        alert("Sub-agent deleted successfully!")
        fetchSubAgents()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete sub-agent")
      }
    } catch (error) {
      console.error("[v0] Error deleting sub-agent:", error)
      alert("Error deleting sub-agent")
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0A1A2F] to-[#1A2F45]">
      <AgentSidebar />

      <div className="flex-1 md:ml-64">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#FFD700]">Sub-Agent Management</h1>
            <p className="text-[#B8C5D6] mt-2">Recruit, manage, and track your sub-agent network</p>
          </div>

          {/* Invite Link Card */}
          <div className="mb-8">
            <InviteLinkCard />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {[
              { title: "Total Sub-Agents", value: subAgents.length.toString(), icon: Users, color: "bg-blue-500" },
              {
                title: "Active Today",
                value: stats.activeToday.toString(),
                icon: TrendingUp,
                color: "bg-green-500",
              },
              {
                title: "Total Sales",
                value: `$${stats.totalSales.toFixed(2)}`,
                icon: DollarSign,
                color: "bg-[#FFD700]",
              },
              {
                title: "Total Commission",
                value: `$${stats.totalCommission.toFixed(2)}`,
                icon: DollarSign,
                color: "bg-purple-500",
              },
            ].map((stat, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[#F5F5F5] text-xs sm:text-sm font-medium truncate">{stat.title}</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${stat.color} flex items-center justify-center flex-shrink-0 ml-2`}
                    >
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-[#FFD700]" />
                Sub-Agents Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subAgents.map((agent) => (
                  <div
                    key={agent._id}
                    className="p-4 bg-[#0A1A2F]/50 rounded-lg border border-[#FFD700]/20 hover:border-[#FFD700]/50 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center relative flex-shrink-0">
                          <span className="text-sm font-bold text-[#0A1A2F]">
                            {(agent.fullName || agent.name || "NA")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0A1A2F]"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white truncate">
                              {agent.fullName || agent.name || "Unknown Agent"}
                            </h3>
                            <Badge variant="default" className="bg-green-500 text-white text-xs">
                              active
                            </Badge>
                          </div>
                          <p className="text-xs text-[#F5F5F5]/70">{agent._id}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                            <div>
                              <p className="text-[#F5F5F5]/50">Email</p>
                              <p className="text-white truncate">{agent.email}</p>
                            </div>
                            <div>
                              <p className="text-[#F5F5F5]/50">Location</p>
                              <p className="text-white">{agent.location || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[#F5F5F5]/50">Commission</p>
                              <p className="text-[#FFD700] font-semibold">{agent.commissionRate || 0}%</p>
                            </div>
                            <div>
                              <p className="text-[#F5F5F5]/50">Phone</p>
                              <p className="text-white">{agent.phone || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#FFD700] text-[#FFD700] bg-transparent"
                          onClick={() => handleView(agent._id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500 text-blue-500 bg-transparent"
                          onClick={() => handleEdit(agent)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(agent._id, agent.fullName || agent.name)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-[#0A1A2F] border-[#FFD700]/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Sub-Agent Details</DialogTitle>
            </DialogHeader>
            {selectedSubAgent && (
              <div className="space-y-4">
                <div>
                  <Label className="text-[#F5F5F5]">Full Name</Label>
                  <p className="text-white mt-1">{selectedSubAgent.fullName}</p>
                </div>
                <div>
                  <Label className="text-[#F5F5F5]">Email</Label>
                  <p className="text-white mt-1">{selectedSubAgent.email}</p>
                </div>
                <div>
                  <Label className="text-[#F5F5F5]">Phone</Label>
                  <p className="text-white mt-1">{selectedSubAgent.phone}</p>
                </div>
                <div>
                  <Label className="text-[#F5F5F5]">Location</Label>
                  <p className="text-white mt-1">{selectedSubAgent.location || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-[#F5F5F5]">Commission Rate</Label>
                  <p className="text-[#FFD700] mt-1 font-semibold">{selectedSubAgent.commissionRate}%</p>
                </div>
                <div>
                  <Label className="text-[#F5F5F5]">Status</Label>
                  <Badge className="mt-1 bg-green-500">{selectedSubAgent.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </div>
            )}
            <Button onClick={() => setIsViewDialogOpen(false)} className="bg-[#FFD700] text-[#0A1A2F]">
              Close
            </Button>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-[#0A1A2F] border-[#FFD700]/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Edit Sub-Agent</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-[#F5F5F5]">
                  Full Name
                </Label>
                <Input
                  id="edit-name"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="bg-white/5 border-[#FFD700]/30 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-[#F5F5F5]">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="bg-white/5 border-[#FFD700]/30 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-phone" className="text-[#F5F5F5]">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="bg-white/5 border-[#FFD700]/30 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-location" className="text-[#F5F5F5]">
                  Location
                </Label>
                <Input
                  id="edit-location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="bg-white/5 border-[#FFD700]/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-commission" className="text-[#F5F5F5]">
                  Commission Rate (%)
                </Label>
                <Input
                  id="edit-commission"
                  type="number"
                  min="1"
                  max="20"
                  value={editFormData.commissionRate}
                  onChange={(e) => setEditFormData({ ...editFormData, commissionRate: e.target.value })}
                  className="bg-white/5 border-[#FFD700]/30 text-white"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1 border-[#FFD700]/30 text-[#F5F5F5]"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Sub-Agent"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
