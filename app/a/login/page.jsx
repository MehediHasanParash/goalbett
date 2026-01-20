"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock } from "lucide-react"
import { AuthLayout } from "@/components/ui/auth-layout"
import { InputField } from "@/components/ui/input-field"
import { AnimatedButton } from "@/components/ui/animated-button"
import { login, ROLES } from "@/lib/auth-service"

export default function AgentLoginPage() {
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

    console.log("[v0] Agent login attempt:", formData.email)
    const result = await login(formData.email, formData.password, ROLES.AGENT)
    console.log("[v0] Agent login result:", result)
    console.log("[v0] Token saved:", localStorage.getItem("auth_token"))

    if (result.success) {
      router.push("/a/dashboard")
    } else {
      setErrors({ email: result.error || "Login failed" })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A1A2F] to-black/50 text-white">
      <AuthLayout
        title="Agent Login"
        subtitle="Access your cash transaction system"
        showBack={true}
        onBack={() => router.push("/")}
      >
        <div className="space-y-6">
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange("email")}
            error={errors.email}
            icon={Mail}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange("password")}
            error={errors.password}
            icon={Lock}
          />

          <AnimatedButton variant="primary" size="lg" className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log In"}
          </AnimatedButton>

          <div className="text-center">
            <button
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </AuthLayout>
    </div>
  )
}
