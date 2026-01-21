"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { BrandedButton } from "@/components/ui/branded-button"
import { login, ROLES } from "@/lib/auth-service"

export default function TenantAdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await login(email, password, ROLES.TENANT_ADMIN)

    if (result.success) {
      router.push("/t/dashboard")
    } else {
      setError(result.error || "Login failed")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-8">
            <Logo size="large" />
          </div>

          <h1 className="text-2xl font-bold text-center text-[#FFD700] mb-2">Tenant Admin Access</h1>
          <p className="text-center text-[#B8C5D6] text-sm mb-6">Manage your betting network and operations</p>

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
                placeholder="tenant@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <BrandedButton type="submit" disabled={loading} className="w-full" variant="primary">
              {loading ? "Signing in..." : "Sign In"}
            </BrandedButton>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-[#FFD700]/70 hover:text-[#FFD700] text-sm transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-[#B8C5D6]">
            Not a Tenant Admin?{" "}
            <Link href="/auth" className="text-[#FFD700] hover:text-[#FFD700]/80 font-semibold">
              Go to main login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
