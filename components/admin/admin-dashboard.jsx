"use client"
import { useState } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { BrandedButton } from "@/components/ui/branded-button"
import {
  Users,
  DollarSign,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Receipt,
  Shield,
  Bell,
  Upload,
  ImageIcon,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import AdminSidebar from "./admin-sidebar"

export function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [advertisements, setAdvertisements] = useState([
    { id: 1, title: "Welcome Bonus 100%", image: "/casino-bonus.png", active: true },
    { id: 2, title: "Jackpot Madness", image: "/jackpot-slots.jpg", active: true },
  ])
  const [showAdUpload, setShowAdUpload] = useState(false)

  const stats = [
    { label: "Total Users", value: "12,543", change: "+12.5%", icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "Total Bets", value: "45,231", change: "+8.2%", icon: Receipt, color: "from-green-500 to-green-600" },
    { label: "Revenue", value: "$125,679", change: "+15.3%", icon: DollarSign, color: "from-purple-500 to-purple-600" },
    { label: "Active Now", value: "1,234", change: "+5.1%", icon: Activity, color: "from-orange-500 to-orange-600" },
  ]

  const recentBets = [
    { id: "BET001", user: "John Doe", amount: "$100", odds: "2.5", status: "Won", time: "2 mins ago" },
    { id: "BET002", user: "Jane Smith", amount: "$50", odds: "1.8", status: "Pending", time: "5 mins ago" },
    { id: "BET003", user: "Mike Johnson", amount: "$200", odds: "3.2", status: "Lost", time: "10 mins ago" },
    { id: "BET004", user: "Sarah Williams", amount: "$75", odds: "2.1", status: "Won", time: "15 mins ago" },
    { id: "BET005", user: "Tom Brown", amount: "$150", odds: "1.5", status: "Pending", time: "20 mins ago" },
  ]

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", href: "/admin", active: true },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: Receipt, label: "Bets", href: "/admin/bets" },
    { icon: DollarSign, label: "Transactions", href: "/admin/transactions" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
    { icon: Shield, label: "Security", href: "/admin/security" },
    { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5]">
      {/* Sidebar */}
      <AdminSidebar />
      {/* <aside
        className={`fixed left-0 top-0 bottom-0 z-50 bg-[#0D1F35]/95 backdrop-blur-sm border-r border-[#2A3F55] transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-[#FFD700]">Admin Panel</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    item.active
                      ? "bg-[#FFD700] text-[#0A1A2F]"
                      : "text-[#B8C5D6] hover:bg-[#1A2F45] hover:text-[#F5F5F5]"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-[#2A3F55]">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside> */}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "ml-0"}`}>
        {/* Header */}
        <header className="bg-[#0D1F35]/80 backdrop-blur-sm border-b border-[#2A3F55] sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              {/* <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button> */}
              <div className="text-center ml-4">
                <h1 className="text-xl font-bold">Dashboard</h1>
                <p className="text-sm text-[#B8C5D6]">Welcome back, Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center font-bold text-[#0A1A2F]">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card3D key={index}>
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-green-400 text-sm font-medium">{stat.change}</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </Card3D>
            ))}
          </div>

          {/* Advertisement Management Section */}
          <Card3D className="mb-8">
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl mb-1">Advertisement Management</h3>
                  <p className="text-sm text-muted-foreground">Upload and manage promotional banners</p>
                </div>
                <BrandedButton variant="primary" size="sm" onClick={() => setShowAdUpload(!showAdUpload)}>
                  <Upload className="w-4 h-4" />
                  Upload Ad
                </BrandedButton>
              </div>

              {showAdUpload && (
                <div className="mb-6 p-4 bg-[#1A2F45] border border-[#2A3F55] rounded-xl">
                  <h4 className="font-semibold mb-3">Upload New Advertisement</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-2">Ad Title</label>
                      <input
                        type="text"
                        placeholder="Enter advertisement title"
                        className="w-full px-4 py-2 bg-[#0D1F35] border border-[#2A3F55] rounded-lg text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Upload Image</label>
                      <div className="border-2 border-dashed border-[#2A3F55] rounded-lg p-8 text-center hover:border-[#FFD700] transition-colors cursor-pointer">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-[#B8C5D6]" />
                        <p className="text-sm text-[#B8C5D6]">Click to upload or drag and drop</p>
                        <p className="text-xs text-[#B8C5D6] mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <BrandedButton variant="primary" size="sm" className="flex-1">
                        Save Advertisement
                      </BrandedButton>
                      <BrandedButton variant="secondary" size="sm" onClick={() => setShowAdUpload(false)}>
                        Cancel
                      </BrandedButton>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advertisements.map((ad) => (
                  <div key={ad.id} className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-4">
                    <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                      <Image src={ad.image || "/placeholder.svg"} alt={ad.title} fill className="object-cover" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{ad.title}</h4>
                        <span className={`text-xs ${ad.active ? "text-green-400" : "text-red-400"}`}>
                          {ad.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-[#FFD700] text-[#0A1A2F] rounded text-xs font-bold hover:bg-[#FFD700]/90">
                          Edit
                        </button>
                        <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold hover:bg-red-500/30">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card3D>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card3D>
              <div className="glass p-6 rounded-2xl">
                <h3 className="font-bold mb-4">Revenue Overview</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {[65, 45, 80, 55, 70, 90, 75].map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-[#FFD700] to-[#FFD700]/50 rounded-t-lg transition-all hover:from-[#FFD700] hover:to-[#FFD700]"
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card3D>

            <Card3D>
              <div className="glass p-6 rounded-2xl">
                <h3 className="font-bold mb-4">User Activity</h3>
                <div className="space-y-4">
                  {[
                    { label: "Sports Betting", value: 65, color: "bg-blue-500" },
                    { label: "Casino Games", value: 45, color: "bg-green-500" },
                    { label: "Virtual Games", value: 30, color: "bg-purple-500" },
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">{item.label}</span>
                        <span className="text-sm font-bold">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-card/50 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card3D>
          </div>

          {/* Recent Bets Table */}
          <Card3D>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">Recent Bets</h3>
                <Link href="/admin/bets">
                  <BrandedButton variant="secondary" size="sm">
                    View All
                  </BrandedButton>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2A3F55]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Bet ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Odds</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBets.map((bet, index) => (
                      <tr key={index} className="border-b border-[#2A3F55]/50 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-medium">{bet.id}</td>
                        <td className="py-3 px-4">{bet.user}</td>
                        <td className="py-3 px-4 font-bold">{bet.amount}</td>
                        <td className="py-3 px-4">{bet.odds}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              bet.status === "Won"
                                ? "bg-green-500/20 text-green-400"
                                : bet.status === "Lost"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {bet.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{bet.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card3D>
        </div>
      </div>
    </div>
  )
}
