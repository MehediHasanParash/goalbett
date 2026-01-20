"use client"

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
  LogOut,
  Menu,
  X,
  Wallet,
  BookOpen,
  Sparkles,
  FileBarChart,
  Scale,
  LifeBuoy,
  Key,
  UserCog,
  DollarSign,
  FlaskConical,
  PaintBucket,
  Activity,
  Network,
  AlertTriangle,
  Globe,
  FileText,
  PieChart,
  Banknote,
  ShieldAlert,
  ShieldCheck,
  Coins,
  Crown,
  MapPin,
  Ticket,
} from "lucide-react"
import { useState } from "react"
import { VersionFooter } from "@/components/ui/version-footer"

const menuItems = [
  { icon: BarChart3, label: "Dashboard", href: "/s/dashboard" },
  { icon: Crown, label: "Owner Dashboard", href: "/s/owner-dashboard" },
  { icon: ShieldCheck, label: "Security Center", href: "/s/security" },
  { icon: MapPin, label: "Geo Access Control", href: "/s/geo-access" },
  { icon: Trophy, label: "Sports", href: "/s/sports-management" },
  { icon: Calendar, label: "Matches", href: "/s/match-management" },
  { icon: ImageIcon, label: "Banners", href: "/s/banners" },
  { icon: Upload, label: "Games Library", href: "/s/games" },
  { icon: Users, label: "Providers", href: "/s/providers" },
  { icon: Users, label: "Tenants", href: "/s/tenant-management" },
  { icon: UserCog, label: "Staff Management", href: "/s/staff" },
  { icon: Users, label: "Agents", href: "/s/agents" },
  { icon: Network, label: "Agent Hierarchy", href: "/s/agent-hierarchy" },
  { icon: Users, label: "Players", href: "/s/players" },
  { icon: Ticket, label: "Vouchers", href: "/s/vouchers" }, // Added Vouchers menu item
  { icon: Receipt, label: "Bet Management", href: "/s/bets" },
  { icon: Bell, label: "Notifications", href: "/s/notifications" },
  { icon: CreditCard, label: "Financials", href: "/s/financials" },
  { icon: AlertTriangle, label: "Insolvency Alerts", href: "/s/insolvency-alerts" },
  { icon: Wallet, label: "Payment Gateways", href: "/s/payment-gateways" },
  { icon: BookOpen, label: "Wallet & Ledger", href: "/s/wallet-ledger" },
  { icon: Banknote, label: "Commission Settlement", href: "/s/commission-settlement" },
  { icon: Coins, label: "B2B Settlements", href: "/s/b2b-settlements" },
  { icon: ShieldAlert, label: "Circuit Breaker", href: "/s/circuit-breaker" },
  { icon: Sparkles, label: "Bonus Engine", href: "/s/bonus-engine" },
  { icon: TrendingUp, label: "Analytics", href: "/s/analytics" },
  { icon: PieChart, label: "BI Engine", href: "/s/bi-engine" },
  { icon: FileBarChart, label: "Reports & BI", href: "/s/reports" },
  { icon: Lock, label: "Compliance", href: "/s/compliance" },
  { icon: Shield, label: "Syndicate Alerts", href: "/s/syndicate-alerts" },
  { icon: Scale, label: "Legal & Ownership", href: "/s/legal-ownership" },
  { icon: Palette, label: "White-Label Theme", href: "/s/theme-manager" },
  { icon: PaintBucket, label: "Design Management", href: "/s/design-management" },
  { icon: MessageSquare, label: "USSD Monitoring", href: "/s/ussd-monitoring" },
  { icon: Zap, label: "Jackpot Admin", href: "/s/jackpot-admin" },
  { icon: DollarSign, label: "Jackpot Ticker", href: "/s/jackpot-ticker" },
  { icon: Gift, label: "Promotions Config", href: "/s/promotions-config" },
  { icon: Shield, label: "Audit Logs", href: "/s/audit-logs" },
  { icon: FlaskConical, label: "Sandbox Testing", href: "/s/sandbox-testing" },
  { icon: Activity, label: "Stress Test", href: "/s/stress-test" },
  { icon: Database, label: "System", href: "/s/system" },
  { icon: LifeBuoy, label: "Disaster Recovery", href: "/s/disaster-recovery" },
  { icon: Globe, label: "Domain Manager", href: "/s/domain-manager" },
  { icon: Key, label: "API Governance", href: "/s/api-governance" },
  { icon: FileText, label: "API Docs", href: "/s/api-docs" },
  { icon: Settings, label: "Admin Controls", href: "/s/admin-controls" },
  { icon: Settings, label: "Settings", href: "/s/settings" },
]

export function SuperAdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/s/login")
  }

  const isActive = (href) => {
    if (href === "/s/dashboard") {
      return pathname === "/s/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0D1F35] border border-[#2A3F55] rounded-lg text-[#F5F5F5]"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed left-0 top-0 h-full w-72 bg-[#0D1F35] border-r border-[#2A3F55] z-50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 overflow-y-auto h-full flex flex-col">
          <h2 className="text-[#FFD700] font-bold text-xl mb-8">Super Admin</h2>
          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                  isActive(item.href) ? "bg-[#FFD700] text-[#0A1A2F]" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm text-red-400 hover:bg-red-500/20 mt-4"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-semibold">Logout</span>
            </button>
          </nav>
          <div className="mt-4 pt-4 border-t border-[#2A3F55]">
            <VersionFooter variant="inline" />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:flex lg:flex-col lg:w-72 lg:h-screen lg:bg-[#0D1F35] lg:border-r lg:border-[#2A3F55] lg:p-6 lg:overflow-y-auto">
        <h2 className="text-[#FFD700] font-bold text-xl mb-8">Super Admin</h2>
        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href) ? "bg-[#FFD700] text-[#0A1A2F]" : "text-[#B8C5D6] hover:bg-[#1A2F45]"
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
        <div className="mt-4 pt-4 border-t border-[#2A3F55]">
          <VersionFooter variant="inline" />
        </div>
      </div>
    </>
  )
}

export function SuperAdminLayout({ children, title, description }) {
  return (
    <div className="min-h-screen bg-[#0A1A2F]">
      <SuperAdminSidebar />
      <div className="lg:ml-72">
        {/* Header */}
        <div className="bg-[#0D1F35]/80 backdrop-blur-sm border-b border-[#2A3F55] sticky top-0 z-30">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="pl-12 lg:pl-0">
                <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">{title}</h1>
                {description && <p className="text-sm text-[#B8C5D6] mt-1">{description}</p>}
              </div>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="px-4 md:px-6 py-8">{children}</div>
      </div>
      <VersionFooter />
    </div>
  )
}
