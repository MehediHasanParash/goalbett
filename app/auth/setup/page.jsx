"use client"
import { useState } from "react"
import { Lock, Mail, User, Key } from "lucide-react"
import { AuthLayout } from "@/components/ui/auth-layout"
import { InputField } from "@/components/ui/input-field"
import { AnimatedButton } from "@/components/ui/animated-button"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const [formData, setFormData] = useState({
    setupKey: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleSetup = async () => {
    setIsLoading(true)
    setErrors({})

    // Validation
    if (!formData.setupKey) {
      setErrors({ setupKey: "Setup key is required" })
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ setupKey: data.error || "Setup failed" })
        setIsLoading(false)
        return
      }

      // Store token and user data
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      setSuccess(true)

      // Redirect to super admin dashboard after 2 seconds
      setTimeout(() => {
        router.push("/s/dashboard")
      }, 2000)
    } catch (error) {
      setErrors({ setupKey: "Connection error. Please try again." })
    }

    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#0A1A2F] to-black/50 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Setup Complete!</h2>
          <p className="text-muted-foreground">Redirecting to Super Admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A1A2F] to-black/50 text-white relative overflow-hidden">
      <AuthLayout title="System Setup" subtitle="Create the first Super Admin account" showBack={false}>
        <div className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-300">
              <strong>First Time Setup:</strong> This page is only for creating the initial Super Admin account. You
              need the SETUP_KEY from your environment variables.
            </p>
          </div>

          <InputField
            label="Setup Key"
            type="password"
            placeholder="Enter setup key from .env"
            value={formData.setupKey}
            onChange={handleChange("setupKey")}
            error={errors.setupKey}
            icon={Key}
          />

          <InputField
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange("fullName")}
            error={errors.fullName}
            icon={User}
          />

          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange("email")}
            error={errors.email}
            icon={Mail}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Create password"
            value={formData.password}
            onChange={handleChange("password")}
            error={errors.password}
            icon={Lock}
          />

          <InputField
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            error={errors.confirmPassword}
            icon={Lock}
          />

          <AnimatedButton variant="primary" size="lg" className="w-full" onClick={handleSetup} disabled={isLoading}>
            {isLoading ? "Setting up..." : "Create Super Admin"}
          </AnimatedButton>

          <div className="text-center">
            <button
              onClick={() => router.push("/auth")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </AuthLayout>
    </div>
  )
}
