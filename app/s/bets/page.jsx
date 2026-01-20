"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { BetManagement } from "@/components/admin/bet-management"
import { Card, CardContent } from "@/components/ui/card"
import { Receipt, DollarSign, TrendingUp, AlertTriangle } from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export default function BetsPage() {
  const [stats, setStats] = useState({
    todayBets: 0,
    totalStakes: 0,
    ggr: 0,
    pendingReview: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/bets?limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const formatCurrency = (amount) => {
    // Round to 2 decimal places to fix floating point precision
    const rounded = Math.round((amount || 0) * 100) / 100
    if (rounded >= 1000000) return `$${(rounded / 1000000).toFixed(1)}M`
    if (rounded >= 1000) return `$${(rounded / 1000).toFixed(1)}K`
    return `$${rounded.toFixed(2)}`
  }

  return (
    <SuperAdminLayout title="Bet Management" description="Monitor and manage all betting activity">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#FFD700]/20">
                <Receipt className="h-6 w-6 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Bets Today</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{stats.todayBets.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Stakes</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{formatCurrency(stats.totalStakes)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">GGR</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{formatCurrency(stats.ggr)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{stats.pendingReview}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <BetManagement />
      </div>
    </SuperAdminLayout>
  )
}
