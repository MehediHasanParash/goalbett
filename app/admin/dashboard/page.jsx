"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, Users, CreditCard, CheckCircle, XCircle, BarChart3, Settings, LogOut } from "lucide-react"
import RoleProtectedLayout from "@/components/auth/role-protected-layout"
import { ROLES, logout } from "@/lib/auth-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TenantPlayerManagement } from "@/components/admin/tenant-player-management"
import { TenantAgentManagement } from "@/components/admin/tenant-agent-management"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { TransactionHistory } from "@/components/dashboard/transaction-history"
import { LiveBettingFeed } from "@/components/dashboard/live-betting-feed"
import { ActivityLog } from "@/components/dashboard/activity-log"
import { AdminControlsSettings } from "@/components/admin/admin-controls-settings"

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [hasAdminControlsAccess, setHasAdminControlsAccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const permissions = JSON.parse(localStorage.getItem("adminPermissions") || "{}")
    const hasAccess = Object.values(permissions).some((permission) => permission === true)
    setHasAdminControlsAccess(hasAccess)
  }, [])

  const pendingApprovals = [
    { id: 1, type: "Deposit", player: "John Doe", amount: "$500", time: "5 mins ago" },
    { id: 2, type: "Withdrawal", player: "Jane Smith", amount: "$1,200", time: "15 mins ago" },
    { id: 3, type: "Deposit", player: "Ahmed Ali", amount: "$300", time: "1 hour ago" },
  ]

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const navItems = [
    { icon: BarChart3, label: "Overview", id: "overview" },
    { icon: CheckCircle, label: "Approvals", id: "approvals" },
    { icon: Users, label: "Players", id: "players" },
    { icon: Users, label: "Agents", id: "agents" },
    { icon: CreditCard, label: "Transactions", id: "transactions" },
    ...(hasAdminControlsAccess ? [{ icon: Settings, label: "Admin Controls", id: "admin-controls" }] : []),
    { icon: Settings, label: "Settings", id: "settings" },
    { icon: LogOut, label: "Logout", id: "logout", action: handleLogout, isLogout: true },
  ]

  return (
    <RoleProtectedLayout requiredRole={ROLES.ADMIN}>
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]">
        {/* Mobile Sidebar */}
        <div className={`lg:hidden fixed inset-0 z-40 ${sidebarOpen ? "block" : "hidden"}`}>
          <button onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 h-screen w-64 bg-[#0D1F35] border-r border-[#2A3F55] p-4 overflow-y-auto">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-[#F5F5F5]">
              <X className="w-6 h-6" />
            </button>
            <div className="mt-12 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isLogout) {
                      item.action()
                    } else {
                      setActiveTab(item.id)
                      setSidebarOpen(false)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.isLogout
                      ? "text-red-400 hover:bg-red-500/20"
                      : activeTab === item.id
                        ? "bg-[#FFD700] text-[#0A1A2F]"
                        : "text-[#B8C5D6] hover:bg-[#1A2F45]"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:block lg:w-64 lg:h-screen lg:bg-[#0D1F35] lg:border-r lg:border-[#2A3F55] lg:p-6">
          <h2 className="text-[#FFD700] font-bold text-lg mb-8">Casino Admin</h2>
          <nav className="space-y-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => (item.isLogout ? item.action() : setActiveTab(item.id))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.isLogout
                    ? "text-red-400 hover:bg-red-500/20"
                    : activeTab === item.id
                      ? "bg-[#FFD700] text-[#0A1A2F]"
                      : "text-[#B8C5D6] hover:bg-[#1A2F45]"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
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
                    <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">Admin Dashboard</h1>
                    <p className="text-sm text-[#B8C5D6] mt-1">Manage players, agents, and daily operations</p>
                  </div>
                </div>
                <NotificationBell />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 md:px-6 py-8">
            {activeTab === "players" && <TenantPlayerManagement />}
            {activeTab === "agents" && <TenantAgentManagement />}
            {activeTab === "admin-controls" && hasAdminControlsAccess && <AdminControlsSettings />}

            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700]/50">
                    <CardContent className="p-6">
                      <p className="text-sm text-[#B8C5D6] mb-2">Pending Approvals</p>
                      <h3 className="text-4xl font-bold text-[#FFD700]">8</h3>
                      <p className="text-xs text-yellow-400 mt-2">Requires attention</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/50">
                    <CardContent className="p-6">
                      <p className="text-sm text-[#B8C5D6] mb-2">Active Players</p>
                      <h3 className="text-4xl font-bold text-blue-400">145</h3>
                      <p className="text-xs text-blue-400 mt-2">Currently online</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/50">
                    <CardContent className="p-6">
                      <p className="text-sm text-[#B8C5D6] mb-2">Today's Deposits</p>
                      <h3 className="text-4xl font-bold text-green-400">$12.5K</h3>
                      <p className="text-xs text-green-400 mt-2">45 transactions</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/50">
                    <CardContent className="p-6">
                      <p className="text-sm text-[#B8C5D6] mb-2">Active Agents</p>
                      <h3 className="text-4xl font-bold text-purple-400">24</h3>
                      <p className="text-xs text-purple-400 mt-2">Managing players</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardHeader>
                    <CardTitle className="text-[#F5F5F5]">Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingApprovals.map((approval) => (
                        <div
                          key={approval.id}
                          className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-[#F5F5F5] font-semibold">{approval.player}</p>
                            <p className="text-[#B8C5D6] text-sm">
                              {approval.type} - {approval.amount}
                            </p>
                            <p className="text-[#B8C5D6] text-xs">{approval.time}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-500 text-red-400 bg-transparent">
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LiveBettingFeed />
                  <ActivityLog />
                </div>
              </div>
            )}

            {activeTab === "approvals" && (
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#F5F5F5]">Approval Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#B8C5D6]">Manage all pending deposits and withdrawals</p>
                </CardContent>
              </Card>
            )}

            {activeTab === "transactions" && <TransactionHistory />}

            {activeTab === "settings" && (
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#F5F5F5]">Admin Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#B8C5D6]">Configure your admin preferences</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  )
}
