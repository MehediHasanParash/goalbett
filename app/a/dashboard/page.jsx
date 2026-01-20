"use client"
import AgentSidebar from "@/components/agent/agent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Wallet,
  TrendingUp,
  CreditCard,
  UserPlus,
  Receipt,
  DollarSign,
  ArrowUpRight,
  QrCode,
  Plus,
  AlertCircle,
  LogOut,
  Printer,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"
import AgentBetIdScanner from "@/components/agent/agent-betid-scanner"
import AgentCashForm from "@/components/agent/agent-cash-form"
import Link from "next/link"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { TransactionHistory } from "@/components/dashboard/transaction-history"
import { useRouter } from "next/navigation"
import { logout, getAuthToken } from "@/lib/auth-service"
import { InviteLinkCard } from "@/components/agent/invite-link-card"
import { CreditStatusCard } from "@/components/agent/credit-status-card"
import { PrintSlipModal } from "@/components/agent/print-slip-modal"

const salesData = [
  { name: "Mon", sales: 1200, commission: 120, customers: 45 },
  { name: "Tue", sales: 1900, commission: 190, customers: 52 },
  { name: "Wed", sales: 800, commission: 80, customers: 38 },
  { name: "Thu", sales: 1600, commission: 160, customers: 48 },
  { name: "Fri", sales: 2200, commission: 220, customers: 65 },
  { name: "Sat", sales: 2800, commission: 280, customers: 78 },
  { name: "Sun", sales: 2100, commission: 210, customers: 58 },
]

