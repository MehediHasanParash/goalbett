"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { getAuthToken } from "@/lib/auth-service"
import { toast } from "sonner"
import {
  Gift,
  Ticket,
  Percent,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Play,
  Pause,
  XCircle,
  Sparkles,
  Target,
  Layers,
  Star,
} from "lucide-react"

const BONUS_TYPES = [
  { value: "deposit_match", label: "Deposit Match", icon: Percent, color: "#10B981" },
  { value: "free_bet", label: "Free Bet", icon: Ticket, color: "#3B82F6" },
  { value: "free_spins", label: "Free Spins", icon: Sparkles, color: "#8B5CF6" },
  { value: "bonus_money", label: "Bonus Money", icon: DollarSign, color: "#F59E0B" },
  { value: "cashback", label: "Cashback", icon: TrendingUp, color: "#EC4899" },
  { value: "combo_boost", label: "Combo Boost", icon: Layers, color: "#06B6D4" },
  { value: "reload_bonus", label: "Reload Bonus", icon: RefreshCw, color: "#84CC16" },
  { value: "no_deposit", label: "No Deposit", icon: Gift, color: "#F97316" },
  { value: "referral", label: "Referral", icon: Users, color: "#6366F1" },
  { value: "loyalty", label: "Loyalty", icon: Star, color: "#EAB308" },
]

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "sports", label: "Sports" },
  { value: "casino", label: "Casino" },
]

const STATUS_COLORS = {
  draft: "bg-gray-500",
  active: "bg-green-500",
  paused: "bg-yellow-500",
  expired: "bg-red-500",
  archived: "bg-gray-700",
  pending: "bg-blue-500",
  wagering: "bg-purple-500",
  completed: "bg-green-600",
  cancelled: "bg-red-600",
  forfeited: "bg-orange-500",
}

