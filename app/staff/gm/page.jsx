"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  UserCog,
  Users,
  TrendingUp,
  BarChart3,
  Plus,
  Search,
  Eye,
  Edit,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAuthToken, getUser, logout } from "@/lib/auth-service"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { PasswordChangeCard } from "@/components/admin/password-change-card"

export default function GeneralManagerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalPlayers: 0,
    activePlayers: 0,
    ggrThisMonth: 0,
    ggrChange: 0,
    depositsThisMonth: 0,
    withdrawalsThisMonth: 0,
  })
  const [agents, setAgents] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false)
  const [agentForm, setAgentForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    commissionRate: 10,
  })
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser || currentUser.role !== "general_manager") {
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

      // Fetch KPI stats
      const statsRes = await fetch("/api/staff/gm/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const statsData = await statsRes.json()
      if (statsData.stats) {
        setStats(statsData.stats)
        setWeeklyData(statsData.weeklyData || [])
      } else if (statsData.error) {
        toast.error(statsData.error)
      }

      // Fetch agents
      const agentsRes = await fetch("/api/staff/gm/agents", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const agentsData = await agentsRes.json()
      if (agentsData.agents) {
        setAgents(agentsData.agents)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCreateAgent = async () => {
    try {
      if (!agentForm.fullName || !agentForm.email || !agentForm.password) {
        toast.error("Please fill in all required fields")
        return
      }

      const token = getAuthToken()
      const response = await fetch("/api/staff/gm/agents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentForm),
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Agent created successfully")
        setShowCreateAgentModal(false)
        setAgentForm({ fullName: "", email: "", phone: "", password: "", commissionRate: 10 })
        fetchData()
      } else {
        toast.error(data.error || "Failed to create agent")
      }
    } catch (error) {
      toast.error("Failed to create agent")
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/staff/login")
  }

  const navigationItems = [
    { icon: BarChart3, label: "Overview", id: "overview" },
    { icon: Users, label: "Agents", id: "agents" },
    { icon: TrendingUp, label: "KPIs", id: "kpis" },
    { icon: Settings, label: "Settings", id: "settings" },
  ]

  const playerDistribution = [
    { name: "Sports", value: 45, color: "#10B981" },
    { name: "Casino", value: 30, color: "#FFD700" },
    { name: "Live Games", value: 25, color: "#3B82F6" },
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
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
                  activeTab === item.id ? "bg-blue-500 text-white" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
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
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <UserCog className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">General Manager</h2>
            <p className="text-xs text-[#B8C5D6]">{user?.fullName}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? "bg-blue-500 text-white" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
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
              <h1 className="text-2xl md:text-3xl font-bold text-blue-400">General Manager Dashboard</h1>
              <p className="text-[#B8C5D6] text-sm">Manage agents, view KPIs, and monitor operations</p>
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

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards - Using real data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">GGR This Month</p>
                      <p className="text-2xl font-bold text-[#FFD700]">{formatCurrency(stats.ggrThisMonth)}</p>
                      <p className={`text-xs ${Number(stats.ggrChange) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {Number(stats.ggrChange) >= 0 ? "+" : ""}
                        {stats.ggrChange}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-[#FFD700]/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Active Players</p>
                      <p className="text-2xl font-bold text-blue-400">{(stats.activePlayers || 0).toLocaleString()}</p>
                      <p className="text-xs text-[#B8C5D6]">{stats.totalPlayers || 0} total</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Deposits</p>
                      <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.depositsThisMonth)}</p>
                    </div>
                    <ArrowDownRight className="w-8 h-8 text-emerald-400/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Withdrawals</p>
                      <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.withdrawalsThisMonth)}</p>
                    </div>
                    <ArrowUpRight className="w-8 h-8 text-red-400/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#B8C5D6] text-sm">Active Agents</p>
                      <p className="text-2xl font-bold text-purple-400">{stats.activeAgents || 0}</p>
                      <p className="text-xs text-[#B8C5D6]">{stats.totalAgents || 0} total</p>
                    </div>
                    <UserCog className="w-8 h-8 text-purple-400/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts - Using real weeklyData */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white">Weekly GGR Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                        <XAxis dataKey="day" stroke="#B8C5D6" />
                        <YAxis stroke="#B8C5D6" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A1A2F",
                            border: "1px solid #2A3F55",
                            borderRadius: "8px",
                          }}
                        />
                        <Line type="monotone" dataKey="ggr" stroke="#FFD700" strokeWidth={3} name="GGR" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-[#B8C5D6]">No data available</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white">New Players This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                        <XAxis dataKey="day" stroke="#B8C5D6" />
                        <YAxis stroke="#B8C5D6" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0A1A2F",
                            border: "1px solid #2A3F55",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="players" fill="#3B82F6" name="New Players" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-[#B8C5D6]">No data available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Agents - Using real data */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Top Performing Agents</CardTitle>
                  <CardDescription className="text-[#B8C5D6]">Agents ranked by performance</CardDescription>
                </div>
                <Button
                  onClick={() => setActiveTab("agents")}
                  variant="outline"
                  className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {agents.length > 0 ? (
                  <div className="space-y-3">
                    {agents.slice(0, 5).map((agent, idx) => (
                      <div key={agent._id} className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {agent.firstName} {agent.lastName}
                            </p>
                            <p className="text-xs text-[#B8C5D6]">{agent.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#FFD700] font-bold">{formatCurrency(agent.totalEarnings || 0)}</p>
                          <p className="text-xs text-[#B8C5D6]">{agent.commissionRate || 10}% commission</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#B8C5D6]">
                    No agents found. Create your first agent to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === "agents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-white"
                />
              </div>
              <Button onClick={() => setShowCreateAgentModal(true)} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </div>

            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-0">
                {agents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2A3F55]">
                          <th className="text-left py-4 px-6 text-[#B8C5D6] font-medium">Agent</th>
                          <th className="text-left py-4 px-6 text-[#B8C5D6] font-medium">Phone</th>
                          <th className="text-left py-4 px-6 text-[#B8C5D6] font-medium">Commission</th>
                          <th className="text-left py-4 px-6 text-[#B8C5D6] font-medium">Earnings</th>
                          <th className="text-left py-4 px-6 text-[#B8C5D6] font-medium">Status</th>
                          <th className="text-left py-4 px-6 text-[#B8C5D6] font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agents
                          .filter(
                            (agent) =>
                              !searchQuery ||
                              `${agent.firstName} ${agent.lastName}`
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase()) ||
                              agent.email.toLowerCase().includes(searchQuery.toLowerCase()),
                          )
                          .map((agent) => (
                            <tr key={agent._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                              <td className="py-4 px-6">
                                <p className="text-white font-medium">
                                  {agent.firstName} {agent.lastName}
                                </p>
                                <p className="text-xs text-[#B8C5D6]">{agent.email}</p>
                              </td>
                              <td className="py-4 px-6 text-white">{agent.phone || "-"}</td>
                              <td className="py-4 px-6 text-[#FFD700]">{agent.commissionRate || 10}%</td>
                              <td className="py-4 px-6 text-emerald-400 font-semibold">
                                {formatCurrency(agent.totalEarnings || 0)}
                              </td>
                              <td className="py-4 px-6">
                                <Badge
                                  className={
                                    agent.status === "active"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-red-500/20 text-red-400"
                                  }
                                >
                                  {agent.status || "active"}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" className="text-[#B8C5D6]">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-[#B8C5D6]">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#B8C5D6]">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No agents found</p>
                    <Button
                      onClick={() => setShowCreateAgentModal(true)}
                      className="mt-4 bg-blue-500 hover:bg-blue-600"
                    >
                      Create Your First Agent
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* KPIs Tab */}
        {activeTab === "kpis" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#FFD700]">GGR Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-5xl font-bold text-[#FFD700]">{formatCurrency(stats.ggrThisMonth)}</p>
                    <p className="text-[#B8C5D6] mt-2">Gross Gaming Revenue This Month</p>
                    <div
                      className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full ${Number(stats.ggrChange) >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                    >
                      {Number(stats.ggrChange) >= 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span>{Math.abs(Number(stats.ggrChange))}% vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-blue-400">Player Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#B8C5D6]">Total Players</span>
                      <span className="text-white font-bold">{(stats.totalPlayers || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#B8C5D6]">Active (30 days)</span>
                      <span className="text-green-400 font-bold">{(stats.activePlayers || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#B8C5D6]">Total Agents</span>
                      <span className="text-white font-bold">{stats.totalAgents || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#B8C5D6]">Active Agents</span>
                      <span className="text-green-400 font-bold">{stats.activeAgents || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <PasswordChangeCard
              title="Change Your Password"
              description="Update your General Manager account password"
            />

            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">Other Settings</CardTitle>
                <CardDescription className="text-[#B8C5D6]">Additional preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[#B8C5D6]">More settings options coming soon...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      <Dialog open={showCreateAgentModal} onOpenChange={setShowCreateAgentModal}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription className="text-[#B8C5D6]">Add a new agent to your network</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#B8C5D6]">Full Name *</Label>
              <Input
                value={agentForm.fullName}
                onChange={(e) => setAgentForm({ ...agentForm, fullName: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-white"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#B8C5D6]">Email *</Label>
              <Input
                type="email"
                value={agentForm.email}
                onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-white"
                placeholder="agent@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#B8C5D6]">Phone</Label>
              <Input
                value={agentForm.phone}
                onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-white"
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#B8C5D6]">Password *</Label>
              <Input
                type="password"
                value={agentForm.password}
                onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-white"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#B8C5D6]">Commission Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={agentForm.commissionRate}
                onChange={(e) => setAgentForm({ ...agentForm, commissionRate: Number(e.target.value) })}
                className="bg-[#1A2F45] border-[#2A3F55] text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateAgentModal(false)}
              className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAgent} className="bg-blue-500 hover:bg-blue-600">
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
