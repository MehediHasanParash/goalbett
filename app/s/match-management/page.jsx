"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Save, RefreshCw, Calendar, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import RoleProtectedLayout from "@/components/auth/role-protected-layout"
import { ROLES, getAuthToken } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SuperAdminSidebar } from "@/components/admin/super-admin-sidebar"

export default function MatchManagement() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [sports, setSports] = useState([])
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedSport, setSelectedSport] = useState("all")

  const [formData, setFormData] = useState({
    name: "",
    sportId: "",
    leagueId: "",
    homeTeam: { name: "", logo: "", score: null },
    awayTeam: { name: "", logo: "", score: null },
    startTime: "",
    status: "scheduled",
    isFeatured: false,
    isBettingOpen: true,
    odds: { home: 2.0, draw: 3.5, away: 2.5 },
    betBoost: {
      enabled: false,
      placedCount: 0,
      originalOdds: 0,
      boostedOdds: 0,
      conditions: [],
      stakeAmount: 10,
      returns: 0,
    },
    markets: {
      overUnder: { line: 2.5, over: 1.8, under: 2.0 },
      bothTeamsScore: { yes: 1.9, no: 1.9 },
      doubleChance: { homeOrDraw: 1.3, homeOrAway: 1.5, drawOrAway: 1.4 },
    },
  })

  useEffect(() => {
    fetchSports()
    fetchLeagues()
    fetchEvents()
  }, [])

  const fetchSports = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/sports", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("Sports fetch error:", errorText)
        return
      }

      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setSports(data.data)
      }
    } catch (error) {
      console.error("Error fetching sports:", error)
    }
  }

  const fetchLeagues = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/leagues", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) return

      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setLeagues(data.data)
      }
    } catch (error) {
      console.error("Error fetching leagues:", error)
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const res = await fetch("/api/super/events", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        console.error("Events fetch error")
        return
      }

      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setEvents(data.data)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const token = getAuthToken()
      const url = editingEvent ? `/api/super/events/${editingEvent._id}` : "/api/super/events"
      const method = editingEvent ? "PUT" : "POST"

      const submitData = {
        ...formData,
        name: formData.name || `${formData.homeTeam.name} vs ${formData.awayTeam.name}`,
        betBoost: {
          enabled: formData.betBoost?.enabled || false,
          originalOdds: Number.parseFloat(formData.betBoost?.originalOdds) || 0,
          boostedOdds: Number.parseFloat(formData.betBoost?.boostedOdds) || 0,
          conditions: formData.betBoost?.conditions || [],
          placedBets: Number.parseInt(formData.betBoost?.placedCount) || 0,
        },
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()
      if (data.success) {
        setIsModalOpen(false)
        setEditingEvent(null)
        fetchEvents()
        resetForm()
      } else {
        console.error("[v0] Event save error:", data.error)
        alert(data.error || "Failed to save event")
      }
    } catch (error) {
      console.error("Error saving event:", error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this match?")) return

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchEvents()
      }
    } catch (error) {
      console.error("Error deleting event:", error)
    }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      name: event.name || "",
      sportId: event.sportId?._id || event.sportId || "",
      leagueId: event.leagueId?._id || event.leagueId || "",
      homeTeam: event.homeTeam || { name: "", logo: "", score: null },
      awayTeam: event.awayTeam || { name: "", logo: "", score: null },
      startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : "",
      status: event.status || "scheduled",
      isFeatured: event.isFeatured || false,
      isBettingOpen: event.isBettingOpen !== false,
      odds: event.odds || { home: 2.0, draw: 3.5, away: 2.5 },
      betBoost: event.betBoost || {
        enabled: false,
        placedCount: 0,
        originalOdds: 0,
        boostedOdds: 0,
        conditions: [],
        stakeAmount: 10,
        returns: 0,
      },
      markets: event.markets || {
        overUnder: { line: 2.5, over: 1.8, under: 2.0 },
        bothTeamsScore: { yes: 1.9, no: 1.9 },
        doubleChance: { homeOrDraw: 1.3, homeOrAway: 1.5, drawOrAway: 1.4 },
      },
    })
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      sportId: "",
      leagueId: "",
      homeTeam: { name: "", logo: "", score: null },
      awayTeam: { name: "", logo: "", score: null },
      startTime: "",
      status: "scheduled",
      isFeatured: false,
      isBettingOpen: true,
      odds: { home: 2.0, draw: 3.5, away: 2.5 },
      betBoost: {
        enabled: false,
        placedCount: 0,
        originalOdds: 0,
        boostedOdds: 0,
        conditions: [],
        stakeAmount: 10,
        returns: 0,
      },
      markets: {
        overUnder: { line: 2.5, over: 1.8, under: 2.0 },
        bothTeamsScore: { yes: 1.9, no: 1.9 },
        doubleChance: { homeOrDraw: 1.3, homeOrAway: 1.5, drawOrAway: 1.4 },
      },
    })
  }

  const filteredEvents =
    selectedSport === "all" ? events : events.filter((e) => (e.sportId?._id || e.sportId) === selectedSport)

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "bg-green-500/20 text-green-400"
      case "scheduled":
        return "bg-blue-500/20 text-blue-400"
      case "finished":
        return "bg-gray-500/20 text-gray-400"
      case "postponed":
        return "bg-yellow-500/20 text-yellow-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <RoleProtectedLayout allowedRoles={[ROLES.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]">
        <SuperAdminSidebar />

        {/* Main Content */}
        <div className="lg:ml-64">
          <div className="px-16 py-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#FFD700]">Match Management</h1>
                <p className="text-[#B8C5D6] mt-2">Manage matches, events, and betting markets</p>
              </div>
              <div className="flex gap-3">
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger className="w-48 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                    <SelectValue placeholder="Filter by sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    {sports.map((sport) => (
                      <SelectItem key={sport._id} value={sport._id}>
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    resetForm()
                    setEditingEvent(null)
                    setIsModalOpen(true)
                  }}
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Match
                </Button>
              </div>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-[#FFD700] mx-auto" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-[#B8C5D6] mx-auto mb-4" />
                <p className="text-[#B8C5D6]">No matches found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event._id} className="bg-[#0D1F35] border-[#2A3F55]">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-[#F5F5F5] text-sm truncate">
                          {event.homeTeam?.name || "TBD"} vs {event.awayTeam?.name || "TBD"}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(event)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(event._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-[#B8C5D6]">
                          <Clock className="w-4 h-4" />
                          {event.startTime ? new Date(event.startTime).toLocaleString() : "TBD"}
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                          {event.isFeatured && <Badge className="bg-[#FFD700]/20 text-[#FFD700]">Featured</Badge>}
                          {event.isBettingOpen && (
                            <Badge className="bg-green-500/20 text-green-400">Betting Open</Badge>
                          )}
                        </div>
                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-[#2A3F55]">
                          <span className="text-[#B8C5D6]">1: {event.odds?.home || "-"}</span>
                          <span className="text-[#B8C5D6]">X: {event.odds?.draw || "-"}</span>
                          <span className="text-[#B8C5D6]">2: {event.odds?.away || "-"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEvent ? "Edit Match" : "Add New Match"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Sport</Label>
                      <Select
                        value={formData.sportId}
                        onValueChange={(value) => setFormData({ ...formData, sportId: value })}
                      >
                        <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                          <SelectValue placeholder="Select sport" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                          {sports.map((sport) => (
                            <SelectItem key={sport._id} value={sport._id}>
                              {sport.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>League</Label>
                      <Select
                        value={formData.leagueId}
                        onValueChange={(value) => setFormData({ ...formData, leagueId: value })}
                      >
                        <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                          <SelectValue placeholder="Select league" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                          {leagues.map((league) => (
                            <SelectItem key={league._id} value={league._id}>
                              {league.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Home Team</Label>
                      <Input
                        value={formData.homeTeam.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            homeTeam: { ...formData.homeTeam, name: e.target.value },
                          })
                        }
                        placeholder="Manchester United"
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label>Away Team</Label>
                      <Input
                        value={formData.awayTeam.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            awayTeam: { ...formData.awayTeam, name: e.target.value },
                          })
                        }
                        placeholder="Liverpool"
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Match Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="live">Live</SelectItem>
                          <SelectItem value="finished">Finished</SelectItem>
                          <SelectItem value="postponed">Postponed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-4 h-4 accent-[#FFD700]"
                      />
                      <span className="text-sm">Featured</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isBettingOpen}
                        onChange={(e) => setFormData({ ...formData, isBettingOpen: e.target.checked })}
                        className="w-4 h-4 accent-[#FFD700]"
                      />
                      <span className="text-sm">Betting Open</span>
                    </label>
                  </div>

                  <div>
                    <h3 className="text-[#FFD700] font-semibold mb-2">Odds</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Home</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.odds.home}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              odds: { ...formData.odds, home: Number.parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                      <div>
                        <Label>Away</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.odds.away}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              odds: { ...formData.odds, away: Number.parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label>Draw</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.odds.draw}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            odds: { ...formData.odds, draw: Number.parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] w-1/2"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[#FFD700] font-semibold mb-2">Markets</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Over Under Line</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={formData.markets.overUnder.line}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              markets: {
                                ...formData.markets,
                                overUnder: {
                                  ...formData.markets.overUnder,
                                  line: Number.parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                      <div>
                        <Label>Over Odds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.markets.overUnder.over}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              markets: {
                                ...formData.markets,
                                overUnder: {
                                  ...formData.markets.overUnder,
                                  over: Number.parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label>Under Odds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.markets.overUnder.under}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              markets: {
                                ...formData.markets,
                                overUnder: {
                                  ...formData.markets.overUnder,
                                  under: Number.parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                      <div>
                        <Label>Both Teams Score - Yes Odds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.markets.bothTeamsScore.yes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              markets: {
                                ...formData.markets,
                                bothTeamsScore: {
                                  ...formData.markets.bothTeamsScore,
                                  yes: Number.parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label>Both Teams Score - No Odds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.markets.bothTeamsScore.no}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              markets: {
                                ...formData.markets,
                                bothTeamsScore: {
                                  ...formData.markets.bothTeamsScore,
                                  no: Number.parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                      <div>
                        <Label>Double Chance - Home or Draw Odds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.markets.doubleChance.homeOrDraw}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              markets: {
                                ...formData.markets,
                                doubleChance: {
                                  ...formData.markets.doubleChance,
                                  homeOrDraw: Number.parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label>Double Chance - Home or Away Odds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.markets.doubleChance.homeOrAway}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              markets: {
                                ...formData.markets,
                                doubleChance: {
                                  ...formData.markets.doubleChance,
                                  homeOrAway: Number.parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                      <div>
                        <Label>Double Chance - Draw or Away Odds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.markets.doubleChance.drawOrAway}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              markets: {
                                ...formData.markets,
                                doubleChance: {
                                  ...formData.markets.doubleChance,
                                  drawOrAway: Number.parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#FFD700] font-semibold">Bet Boost</h3>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.betBoost.enabled}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              betBoost: { ...formData.betBoost, enabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 accent-[#FFD700]"
                        />
                        <span className="text-sm">Enable Bet Boost</span>
                      </label>
                    </div>

                    {formData.betBoost.enabled && (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm text-muted-foreground">Placed Count</label>
                            <Input
                              type="number"
                              value={formData.betBoost.placedCount}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  betBoost: { ...formData.betBoost, placedCount: Number.parseInt(e.target.value) || 0 },
                                })
                              }
                              className="bg-[#0A1A2F] border-[#2A3F55]"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Original Odds</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.betBoost.originalOdds}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  betBoost: {
                                    ...formData.betBoost,
                                    originalOdds: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              className="bg-[#0A1A2F] border-[#2A3F55]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm text-muted-foreground">Boosted Odds</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.betBoost.boostedOdds}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  betBoost: {
                                    ...formData.betBoost,
                                    boostedOdds: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              className="bg-[#0A1A2F] border-[#2A3F55]"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Stake Amount ($)</label>
                            <Input
                              type="number"
                              value={formData.betBoost.stakeAmount}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  betBoost: {
                                    ...formData.betBoost,
                                    stakeAmount: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              className="bg-[#0A1A2F] border-[#2A3F55]"
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="text-sm text-muted-foreground">Betting Conditions (one per line)</label>
                          <textarea
                            value={formData.betBoost.conditions?.join("\n") || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                betBoost: {
                                  ...formData.betBoost,
                                  conditions: e.target.value.split("\n").filter((c) => c.trim()),
                                },
                              })
                            }
                            placeholder="Arsenal to Win\nBoth Teams to Score\nOver 2.5 Goals"
                            rows={4}
                            className="w-full bg-[#0A1A2F] border border-[#2A3F55] rounded-md p-2 text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Example: "Arsenal to Win", "Both Teams to Score", "Over 2.5 Goals"
                          </p>
                        </div>

                        <div className="bg-[#0A1A2F] rounded-md p-3">
                          <p className="text-sm">
                            ${formData.betBoost.stakeAmount} stake returns ${" "}
                            <span className="text-[#FFD700] font-semibold">
                              {(formData.betBoost.stakeAmount * formData.betBoost.boostedOdds).toFixed(2)}
                            </span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  )
}
