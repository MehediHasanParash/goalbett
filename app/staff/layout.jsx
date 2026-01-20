"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { getAuthToken, getUser } from "@/lib/auth-service"
import {
  DollarSign,
  Users,
  HeadphonesIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ROLE_CONFIG = {
  finance_manager: {
    title: "Finance Manager",
    path: "/staff/finance",
    icon: DollarSign,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  general_manager: {
    title: "General Manager",
    path: "/staff/gm",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  support_manager: {
    title: "Support Manager",
    path: "/staff/support",
    icon: HeadphonesIcon,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  support_agent: {
    title: "Support Agent",
    path: "/staff/support",
    icon: HeadphonesIcon,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
}

export default function StaffLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isLoginPage = pathname === "/staff/login"

  const handleLogout = () => {
    // Implement logout logic here
    router.push("/staff/login")
  }

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      const token = getAuthToken()
      const userData = getUser()

      if (!token || !userData) {
        router.push("/staff/login")
        return
      }

      const allowedRoles = ["finance_manager", "general_manager", "support_manager", "support_agent"]
      if (!allowedRoles.includes(userData.role)) {
        router.push("/staff/login")
        return
      }

      setUser(userData)
      setLoading(false)

      // Redirect to correct dashboard based on role
      const roleConfig = ROLE_CONFIG[userData.role]
      if (roleConfig && pathname === "/staff") {
        router.push(roleConfig.path)
      }
    }

    checkAuth()
  }, [router, pathname, isLoginPage])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const roleConfig = user ? ROLE_CONFIG[user.role] : null
  const RoleIcon = roleConfig?.icon || LayoutDashboard

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left - Logo & Role */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link href={roleConfig?.path || "/staff"} className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${roleConfig?.bgColor || "bg-primary/10"}`}>
                <RoleIcon className={`h-5 w-5 ${roleConfig?.color || "text-primary"}`} />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-foreground">{roleConfig?.title || "Staff Portal"}</h1>
                <p className="text-xs text-muted-foreground">{user?.tenantId?.name || "Tenant"}</p>
              </div>
            </Link>
          </div>

          {/* Right - User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={roleConfig?.bgColor}>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{roleConfig?.title}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground">
                <Building2 className="mr-2 h-4 w-4" />
                {user?.tenantId?.name || "Tenant"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">{children}</main>
    </div>
  )
}
