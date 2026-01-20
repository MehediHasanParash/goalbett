"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Download, ChevronLeft, ChevronRight, MoreVertical, Trash2, Eye, Ban, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { SuperAdminSidebar } from "@/components/admin/super-admin-sidebar"

export default function PlayersManagementPage() {
  const router = useRouter()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchPlayers()
  }, [currentPage, filterStatus])

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filterStatus !== "all" && { status: filterStatus }),
      })

      const response = await fetch(`/api/super/players?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players || [])
        setTotalPages(Math.ceil((data.total || 0) / 20))
      }
    } catch (error) {
      console.error("Error fetching players:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return

    try {
      setActionLoading(true)
      const token = localStorage.getItem("auth_token")

      const response = await fetch(`/api/super/players/${playerToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setPlayers(players.filter((p) => p._id !== playerToDelete._id))
        setDeleteDialogOpen(false)
        setPlayerToDelete(null)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete player")
      }
    } catch (error) {
      console.error("Error deleting player:", error)
      alert("Failed to delete player")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (player, newStatus) => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem("auth_token")

      const response = await fetch(`/api/super/players/${player._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setPlayers(players.map((p) => (p._id === player._id ? { ...p, status: newStatus } : p)))
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update player status")
      }
    } catch (error) {
      console.error("Error updating player:", error)
      alert("Failed to update player status")
    } finally {
      setActionLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExportLoading(true)
      const token = localStorage.getItem("auth_token")

      const response = await fetch(`/api/super/players?limit=10000`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch players for export")
      }

      const data = await response.json()
      const allPlayers = data.players || []

      if (allPlayers.length === 0) {
        alert("No players to export")
        return
      }

      const headers = [
        "Username",
        "Email",
        "Phone",
        "Tenant",
        "Tenant Domain",
        "Balance",
        "KYC Status",
        "Account Status",
        "Joined Date",
        "Last Login",
        "Total Bets",
        "Total Wagered",
        "Total Won",
      ]

      const csvRows = [headers.join(",")]

      allPlayers.forEach((player) => {
        const row = [
          `"${player.username || ""}"`,
          `"${player.email || ""}"`,
          `"${player.phone || ""}"`,
          `"${player.tenantName || ""}"`,
          `"${player.tenantDomain || ""}"`,
          (player.balance || 0).toFixed(2),
          `"${player.kyc_status || "unknown"}"`,
          `"${player.status || "unknown"}"`,
          `"${player.createdAt ? new Date(player.createdAt).toLocaleDateString() : ""}"`,
          `"${player.lastLogin ? new Date(player.lastLogin).toLocaleDateString() : "Never"}"`,
          player.totalBets || 0,
          (player.totalWagered || 0).toFixed(2),
          (player.totalWon || 0).toFixed(2),
        ]
        csvRows.push(row.join(","))
      })

      const csvContent = csvRows.join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `players_export_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting players:", error)
      alert("Failed to export players: " + error.message)
    } finally {
      setExportLoading(false)
    }
  }

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      searchQuery === "" ||
      player.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.phone?.includes(searchQuery)

    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#0A1A2F] flex">
      <SuperAdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 `}>
        <div className="border-b border-[#2A3F55] bg-[#0D1F35]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#FFD700] mb-1">Player Management</h1>
                <p className="text-[#B8C5D6]">Manage and monitor all players across tenants</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B8C5D6] w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5] placeholder:text-[#B8C5D6]"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-[#0A1A2F] border border-[#2A3F55] rounded-lg text-[#F5F5F5]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="blocked">Blocked</option>
                </select>
                <Button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="bg-[#FFD700] hover:bg-[#FFC700] text-[#0A1A2F] font-bold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportLoading ? "Exporting..." : "Export"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-[#1A2F45]/50 border-[#2A3F55] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0A1A2F] border-b border-[#2A3F55]">
                  <tr>
                    <th className="text-left p-4 text-[#FFD700] font-bold">Player</th>
                    <th className="text-left p-4 text-[#FFD700] font-bold">Tenant</th>
                    <th className="text-left p-4 text-[#FFD700] font-bold">Balance</th>
                    <th className="text-left p-4 text-[#FFD700] font-bold">KYC Status</th>
                    <th className="text-left p-4 text-[#FFD700] font-bold">Account Status</th>
                    <th className="text-left p-4 text-[#FFD700] font-bold">Joined</th>
                    <th className="text-right p-4 text-[#FFD700] font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A3F55]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFD700]"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[#B8C5D6]">
                        No players found
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((player) => (
                      <tr key={player._id} className="hover:bg-[#1A2F45] transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-bold text-[#F5F5F5]">{player.username || "N/A"}</div>
                            <div className="text-sm text-[#B8C5D6]">{player.email}</div>
                            <div className="text-sm text-[#B8C5D6]">{player.phone || "-"}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          {player.tenantName ? (
                            <div>
                              <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30 mb-1">
                                {player.tenantName}
                              </Badge>
                              <div className="text-xs text-[#B8C5D6]">{player.tenantDomain}</div>
                            </div>
                          ) : (
                            <span className="text-[#B8C5D6]">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-green-400">${(player.balance || 0).toFixed(2)}</div>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={
                              player.kyc_status === "verified"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : player.kyc_status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }
                          >
                            {player.kyc_status || "unknown"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={
                              player.status === "active"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : player.status === "suspended"
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }
                          >
                            {player.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-[#B8C5D6]">{new Date(player.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/s/players/${player._id}`}>
                              <Button size="sm" className="bg-[#FFD700] hover:bg-[#FFC700] text-[#0A1A2F] font-bold">
                                Manage
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-[#B8C5D6] hover:text-[#F5F5F5]"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#1A2F45] border-[#2A3F55]">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/s/players/${player._id}`)}
                                  className="text-[#F5F5F5] hover:bg-[#2A3F55] cursor-pointer"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#2A3F55]" />
                                {player.status === "active" ? (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(player, "suspended")}
                                    className="text-yellow-400 hover:bg-[#2A3F55] cursor-pointer"
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Suspend Player
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(player, "active")}
                                    className="text-green-400 hover:bg-[#2A3F55] cursor-pointer"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Activate Player
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-[#2A3F55]" />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPlayerToDelete(player)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="text-red-400 hover:bg-[#2A3F55] cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Player
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#2A3F55]">
                <div className="text-sm text-[#B8C5D6]">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5] disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5] disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A2F45] border-[#2A3F55]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#F5F5F5]">Delete Player</AlertDialogTitle>
            <AlertDialogDescription className="text-[#B8C5D6]">
              Are you sure you want to delete{" "}
              <span className="text-[#FFD700] font-semibold">{playerToDelete?.username || playerToDelete?.email}</span>?
              This action cannot be undone and will remove all associated data including bets, transactions, and wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2A3F55] text-[#F5F5F5] border-[#2A3F55] hover:bg-[#3A4F65]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlayer}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? "Deleting..." : "Delete Player"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
