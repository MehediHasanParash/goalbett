"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Menu,
  X,
  BarChart3,
  Users,
  UserCog,
  CreditCard,
  TrendingUp,
  LogOut,
  Palette,
  Shield,
  Lock,
  SettingsIcon,
  Wallet,
  UserPlus,
  Ticket,
} from "lucide-react"
import RoleProtectedLayout from "@/components/auth/role-protected-layout"
import { ROLES, logout } from "@/lib/auth-service"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TenantPlayerManagement } from "@/components/admin/tenant-player-management"
import { TenantAgentManagement } from "@/components/admin/tenant-agent-management"
import { TenantBrandConfig } from "@/components/admin/tenant-brand-config"
import { AdminAnalytics } from "@/components/admin/admin-analytics"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { TransactionHistory } from "@/components/dashboard/transaction-history"
import { LiveBettingFeed } from "@/components/dashboard/live-betting-feed"
import { ActivityLog } from "@/components/dashboard/activity-log"
import { AdminControlsSettings } from "@/components/admin/admin-controls-settings"
import { AdminPermissions } from "@/components/admin/admin-permissions"
import { TenantSettings } from "@/components/admin/tenant-settings"
import { TenantWallet } from "@/components/dashboard/tenant-wallet"
import { BannerManagement } from "@/components/admin/banner-management"
import { TenantVouchers } from "@/components/admin/tenant-vouchers" // Assuming TenantVouchers component exists

function DashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [tenantInfo, setTenantInfo] = useState(null)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab")
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    fetchTenantInfo()
    fetchDashboardStats()
  }, [])

  const fetchTenantInfo = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/tenant/current", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success && data.tenant) {
        setTenantInfo(data.tenant)
      }
    } catch (error) {
      console.error("Error fetching tenant info:", error)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/tenant/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success && data.stats) {
        setDashboardStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const navigationItems = [
    { icon: BarChart3, label: "Overview", id: "overview" },
    { icon: Users, label: "Players", id: "players" },
    { icon: UserCog, label: "Agents", id: "agents" },
    { icon: UserPlus, label: "Staff Management", id: "staff", isRoute: true, path: "/t/staff" },
    { icon: CreditCard, label: "Transactions", id: "transactions" },
    { icon: TrendingUp, label: "Analytics", id: "analytics" },
    { icon: Shield, label: "Admin Controls", id: "admin-controls" },
    { icon: Lock, label: "Permissions", id: "permissions" },
    { icon: Wallet, label: "Wallet", id: "wallet", isRoute: true, path: "/t/wallet" },
    { icon: Ticket, label: "Vouchers", id: "vouchers", isRoute: true, path: "/t/vouchers" },
    { icon: Palette, label: "Banners", id: "banners" },
    { icon: Palette, label: "Brand Config", id: "brand-config" },
    { icon: SettingsIcon, label: "Settings", id: "settings" },
  ]

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
    return `$${amount?.toFixed(2) || "0.00"}`
  }

  return (
    <RoleProtectedLayout requiredRole={ROLES.TENANT_ADMIN}>
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]">
        {/* Mobile Sidebar */}
        <div className={`lg:hidden fixed inset-0 z-40 ${sidebarOpen ? "block" : "hidden"}`}>
          <button onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 h-screen w-64 bg-[#0D1F35] border-r border-[#2A3F55] p-4 overflow-y-auto">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-[#F5F5F5]">
              <X className="w-6 h-6" />
            </button>
            {tenantInfo && (
              <div className="mt-12 mb-6 p-4 bg-[#1A2F45] rounded-lg border border-[#FFD700]/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center font-bold text-[#0A1A2F]">
                    {tenantInfo.name?.charAt(0) || "T"}
                  </div>
                  <div>
                    <p className="text-[#F5F5F5] font-semibold text-sm">{tenantInfo.name || "Tenant"}</p>
                    <p className="text-[#B8C5D6] text-xs">{tenantInfo.email || ""}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#B8C5D6]">Balance:</span>
                    <span className="text-[#FFD700] font-semibold">
                      ${tenantInfo.wallet?.balance?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B8C5D6]">Domain:</span>
                    <span className="text-[#F5F5F5] font-mono text-[10px]">
                      {tenantInfo.primaryDomain || tenantInfo.subdomain || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B8C5D6]">Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tenantInfo.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {tenantInfo.status || "active"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isRoute) {
                      router.push(item.path)
                    } else {
                      setActiveTab(item.id)
                    }
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:block lg:w-64 lg:h-screen lg:bg-[#0D1F35] lg:border-r lg:border-[#2A3F55] lg:p-6 lg:overflow-y-auto">
          <h2 className="text-[#FFD700] font-bold text-lg mb-4">Tenant Admin</h2>
          {tenantInfo && (
            <div className="mb-6 p-4 bg-[#1A2F45] rounded-lg border border-[#FFD700]/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center font-bold text-[#0A1A2F] text-lg">
                  {tenantInfo.name?.charAt(0) || "T"}
                </div>
                <div>
                  <p className="text-[#F5F5F5] font-semibold">{tenantInfo.name || "Tenant"}</p>
                  <p className="text-[#B8C5D6] text-xs">{tenantInfo.email || ""}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-[#0A1A2F] rounded">
                  <span className="text-[#B8C5D6]">Balance:</span>
                  <span className="text-[#FFD700] font-bold">${tenantInfo.wallet?.balance?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="p-2 bg-[#0A1A2F] rounded">
                  <p className="text-[#B8C5D6] text-xs mb-1">Domain:</p>
                  <p className="text-[#F5F5F5] font-mono text-xs break-all">
                    {tenantInfo.primaryDomain || tenantInfo.subdomain || "N/A"}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#B8C5D6]">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      tenantInfo.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {tenantInfo.status || "active"}
                  </span>
                </div>
              </div>
            </div>
          )}
          <nav className="space-y-4">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isRoute) {
                    router.push(item.path)
                  } else {
                    setActiveTab(item.id)
                  }
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-400 hover:bg-red-500/20"
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
                    <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">Tenant Admin Dashboard</h1>
                    <p className="text-sm text-[#B8C5D6] mt-1">Manage your betting network operations</p>
                  </div>
                </div>
                <NotificationBell />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 md:px-6 py-8">
            {activeTab === "settings" && <TenantSettings />}
            {activeTab === "players" && <TenantPlayerManagement />}
            {activeTab === "agents" && <TenantAgentManagement />}
            {activeTab === "staff" && <div>Staff Management Content</div>}
            {activeTab === "analytics" && <AdminAnalytics />}
            {activeTab === "brand-config" && <TenantBrandConfig />}
            {activeTab === "admin-controls" && <AdminControlsSettings />}
            {activeTab === "permissions" && <AdminPermissions />}
            {activeTab === "transactions" && <TransactionHistory />}
            {activeTab === "wallet" && <TenantWallet />}
            {activeTab === "banners" && <BannerManagement isSuperAdmin={false} />}
            {activeTab === "vouchers" && <TenantVouchers />}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* KPI Cards - Updated to use real data */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/50 rounded-xl p-6">
                    <p className="text-sm text-[#B8C5D6] mb-2">Total Players</p>
                    <h3 className="text-4xl font-bold text-[#FFD700]">
                      {statsLoading ? "..." : dashboardStats?.totalPlayers?.toLocaleString() || "0"}
                    </h3>
                    <p className="text-xs text-green-400 mt-2">
                      {dashboardStats?.playerGrowth > 0 ? "+" : ""}
                      {dashboardStats?.playerGrowth || 0}% from last month
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/50 rounded-xl p-6">
                    <p className="text-sm text-[#B8C5D6] mb-2">Active Agents</p>
                    <h3 className="text-4xl font-bold text-blue-400">
                      {statsLoading ? "..." : dashboardStats?.activeAgents || "0"}
                    </h3>
                    <p className="text-xs text-blue-400 mt-2">{dashboardStats?.subAgents || 0} sub-agents</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/50 rounded-xl p-6">
                    <p className="text-sm text-[#B8C5D6] mb-2">Monthly Revenue</p>
                    <h3 className="text-4xl font-bold text-green-400">
                      {statsLoading ? "..." : formatCurrency(dashboardStats?.monthlyRevenue || 0)}
                    </h3>
                    <p className="text-xs text-green-400 mt-2">
                      {dashboardStats?.revenueGrowth > 0 ? "+" : ""}
                      {dashboardStats?.revenueGrowth || 0}% growth
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/50 rounded-xl p-6">
                    <p className="text-sm text-[#B8C5D6] mb-2">Pending Payouts</p>
                    <h3 className="text-4xl font-bold text-purple-400">
                      {statsLoading ? "..." : formatCurrency(dashboardStats?.pendingPayouts || 0)}
                    </h3>
                    <p className="text-xs text-purple-400 mt-2">Processing soon</p>
                  </div>
                </div>

                {/* Performance Chart - Updated to use real data */}
                <div className="bg-[#0D1F35]/80 border border-[#2A3F55] rounded-xl p-6">
                  <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">6-Month Performance</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardStats?.performanceData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#B8C5D6" />
                      <YAxis stroke="#B8C5D6" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A1A2F",
                          border: "1px solid #FFD700",
                          borderRadius: "8px",
                          color: "#F5F5F5",
                        }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Network Stats - Updated to use real data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#0D1F35]/80 border border-[#2A3F55] rounded-xl p-6">
                    <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">Quick Stats</h2>
                    <div className="space-y-3">
                      {[
                        { label: "Total Bets Placed", value: dashboardStats?.totalBets?.toLocaleString() || "0" },
                        { label: "Avg Bet Value", value: `$${dashboardStats?.avgBetValue?.toFixed(2) || "0.00"}` },
                        { label: "Win Rate", value: `${dashboardStats?.winRate?.toFixed(1) || "0"}%` },
                        { label: "Player Retention", value: `${dashboardStats?.playerRetention || 0}%` },
                      ].map((stat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                          <span className="text-[#B8C5D6]">{stat.label}</span>
                          <span className="font-bold text-[#FFD700]">{statsLoading ? "..." : stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0D1F35]/80 border border-[#2A3F55] rounded-xl p-6">
                    <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">Agent Performance</h2>
                    <div className="space-y-3">
                      {statsLoading ? (
                        <div className="text-[#B8C5D6] text-center py-4">Loading agents...</div>
                      ) : dashboardStats?.topAgents?.length > 0 ? (
                        dashboardStats.topAgents.map((agent, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                            <span className="text-[#B8C5D6]">{agent.name}</span>
                            <span className="font-bold text-green-400">${agent.commission?.toFixed(2) || "0.00"}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[#B8C5D6] text-center py-4">No agents yet</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LiveBettingFeed />
                  <ActivityLog />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  )
}

export default function TenantAdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
          <div className="text-[#FFD700] text-xl">Loading...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
