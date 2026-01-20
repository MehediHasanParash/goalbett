"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  BarChart3,
  Trophy,
  Calendar,
  ImageIcon,
  Upload,
  Users,
  Receipt,
  Bell,
  CreditCard,
  TrendingUp,
  Lock,
  Palette,
  MessageSquare,
  Zap,
  Gift,
  Shield,
  Database,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react"

export default function PlayersLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    localStorage.removeItem("auth_token")
    router.push("/s/login")
  }

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", href: "/s/dashboard", key: "dashboard" },
    { icon: Trophy, label: "Sports", href: "/s/sports-management", key: "sports" },
    { icon: Calendar, label: "Matches", href: "/s/match-management", key: "matches" },
    { icon: ImageIcon, label: "Banners", href: "/s/dashboard", key: "banners" },
    { icon: Upload, label: "Games Library", href: "/s/dashboard", key: "games" },
    { icon: Users, label: "Providers", href: "/s/dashboard", key: "providers" },
    { icon: Users, label: "Tenants", href: "/s/tenant-management", key: "tenants" },
    { icon: Users, label: "Agents", href: "/s/dashboard", key: "agents" },
    { icon: Users, label: "Players", href: "/s/players", key: "players" },
    { icon: Receipt, label: "Bet Management", href: "/s/dashboard", key: "bets" },
    { icon: Bell, label: "Notifications", href: "/s/dashboard", key: "notifications" },
    { icon: CreditCard, label: "Financials", href: "/s/dashboard", key: "financials" },
    { icon: TrendingUp, label: "Analytics", href: "/s/dashboard", key: "analytics" },
    { icon: Lock, label: "Compliance", href: "/s/dashboard", key: "compliance" },
    { icon: Palette, label: "White-Label Theme", href: "/s/dashboard", key: "theme" },
    { icon: MessageSquare, label: "USSD Monitoring", href: "/s/dashboard", key: "ussd" },
    { icon: Zap, label: "Jackpot Admin", href: "/s/dashboard", key: "jackpot" },
    { icon: Gift, label: "Promotions Config", href: "/s/dashboard", key: "promotions" },
    { icon: Shield, label: "Audit Logs", href: "/s/audit-logs", key: "audit" },
    { icon: Database, label: "System", href: "/s/dashboard", key: "system" },
    { icon: Settings, label: "Admin Controls", href: "/s/dashboard", key: "admin-controls" },
    { icon: Settings, label: "Settings", href: "/s/dashboard", key: "settings" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800">
      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-40 ${sidebarOpen ? "block" : "hidden"}`}>
        <button onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/50" />
        <div className="absolute left-0 top-0 h-screen w-64 bg-[#0D1F35] border-r border-[#2A3F55] p-4 overflow-y-auto">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-[#F5F5F5]">
            <X className="w-6 h-6" />
          </button>
          <div className="mt-12 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  router.push(item.href)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-[#FFD700] text-[#0A1A2F]"
                    : "text-[#B8C5D6] hover:bg-[#1A2F45]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:block lg:w-72 lg:h-screen lg:bg-[#0D1F35] lg:border-r lg:border-[#2A3F55] lg:p-6 lg:overflow-y-auto">
        <h2 className="text-[#FFD700] font-bold text-xl mb-8">Super Admin</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-[#FFD700] text-[#0A1A2F]"
                  : "text-[#B8C5D6] hover:bg-[#1A2F45]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm text-red-400 hover:bg-red-500/20 mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-[#0D1F35] border border-[#2A3F55] rounded-lg text-[#F5F5F5]"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
