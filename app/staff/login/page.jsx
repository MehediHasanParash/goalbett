"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { BrandedButton } from "@/components/ui/branded-button"
import { setAuthToken, setUser, ROLE_PATHS } from "@/lib/auth-service"
import { STAFF_ROLES, ROLE_DISPLAY_NAMES } from "@/lib/staff-permissions"
import { Eye, EyeOff, Users, DollarSign, Headphones, Briefcase } from "lucide-react"

export default function StaffLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setAuthToken(data.token)
        setUser(data.user)

        // Redirect based on staff role
        const redirectPath = ROLE_PATHS[data.user.role] || "/staff"
        router.push(redirectPath)
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    }

    setLoading(false)
  }

  const roleIcons = {
    [STAFF_ROLES.FINANCE_MANAGER]: DollarSign,
    [STAFF_ROLES.GENERAL_MANAGER]: Briefcase,
    [STAFF_ROLES.SUPPORT_MANAGER]: Headphones,
    [STAFF_ROLES.SUPPORT_AGENT]: Users,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="large" />
          </div>

          {/* Header */}
          <h1 className="text-2xl font-bold text-center text-[#FFD700] mb-2">Staff Portal</h1>
          <p className="text-center text-[#B8C5D6] text-sm mb-6">Access your staff dashboard</p>

          {/* Role badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {Object.entries(STAFF_ROLES).map(([key, role]) => {
              const Icon = roleIcons[role]
              return (
                <div
                  key={key}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A2F45] border border-[#2A3F55] rounded-full text-xs text-[#B8C5D6]"
                >
                  {Icon && <Icon className="w-3 h-3 text-[#FFD700]" />}
                  <span>{ROLE_DISPLAY_NAMES[role]}</span>
                </div>
              )
            })}
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700] transition-colors"
                placeholder="staff@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700] transition-colors pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8C5D6] hover:text-[#FFD700] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <BrandedButton type="submit" disabled={loading} className="w-full" variant="primary">
              {loading ? "Signing in..." : "Sign In to Staff Portal"}
            </BrandedButton>
          </form>

          {/* Footer Links */}
          <div className="mt-6 space-y-3">
            <div className="text-center text-sm text-[#B8C5D6]">
              <Link href="/forgot-password" className="text-[#FFD700] hover:text-[#FFD700]/80 font-semibold">
                Forgot your password?
              </Link>
            </div>
            <div className="text-center text-sm text-[#B8C5D6]">
              Not a staff member?{" "}
              <Link href="/auth" className="text-[#FFD700] hover:text-[#FFD700]/80 font-semibold">
                Go to main login
              </Link>
            </div>
          </div>

          {/* Help text */}
          <div className="mt-6 p-4 bg-[#1A2F45]/50 border border-[#2A3F55] rounded-lg">
            <p className="text-xs text-[#B8C5D6] text-center">
              Staff accounts are created by your Tenant Admin or Super Admin. Contact your administrator if you need
              access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
