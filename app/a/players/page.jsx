"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AgentSidebar from "@/components/agent/agent-sidebar"
import PlayerAccountCreator from "@/components/agent/player-account-creator"
import { getAuthToken, parseToken } from "@/lib/auth-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, UserPlus, TrendingUp, Printer } from "lucide-react"
import { PrintSlipModal } from "@/components/agent/print-slip-modal"

export default function AgentPlayersPage() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    newThisMonth: 0,
    totalValue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState("USD")
  const router = useRouter()
  const [printSlipOpen, setPrintSlipOpen] = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    if (!token || token === "null") {
      router.push("/a/login")
      return
    }

    const userData = parseToken(token)
    if (!userData || userData.role !== "agent") {
      router.push("/a/login")
      return
    }

    fetchPlayerStats()
    fetchCurrency()
  }, [router])

  const fetchCurrency = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch("/api/agent/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success && data.data.currency) {
        setCurrency(data.data.currency)
      }
    } catch (error) {
      console.error("Error fetching currency:", error)
    }
  }

  const fetchPlayerStats = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch("/api/users/players", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const players = data.players || []

        const now = new Date()
        const thisMonth = players.filter((p) => {
          const created = new Date(p.createdAt)
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
        })

        const totalValue = players.reduce((sum, p) => sum + (p.balance || 0), 0)

        setStats({
          totalPlayers: players.length,
          activePlayers: players.filter((p) => p.status === "active").length,
          newThisMonth: thisMonth.length,
          totalValue: totalValue,
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching player stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayerCreated = () => {
    console.log("[v0] Player created, refreshing stats...")
    fetchPlayerStats()
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0A1A2F] to-[#1A2F45]">
      <AgentSidebar />

      <div className="flex-1 md:ml-64">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#FFD700]">Player Management</h1>
              <p className="text-[#B8C5D6] mt-2">Create and manage player accounts</p>
            </div>
            <Button
              onClick={() => setPrintSlipOpen(true)}
              className="bg-[#1A2F45] hover:bg-[#2A3F55] text-white border border-[#FFD700]/20"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Summary
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#B8C5D6]">Total Players</CardTitle>
                <Users className="h-4 w-4 text-[#FFD700]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{loading ? "..." : stats.totalPlayers}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#B8C5D6]">Active Players</CardTitle>
                <UserCheck className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{loading ? "..." : stats.activePlayers}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#B8C5D6]">New This Month</CardTitle>
                <UserPlus className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{loading ? "..." : stats.newThisMonth}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#B8C5D6]">Total Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">
                  {loading ? "..." : `${stats.totalValue.toFixed(2)} ${currency}`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Player Creator Component */}
          <PlayerAccountCreator onPlayerCreated={handlePlayerCreated} />
        </div>
      </div>

      <PrintSlipModal open={printSlipOpen} onOpenChange={setPrintSlipOpen} type="daily_summary" />
    </div>
  )
}
