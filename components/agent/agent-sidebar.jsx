"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Wallet,
  BarChart3,
  CreditCard,
  TrendingUp,
  Menu,
  X,
  Receipt,
  Settings,
  Ticket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getAuthToken, parseToken } from "@/lib/auth-service"

const agentMenuItems = [
  {
    title: "Dashboard",
    href: "/a/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Sub-Agents",
    href: "/a/subagents",
    icon: Users,
  },
  {
    title: "Players",
    href: "/a/players",
    icon: Users,
  },
  {
    title: "Place Bet for Customer",
    href: "/a/place-bet-customer",
    icon: Receipt,
  },
  {
    title: "Sell Credits",
    href: "/a/credits",
    icon: CreditCard,
  },
  {
    title: "Vouchers",
    href: "/a/vouchers",
    icon: Ticket,
  },
  {
    title: "Wallet",
    href: "/a/wallet",
    icon: Wallet,
  },
  {
    title: "Request Credits",
    href: "/a/request-credits",
    icon: BarChart3,
  },
  {
    title: "Commission",
    href: "/a/commission",
    icon: TrendingUp,
  },
  {
    title: "Settings",
    href: "/a/settings",
    icon: Settings,
  },
]

export default function AgentSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const [agentData, setAgentData] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)

  useEffect(() => {
    const fetchAgentData = async () => {
      const token = getAuthToken()
      if (!token || token === "null") return

      const userData = parseToken(token)
      if (!userData) return

      try {
        const [profileResponse, walletResponse] = await Promise.all([
          fetch(`/api/users/profile/${userData.userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/wallet/balance", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (profileResponse.ok) {
          const data = await profileResponse.json()
          setAgentData(data.user)
        }

        if (walletResponse.ok) {
          const walletData = await walletResponse.json()
          if (walletData.success) {
            setWalletBalance(walletData.data)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching agent data:", error)
      }
    }

    fetchAgentData()
  }, [])

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-[#FFD700]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#0A1A2F] border-r border-[#FFD700]/20 transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-[#FFD700]/20">
            <h1 className="text-xl font-bold text-[#FFD700]">Agent Panel</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {agentMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-[#FFD700] text-[#0A1A2F]"
                      : "text-[#F5F5F5] hover:bg-[#FFD700]/10 hover:text-[#FFD700]",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          {/* Agent info */}
          <div className="p-4 border-t border-[#FFD700]/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-[#0A1A2F]">
                  {agentData?.fullName
                    ? agentData.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "A"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{agentData?.fullName || "Agent"}</p>
                <p className="text-xs text-[#F5F5F5]">Agent Owner</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-[#FFD700]/10 rounded-lg border border-[#FFD700]/30">
              <p className="text-xs text-[#F5F5F5]">Wallet Balance</p>
              <p className="text-lg font-bold text-[#FFD700]">
                {walletBalance
                  ? `${walletBalance.availableBalance?.toFixed(2) || "0.00"} ${walletBalance.currency || "ETB"}`
                  : "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
