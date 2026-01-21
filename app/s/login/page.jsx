"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Shield } from "lucide-react"
import { AuthLayout } from "@/components/ui/auth-layout"
import { InputField } from "@/components/ui/input-field"
import { AnimatedButton } from "@/components/ui/animated-button"
import { login, ROLES } from "@/lib/auth-service"

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: "" })
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setErrors({})

    const result = await login(formData.email, formData.password, ROLES.SUPERADMIN)

    if (result.success) {
      router.push("/s/dashboard")
    } else {
      setErrors({ email: result.error || "Login failed" })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#1a2942] to-[#0A1A2F] text-white">
      <AuthLayout
        title={
          <div className="flex items-center justify-center gap-3">
            <Shield className="w-10 h-10 text-[#FFD700]" />
            <span>Betengin</span>
          </div>
        }
        subtitle="Super Admin Platform - Authorized Access Only"
        showBack={false}
      >
        <div className="space-y-6">
          <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#FFD700] mb-1">Restricted Access</p>
                <p className="text-gray-300 text-xs leading-relaxed">
                  This is the Betengin Super Admin platform. Access is restricted to authorized system administrators
                  only. All authentication attempts and actions are logged and monitored.
                </p>
              </div>
            </div>
          </div>

          <InputField
            label="Admin Email"
            type="email"
            placeholder="Enter your admin email"
            value={formData.email}
            onChange={handleInputChange("email")}
            error={errors.email}
            icon={Mail}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Enter your secure password"
            value={formData.password}
            onChange={handleInputChange("password")}
            error={errors.password}
            icon={Lock}
          />

          <AnimatedButton variant="primary" size="lg" className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Authenticating..." : "Access Super Admin"}
          </AnimatedButton>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/auth/forgot-password")}
              className="text-sm text-[#FFD700]/70 hover:text-[#FFD700] transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-700">
            <p>© 2025 Betengin. All rights reserved.</p>
            <p className="mt-1">Platform Version 1.0</p>
          </div>
        </div>
      </AuthLayout>
    </div>
  )
}
