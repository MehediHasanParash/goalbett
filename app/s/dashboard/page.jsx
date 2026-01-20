"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Building2,
  Receipt,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { getAuthToken, getUser } from "@/lib/auth-service"

const revenueData = [
  { month: "Jan", revenue: 180000, bets: 45000 },
  { month: "Feb", revenue: 220000, bets: 52000 },
  { month: "Mar", revenue: 280000, bets: 68000 },
  { month: "Apr", revenue: 250000, bets: 58000 },
  { month: "May", revenue: 320000, bets: 72000 },
  { month: "Jun", revenue: 380000, bets: 85000 },
]

const tenantData = [
  { name: "GoalBet", value: 35 },
  { name: "AmnenBet", value: 28 },
  { name: "SportKing", value: 22 },
  { name: "Others", value: 15 },
]

const COLORS = ["#FFD700", "#4A90E2", "#50C878", "#FF6B6B"]

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalPlayers: 0,
    totalRevenue: 0,
    totalBets: 0,
    activeTenants: 0,
    pendingWithdrawals: 0,
  })

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = getAuthToken()
        const user = getUser()

        if (!token || !user) {
          router.replace("/s/login")
          return false
        }

        if (user.role !== "superadmin" && user.role !== "super_admin") {
          router.replace("/s/login")
          return false
        }

        return true
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        router.replace("/s/login")
        return false
      }
    }

    const isAuth = checkAuth()
    if (isAuth) {
      setAuthenticated(true)
      fetchStats()
    }
  }, [router])

  const fetchStats = async () => {
    try {
      const token = getAuthToken()
      const [tenantsRes, playersRes] = await Promise.all([
        fetch("/api/super/tenants", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/super/players?limit=1", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const tenantsData = await tenantsRes.json()
      const playersData = await playersRes.json()

      setStats({
        totalTenants: tenantsData.tenants?.length || 0,
        activeTenants: tenantsData.tenants?.filter((t) => t.status === "active").length || 0,
        totalPlayers: playersData.total || 0,
        totalRevenue: 2400000,
        totalBets: 458000,
        pendingWithdrawals: 23,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated || loading) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#B8C5D6]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <SuperAdminLayout title="Dashboard" description="Overview of your platform">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700]/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#B8C5D6]">Total Tenants</p>
                  <p className="text-3xl font-bold text-[#FFD700]">{stats.totalTenants}</p>
                  <p className="text-xs text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    {stats.activeTenants} active
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FFD700]/20">
                  <Building2 className="h-8 w-8 text-[#FFD700]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#B8C5D6]">Total Players</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.totalPlayers.toLocaleString()}</p>
                  <p className="text-xs text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +342 this week
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#B8C5D6]">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-400">${(stats.totalRevenue / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +12.5% this month
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/20">
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#B8C5D6]">Active Bets</p>
                  <p className="text-3xl font-bold text-purple-400">{(stats.totalBets / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-red-400 flex items-center mt-1">
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                    -2.3% today
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Receipt className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                  <XAxis dataKey="month" stroke="#B8C5D6" />
                  <YAxis stroke="#B8C5D6" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0A1A2F", border: "1px solid #2A3F55" }}
                    labelStyle={{ color: "#FFD700" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2} dot={{ fill: "#FFD700" }} />
                  <Line type="monotone" dataKey="bets" stroke="#4A90E2" strokeWidth={2} dot={{ fill: "#4A90E2" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Revenue by Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tenantData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tenantData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0A1A2F", border: "1px solid #2A3F55" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {tenantData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-[#B8C5D6] text-sm">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => router.push("/s/tenant-management")}
                className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5] h-20 flex flex-col gap-2"
              >
                <Building2 className="w-6 h-6 text-[#FFD700]" />
                <span>Add Tenant</span>
              </Button>
              <Button
                onClick={() => router.push("/s/players")}
                className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5] h-20 flex flex-col gap-2"
              >
                <Users className="w-6 h-6 text-[#FFD700]" />
                <span>View Players</span>
              </Button>
              <Button
                onClick={() => router.push("/s/financials")}
                className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5] h-20 flex flex-col gap-2"
              >
                <DollarSign className="w-6 h-6 text-[#FFD700]" />
                <span>Financials</span>
              </Button>
              <Button
                onClick={() => router.push("/s/analytics")}
                className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5] h-20 flex flex-col gap-2"
              >
                <TrendingUp className="w-6 h-6 text-[#FFD700]" />
                <span>Analytics</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">System Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-[#F5F5F5] text-sm font-medium">{stats.pendingWithdrawals} Pending Withdrawals</p>
                  <p className="text-[#B8C5D6] text-xs">Requires manual review</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-[#F5F5F5] text-sm font-medium">All Systems Operational</p>
                  <p className="text-[#B8C5D6] text-xs">99.9% uptime this month</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-[#F5F5F5] text-sm font-medium">High Traffic Detected</p>
                  <p className="text-[#B8C5D6] text-xs">45% above normal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  )
}