export default function BonusEnginePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState(null)
  const [templates, setTemplates] = useState([])
  const [playerBonuses, setPlayerBonuses] = useState([])
  const [cashbackLevels, setCashbackLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Dialog states
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showCashbackDialog, setShowCashbackDialog] = useState(false)
  const [showBonusDetails, setShowBonusDetails] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedBonus, setSelectedBonus] = useState(null)
  const [selectedCashback, setSelectedCashback] = useState(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchData()
  }, [activeTab, page, statusFilter, typeFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()

      if (activeTab === "overview") {
        const res = await fetch("/api/super/bonus-engine?view=overview", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setStats(data.stats)
          setPlayerBonuses(data.recentBonuses || [])
        }
      } else if (activeTab === "templates") {
        const res = await fetch("/api/super/bonus-engine?view=templates", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setTemplates(data.templates || [])
        }
      } else if (activeTab === "player-bonuses") {
        let url = `/api/super/bonus-engine?view=player-bonuses&page=${page}`
        if (statusFilter !== "all") url += `&status=${statusFilter}`
        if (typeFilter !== "all") url += `&type=${typeFilter}`

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setPlayerBonuses(data.bonuses || [])
          setTotalPages(data.pagination?.pages || 1)
        }
      } else if (activeTab === "cashback") {
        const res = await fetch("/api/super/bonus-engine?view=cashback-levels", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setCashbackLevels(data.levels || [])
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async (templateData) => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/bonus-engine/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Bonus template created")
        setShowTemplateDialog(false)
        setSelectedTemplate(null)
        fetchData()
      } else {
        toast.error(data.error || "Failed to create template")
      }
    } catch (error) {
      toast.error("Failed to create template")
    }
  }

  const handleUpdateTemplate = async (templateData) => {
    try {
      const token = getAuthToken()
      const res = await fetch(`/api/super/bonus-engine/templates/${selectedTemplate._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Template updated")
        setShowTemplateDialog(false)
        setSelectedTemplate(null)
        fetchData()
      } else {
        toast.error(data.error || "Failed to update template")
      }
    } catch (error) {
      toast.error("Failed to update template")
    }
  }

  const handleToggleTemplateStatus = async (template) => {
    try {
      const token = getAuthToken()
      const newStatus = template.status === "active" ? "paused" : "active"
      const res = await fetch(`/api/super/bonus-engine/templates/${template._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Template ${newStatus === "active" ? "activated" : "paused"}`)
        fetchData()
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const token = getAuthToken()
      const res = await fetch(`/api/super/bonus-engine/templates/${templateId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Template deleted")
        fetchData()
      } else {
        toast.error(data.error || "Failed to delete")
      }
    } catch (error) {
      toast.error("Failed to delete template")
    }
  }

  const handleCancelBonus = async (bonusId) => {
    const reason = prompt("Enter cancellation reason:")
    if (!reason) return

    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/bonus-engine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "cancel_bonus", bonusId, reason }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Bonus cancelled")
        fetchData()
      }
    } catch (error) {
      toast.error("Failed to cancel bonus")
    }
  }

  const handleProcessExpired = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/bonus-engine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "process_expired" }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Processed ${data.expiredCount} expired bonuses`)
        fetchData()
      }
    } catch (error) {
      toast.error("Failed to process expired bonuses")
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getBonusTypeInfo = (type) => {
    return BONUS_TYPES.find((t) => t.value === type) || BONUS_TYPES[0]
  }

  return (
    <SuperAdminLayout
      title="Bonus Engine 2.0"
      description="Advanced bonus management with free bets, cashback, and wagering tracking"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Gift className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-[#8A9DB5] text-sm">Active Bonuses</p>
                <p className="text-2xl font-bold text-green-400">{stats?.activePlayerBonuses || 0}</p>
                <p className="text-xs text-[#8A9DB5]">{stats?.totalPlayerBonuses || 0} total claimed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[#8A9DB5] text-sm">Total Awarded</p>
                <p className="text-2xl font-bold text-blue-400">{formatCurrency(stats?.totalAwarded)}</p>
                <p className="text-xs text-[#8A9DB5]">{formatCurrency(stats?.totalConverted)} converted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-[#8A9DB5] text-sm">Pending Wagering</p>
                <p className="text-2xl font-bold text-purple-400">{stats?.pendingWagering || 0}</p>
                <p className="text-xs text-[#8A9DB5]">In progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-[#8A9DB5] text-sm">Conversion Rate</p>
                <p className="text-2xl font-bold text-yellow-400">{stats?.conversionRate || 0}%</p>
                <p className="text-xs text-[#8A9DB5]">{stats?.activeTemplates || 0} active templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList className="bg-[#0D1F35] border border-[#2A3F55]">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              <Gift className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="player-bonuses"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              <Users className="w-4 h-4 mr-2" />
              Player Bonuses
            </TabsTrigger>
            <TabsTrigger
              value="cashback"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              <Percent className="w-4 h-4 mr-2" />
              Cashback Levels
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} className="border-[#2A3F55] text-[#B8C5D6] bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {activeTab === "templates" && (
              <Button
                onClick={() => {
                  setSelectedTemplate(null)
                  setShowTemplateDialog(true)
                }}
                className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            )}
            {activeTab === "cashback" && (
              <Button
                onClick={() => {
                  setSelectedCashback(null)
                  setShowCashbackDialog(true)
                }}
                className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Level
              </Button>
            )}
            {activeTab === "player-bonuses" && (
              <Button
                variant="outline"
                onClick={handleProcessExpired}
                className="border-orange-500/50 text-orange-400 bg-transparent"
              >
                <Clock className="w-4 h-4 mr-2" />
                Process Expired
              </Button>
            )}
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bonus Types Breakdown */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">Bonus Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {BONUS_TYPES.slice(0, 6).map((type) => {
                    const Icon = type.icon
                    return (
                      <div key={type.value} className="flex items-center gap-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${type.color}20` }}>
                          <Icon className="w-5 h-5" style={{ color: type.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-[#B8C5D6]">{type.label}</span>
                            <span className="text-sm text-[#F5F5F5]">{Math.floor(Math.random() * 100)}%</span>
                          </div>
                          <Progress
                            value={Math.floor(Math.random() * 100)}
                            className="h-2"
                            style={{ "--progress-color": type.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">Recent Bonuses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {playerBonuses.slice(0, 5).map((bonus) => {
                    const typeInfo = getBonusTypeInfo(bonus.bonusType)
                    const Icon = typeInfo.icon
                    return (
                      <div key={bonus._id} className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${typeInfo.color}20` }}>
                            <Icon className="w-4 h-4" style={{ color: typeInfo.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#F5F5F5]">
                              {bonus.userId?.name || bonus.userId?.email || "Unknown"}
                            </p>
                            <p className="text-xs text-[#8A9DB5]">{bonus.bonusName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-400">{formatCurrency(bonus.bonusAmount)}</p>
                          <Badge className={`text-xs ${STATUS_COLORS[bonus.status]} text-white`}>{bonus.status}</Badge>
                        </div>
                      </div>
                    )
                  })}
                  {playerBonuses.length === 0 && <p className="text-center text-[#8A9DB5] py-4">No recent bonuses</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2A3F55]">
                    <TableHead className="text-[#8A9DB5]">Bonus</TableHead>
                    <TableHead className="text-[#8A9DB5]">Type</TableHead>
                    <TableHead className="text-[#8A9DB5]">Value</TableHead>
                    <TableHead className="text-[#8A9DB5]">Wagering</TableHead>
                    <TableHead className="text-[#8A9DB5]">Claims</TableHead>
                    <TableHead className="text-[#8A9DB5]">Status</TableHead>
                    <TableHead className="text-[#8A9DB5]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => {
                    const typeInfo = getBonusTypeInfo(template.type)
                    const Icon = typeInfo.icon
                    return (
                      <TableRow key={template._id} className="border-[#2A3F55]">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${typeInfo.color}20` }}>
                              <Icon className="w-4 h-4" style={{ color: typeInfo.color }} />
                            </div>
                            <div>
                              <p className="font-medium text-[#F5F5F5]">{template.name}</p>
                              <p className="text-xs text-[#8A9DB5]">{template.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: typeInfo.color, color: typeInfo.color }}>
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#F5F5F5]">
                          {template.type === "deposit_match" || template.type === "reload_bonus"
                            ? `${template.value?.amount}% (max ${formatCurrency(template.value?.maxAmount)})`
                            : template.type === "free_bet"
                              ? `${template.freeBet?.count}x ${formatCurrency(template.freeBet?.amountPerBet)}`
                              : template.type === "free_spins"
                                ? `${template.freeSpins?.count} spins`
                                : formatCurrency(template.value?.amount)}
                        </TableCell>
                        <TableCell className="text-[#F5F5F5]">{template.wagering?.multiplier}x</TableCell>
                        <TableCell className="text-[#F5F5F5]">{template.stats?.totalClaimed || 0}</TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[template.status]} text-white`}>{template.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1A2F45] border-[#2A3F55]">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTemplate(template)
                                  setShowTemplateDialog(true)
                                }}
                                className="text-[#F5F5F5]"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleTemplateStatus(template)}
                                className="text-[#F5F5F5]"
                              >
                                {template.status === "active" ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteTemplate(template._id)}
                                className="text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-[#8A9DB5] py-8">
                        No bonus templates found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Player Bonuses Tab */}
        <TabsContent value="player-bonuses" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A9DB5] w-4 h-4" />
              <Input
                placeholder="Search by player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="wagering">Wagering</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                <SelectItem value="all">All Types</SelectItem>
                {BONUS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2A3F55]">
                    <TableHead className="text-[#8A9DB5]">Player</TableHead>
                    <TableHead className="text-[#8A9DB5]">Bonus</TableHead>
                    <TableHead className="text-[#8A9DB5]">Amount</TableHead>
                    <TableHead className="text-[#8A9DB5]">Wagering Progress</TableHead>
                    <TableHead className="text-[#8A9DB5]">Expires</TableHead>
                    <TableHead className="text-[#8A9DB5]">Status</TableHead>
                    <TableHead className="text-[#8A9DB5]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerBonuses.map((bonus) => {
                    const typeInfo = getBonusTypeInfo(bonus.bonusType)
                    return (
                      <TableRow key={bonus._id} className="border-[#2A3F55]">
                        <TableCell>
                          <div>
                            <p className="font-medium text-[#F5F5F5]">{bonus.userId?.name || "Unknown"}</p>
                            <p className="text-xs text-[#8A9DB5]">{bonus.userId?.email || bonus.userId?.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" style={{ borderColor: typeInfo.color, color: typeInfo.color }}>
                              {typeInfo.label}
                            </Badge>
                            <span className="text-xs text-[#8A9DB5]">{bonus.bonusCode}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-[#F5F5F5]">{formatCurrency(bonus.bonusAmount)}</p>
                            <p className="text-xs text-[#8A9DB5]">{formatCurrency(bonus.bonusRemaining)} remaining</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#8A9DB5]">{formatCurrency(bonus.wagering?.completed || 0)}</span>
                              <span className="text-[#F5F5F5]">{(bonus.wagering?.progress || 0).toFixed(0)}%</span>
                            </div>
                            <Progress value={bonus.wagering?.progress || 0} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="text-[#F5F5F5]">{formatDate(bonus.expiresAt)}</TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[bonus.status]} text-white`}>{bonus.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1A2F45] border-[#2A3F55]">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedBonus(bonus)
                                  setShowBonusDetails(true)
                                }}
                                className="text-[#F5F5F5]"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {["active", "wagering"].includes(bonus.status) && (
                                <DropdownMenuItem onClick={() => handleCancelBonus(bonus._id)} className="text-red-400">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel Bonus
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {playerBonuses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-[#8A9DB5] py-8">
                        No player bonuses found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-[#2A3F55] text-[#B8C5D6]"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-[#B8C5D6]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-[#2A3F55] text-[#B8C5D6]"
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Cashback Levels Tab */}
        <TabsContent value="cashback" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashbackLevels.map((level) => (
              <Card
                key={level._id}
                className="bg-[#0D1F35] border-[#2A3F55]"
                style={{ borderLeftColor: level.color, borderLeftWidth: 4 }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                        <Star className="w-5 h-5" style={{ color: level.color }} />
                        Tier {level.tier}: {level.name}
                      </CardTitle>
                      <p className="text-sm text-[#8A9DB5] mt-1">Min. {formatCurrency(level.minMonthlyWager)}/month</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1A2F45] border-[#2A3F55]">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCashback(level)
                            setShowCashbackDialog(true)
                          }}
                          className="text-[#F5F5F5]"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-[#1A2F45] p-2 rounded">
                        <p className="text-[#8A9DB5]">Sports</p>
                        <p className="text-[#F5F5F5] font-medium">{level.rates?.sports || 0}%</p>
                      </div>
                      <div className="bg-[#1A2F45] p-2 rounded">
                        <p className="text-[#8A9DB5]">Casino</p>
                        <p className="text-[#F5F5F5] font-medium">{level.rates?.casino || 0}%</p>
                      </div>
                      <div className="bg-[#1A2F45] p-2 rounded">
                        <p className="text-[#8A9DB5]">Live Casino</p>
                        <p className="text-[#F5F5F5] font-medium">{level.rates?.live_casino || 0}%</p>
                      </div>
                      <div className="bg-[#1A2F45] p-2 rounded">
                        <p className="text-[#8A9DB5]">Virtual</p>
                        <p className="text-[#F5F5F5] font-medium">{level.rates?.virtual_sports || 0}%</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {level.benefits?.prioritySupport && (
                        <Badge className="bg-blue-500/20 text-blue-400">Priority Support</Badge>
                      )}
                      {level.benefits?.fasterWithdrawals && (
                        <Badge className="bg-green-500/20 text-green-400">Fast Withdrawals</Badge>
                      )}
                      {level.benefits?.personalManager && (
                        <Badge className="bg-purple-500/20 text-purple-400">Personal Manager</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {cashbackLevels.length === 0 && (
              <Card className="bg-[#0D1F35] border-[#2A3F55] col-span-full">
                <CardContent className="py-12 text-center">
                  <Percent className="w-12 h-12 text-[#8A9DB5] mx-auto mb-4" />
                  <p className="text-[#8A9DB5]">No cashback levels configured</p>
                  <Button onClick={() => setShowCashbackDialog(true)} className="mt-4 bg-[#FFD700] text-[#0A1A2F]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Level
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <TemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        template={selectedTemplate}
        onSave={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}
      />

      {/* Cashback Level Dialog */}
      <CashbackLevelDialog
        open={showCashbackDialog}
        onOpenChange={setShowCashbackDialog}
        level={selectedCashback}
        onSave={async (data) => {
          const token = getAuthToken()
          const action = selectedCashback ? "update_cashback_level" : "create_cashback_level"
          const res = await fetch("/api/super/bonus-engine", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action,
              levelId: selectedCashback?._id,
              data,
            }),
          })
          const result = await res.json()
          if (result.success) {
            toast.success(selectedCashback ? "Level updated" : "Level created")
            setShowCashbackDialog(false)
            setSelectedCashback(null)
            fetchData()
          }
        }}
      />

      {/* Bonus Details Dialog */}
      <Dialog open={showBonusDetails} onOpenChange={setShowBonusDetails}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#F5F5F5]">Bonus Details</DialogTitle>
          </DialogHeader>
          {selectedBonus && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-sm text-[#8A9DB5]">Player</p>
                  <p className="text-[#F5F5F5] font-medium">
                    {selectedBonus.userId?.name || selectedBonus.userId?.email}
                  </p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-sm text-[#8A9DB5]">Status</p>
                  <Badge className={`${STATUS_COLORS[selectedBonus.status]} text-white`}>{selectedBonus.status}</Badge>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-sm text-[#8A9DB5]">Bonus Amount</p>
                  <p className="text-green-400 font-medium">{formatCurrency(selectedBonus.bonusAmount)}</p>
                </div>
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-sm text-[#8A9DB5]">Remaining</p>
                  <p className="text-[#F5F5F5] font-medium">{formatCurrency(selectedBonus.bonusRemaining)}</p>
                </div>
              </div>

              <div className="bg-[#1A2F45] p-4 rounded-lg">
                <p className="text-sm text-[#8A9DB5] mb-2">Wagering Progress</p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#B8C5D6]">
                    {formatCurrency(selectedBonus.wagering?.completed || 0)} /{" "}
                    {formatCurrency(selectedBonus.wagering?.requirement || 0)}
                  </span>
                  <span className="text-[#F5F5F5]">{(selectedBonus.wagering?.progress || 0).toFixed(1)}%</span>
                </div>
                <Progress value={selectedBonus.wagering?.progress || 0} className="h-3" />
              </div>

              {selectedBonus.freeBets?.total > 0 && (
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-sm text-[#8A9DB5] mb-2">Free Bets</p>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-[#8A9DB5]">Total</p>
                      <p className="text-[#F5F5F5]">{selectedBonus.freeBets.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A9DB5]">Used</p>
                      <p className="text-[#F5F5F5]">{selectedBonus.freeBets.used}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A9DB5]">Remaining</p>
                      <p className="text-green-400">{selectedBonus.freeBets.remaining}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBonus.history?.length > 0 && (
                <div className="bg-[#1A2F45] p-4 rounded-lg">
                  <p className="text-sm text-[#8A9DB5] mb-2">History</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedBonus.history.map((entry, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b border-[#2A3F55] pb-2">
                        <span className="text-[#B8C5D6]">{entry.action}</span>
                        <span className="text-[#8A9DB5]">{formatDate(entry.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}

// Template Dialog Component
function TemplateDialog({ open, onOpenChange, template, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    type: "deposit_match",
    category: "all",
    status: "draft",
    value: { amount: 100, maxAmount: 500, minDeposit: 10 },
    wagering: { multiplier: 10, minOdds: 1.5 },
    validity: { daysToExpire: 30, daysToWager: 30 },
    freeBet: { count: 1, amountPerBet: 10, minOdds: 1.5 },
    freeSpins: { count: 50, valuePerSpin: 0.1 },
    comboBoost: { minLegs: 3, boostPerLeg: 5, maxBoost: 100 },
    cashback: { percentage: 10, maxAmount: 1000, period: "weekly" },
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        code: template.code || "",
        description: template.description || "",
        type: template.type || "deposit_match",
        category: template.category || "all",
        status: template.status || "draft",
        value: template.value || { amount: 100, maxAmount: 500, minDeposit: 10 },
        wagering: template.wagering || { multiplier: 10, minOdds: 1.5 },
        validity: template.validity || { daysToExpire: 30, daysToWager: 30 },
        freeBet: template.freeBet || { count: 1, amountPerBet: 10, minOdds: 1.5 },
        freeSpins: template.freeSpins || { count: 50, valuePerSpin: 0.1 },
        comboBoost: template.comboBoost || { minLegs: 3, boostPerLeg: 5, maxBoost: 100 },
        cashback: template.cashback || { percentage: 10, maxAmount: 1000, period: "weekly" },
      })
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        type: "deposit_match",
        category: "all",
        status: "draft",
        value: { amount: 100, maxAmount: 500, minDeposit: 10 },
        wagering: { multiplier: 10, minOdds: 1.5 },
        validity: { daysToExpire: 30, daysToWager: 30 },
        freeBet: { count: 1, amountPerBet: 10, minOdds: 1.5 },
        freeSpins: { count: 50, valuePerSpin: 0.1 },
        comboBoost: { minLegs: 3, boostPerLeg: 5, maxBoost: 100 },
        cashback: { percentage: 10, maxAmount: 1000, period: "weekly" },
      })
    }
  }, [template])

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      toast.error("Name and code are required")
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0D1F35] border-[#2A3F55] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F5]">
            {template ? "Edit Bonus Template" : "Create Bonus Template"}
          </DialogTitle>
          <DialogDescription className="text-[#8A9DB5]">
            Configure all bonus parameters including wagering requirements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#FFD700]">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Welcome Bonus 100%"
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME100"
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#B8C5D6]">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Get 100% match on your first deposit..."
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                    {BONUS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Value Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#FFD700]">Value Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">
                  {formData.type === "deposit_match" || formData.type === "reload_bonus"
                    ? "Match %"
                    : formData.type === "cashback"
                      ? "Cashback %"
                      : "Amount"}
                </Label>
                <Input
                  type="number"
                  value={formData.value.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: { ...formData.value, amount: Number.parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Max Amount</Label>
                <Input
                  type="number"
                  value={formData.value.maxAmount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: { ...formData.value, maxAmount: Number.parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Min Deposit</Label>
                <Input
                  type="number"
                  value={formData.value.minDeposit || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: { ...formData.value, minDeposit: Number.parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>
          </div>

          {/* Type-specific fields */}
          {formData.type === "free_bet" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#FFD700]">Free Bet Settings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Number of Free Bets</Label>
                  <Input
                    type="number"
                    value={formData.freeBet.count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeBet: { ...formData.freeBet, count: Number.parseInt(e.target.value) || 1 },
                      })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Amount Per Bet</Label>
                  <Input
                    type="number"
                    value={formData.freeBet.amountPerBet}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeBet: { ...formData.freeBet, amountPerBet: Number.parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Min Odds</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.freeBet.minOdds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeBet: { ...formData.freeBet, minOdds: Number.parseFloat(e.target.value) || 1.5 },
                      })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.type === "free_spins" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#FFD700]">Free Spins Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Number of Spins</Label>
                  <Input
                    type="number"
                    value={formData.freeSpins.count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeSpins: { ...formData.freeSpins, count: Number.parseInt(e.target.value) || 0 },
                      })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Value Per Spin</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.freeSpins.valuePerSpin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeSpins: { ...formData.freeSpins, valuePerSpin: Number.parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.type === "combo_boost" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#FFD700]">Combo Boost Settings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Min Legs</Label>
                  <Input
                    type="number"
                    value={formData.comboBoost.minLegs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comboBoost: { ...formData.comboBoost, minLegs: Number.parseInt(e.target.value) || 3 },
                      })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Boost % Per Leg</Label>
                  <Input
                    type="number"
                    value={formData.comboBoost.boostPerLeg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comboBoost: { ...formData.comboBoost, boostPerLeg: Number.parseFloat(e.target.value) || 5 },
                      })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Max Boost %</Label>
                  <Input
                    type="number"
                    value={formData.comboBoost.maxBoost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comboBoost: { ...formData.comboBoost, maxBoost: Number.parseFloat(e.target.value) || 100 },
                      })
                    }
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wagering Requirements */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#FFD700]">Wagering Requirements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Wagering Multiplier (x)</Label>
                <Input
                  type="number"
                  value={formData.wagering.multiplier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wagering: { ...formData.wagering, multiplier: Number.parseFloat(e.target.value) || 1 },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Min Odds</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.wagering.minOdds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wagering: { ...formData.wagering, minOdds: Number.parseFloat(e.target.value) || 1.5 },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>
          </div>

          {/* Validity */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#FFD700]">Validity & Expiration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Days to Use Bonus</Label>
                <Input
                  type="number"
                  value={formData.validity.daysToExpire}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validity: { ...formData.validity, daysToExpire: Number.parseInt(e.target.value) || 30 },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Days to Complete Wagering</Label>
                <Input
                  type="number"
                  value={formData.validity.daysToWager}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validity: { ...formData.validity, daysToWager: Number.parseInt(e.target.value) || 30 },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#2A3F55]">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#FFD700] text-[#0A1A2F]">
            {template ? "Update Template" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Cashback Level Dialog
function CashbackLevelDialog({ open, onOpenChange, level, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    tier: 1,
    minMonthlyWager: 0,
    rates: { sports: 5, casino: 3, live_casino: 2, virtual_sports: 4 },
    maxCashbackPerDay: 100,
    maxCashbackPerWeek: 500,
    maxCashbackPerMonth: 2000,
    wageringRequirement: 1,
    color: "#FFD700",
    benefits: {
      prioritySupport: false,
      exclusivePromotions: false,
      higherLimits: false,
      fasterWithdrawals: false,
      personalManager: false,
    },
  })

  useEffect(() => {
    if (level) {
      setFormData({
        name: level.name || "",
        tier: level.tier || 1,
        minMonthlyWager: level.minMonthlyWager || 0,
        rates: level.rates || { sports: 5, casino: 3, live_casino: 2, virtual_sports: 4 },
        maxCashbackPerDay: level.maxCashbackPerDay || 100,
        maxCashbackPerWeek: level.maxCashbackPerWeek || 500,
        maxCashbackPerMonth: level.maxCashbackPerMonth || 2000,
        wageringRequirement: level.wageringRequirement || 1,
        color: level.color || "#FFD700",
        benefits: level.benefits || {},
      })
    }
  }, [level])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0D1F35] border-[#2A3F55] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F5]">{level ? "Edit Cashback Level" : "Add Cashback Level"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#B8C5D6]">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bronze, Silver, Gold..."
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#B8C5D6]">Tier</Label>
              <Input
                type="number"
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: Number.parseInt(e.target.value) || 1 })}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#B8C5D6]">Min Monthly Wager</Label>
            <Input
              type="number"
              value={formData.minMonthlyWager}
              onChange={(e) => setFormData({ ...formData, minMonthlyWager: Number.parseFloat(e.target.value) || 0 })}
              className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#B8C5D6]">Cashback Rates (%)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-[#8A9DB5]">Sports</Label>
                <Input
                  type="number"
                  value={formData.rates.sports}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rates: { ...formData.rates, sports: Number.parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#8A9DB5]">Casino</Label>
                <Input
                  type="number"
                  value={formData.rates.casino}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rates: { ...formData.rates, casino: Number.parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#B8C5D6]">Benefits</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(formData.benefits).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        benefits: { ...formData.benefits, [key]: checked },
                      })
                    }
                  />
                  <Label className="text-sm text-[#B8C5D6]">
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#2A3F55]">
            Cancel
          </Button>
          <Button onClick={() => onSave(formData)} className="bg-[#FFD700] text-[#0A1A2F]">
            {level ? "Update Level" : "Add Level"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
