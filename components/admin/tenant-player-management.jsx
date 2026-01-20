"use client"

import { useState, useEffect } from "react"
import { Search, CheckCircle, Clock, AlertCircle, Eye, UserPlus, MoreHorizontal, Edit, Ban, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuthToken } from "@/lib/auth-service"

export function TenantPlayerManagement() {
  const [players, setPlayers] = useState([])
  const [stats, setStats] = useState({
    totalPlayers: 0,
    verifiedPlayers: 0,
    pendingKYC: 0,
    activePlayers: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterKYC, setFilterKYC] = useState("all")
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showKYCModal, setShowKYCModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    username: "",
    status: "active",
    balance: 0,
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    username: "",
  })

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()

      const response = await fetch("/api/users/players", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPlayers(data.data || [])
        setStats(
          data.stats || {
            totalPlayers: data.data?.length || 0,
            verifiedPlayers: 0,
            pendingKYC: 0,
            activePlayers: 0,
          },
        )
      } else {
        console.error("Failed to load players")
      }
    } catch (error) {
      console.error("Load players error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = getAuthToken()
      const response = await fetch("/api/users/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsAddPlayerOpen(false)
        setFormData({ name: "", email: "", password: "", phone: "", username: "" })
        loadPlayers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create player")
      }
    } catch (error) {
      console.error("Add player error:", error)
      alert("Failed to create player")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPlayer = (player) => {
    setEditingPlayer(player)
    setEditFormData({
      fullName: player.fullName || player.name || "",
      email: player.email || "",
      phone: player.phone || "",
      username: player.username || "",
      status: player.status || "active",
      balance: player.balance || 0,
    })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingPlayer) return
    setIsSubmitting(true)

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/users/players/${editingPlayer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        setIsEditOpen(false)
        setEditingPlayer(null)
        loadPlayers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update player")
      }
    } catch (error) {
      console.error("Edit player error:", error)
      alert("Failed to update player")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (player) => {
    const newStatus = player.status === "active" ? "suspended" : "active"
    if (!confirm(`Are you sure you want to ${newStatus === "suspended" ? "suspend" : "activate"} this player?`)) return

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/users/players/${player._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, isActive: newStatus === "active" }),
      })

      if (response.ok) {
        loadPlayers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update player status")
      }
    } catch (error) {
      console.error("Toggle status error:", error)
      alert("Failed to update player status")
    }
  }

  const handleDeletePlayer = async (player) => {
    if (!confirm(`Are you sure you want to delete ${player.fullName || player.name}? This action cannot be undone.`))
      return

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/users/players/${player._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        loadPlayers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete player")
      }
    } catch (error) {
      console.error("Delete player error:", error)
      alert("Failed to delete player")
    }
  }

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      (p.fullName || p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone || "").includes(searchTerm)
    const matchesStatus = filterStatus === "all" || p.status === filterStatus
    const matchesKYC = filterKYC === "all" || p.kyc_status === filterKYC
    return matchesSearch && matchesStatus && matchesKYC
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
      case "active":
        return "bg-green-500/20 text-green-400"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "suspended":
      case "banned":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getKYCStatusIcon = (kycStatus) => {
    switch (kycStatus) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const handleViewKYC = (player) => {
    setSelectedPlayer(player)
    setShowKYCModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Player Management</h1>
          <p className="text-[#B8C5D6]">Manage players, KYC verification, and player limits</p>
        </div>
        <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold whitespace-nowrap">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Add New Player</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[#B8C5D6]">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-[#B8C5D6]">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  required
                />
              </div>
              <div>
                <Label htmlFor="username" className="text-[#B8C5D6]">
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="Leave empty to use email prefix"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-[#B8C5D6]">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-[#B8C5D6]">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPlayerOpen(false)}
                  className="border-[#2A3F55] text-[#B8C5D6]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                >
                  {isSubmitting ? "Creating..." : "Create Player"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Players</p>
                <p className="text-3xl font-bold text-[#FFD700] mt-2">{stats.totalPlayers}</p>
              </div>
              <div className="w-12 h-12 bg-[#FFD700]/20 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-[#FFD700]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Verified</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{stats.verifiedPlayers}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Pending KYC</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.pendingKYC}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Active</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{stats.activePlayers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B8C5D6] w-4 h-4" />
              <input
                type="text"
                placeholder="Search players by name, email, or phone..."
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
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <select
              value={filterKYC}
              onChange={(e) => setFilterKYC(e.target.value)}
              className="px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
            >
              <option value="all">All KYC</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="not_submitted">Not Submitted</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Players Table */}
      <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-[#B8C5D6]">Loading players...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-[#B8C5D6]">
              {players.length === 0 ? "No players yet. Add your first player!" : "No players match your filters"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A3F55]">
                    <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Player</th>
                    <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Contact</th>
                    <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">KYC</th>
                    <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Balance</th>
                    <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Joined</th>
                    <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr key={player._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold">
                            {(player.fullName || player.name || "P").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[#F5F5F5] font-medium">{player.fullName || player.name}</p>
                            <p className="text-[#B8C5D6] text-sm">@{player.username || player.email?.split("@")[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-[#F5F5F5] text-sm">{player.email}</p>
                        <p className="text-[#B8C5D6] text-sm">{player.phone || "N/A"}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(player.status)}>{player.status || "active"}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getKYCStatusIcon(player.kyc_status)}
                          <span className="text-[#B8C5D6] text-sm capitalize">
                            {(player.kyc_status || "not_submitted").replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#FFD700] font-medium">${(player.balance || 0).toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#B8C5D6] text-sm">
                          {player.createdAt ? new Date(player.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-[#B8C5D6] hover:text-[#F5F5F5] hover:bg-[#1A2F45]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
                            <DropdownMenuItem
                              onClick={() => handleViewKYC(player)}
                              className="hover:bg-[#1A2F45] cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditPlayer(player)}
                              className="hover:bg-[#1A2F45] cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(player)}
                              className="hover:bg-[#1A2F45] cursor-pointer"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              {player.status === "active" ? "Suspend" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeletePlayer(player)}
                              className="hover:bg-[#1A2F45] cursor-pointer text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

      {/* View Details Modal */}
      <Dialog open={showKYCModal} onOpenChange={setShowKYCModal}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">Player Details</DialogTitle>
          </DialogHeader>
          {selectedPlayer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#B8C5D6] text-sm">Name</p>
                  <p className="text-[#F5F5F5]">{selectedPlayer.fullName || selectedPlayer.name}</p>
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Email</p>
                  <p className="text-[#F5F5F5]">{selectedPlayer.email}</p>
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Username</p>
                  <p className="text-[#F5F5F5]">{selectedPlayer.username || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Phone</p>
                  <p className="text-[#F5F5F5]">{selectedPlayer.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Status</p>
                  <Badge className={getStatusColor(selectedPlayer.status)}>{selectedPlayer.status || "active"}</Badge>
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">KYC Status</p>
                  <div className="flex items-center gap-2">
                    {getKYCStatusIcon(selectedPlayer.kyc_status)}
                    <span className="text-[#F5F5F5] capitalize">
                      {(selectedPlayer.kyc_status || "not_submitted").replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Balance</p>
                  <p className="text-[#FFD700] font-medium">${(selectedPlayer.balance || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Joined</p>
                  <p className="text-[#F5F5F5]">
                    {selectedPlayer.createdAt ? new Date(selectedPlayer.createdAt).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Last Login</p>
                  <p className="text-[#F5F5F5]">
                    {selectedPlayer.lastLogin ? new Date(selectedPlayer.lastLogin).toLocaleString() : "Never"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">Edit Player</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
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
              <Label htmlFor="edit-username" className="text-[#B8C5D6]">
                Username
              </Label>
              <Input
                id="edit-username"
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
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
              <Label htmlFor="edit-balance" className="text-[#B8C5D6]">
                Balance
              </Label>
              <Input
                id="edit-balance"
                type="number"
                step="0.01"
                value={editFormData.balance}
                onChange={(e) => setEditFormData({ ...editFormData, balance: Number.parseFloat(e.target.value) || 0 })}
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
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
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
    </div>
  )
}
