"use client"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Phone } from 'lucide-react'
import { AuthLayout } from "@/components/ui/auth-layout"
import { InputField } from "@/components/ui/input-field"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleSignUp = async () => {
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" })
      return
    }

    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.password) {
      setErrors({ email: "Please fill in all required fields" })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: "player",
          // tenant_id will be determined by domain or provided separately
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store auth token and user data
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        
        // Redirect to player dashboard
        router.push("/p/dashboard")
      } else {
        setErrors({ email: data.error || "Registration failed" })
      }
    } catch (error) {
      setErrors({ email: "Registration failed. Please try again." })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A1A2F] to-black/50 text-white relative overflow-hidden">
      <AuthLayout
        title="Create Account"
        subtitle="Join Goal Betting and start winning!"
        showBack={true}
        onBack={() => router.push("/")}
      >
        <div className="space-y-6">
          <InputField
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleInputChange("fullName")}
            error={errors.fullName}
            icon={User}
          />

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
            label="Phone (Optional)"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleInputChange("phone")}
            error={errors.phone}
            icon={Phone}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Create password"
            value={formData.password}
            onChange={handleInputChange("password")}
            error={errors.password}
            icon={Lock}
          />

          <InputField
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            error={errors.confirmPassword}
            icon={Lock}
          />

          <div className="flex items-start space-x-2">
            <input type="checkbox" className="mt-1 rounded border-border" required />
            <span className="text-sm text-muted-foreground">
              I agree to the{" "}
              <button className="text-primary hover:text-primary/80 transition-colors">Terms of Service</button> and{" "}
              <button className="text-primary hover:text-primary/80 transition-colors">Privacy Policy</button>
            </span>
          </div>

          <AnimatedButton variant="primary" size="lg" className="w-full" onClick={handleSignUp} disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Sign Up"}
          </AnimatedButton>

          <div className="text-center space-y-2">
            <div>
              <span className="text-muted-foreground">Already have an account? </span>
              <button
                onClick={() => router.push("/auth")}
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    </div>
  )
}
