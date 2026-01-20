"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import {
  Wallet,
  Users,
  TrendingUp,
  Menu,
  X,
  BarChart3,
  UserCog,
  CreditCard,
  LogOut,
  Palette,
  Shield,
  Lock,
  SettingsIcon,
  Loader2,
} from "lucide-react"
import { AdminAgentTopup } from "@/components/admin/admin-agent-topup"
import RoleProtectedLayout from "@/components/auth/role-protected-layout"
import { ROLES, logout } from "@/lib/auth-service"
import { NotificationBell } from "@/components/dashboard/notification-bell"

export default function TenantWallet() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tenantInfo, setTenantInfo] = useState(null)
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [walletStats, setWalletStats] = useState({
    totalAgents: 0,
    totalFloatDistributed: 0,
    thisMonthFloat: 0,
    loading: true,
  })

  const fetchTenantInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const timestamp = Date.now()
      const response = await fetch(`/api/tenant/current?_t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })
      const data = await response.json()
      if (data.success && data.tenant) {
        setTenantInfo(data.tenant)
        return data.tenant
      }
    } catch (error) {
      console.error("Error fetching tenant info:", error)
    }
    return null
  }, [])

  const fetchWalletStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const timestamp = Date.now()

      const agentsRes = await fetch(`/api/users/agents?_t=${timestamp}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      const agentsData = await agentsRes.json()

      const statsRes = await fetch(`/api/tenant/wallet-stats?_t=${timestamp}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      const statsData = await statsRes.json()

      setWalletStats({
        totalAgents: agentsData.success ? agentsData.data?.length || 0 : 0,
        totalFloatDistributed: statsData.success ? statsData.data?.totalFloatDistributed || 0 : 0,
        thisMonthFloat: statsData.success ? statsData.data?.thisMonthFloat || 0 : 0,
        loading: false,
      })
    } catch (error) {
      console.error("Error fetching wallet stats:", error)
      setWalletStats((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    fetchTenantInfo()
    fetchWalletStats()
  }, [fetchTenantInfo, fetchWalletStats, refreshKey])

  const handleTopupSuccess = useCallback(
    async (result) => {
      if (result?.newTenantBalance !== undefined) {
        setTenantInfo((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            wallet: {
              ...prev.wallet,
              balance: result.newTenantBalance,
            },
          }
        })
      }

      setWalletStats((prev) => ({ ...prev, loading: true }))

      await new Promise((resolve) => setTimeout(resolve, 300))

      await Promise.all([fetchTenantInfo(), fetchWalletStats()])

      setRefreshKey((prev) => prev + 1)
    },
    [fetchTenantInfo, fetchWalletStats],
  )

  const currency = tenantInfo?.settings?.currency || "USD"

  const navigationItems = [
    { icon: BarChart3, label: "Overview", id: "overview", path: "/t/dashboard" },
    { icon: Users, label: "Players", id: "players", path: "/t/dashboard?tab=players" },
    { icon: UserCog, label: "Agents", id: "agents", path: "/t/dashboard?tab=agents" },
    { icon: CreditCard, label: "Transactions", id: "transactions", path: "/t/dashboard?tab=transactions" },
    { icon: TrendingUp, label: "Analytics", id: "analytics", path: "/t/dashboard?tab=analytics" },
    { icon: Shield, label: "Admin Controls", id: "admin-controls", path: "/t/dashboard?tab=admin-controls" },
    { icon: Lock, label: "Permissions", id: "permissions", path: "/t/dashboard?tab=permissions" },
    { icon: Wallet, label: "Wallet", id: "wallet", path: "/t/wallet" },
    { icon: Palette, label: "Brand Config", id: "brand-config", path: "/t/dashboard?tab=brand-config" },
    { icon: SettingsIcon, label: "Settings", id: "settings", path: "/t/dashboard?tab=settings" },
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
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
                      {formatCurrency(tenantInfo.wallet?.balance || 0)}
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
                    router.push(item.path)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.id === "wallet" ? "bg-[#FFD700] text-[#0A1A2F]" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
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
                  <span className="text-[#FFD700] font-bold">{formatCurrency(tenantInfo.wallet?.balance || 0)}</span>
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
                  router.push(item.path)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.id === "wallet" ? "bg-[#FFD700] text-[#0A1A2F]" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
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
          <div className="bg-[#0D1F35]/80 backdrop-blur-sm border-b border-[#2A3F55] sticky top-0 z-30">
            <div className="px-4 md:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-[#F5F5F5]">
                    <Menu className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">Wallet Management</h1>
                    <p className="text-sm text-[#B8C5D6] mt-1">Top up agents and manage financial operations</p>
                  </div>
                </div>
                <NotificationBell />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#F5F5F5] text-sm mb-2">Total Agents</p>
                        {walletStats.loading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        ) : (
                          <p className="text-3xl font-bold text-white">{walletStats.totalAgents}</p>
                        )}
                      </div>
                      <Users className="w-10 h-10 text-[#FFD700]" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#F5F5F5] text-sm mb-2">Total Float Distributed</p>
                        {walletStats.loading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-green-400" />
                        ) : (
                          <p className="text-3xl font-bold text-green-400">
                            {formatCurrency(walletStats.totalFloatDistributed)}
                          </p>
                        )}
                      </div>
                      <Wallet className="w-10 h-10 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#F5F5F5] text-sm mb-2">This Month</p>
                        {walletStats.loading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        ) : (
                          <p className="text-3xl font-bold text-blue-400">
                            {formatCurrency(walletStats.thisMonthFloat)}
                          </p>
                        )}
                      </div>
                      <TrendingUp className="w-10 h-10 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Agent Topup */}
              <AdminAgentTopup onSuccess={handleTopupSuccess} />

              {/* Info Section */}
              <Card className="bg-gradient-to-br from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/30">
                <CardContent className="p-6 space-y-3 text-[#B8C5D6] text-sm">
                  <div>
                    <h4 className="text-[#FFD700] font-semibold mb-1">Funding Types:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Cash Deposit:</strong> Agent brings physical cash (requires receipt photo + witnesses)
                      </li>
                      <li>
                        <strong>Bank Transfer:</strong> Agent transfers via bank (requires bank reference)
                      </li>
                      <li>
                        <strong>Mobile Money:</strong> Agent uses M-Pesa, Orange Money, etc.
                      </li>
                      <li>
                        <strong>Credit Line:</strong> System credit to trusted agents
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 bg-[#0A1A2F]/50 rounded border border-[#FFD700]/20">
                    <p className="text-xs text-[#FFD700]">
                      Warning: Amounts over {formatCurrency(100000)} require manual review and approval
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  )
}
