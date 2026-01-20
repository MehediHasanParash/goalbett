"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MFAVerifyPage() {
  const router = useRouter()
  const [redirectUrl, setRedirectUrl] = useState("/s/dashboard")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [checkingMfa, setCheckingMfa] = useState(true)
  const [mfaNotEnabled, setMfaNotEnabled] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const url = params.get("redirect") || params.get("returnUrl")
      if (url) setRedirectUrl(url)
    }

    checkMfaStatus()
  }, [])

  const checkMfaStatus = async () => {
    try {
      console.log("[v0] Checking MFA status...")
      const res = await fetch("/api/super/mfa/status", {
        method: "GET",
        credentials: "include",
      })

      console.log("[v0] MFA status response:", res.status, res.ok)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.log("[v0] MFA status error data:", errorData)
        // If unauthorized or forbidden, user might need to re-login
        if (res.status === 401 || res.status === 403) {
          setError("Session expired. Please log in again.")
          setTimeout(() => router.push("/s/login"), 2000)
          return
        }
        // For other errors, show MFA not enabled screen to be safe
        setMfaNotEnabled(true)
        return
      }

      const data = await res.json()
      console.log("[v0] MFA status data:", data)

      if (!data.enabled) {
        console.log("[v0] MFA not enabled, showing setup prompt")
        setMfaNotEnabled(true)
      } else {
        console.log("[v0] MFA enabled, showing verify form")
      }
    } catch (err) {
      console.error("[v0] Failed to check MFA status:", err)
      // On error, show MFA not enabled screen to be safe
      setMfaNotEnabled(true)
    } finally {
      setCheckingMfa(false)
    }
  }

  const goToMfaSetup = () => {
    const setupUrl = `/s/security/mfa?redirect=${encodeURIComponent(redirectUrl)}`
    router.push(setupUrl)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/super/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Invalid code")
      }

      setSuccess(true)

      document.cookie = `mfa_verified=true; path=/; max-age=${60 * 60 * 24}` // 24 hours

      setTimeout(() => {
        router.push(redirectUrl)
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingMfa) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Checking authentication status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mfaNotEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <CardTitle>MFA Required</CardTitle>
            <CardDescription>
              Two-factor authentication must be enabled to access this page. Please set up MFA first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>For security purposes, sensitive areas like Financials and Audit Logs require MFA verification.</p>
            </div>
            <Button onClick={goToMfaSetup} className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Set Up MFA Now
            </Button>
            <Button variant="outline" onClick={() => router.push("/s/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <XCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Verified! Redirecting...
              </div>
            )}

            <Button type="submit" className="w-full" disabled={code.length !== 6 || loading || success}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verified
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
