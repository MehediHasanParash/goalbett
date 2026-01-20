"use client"

import { useState } from "react"
import { Mail, Lock } from "lucide-react"
import { AuthLayout } from "@/components/ui/auth-layout"
import { InputField } from "@/components/ui/input-field"
import { AnimatedButton } from "@/components/ui/animated-button"
import { createToken, ROLES } from "@/lib/auth-service"

export default function PlayerLoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: "" })
  }

  const handleLogin = async () => {
    setIsLoading(true)

    const demoUsers = {
      "player@demo.com": {
        id: "player_1",
        role: ROLES.PLAYER,
        fullName: "John Player",
        balance: 2500,
        tenantId: "default",
      },
    }

    const user = demoUsers[formData.email]
    if (user && formData.password === "demo123") {
      createToken(user)
      localStorage.setItem("user", JSON.stringify(user))
      window.location.href = "/p/dashboard"
    } else {
      setErrors({
        email: "Invalid credentials. Try: player@demo.com with password: demo123",
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A1A2F] to-black/50 text-white">
      <AuthLayout
        title="Player Login"
        subtitle="Access your sportsbook and casino"
        showBack={true}
        onBack={() => (window.location.href = "/")}
      >
        <div className="space-y-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
            <p className="font-medium text-secondary mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-gray-300">
              <p>Email: player@demo.com</p>
              <p>Password: demo123</p>
            </div>
          </div>

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
            <span className="text-muted-foreground">Don't have an account? </span>
            <button
              onClick={() => (window.location.href = "/p/signup")}
              className="text-secondary hover:text-secondary/80 transition-colors font-medium"
            >
              Sign Up
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => (window.location.href = "/guest")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </AuthLayout>
    </div>
  )
}
