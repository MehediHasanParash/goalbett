"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, DollarSign, Users, RefreshCw, Plus, Edit, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthToken } from "@/lib/auth-service"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function JackpotAdminPage() {
  const { toast } = useToast()
  const [jackpots, setJackpots] = useState([])
  const [stats, setStats] = useState({
    activeRounds: 0,
    totalPoolSize: 0,
    totalParticipants: 0,
    totalRollovers: 0,
  })
  const [participationTrend, setParticipationTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedJackpot, setSelectedJackpot] = useState(null)
  const [availableMatches, setAvailableMatches] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    status: "upcoming",
    poolSize: 0,
    entryFee: 10,
    maxParticipants: 1000,
    matches: [],
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    fetchJackpots()
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      console.log("[v0] Fetching available matches...")
      const token = getAuthToken()
      const res = await fetch("/api/super/matches", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      console.log("[v0] Matches API response:", data)

      if (data.success) {
        console.log("[v0] Setting available matches:", data.matches?.length || 0, "matches")
        setAvailableMatches(data.matches || [])
      } else {
        console.error("[v0] Failed to fetch matches:", data.error)
      }
    } catch (error) {
      console.error("[v0] Error fetching matches:", error)
    }
  }

  const fetchJackpots = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const res = await fetch("/api/super/jackpots", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setJackpots(data.jackpots || [])
        setStats(data.stats || {})
        setParticipationTrend(data.participationTrend || [])
      }
    } catch (error) {
      console.error("Error fetching jackpots:", error)
      toast({
        title: "Error",
        description: "Failed to load jackpots",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      setSaving(true)
      const token = getAuthToken()

      const mapEventStatusToMatchStatus = (eventStatus) => {
        const statusMap = {
          scheduled: "pending",
          upcoming: "pending",
          live: "live",
          in_progress: "live",
          completed: "finished",
          finished: "finished",
          cancelled: "cancelled",
        }
        return statusMap[eventStatus] || "pending"
      }

      const payload = {
        name: formData.name,
        status: formData.status,
        pool: {
          initial: formData.poolSize,
          current: formData.poolSize,
        },
        entry: {
          fee: formData.entryFee,
        },
        maxParticipants: formData.maxParticipants,
        matches: formData.matches.map((matchId) => {
          const match = availableMatches.find((m) => m._id === matchId)
          return {
            eventId: match._id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.league,
            startTime: match.startTime,
            status: mapEventStatusToMatchStatus(match.status),
          }
        }),
        schedule: {
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
      }

      const res = await fetch("/api/super/jackpots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: "Success", description: "Jackpot round created" })
        setShowCreateDialog(false)
        resetForm()
        fetchJackpots()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create jackpot",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedJackpot) return

    try {
      setSaving(true)
      const token = getAuthToken()
      const res = await fetch(`/api/super/jackpots/${selectedJackpot._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: "Success", description: "Jackpot updated" })
        setShowEditDialog(false)
        setSelectedJackpot(null)
        resetForm()
        fetchJackpots()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update jackpot",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this jackpot round?")) return

    try {
      const token = getAuthToken()
      const res = await fetch(`/api/super/jackpots/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: "Success", description: "Jackpot deleted" })
        fetchJackpots()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete jackpot",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      status: "upcoming",
      poolSize: 0,
      entryFee: 10,
      maxParticipants: 1000,
      matches: [],
      startDate: "",
      endDate: "",
    })
  }

  const openEditDialog = (jackpot) => {
    setSelectedJackpot(jackpot)
    setFormData({
      name: jackpot.name || "",
      status: jackpot.status || "upcoming",
      poolSize: jackpot.pool?.current || 0,
      entryFee: jackpot.entry?.fee || 10,
      maxParticipants: jackpot.maxParticipants || 1000,
      matches: jackpot.matches || [],
      startDate: jackpot.schedule?.startDate || "",
      endDate: jackpot.schedule?.endDate || "",
    })
    setShowEditDialog(true)
  }

  const formatCurrency = (value) => {
    if (value == null) return "$0"
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toLocaleString()}`
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-500/20 text-green-400",
      upcoming: "bg-blue-500/20 text-blue-400",
      completed: "bg-gray-500/20 text-gray-400",
      cancelled: "bg-red-500/20 text-red-400",
    }
    return <Badge className={styles[status] || styles.upcoming}>{status}</Badge>
  }

  const toggleMatchSelection = (matchId) => {
    setFormData((prev) => ({
      ...prev,
      matches: prev.matches.includes(matchId)
        ? prev.matches.filter((id) => id !== matchId)
        : [...prev.matches, matchId],
    }))
  }

  const removeSelectedMatch = (matchId) => {
    setFormData((prev) => ({
      ...prev,
      matches: prev.matches.filter((id) => id !== matchId),
    }))
  }

  return (
    <SuperAdminLayout title="Jackpot Management" description="Create and manage jackpot rounds">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Active Rounds", value: stats.activeRounds || 0, icon: Zap },
            { label: "Total Pool Size", value: formatCurrency(stats.totalPoolSize), icon: DollarSign },
            { label: "Participants", value: (stats.totalParticipants || 0).toLocaleString(), icon: Users },
            { label: "Rollovers", value: stats.totalRollovers || 0, icon: Zap },
          ].map((stat, i) => (
            <Card key={i} className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#FFD700]/20">
                  <stat.icon className="h-6 w-6 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#F5F5F5]">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Participation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={participationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                <XAxis dataKey="week" stroke="#B8C5D6" />
                <YAxis stroke="#B8C5D6" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0A1A2F", border: "1px solid #2A3F55" }}
                  labelStyle={{ color: "#FFD700" }}
                />
                <Line type="monotone" dataKey="participants" stroke="#FFD700" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#FFD700]">Jackpot Rounds</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchJackpots}
                disabled={loading}
                className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                onClick={() => {
                  resetForm()
                  setShowCreateDialog(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Round
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 animate-spin text-[#FFD700]">Loading...</div>
              </div>
            ) : jackpots.length === 0 ? (
              <div className="text-center py-8 text-[#B8C5D6]">No jackpot rounds found. Create your first one!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2A3F55]">
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Pool Size</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Entry Fee</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Participants</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Matches</th>
                      <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jackpots.map((jackpot) => (
                      <tr key={jackpot._id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                        <td className="py-3 px-4 text-[#F5F5F5] font-medium">{jackpot.name}</td>
                        <td className="py-3 px-4">{getStatusBadge(jackpot.status)}</td>
                        <td className="py-3 px-4 text-[#FFD700]">${formatCurrency(jackpot.pool?.current || 0)}</td>
                        <td className="py-3 px-4 text-[#FFD700]">${(jackpot.entry?.fee || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-[#B8C5D6]">{(jackpot.participantCount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-[#B8C5D6]">{jackpot.matches?.length || 0}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300"
                              onClick={() => openEditDialog(jackpot)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => handleDelete(jackpot._id)}
                            >
                              <Trash2 className="w-4 h-4" />
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

      <Dialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setShowEditDialog(false)
            setSelectedJackpot(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">
              {showEditDialog ? "Edit Jackpot Round" : "Create Jackpot Round"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Weekly Mega Jackpot"
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pool Size ($)</Label>
                <Input
                  type="number"
                  value={formData.poolSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      poolSize: Number(e.target.value),
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label>Entry Fee ($)</Label>
                <Input
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      entryFee: Number(e.target.value),
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxParticipants: Number(e.target.value),
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Matches</Label>
              <div className="border border-[#2A3F55] rounded-lg bg-[#1A2F45] max-h-64 overflow-y-auto">
                {availableMatches.length === 0 ? (
                  <div className="p-4 text-center text-[#B8C5D6]">No matches available</div>
                ) : (
                  <div className="p-2 space-y-2">
                    {availableMatches.map((match) => (
                      <div
                        key={match._id}
                        onClick={() => toggleMatchSelection(match._id)}
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          formData.matches.includes(match._id)
                            ? "bg-[#FFD700]/20 border border-[#FFD700]"
                            : "bg-[#0D1F35] border border-[#2A3F55] hover:bg-[#1A2F45]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-[#F5F5F5]">
                              {match.homeTeam} vs {match.awayTeam}
                            </div>
                            <div className="text-sm text-[#B8C5D6]">
                              {match.league} • {new Date(match.startTime).toLocaleString()}
                            </div>
                          </div>
                          {formData.matches.includes(match._id) && <div className="text-[#FFD700]">✓</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.matches.length > 0 && (
                <div className="mt-2 space-y-1">
                  <Label className="text-sm text-[#B8C5D6]">Selected ({formData.matches.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.matches.map((matchId) => {
                      const match = availableMatches.find((m) => m._id === matchId)
                      if (!match) return null
                      return (
                        <Badge key={matchId} className="bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30 pr-1">
                          {match.homeTeam} vs {match.awayTeam}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSelectedMatch(matchId)
                            }}
                            className="ml-1 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
                setSelectedJackpot(null)
                resetForm()
              }}
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              Cancel
            </Button>
            <Button
              onClick={showEditDialog ? handleUpdate : handleCreate}
              disabled={
                saving || !formData.name || formData.matches.length === 0 || !formData.startDate || !formData.endDate
              }
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
            >
              {saving && <div className="w-4 h-4 mr-2 animate-spin">Loading...</div>}
              {showEditDialog ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}
