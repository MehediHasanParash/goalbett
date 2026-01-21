"use client"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { AuthLayout } from "@/components/ui/auth-layout"
import { InputField } from "@/components/ui/input-field"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [method, setMethod] = useState("")
  const [otp, setOtp] = useState("")

  useEffect(() => {
    const resetIdentifier = sessionStorage.getItem("reset_identifier")
    const resetMethod = sessionStorage.getItem("reset_method")
    const resetOtp = sessionStorage.getItem("reset_otp")
    const resetEmail = sessionStorage.getItem("reset_email")

    if (!resetIdentifier || !resetMethod || !resetOtp) {
      router.push("/auth/forgot-password")
      return
    }

    setIdentifier(resetEmail || resetIdentifier)
    setMethod(resetMethod)
    setOtp(resetOtp)
  }, [router])

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleUpdatePassword = async () => {
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" })
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: method === "email" ? identifier : undefined,
          phone: method === "phone" ? identifier : undefined,
          otp,
          newPassword: formData.password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.removeItem("reset_identifier")
        sessionStorage.removeItem("reset_method")
        sessionStorage.removeItem("reset_otp")
        sessionStorage.removeItem("reset_email")
        sessionStorage.removeItem("reset_debug_otp")

        const loginPath = {
          player: "/p/login",
          agent: "/a/login",
          subagent: "/a/login",
          sub_agent: "/a/login",
          tenant: "/t/login",
          tenant_admin: "/t/login",
          superadmin: "/s/login",
          super_admin: "/s/login",
          admin: "/admin/login",
          staff: "/staff/login",
          finance_manager: "/staff/login",
          general_manager: "/staff/login",
          support_manager: "/staff/login",
          support_agent: "/staff/login",
        }[data.role] || "/auth"

        router.push(`${loginPath}?reset=success`)
      } else {
        setErrors({ password: data.error || "Failed to reset password" })
      }
    } catch (error) {
      setErrors({ password: "Failed to reset password. Please try again." })
    }

    setIsLoading(false)
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Create a strong password for your account"
      showBack={true}
      onBack={() => router.push("/auth/verify-reset")}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-10 w-10 text-primary" />
          </div>
        </div>

        <InputField
          label="New Password"
          type="password"
          placeholder="Enter new password"
          value={formData.password}
          onChange={handleInputChange("password")}
          error={errors.password}
          icon={Lock}
        />

        <InputField
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          onChange={handleInputChange("confirmPassword")}
          error={errors.confirmPassword}
          icon={Lock}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Password requirements:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className={formData.password.length >= 8 ? "text-green-500" : ""}>
              • At least 8 characters long
            </li>
            <li className={/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? "text-green-500" : ""}>
              • Contains uppercase and lowercase letters
            </li>
            <li className={/\d/.test(formData.password) ? "text-green-500" : ""}>
              • Contains at least one number
            </li>
            <li className={/[!@#$%^&*]/.test(formData.password) ? "text-green-500" : ""}>
              • Contains at least one special character
            </li>
          </ul>
        </div>

        <AnimatedButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleUpdatePassword}
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update Password"}
        </AnimatedButton>
      </div>
    </AuthLayout>
  )
}
