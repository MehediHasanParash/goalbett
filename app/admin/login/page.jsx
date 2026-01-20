"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, UserCog } from "lucide-react"
import { login, ROLES } from "@/lib/auth-service"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(email, password, ROLES.ADMIN)

    if (result.success) {
      router.push("/admin/dashboard")
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="large" />
          </div>
          <div className="bg-[#1A2F45] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCog className="w-8 h-8 text-[#FFD700]" />
          </div>
          <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">Admin Login</h1>
          <p className="text-[#B8C5D6]">Casino operations staff access</p>
        </div>

        <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#B8C5D6] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8C5D6]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@demo.com"
                  className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B8C5D6] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8C5D6]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">{error}</div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold text-lg py-6"
            >
              {loading ? "Logging in..." : "Login to Dashboard"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/select-role" className="text-sm text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
              Back to Role Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
