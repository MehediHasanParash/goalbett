"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Headphones,
  MessageSquare,
  Users,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  LogOut,
  Menu,
  X,
  Lock,
  User,
  History,
  RefreshCw,
  Loader2,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getAuthToken, getUser, logout } from "@/lib/auth-service"
import { PasswordChangeCard } from "@/components/admin/password-change-card"

export default function SupportDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("tickets")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [tickets, setTickets] = useState([])
  const [players, setPlayers] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [playerSearchQuery, setPlayerSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [replyMessage, setReplyMessage] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  })

  const isManager = user?.role === "support_manager"

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser || !["support_manager", "support_agent"].includes(currentUser.role)) {
      router.push("/staff/login")
      return
    }
    setUser(currentUser)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const token = getAuthToken()

      // Fetch tickets
      const ticketsRes = await fetch(`/api/staff/support/tickets?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const ticketsData = await ticketsRes.json()
      if (ticketsData.tickets) {
        setTickets(ticketsData.tickets)
        setStats(
          ticketsData.stats || {
            total: 0,
            open: 0,
            inProgress: 0,
            resolved: 0,
            urgent: 0,
          },
        )
      } else if (ticketsData.error) {
        toast.error(ticketsData.error)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch support data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSearchPlayers = async () => {
    if (!playerSearchQuery.trim()) {
      toast.error("Please enter a search term")
      return
    }

    try {
      const token = getAuthToken()
      const res = await fetch(`/api/staff/support/players?search=${encodeURIComponent(playerSearchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.players) {
        setPlayers(data.players)
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to search players")
    }
  }

  const handleReplyTicket = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a message")
      return
    }

    try {
      const token = getAuthToken()
      const res = await fetch("/api/staff/support/tickets", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: selectedTicket._id,
          note: replyMessage,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Reply sent successfully")
        setReplyMessage("")
        fetchData()
      } else {
        toast.error(data.error || "Failed to send reply")
      }
    } catch (error) {
      toast.error("Failed to send reply")
    }
  }

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/staff/support/tickets", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          status: newStatus,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Ticket ${newStatus}`)
        fetchData()
        setShowTicketModal(false)
      } else {
        toast.error(data.error || "Failed to update ticket")
      }
    } catch (error) {
      toast.error("Failed to update ticket")
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/staff/login")
  }

  const navigationItems = [
    { icon: MessageSquare, label: "Tickets", id: "tickets" },
    { icon: Users, label: "Players", id: "players" },
    ...(isManager ? [{ icon: AlertTriangle, label: "Escalations", id: "escalations" }] : []),
    { icon: Settings, label: "Settings", id: "settings" },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400"
      case "in_progress":
        return "bg-amber-500/20 text-amber-400"
      case "resolved":
        return "bg-green-500/20 text-green-400"
      case "escalated":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]">
      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-40 ${sidebarOpen ? "block" : "hidden"}`}>
        <button onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/50" />
        <div className="absolute left-0 top-0 h-screen w-64 bg-[#0D1F35] border-r border-[#2A3F55] p-4">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="mt-12 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id ? "bg-purple-500 text-white" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:block lg:w-64 lg:h-screen lg:bg-[#0D1F35] lg:border-r lg:border-[#2A3F55] lg:p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Headphones className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">{isManager ? "Support Manager" : "Support Agent"}</h2>
            <p className="text-xs text-[#B8C5D6]">{user?.fullName}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? "bg-purple-500 text-white" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">Support Dashboard</h1>
              <p className="text-[#B8C5D6] text-sm">Help players and manage support tickets</p>
            </div>
          </div>
          <Button
            onClick={fetchData}
            disabled={refreshing}
            variant="outline"
            size="icon"
            className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
                  <p className="text-xs text-[#B8C5D6]">Total Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.open || 0}</p>
                  <p className="text-xs text-[#B8C5D6]">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <History className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.inProgress || 0}</p>
                  <p className="text-xs text-[#B8C5D6]">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.resolved || 0}</p>
                  <p className="text-xs text-[#B8C5D6]">Resolved</p>
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
                  <p className="text-2xl font-bold text-white">{stats.urgent || 0}</p>
                  <p className="text-xs text-[#B8C5D6]">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-white"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  fetchData()
                }}
              >
                <SelectTrigger className="w-40 bg-[#1A2F45] border-[#2A3F55] text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-0">
                {tickets.length > 0 ? (
                  <div className="divide-y divide-[#2A3F55]">
                    {tickets
                      .filter(
                        (ticket) =>
                          !searchQuery ||
                          ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
                      )
                      .map((ticket) => (
                        <div
                          key={ticket._id}
                          className="p-4 hover:bg-[#1A2F45]/50 cursor-pointer"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowTicketModal(true)
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-white font-semibold">{ticket.subject}</h3>
                                <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                              </div>
                              <p className="text-sm text-[#B8C5D6]">
                                {ticket.userId?.firstName} {ticket.userId?.lastName} - {ticket.userId?.email}
                              </p>
                              <p className="text-xs text-[#B8C5D6] mt-1">{ticket.description?.slice(0, 100)}...</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status?.replace("_", " ")}
                              </Badge>
                              <p className="text-xs text-[#B8C5D6] mt-2">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#B8C5D6]">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tickets found</p>
                    <p className="text-sm mt-2">All caught up! Check back later for new tickets.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === "players" && (
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Player Lookup</CardTitle>
              <CardDescription className="text-[#B8C5D6]">Search and view limited player information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                  <Input
                    placeholder="Search by username, email, or phone..."
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchPlayers()}
                    className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-white"
                  />
                </div>
                <Button onClick={handleSearchPlayers} className="bg-purple-500 hover:bg-purple-600">
                  Search
                </Button>
              </div>

              {players.length > 0 ? (
                <div className="space-y-3">
                  {players.map((player) => (
                    <div
                      key={player._id}
                      className="p-4 bg-[#1A2F45] rounded-lg flex items-center justify-between cursor-pointer hover:bg-[#1A2F45]/80"
                      onClick={() => {
                        setSelectedPlayer(player)
                        setShowPlayerModal(true)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="text-xs text-[#B8C5D6]">{player.email}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          player.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }
                      >
                        {player.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-[#2A3F55] mx-auto mb-4" />
                  <p className="text-white font-semibold">Enter a search term</p>
                  <p className="text-[#B8C5D6] text-sm">Search for players to view their limited profile</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Escalations Tab (Manager Only) */}
        {activeTab === "escalations" && isManager && (
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Escalated Issues</CardTitle>
              <CardDescription className="text-[#B8C5D6]">Issues requiring manager attention</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.filter((t) => t.priority === "urgent" && t.status !== "resolved").length > 0 ? (
                <div className="divide-y divide-[#2A3F55]">
                  {tickets
                    .filter((t) => t.priority === "urgent" && t.status !== "resolved")
                    .map((ticket) => (
                      <div key={ticket._id} className="py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-semibold">{ticket.subject}</h3>
                            <p className="text-sm text-[#B8C5D6]">
                              {ticket.userId?.firstName} {ticket.userId?.lastName}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-purple-500 hover:bg-purple-600"
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setShowTicketModal(true)
                            }}
                          >
                            Take Action
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#B8C5D6]">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No escalated issues</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Settings</CardTitle>
              <CardDescription className="text-[#B8C5D6]">Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeCard />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ticket Detail Modal */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-purple-400">{selectedTicket?.subject}</DialogTitle>
            <DialogDescription className="text-[#B8C5D6]">
              {selectedTicket?.userId?.firstName} {selectedTicket?.userId?.lastName} - {selectedTicket?.userId?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status?.replace("_", " ")}
                </Badge>
                <Badge className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
              </div>

              {/* Description */}
              <div className="p-4 bg-[#1A2F45] rounded-lg">
                <p className="text-white">{selectedTicket.description}</p>
                <p className="text-xs text-[#B8C5D6] mt-2">
                  Created: {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Notes */}
              {selectedTicket.notes?.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto p-4 bg-[#1A2F45] rounded-lg">
                  <p className="text-sm font-semibold text-[#B8C5D6]">Notes:</p>
                  {selectedTicket.notes.map((note, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-purple-500/20 ml-4">
                      <p className="text-white">{note.content}</p>
                      <p className="text-xs text-[#B8C5D6] mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Note */}
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Add Note</Label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="bg-[#1A2F45] border-[#2A3F55] text-white"
                  placeholder="Type your note..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-[#2A3F55]">
                <Button onClick={handleReplyTicket} className="bg-purple-500 hover:bg-purple-600">
                  <Send className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
                {selectedTicket.status !== "resolved" && (
                  <Button
                    onClick={() => handleUpdateTicketStatus(selectedTicket._id, "resolved")}
                    variant="outline"
                    className="border-green-500 text-green-400 hover:bg-green-500/20 bg-transparent"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Resolved
                  </Button>
                )}
                {selectedTicket.status === "open" && (
                  <Button
                    onClick={() => handleUpdateTicketStatus(selectedTicket._id, "in_progress")}
                    variant="outline"
                    className="border-amber-500 text-amber-400 hover:bg-amber-500/20 bg-transparent"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    In Progress
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Player Detail Modal */}
      <Dialog open={showPlayerModal} onOpenChange={setShowPlayerModal}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white">
          <DialogHeader>
            <DialogTitle className="text-purple-400">Player Profile (Limited View)</DialogTitle>
          </DialogHeader>

          {selectedPlayer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#B8C5D6]">Name</p>
                  <p className="text-white">
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#B8C5D6]">Username</p>
                  <p className="text-white">{selectedPlayer.username || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#B8C5D6]">Email</p>
                  <p className="text-white">{selectedPlayer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#B8C5D6]">Status</p>
                  <Badge
                    className={
                      selectedPlayer.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }
                  >
                    {selectedPlayer.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-[#B8C5D6]">Last Login</p>
                  <p className="text-white">
                    {selectedPlayer.lastLogin ? new Date(selectedPlayer.lastLogin).toLocaleString() : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#B8C5D6]">KYC Status</p>
                  <Badge
                    className={
                      selectedPlayer.kycVerified ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                    }
                  >
                    {selectedPlayer.kycVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              </div>

              {isManager && (
                <div className="flex gap-2 pt-4 border-t border-[#2A3F55]">
                  <Button
                    variant="outline"
                    className="border-amber-500 text-amber-400 hover:bg-amber-500/20 bg-transparent"
                    onClick={() => toast.success("Password reset email sent")}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