export default function AgentDashboard() {
  const [showCashForm, setShowCashForm] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const router = useRouter()
  const [walletBalance, setWalletBalance] = useState(null)
  const [stats, setStats] = useState({
    subAgents: { total: 0, active: 0, max: 10 },
    todaySales: { amount: 0, change: 0 },
    profit: { amount: 0, percentage: 10 },
  })
  const [loading, setLoading] = useState(true)
  const [subAgents, setSubAgents] = useState([])
  const [agentProfile, setAgentProfile] = useState({
    shopName: "Agent Shop",
    profitPercentage: 15,
    currency: "USD",
  })
  const [printSlipOpen, setPrintSlipOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    const fetchAgentData = async () => {
      setLoading(true)
      try {
        const token = getAuthToken()

        const walletResponse = await fetch("/api/wallet/balance", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const walletData = await walletResponse.json()
        if (walletData.success) {
          setWalletBalance(walletData.data)
          setAgentProfile((prev) => ({
            ...prev,
            currency: walletData.data.currency || "USD",
          }))
        }

        // Fetch sub-agents
        const subAgentsResponse = await fetch("/api/users/subagents", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (subAgentsResponse.ok) {
          const text = await subAgentsResponse.text()
          if (text && text.trim() !== "") {
            const subAgentsData = JSON.parse(text)
            console.log("[v0] Agent dashboard - fetched sub-agents:", subAgentsData)
            const subAgentsList = subAgentsData.subAgents || []
            setSubAgents(subAgentsList)

            setStats((prev) => ({
              ...prev,
              subAgents: {
                total: subAgentsList.length,
                active: subAgentsList.filter((sa) => sa.isActive).length,
                max: 10,
              },
            }))
          } else {
            console.log("[v0] Empty response from sub-agents API")
            setSubAgents([])
          }
        }

        // TODO: Fetch today's sales and profit from appropriate APIs
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgentData()
  }, [router])

  const handlePrintSlip = (transaction) => {
    setSelectedTransaction(transaction)
    setPrintSlipOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-[#0A1A2F] overflow-x-hidden">
      <AgentSidebar />

      <main className="flex-1 md:ml-64 p-6 sm:p-4 md:p-6 w-full min-w-0">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFD700]">Agent Dashboard</h1>
                  <p className="text-sm sm:text-base text-[#F5F5F5] mt-1 sm:mt-2">
                    Manage your sales network and grow your business
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <button
                    onClick={async () => {
                      await logout()
                      router.push("/auth")
                    }}
                    className="p-2 rounded-lg border border-red-500/30 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/a/credits">
                <Button
                  variant="outline"
                  className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent text-xs sm:text-sm"
                  size="sm"
                >
                  <Receipt className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Sell Credits
                </Button>
              </Link>

              <Link href="/a/subagents">
                <Button
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold text-xs sm:text-sm"
                  size="sm"
                >
                  <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Add Sub-Agent
                </Button>
              </Link>
              <Button
                onClick={() => setPrintSlipOpen(true)}
                className="bg-[#1A2F45] hover:bg-[#2A3F55] text-white border border-[#FFD700]/20"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Daily Summary
              </Button>
            </div>
          </div>

          {/* Credit Status and Invite Link cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CreditStatusCard />
            <InviteLinkCard />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[
              {
                title: "Wallet Balance",
                value: walletBalance
                  ? `${walletBalance.availableBalance?.toFixed(2) || "0.00"} ${walletBalance.currency || agentProfile.currency}`
                  : "$0.00",
                change: loading ? "Loading..." : "+5.2%",
                icon: Wallet,
                color: "bg-[#FFD700]",
                textColor: "text-[#0A1A2F]",
              },
              {
                title: "Sub-Agents",
                value: `${stats.subAgents.active}/${stats.subAgents.max}`,
                change: `${stats.subAgents.max - stats.subAgents.active} slots available`,
                icon: Users,
                color: "bg-green-500",
                textColor: "text-white",
              },
              {
                title: "Today's Sales",
                value: `${stats.todaySales.amount.toFixed(2)} ${agentProfile.currency}`,
                change: loading ? "Loading..." : `+${stats.todaySales.change}%`,
                icon: TrendingUp,
                color: "bg-blue-500",
                textColor: "text-white",
              },
              {
                title: "My Profit",
                value: `${stats.profit.amount.toFixed(2)} ${agentProfile.currency}`,
                change: `${agentProfile.profitPercentage}% of shop profit`,
                icon: CreditCard,
                color: "bg-purple-500",
                textColor: "text-white",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20 hover:border-[#FFD700] transition-all duration-300"
              >
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[#F5F5F5] text-xs sm:text-sm font-medium truncate">{stat.title}</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-1">{stat.value}</p>
                      <p className="text-green-400 text-xs sm:text-sm mt-1 truncate">{stat.change}</p>
                    </div>
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${stat.color} flex items-center justify-center flex-shrink-0 ml-2`}
                    >
                      <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0D1F35]/80 border border-[#2A3F55] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: QrCode,
                    label: "Scan BetID",
                    action: () => setShowScanner(true),
                  },
                  {
                    icon: Plus,
                    label: "Accept Bet",
                    action: () => setShowCashForm(true),
                  },
                  { icon: Wallet, label: "Withdraw", action: () => {} },
                  { icon: Users, label: "Sub-Agents", action: () => {} },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.action}
                    className="p-4 bg-[#1A2F45] border border-[#2A3F55] rounded-lg hover:bg-[#1A2F45]/80 hover:border-[#FFD700] transition-colors flex flex-col items-center gap-2"
                  >
                    <action.icon className="w-6 h-6 text-[#FFD700]" />
                    <span className="text-xs font-semibold text-[#B8C5D6]">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/30 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-[#FFD700] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#FFD700] mb-2">Profit Performance</h3>
                  <p className="text-sm text-[#B8C5D6] mb-3">
                    You earn {agentProfile.profitPercentage}% of your shop's profit. Total earned: $
                    {agentProfile.totalProfit}
                  </p>
                  <button className="px-4 py-2 bg-[#FFD700] text-[#0A1A2F] rounded font-semibold text-sm hover:bg-[#FFD700]/90">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Distribution System */}
          <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700]" />
                Digital Credit Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-[#0A1A2F]/50 p-3 sm:p-4 rounded-lg border border-[#FFD700]/30">
                  <p className="text-[#F5F5F5] text-xs sm:text-sm mb-2">Available Credits</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#FFD700]">
                    {walletBalance
                      ? `${walletBalance.availableBalance?.toFixed(2) || "0.00"} ${walletBalance.currency || agentProfile.currency}`
                      : "Loading..."}
                  </p>
                  <p className="text-xs text-green-400 mt-1">Ready to distribute</p>
                </div>
                <div className="bg-[#0A1A2F]/50 p-3 sm:p-4 rounded-lg border border-[#FFD700]/30">
                  <p className="text-[#F5F5F5] text-xs sm:text-sm mb-2">Distributed Today</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {stats.todaySales.amount.toFixed(2)} {agentProfile.currency}
                  </p>
                  <p className="text-xs text-[#F5F5F5] mt-1">15 transactions</p>
                </div>
                <div className="bg-[#0A1A2F]/50 p-3 sm:p-4 rounded-lg border border-[#FFD700]/30">
                  <p className="text-[#F5F5F5] text-xs sm:text-sm mb-2">My Profit Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-400">{agentProfile.profitPercentage}%</p>
                  <p className="text-xs text-[#F5F5F5] mt-1">Of shop profits</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
                <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold text-xs sm:text-sm">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Sell Credits to Customer
                </Button>
                <Button variant="outline" className="border-[#FFD700] text-[#FFD700] bg-transparent text-xs sm:text-sm">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Request More Credits
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sales Performance Chart */}
          <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700]" />
                Weekly Sales & Profit Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#F5F5F5" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#F5F5F5" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A1A2F",
                      border: "1px solid #FFD700",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#FFD700"
                    strokeWidth={2}
                    dot={{ fill: "#FFD700", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="commission"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }}
                    name="profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sub-Agents and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Active Sub-Agents */}
            <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700]" />
                  Active Sub-Agents Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subAgents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No sub-agents yet</p>
                    <p className="text-sm mt-1">Create your first sub-agent to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subAgents.slice(0, 4).map((agent, index) => (
                      <div
                        key={agent._id || index}
                        className="flex items-center justify-between p-3 bg-[#0A1A2F]/50 rounded-lg border border-[#FFD700]/20 hover:border-[#FFD700]/50 transition-all"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FFD700] rounded-full flex items-center justify-center relative flex-shrink-0">
                            <span className="text-xs sm:text-sm font-bold text-[#0A1A2F]">
                              {agent.fullName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "SA"}
                            </span>
                            <div
                              className={`absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                                agent.isActive ? "bg-green-500" : "bg-gray-500"
                              } border-2 border-[#0A1A2F]`}
                            ></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-xs sm:text-sm truncate">{agent.fullName}</p>
                            <p className="text-xs text-[#F5F5F5] truncate">
                              Today: {agent.todaySales} • {agent.todayCustomers} customers
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <Badge
                            variant={agent.isActive ? "default" : "secondary"}
                            className={
                              agent.isActive ? "bg-green-500 text-white text-xs" : "bg-gray-600 text-gray-300 text-xs"
                            }
                          >
                            {agent.isActive ? "Online" : "Offline"}
                          </Badge>
                          <p className="text-xs text-[#FFD700] mt-1 font-medium">Comm: {agent.todayCommission}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700]" />
                  Quick Actions Hub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: CreditCard,
                      label: "Sell Credits",
                      color: "bg-green-500",
                    },
                    {
                      icon: UserPlus,
                      label: "Add Sub-Agent",
                      color: "bg-blue-500",
                    },
                    {
                      icon: Receipt,
                      label: "View Sales",
                      color: "bg-purple-500",
                    },
                    {
                      icon: Wallet,
                      label: "Withdraw Funds",
                      color: "bg-[#FFD700]",
                    },
                  ].map((action, index) => (
                    <Button
                      key={index}
                      className={`h-16 sm:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 ${action.color} hover:scale-105 transition-all duration-300 text-white font-bold`}
                    >
                      <action.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                      <span className="text-xs sm:text-sm">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History Section */}
          <TransactionHistory onPrintSlip={handlePrintSlip} />
        </div>
      </main>

      {/* Modals */}
      {showScanner && <AgentBetIdScanner onClose={() => setShowScanner(false)} />}
      {showCashForm && <AgentCashForm onClose={() => setShowCashForm(false)} />}
      <PrintSlipModal
        open={printSlipOpen}
        onOpenChange={setPrintSlipOpen}
        transaction={selectedTransaction}
        type={selectedTransaction ? selectedTransaction.type : "daily_summary"}
      />
    </div>
  )
}
