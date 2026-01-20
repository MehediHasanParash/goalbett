"use client"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { UserCircle, Rocket } from 'lucide-react'
import { AuthLayout } from "@/components/ui/auth-layout"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function GuestSessionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [gsid, setGsid] = useState(null)

  useEffect(() => {
    // Check if guest session already exists
    const existingGsid = localStorage.getItem("gsid")
    if (existingGsid) {
      setGsid(existingGsid)
    }
  }, [])

  const handleContinueAsGuest = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/guest-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (data.success) {
        // Store GSID in localStorage
        localStorage.setItem("gsid", data.gsid)
        localStorage.setItem("guest_session", JSON.stringify(data.session))
        
        setGsid(data.gsid)
        
        // Redirect to guest betting page
        router.push("/guest/bet")
      } else {
        alert("Failed to create guest session")
      }
    } catch (error) {
      alert("Failed to create guest session")
    }

    setIsLoading(false)
  }

  const handleLogin = () => {
    router.push("/auth")
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A1A2F] to-black/50 text-white relative overflow-hidden">
      <AuthLayout
        title="Guest Session"
        subtitle="Browse and place bets without an account"
        showBack={true}
        onBack={() => router.push("/")}
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle className="h-10 w-10 text-primary" />
            </div>
          </div>

          {gsid ? (
            <div className="space-y-4">
              <div className="bg-card/50 border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-2">Your Guest Session ID</p>
                <p className="text-lg font-mono text-primary break-all">{gsid}</p>
              </div>

              <AnimatedButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => router.push("/guest/bet")}
              >
                <Rocket className="h-5 w-5 mr-2" />
                Continue Betting
              </AnimatedButton>

              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Guest sessions expire after 24 hours</p>
                <p>Save this ID to retrieve your bets later</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="bg-card/50 border border-border rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-foreground">Guest Benefits:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• No registration required</li>
                    <li>• Place bets immediately</li>
                    <li>• Session saved for 24 hours</li>
                    <li>• Convert to full account anytime</li>
                  </ul>
                </div>

                <AnimatedButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleContinueAsGuest}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Session..." : "Continue as Guest"}
                </AnimatedButton>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card/50 text-muted-foreground">or</span>
                  </div>
                </div>

                <AnimatedButton variant="glass" size="lg" className="w-full" onClick={handleLogin}>
                  Login to Existing Account
                </AnimatedButton>

                <div className="text-center">
                  <span className="text-muted-foreground">New user? </span>
                  <button
                    onClick={() => router.push("/auth")}
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </AuthLayout>
    </div>
  )
}
