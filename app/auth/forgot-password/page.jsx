"use client"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Mail, Phone } from 'lucide-react'
import { AuthLayout } from "@/components/ui/auth-layout"
import { InputField } from "@/components/ui/input-field"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [method, setMethod] = useState("email") // "email" or "phone"
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    const identifier = method === "email" ? email : phone

    if (!identifier) {
      setError(`Please enter your ${method}`)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: method === "email" ? email : undefined,
          phone: method === "phone" ? phone : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store identifier for verification page
        sessionStorage.setItem("reset_identifier", identifier)
        sessionStorage.setItem("reset_method", method)
        router.push("/auth/verify-reset")
      } else {
        setError(data.error || "Failed to send reset code")
      }
    } catch (error) {
      setError("Failed to send reset code. Please try again.")
    }

    setIsLoading(false)
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="We'll send you a code to reset your password"
      showBack={true}
      onBack={() => router.push("/auth")}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {method === "email" ? <Mail className="h-10 w-10 text-primary" /> : <Phone className="h-10 w-10 text-primary" />}
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-card/50 rounded-xl">
          <button
            onClick={() => setMethod("email")}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              method === "email"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Email
          </button>
          <button
            onClick={() => setMethod("phone")}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              method === "phone"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="h-4 w-4 inline mr-2" />
            Phone
          </button>
        </div>

        {method === "email" ? (
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError("")
            }}
            error={error}
            icon={Mail}
          />
        ) : (
          <InputField
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (error) setError("")
            }}
            error={error}
            icon={Phone}
          />
        )}

        <AnimatedButton variant="primary" size="lg" className="w-full" onClick={handleContinue} disabled={isLoading}>
          {isLoading ? "Sending..." : "Continue"}
        </AnimatedButton>

        <div className="text-center">
          <button
            onClick={() => router.push("/auth")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
