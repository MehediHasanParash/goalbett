"use client"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Shield, AlertCircle } from 'lucide-react'
import { AuthLayout } from "@/components/ui/auth-layout"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function VerifyResetPage() {
  const router = useRouter()
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [timeLeft, setTimeLeft] = useState(1800)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [email, setEmail] = useState("")
  const [method, setMethod] = useState("")
  const [debugOtp, setDebugOtp] = useState("")

  useEffect(() => {
    const resetIdentifier = sessionStorage.getItem("reset_identifier")
    const resetMethod = sessionStorage.getItem("reset_method")
    const resetEmail = sessionStorage.getItem("reset_email")
    const resetDebugOtp = sessionStorage.getItem("reset_debug_otp")

    if (!resetIdentifier || !resetMethod) {
      router.push("/auth/forgot-password")
      return
    }

    setIdentifier(resetIdentifier)
    setMethod(resetMethod)
    setEmail(resetEmail || resetIdentifier)
    if (resetDebugOtp) {
      setDebugOtp(resetDebugOtp)
    }
  }, [router])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleVerify = () => {
    const otp = code.join("")
    
    if (otp.length !== 6) {
      setError("Please enter complete OTP")
      return
    }

    // Store OTP in session for password reset page
    sessionStorage.setItem("reset_otp", otp)
    router.push("/auth/reset-password")
  }

  const handleResend = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: method === "email" ? identifier : undefined,
          phone: method === "phone" ? identifier : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTimeLeft(1800)
        setCode(["", "", "", "", "", ""])
        if (data._debug_otp) {
          setDebugOtp(data._debug_otp)
          sessionStorage.setItem("reset_debug_otp", data._debug_otp)
        }
      } else {
        setError(data.error || "Failed to resend code")
      }
    } catch (error) {
      setError("Failed to resend code")
    }

    setIsLoading(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <AuthLayout
      title="Verify Code"
      subtitle={`We've sent a verification code to ${email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}`}
      showBack={true}
      onBack={() => router.push("/auth/forgot-password")}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
        </div>

        {debugOtp && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-500">Development Mode</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your OTP code is: <span className="font-mono font-bold text-amber-500">{debugOtp}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  (In production, this would be sent via email)
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-center text-muted-foreground">Enter the 6-digit code</p>

          <div className="flex justify-center gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                className="w-12 h-12 text-center text-xl font-bold bg-card/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 glass"
              />
            ))}
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>

        <AnimatedButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleVerify}
          disabled={code.some((digit) => !digit) || isLoading}
        >
          {isLoading ? "Verifying..." : "Verify"}
        </AnimatedButton>

        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : "Code expired"}
          </p>
          {timeLeft === 0 || timeLeft < 540 ? (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Resend Code
            </button>
          ) : null}
        </div>
      </div>
    </AuthLayout>
  )
}
