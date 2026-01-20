"use client"
import { useState, useEffect } from "react"
import { Shield } from "lucide-react"
import { AuthLayout } from "@/components/ui/auth-layout"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [timeLeft, setTimeLeft] = useState(60)

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const handleCodeChange = (index, value) => {
    if (value.length <= 1) {
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
    const verificationCode = code.join("")
    console.log("Verification code:", verificationCode)
    window.location.href = "/auth/reset-password"
  }

  const handleResend = () => {
    setTimeLeft(60)
    console.log("Resending code...")
  }

  return (
    <AuthLayout
      title="Verify Email"
      subtitle="We've sent a verification code to your email"
      showBack={true}
      onBack={() => (window.location.href = "/auth/forgot-password")}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-center text-muted-foreground">Enter the 6-digit code sent to your email</p>

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
        </div>

        <AnimatedButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleVerify}
          disabled={code.some((digit) => !digit)}
        >
          Verify
        </AnimatedButton>

        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            {timeLeft > 0 ? `Resend code in ${timeLeft}s` : "Didn't receive the code?"}
          </p>
          {timeLeft === 0 && (
            <button onClick={handleResend} className="text-primary hover:text-primary/80 transition-colors font-medium">
              Resend Code
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
