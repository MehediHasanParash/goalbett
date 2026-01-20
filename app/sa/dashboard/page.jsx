"use client"

import { useState, useEffect } from "react"
import {
  Menu,
  X,
  Users,
  Wallet,
  TrendingUp,
  UserPlus,
  PlayCircle,
  DollarSign,
  Copy,
  CheckCircle,
  LogOut,
} from "lucide-react"
import RoleProtectedLayout from "@/components/auth/role-protected-layout"
import { ROLES } from "@/lib/auth-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { ActivityLog } from "@/components/dashboard/activity-log"
import { getAuthToken } from "@/lib/auth-service"

export default function SubAgentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [addPlayerOpen, setAddPlayerOpen] = useState(false)
  const [playWithoutLoginOpen, setPlayWithoutLoginOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [createdPlayerData, setCreatedPlayerData] = useState(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const [myPlayers, setMyPlayers] = useState([])

  const [selectedPlayerForFunding, setSelectedPlayerForFunding] = useState(null)
  const [fundingDialogOpen, setFundingDialogOpen] = useState(false)
  const [transactionType, setTransactionType] = useState("deposit") // 'deposit' or 'withdraw'

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    console.log("[v0] Loading players...")
    try {
      const token = getAuthToken()
      console.log("[v0] Auth token exists:", !!token)
      console.log("[v0] Making GET request to /api/users/players")

      const response = await fetch("/api/users/players", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("[v0] Load players response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Loaded players data:", data)
        console.log("[v0] Number of players:", data.players?.length || 0)
        setMyPlayers(data.players || [])
      } else {
        const errorData = await response.json()
        console.error("[v0] Failed to load players:", errorData)
      }
    } catch (error) {
      console.error("[v0] Load players error:", error)
      console.error("[v0] Error details:", error.message, error.stack)
    }
  }

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const playerData = {
      name: formData.get("name"),
      username: formData.get("username"),
      initialBalance: Number(formData.get("initialBalance")) || 0,
    }

    console.log("[v0] Creating player with data:", playerData)

    try {
      const token = getAuthToken()
      const response = await fetch("/api/users/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(playerData),
      })

      console.log("[v0] Player creation response status:", response.status)
      const data = await response.json()
      console.log("[v0] Player creation response data:", data)
      console.log("[v0] Player object structure:", JSON.stringify(data.player, null, 2))
      console.log("[v0] Username from API:", data.player?.username)

      if (response.ok) {
        setCreatedPlayerData({
          name: data.player.name || "N/A",
          username: data.player.username || "N/A", // Username should always be present now
          id: data.player.id || "N/A",
          balance: data.player.balance || 0,
          tempPassword: data.player.tempPassword || "N/A",
          loginUrl: window.location.origin + "/auth",
        })
        console.log("[v0] Set created player data with username:", data.player.username)
        setAddPlayerOpen(false)
        setShowSuccessDialog(true)
        await loadPlayers()
        console.log("[v0] Players reloaded after creation")
        e.target.reset() // Reset form
      } else {
        console.error("[v0] Player creation error:", data)
        alert(data.error || data.details || "Failed to create player")
      }
    } catch (error) {
      console.error("[v0] Create player error:", error)
      alert("Failed to create player: " + error.message)
    }
  }

  const copyCredentials = () => {
    if (!createdPlayerData) return
    const credentials = `Username: ${createdPlayerData.username}\nPassword: ${createdPlayerData.tempPassword}\nLogin URL: ${createdPlayerData.loginUrl}`
    navigator.clipboard.writeText(credentials)
    alert("Credentials copied to clipboard!")
  }

  const handlePlayWithoutLogin = (player) => {
    setSelectedPlayer(player)
    setPlayWithoutLoginOpen(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_role")
    window.location.href = "/auth"
  }

  const handleFundPlayer = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const amount = Number(formData.get("amount"))

    if (!selectedPlayerForFunding || amount <= 0) return

    try {
      const token = getAuthToken()
      const response = await fetch("/api/transactions/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedPlayerForFunding._id,
          type: transactionType,
          amount: amount,
          description: `${transactionType === "deposit" ? "Deposit" : "Withdrawal"} by SubAgent`,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Successfully ${transactionType === "deposit" ? "deposited" : "withdrawn"} $${amount}`)
        setFundingDialogOpen(false)
        await loadPlayers()
        e.target.reset()
      } else {
        alert(data.error || "Transaction failed")
      }
    } catch (error) {
      console.error("[v0] Fund player error:", error)
      alert("Transaction failed: " + error.message)
    }
  }

  return (
    <RoleProtectedLayout requiredRole={ROLES.SUB_AGENT}>
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]">
        {/* Mobile Sidebar */}
        <div className={`lg:hidden fixed inset-0 z-40 ${sidebarOpen ? "block" : "hidden"}`}>
          <button onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 h-screen w-64 bg-[#0D1F35] border-r border-[#2A3F55] p-4 overflow-y-auto">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-[#F5F5F5]">
              <X className="w-6 h-6" />
            </button>
            <div className="mt-12 space-y-4">
              {[
                { icon: TrendingUp, label: "Overview", id: "overview" },
                { icon: Users, label: "My Players", id: "players" },
                { icon: UserPlus, label: "Add Player", id: "add-player" },
                { icon: Wallet, label: "Wallet", id: "wallet" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id ? "bg-[#FFD700] text-[#0A1A2F]" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-400 hover:bg-red-500/10 mt-8"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:block lg:w-64 lg:h-screen lg:bg-[#0D1F35] lg:border-r lg:border-[#2A3F55] lg:p-6">
          <h2 className="text-[#FFD700] font-bold text-lg mb-8">Sub-Agent Panel</h2>
          <nav className="space-y-4 flex flex-col h-[calc(100%-3rem)]">
            <div className="flex-1">
              {[
                { icon: TrendingUp, label: "Overview", id: "overview" },
                { icon: Users, label: "My Players", id: "players" },
                { icon: UserPlus, label: "Add Player", id: "add-player" },
                { icon: Wallet, label: "Wallet", id: "wallet" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                    activeTab === item.id ? "bg-[#FFD700] text-[#0A1A2F]" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-400 hover:bg-red-500/10 border border-red-500/30"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Logout</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header */}
          <div className="bg-[#0D1F35]/80 backdrop-blur-sm border-b border-[#2A3F55] sticky top-0 z-30">
            <div className="px-4 md:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-[#F5F5F5]">
                    <Menu className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">Sub-Agent Dashboard</h1>
                    <p className="text-sm text-[#B8C5D6] mt-1">Manage your players and betting operations</p>
                  </div>
                </div>
                <NotificationBell />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 md:px-6 py-8">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700]/50">
                    <CardContent className="p-6">
                      <p className="text-sm text-[#B8C5D6] mb-2">My Players</p>
                      <h3 className="text-4xl font-bold text-[#FFD700]">{myPlayers.length}</h3>
                      <p className="text-xs text-yellow-400 mt-2">Under my management</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/50">
                    <CardContent className="p-6">
                      <p className="text-sm text-[#B8C5D6] mb-2">My Commission (5%)</p>
                      <h3 className="text-4xl font-bold text-green-400">$425</h3>
                      <p className="text-xs text-green-400 mt-2">This month</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/50">
                    <CardContent className="p-6">
                      <p className="text-sm text-[#B8C5D6] mb-2">Player Balances</p>
                      <h3 className="text-4xl font-bold text-blue-400">
                        ${myPlayers.reduce((sum, p) => sum + (p.balance || 0), 0).toFixed(2)}
                      </h3>
                      <p className="text-xs text-blue-400 mt-2">Total funds</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/50">
                    <CardContent className="p-6">
                      <p className="text-sm text-[#B8C5D6] mb-2">Active Players</p>
                      <h3 className="text-4xl font-bold text-purple-400">
                        {myPlayers.filter((p) => p.status === "active").length}
                      </h3>
                      <p className="text-xs text-purple-400 mt-2">Currently active</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardHeader>
                    <CardTitle className="text-[#F5F5F5]">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Dialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold py-6">
                          <UserPlus className="mr-2 h-5 w-5" />
                          Create New Player
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0D1F35] border-[#2A3F55]">
                        <DialogHeader>
                          <DialogTitle className="text-[#FFD700]">Add New Player</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddPlayer} className="space-y-4">
                          <div>
                            <label className="text-[#B8C5D6] text-sm mb-2 block">Player Name</label>
                            <Input name="name" required className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]" />
                          </div>
                          <div>
                            <label className="text-[#B8C5D6] text-sm mb-2 block">Username</label>
                            <Input name="username" required className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]" />
                          </div>
                          <div>
                            <label className="text-[#B8C5D6] text-sm mb-2 block">Initial Balance ($)</label>
                            <Input
                              name="initialBalance"
                              type="number"
                              defaultValue="0"
                              className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                            />
                          </div>
                          <Button type="submit" className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
                            Create Player
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={() => setActiveTab("wallet")}
                      variant="outline"
                      className="border-[#FFD700] text-[#FFD700] py-6 hover:bg-[#FFD700]/10"
                    >
                      <Wallet className="mr-2 h-5 w-5" />
                      Manage Balances
                    </Button>
                    <Button
                      onClick={() => setActiveTab("players")}
                      variant="outline"
                      className="border-blue-500 text-blue-400 py-6 hover:bg-blue-500/10"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      View All Players
                    </Button>
                  </CardContent>
                </Card>

                <ActivityLog />
              </div>
            )}

            {activeTab === "players" && (
              <div className="space-y-6">
                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardHeader>
                    <CardTitle className="text-[#F5F5F5]">My Players ({myPlayers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {myPlayers.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="w-16 h-16 text-[#B8C5D6] mx-auto mb-4 opacity-50" />
                          <p className="text-[#B8C5D6] text-lg">No players yet</p>
                          <p className="text-[#B8C5D6] text-sm mt-2">Create your first player to get started</p>
                          <Button
                            onClick={() => setActiveTab("add-player")}
                            className="mt-4 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create Player
                          </Button>
                        </div>
                      ) : (
                        myPlayers.map((player) => (
                          <div
                            key={player._id}
                            className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 hover:border-[#FFD700]/50 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#FFD700] font-semibold">{player.fullName || player.name}</p>
                                <p className="text-[#B8C5D6] text-sm">@{player.username}</p>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-[#B8C5D6] text-xs">BALANCE</p>
                                  <p className="text-white font-bold text-xl">${player.balance || 0}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPlayerForFunding(player)
                                      setTransactionType("deposit")
                                      setFundingDialogOpen(true)
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Deposit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPlayerForFunding(player)
                                      setTransactionType("withdraw")
                                      setFundingDialogOpen(true)
                                    }}
                                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                                  >
                                    Withdraw
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "add-player" && (
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#F5F5F5]">Create New Player</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPlayer} className="space-y-4 max-w-md">
                    <div>
                      <label className="text-[#B8C5D6] text-sm mb-2 block">Player Name</label>
                      <Input name="name" required className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]" />
                    </div>
                    <div>
                      <label className="text-[#B8C5D6] text-sm mb-2 block">Username</label>
                      <Input name="username" required className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]" />
                    </div>
                    <div>
                      <label className="text-[#B8C5D6] text-sm mb-2 block">Initial Balance ($)</label>
                      <Input
                        name="initialBalance"
                        type="number"
                        defaultValue="0"
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <Button type="submit" className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
                      Create Player
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === "wallet" && (
              <div className="space-y-6">
                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardHeader>
                    <CardTitle className="text-[#F5F5F5]">Wallet Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#B8C5D6] mb-6">Manage player balances and transactions</p>
                    {myPlayers.length === 0 ? (
                      <div className="text-center py-12">
                        <Wallet className="w-16 h-16 text-[#B8C5D6] mx-auto mb-4 opacity-50" />
                        <p className="text-[#B8C5D6]">No players to manage</p>
                        <Button
                          onClick={() => setActiveTab("add-player")}
                          className="mt-4 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create First Player
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myPlayers.map((player) => (
                          <div
                            key={player._id}
                            className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 hover:border-[#FFD700]/50 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#FFD700] font-semibold">{player.fullName || player.name}</p>
                                <p className="text-[#B8C5D6] text-sm">@{player.username}</p>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-[#B8C5D6] text-xs">BALANCE</p>
                                  <p className="text-white font-bold text-xl">${player.balance || 0}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPlayerForFunding(player)
                                      setTransactionType("deposit")
                                      setFundingDialogOpen(true)
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Deposit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPlayerForFunding(player)
                                      setTransactionType("withdraw")
                                      setFundingDialogOpen(true)
                                    }}
                                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                                  >
                                    Withdraw
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55]">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-6">Player Account Created Successfully!</h3>
              <div className="bg-[#1A2F45] rounded-lg p-6 space-y-3 text-left mb-6">
                <div className="flex justify-between">
                  <span className="text-[#B8C5D6]">Player Name:</span>
                  <span className="text-[#F5F5F5] font-semibold">{createdPlayerData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B8C5D6]">Username:</span>
                  <span className="text-[#FFD700] font-semibold">{createdPlayerData?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B8C5D6]">Player ID:</span>
                  <span className="text-[#F5F5F5] text-xs font-mono">{createdPlayerData?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B8C5D6]">Initial Balance:</span>
                  <span className="text-green-400 font-semibold">${createdPlayerData?.balance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B8C5D6]">Temp Password:</span>
                  <span className="text-[#FFD700] font-bold">{createdPlayerData?.tempPassword}</span>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm font-semibold mb-2">Login Information</p>
                <p className="text-[#B8C5D6] text-sm mb-1">Send these credentials to your player:</p>
                <p className="text-[#F5F5F5] text-xs font-mono">Username: {createdPlayerData?.username}</p>
                <p className="text-[#F5F5F5] text-xs font-mono">Password: {createdPlayerData?.tempPassword}</p>
                <p className="text-[#F5F5F5] text-xs font-mono">Login: {createdPlayerData?.loginUrl}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={copyCredentials}
                  variant="outline"
                  className="flex-1 border-[#FFD700] text-[#FFD700] bg-transparent"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Credentials
                </Button>
                <Button
                  onClick={() => setShowSuccessDialog(false)}
                  className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Funding Dialog */}
        <Dialog open={fundingDialogOpen} onOpenChange={setFundingDialogOpen}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55]">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">
                {transactionType === "deposit" ? "Deposit Funds" : "Withdraw Funds"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFundPlayer} className="space-y-4">
              <div>
                <label className="text-[#B8C5D6] text-sm mb-2 block">Player</label>
                <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-md p-3">
                  <p className="text-[#F5F5F5] font-semibold">
                    {selectedPlayerForFunding?.fullName || selectedPlayerForFunding?.name}
                  </p>
                  <p className="text-[#B8C5D6] text-sm">Current Balance: ${selectedPlayerForFunding?.balance || 0}</p>
                </div>
              </div>
              <div>
                <label className="text-[#B8C5D6] text-sm mb-2 block">Amount ($)</label>
                <Input
                  name="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  placeholder="Enter amount"
                />
              </div>
              <Button
                type="submit"
                className={`w-full ${
                  transactionType === "deposit" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                } text-white`}
              >
                {transactionType === "deposit" ? "Deposit" : "Withdraw"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Play Without Login Dialog */}
        <Dialog open={playWithoutLoginOpen} onOpenChange={setPlayWithoutLoginOpen}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">
                Playing as: {selectedPlayer?.fullName || selectedPlayer?.name} ($
                {selectedPlayer?.balance || 0})
              </DialogTitle>
            </DialogHeader>
            <div className="bg-[#1A2F45] rounded-lg p-6 text-center">
              <p className="text-[#B8C5D6] mb-4">
                You are now managing bets for {selectedPlayer?.fullName || selectedPlayer?.name}. Place bets on their
                behalf.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button className="bg-green-600 hover:bg-green-700 text-white py-6">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Sports Betting
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white py-6">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Casino Games
                </Button>
              </div>
              <p className="text-[#B8C5D6] text-xs mt-6">
                All bets will be recorded under {selectedPlayer?.fullName || selectedPlayer?.name}'s account
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleProtectedLayout>
  )
}
