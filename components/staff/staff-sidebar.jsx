"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowDownUp,
  FileText,
  Users,
  TrendingUp,
  MessageSquare,
  UserSearch,
  AlertTriangle,
  Settings,
} from "lucide-react"

const FINANCE_MENU = [
  { name: "Dashboard", href: "/staff/finance", icon: LayoutDashboard },
  { name: "Transactions", href: "/staff/finance?tab=transactions", icon: ArrowDownUp },
  { name: "Withdrawals", href: "/staff/finance?tab=withdrawals", icon: FileText },
  { name: "Reports", href: "/staff/finance?tab=reports", icon: TrendingUp },
]

const GM_MENU = [
  { name: "Dashboard", href: "/staff/gm", icon: LayoutDashboard },
  { name: "Agents", href: "/staff/gm?tab=agents", icon: Users },
  { name: "KPIs", href: "/staff/gm?tab=kpis", icon: TrendingUp },
  { name: "Settings", href: "/staff/gm?tab=settings", icon: Settings },
]

const SUPPORT_MENU = [
  { name: "Dashboard", href: "/staff/support", icon: LayoutDashboard },
  { name: "Tickets", href: "/staff/support?tab=tickets", icon: MessageSquare },
  { name: "Player Lookup", href: "/staff/support?tab=players", icon: UserSearch },
  { name: "Escalations", href: "/staff/support?tab=escalations", icon: AlertTriangle },
]

export function StaffSidebar({ role }) {
  const pathname = usePathname()

  let menuItems = []
  let title = ""

  if (role === "finance_manager") {
    menuItems = FINANCE_MENU
    title = "Finance"
  } else if (role === "general_manager") {
    menuItems = GM_MENU
    title = "Management"
  } else if (role === "support_manager" || role === "support_agent") {
    menuItems = SUPPORT_MENU
    title = "Support"
  }

  return (
    <div className="w-64 bg-card border-r min-h-screen p-4">
      <h2 className="text-lg font-semibold mb-4 px-2">{title}</h2>
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0])
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
