"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, CheckCircle, XCircle, Copy, RefreshCw, Shield, AlertTriangle, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"

export default function MFASetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mfaStatus, setMfaStatus] = useState({
    enabled: false,
    secret: null,
    qrCodeUrl: null,
    backupCodes: [],
  })
  const [verificationCode, setVerificationCode] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [step, setStep] = useState("status") // status, setup, verify, backup, disable

  useEffect(() => {
    fetchMFAStatus()
  }, [])

  const fetchMFAStatus = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      console.log("[v0] MFA Page - Token from localStorage:", token ? `${token.substring(0, 20)}...` : "null")

      if (!token || token === "null") {
        setError("Not authenticated. Please log in again.")
        setLoading(false)
        return
      }

      const res = await fetch("/api/super/mfa/setup", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        if (data.mfaEnabled) {
          setMfaStatus({ enabled: true, secret: null, qrCodeUrl: null, backupCodes: [] })
          setStep("status")
        } else if (data.secret) {
          setMfaStatus({
            enabled: false,
            secret: data.secret,
            qrCodeUrl: data.qrCodeUrl,
            backupCodes: data.backupCodes || [],
          })
          setStep("setup")
        } else {
          setStep("status")
        }
      } else {
        setError(data.error || "Failed to fetch MFA status")
      }
    } catch (error) {
      setError("Failed to fetch MFA status")
    } finally {
      setLoading(false)
    }
  }

  const initiateMFASetup = async () => {
    try {
      setSaving(true)
      setError("")
      const token = localStorage.getItem("auth_token")

      if (!token || token === "null") {
        setError("Not authenticated. Please log in again.")
        setSaving(false)
        return
      }

      const res = await fetch("/api/super/mfa/setup", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success && data.secret) {
        setMfaStatus({
          enabled: false,
          secret: data.secret,
          qrCodeUrl: data.qrCodeUrl,
          backupCodes: data.backupCodes || [],
        })
        setStep("setup")
      } else {
        setError(data.error || "Failed to initiate MFA setup")
      }
    } catch (error) {
      setError("Failed to initiate MFA setup")
    } finally {
      setSaving(false)
    }
  }

  const verifyAndEnableMFA = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }

    if (!mfaStatus.secret) {
      setError("MFA setup session expired. Please restart setup.")
      return
    }

    try {
      setSaving(true)
      setError("")
      const token = localStorage.getItem("auth_token")
      const res = await fetch("/api/super/mfa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode, secret: mfaStatus.secret }),
      })
      const data = await res.json()

      if (data.success) {
        setSuccess("MFA enabled successfully!")
        setMfaStatus((prev) => ({
          ...prev,
          enabled: true,
          backupCodes: data.backupCodes || prev.backupCodes,
        }))
        setStep("backup")
      } else {
        setError(data.error || "Invalid verification code")
      }
    } catch (error) {
      setError("Failed to verify code")
    } finally {
      setSaving(false)
    }
  }

  const disableMFA = async () => {
    if (disableCode.length !== 6) {
      setError("Please enter your current MFA code to disable")
      return
    }

    try {
      setSaving(true)
      setError("")
      const token = localStorage.getItem("auth_token")
      const res = await fetch("/api/super/mfa/setup", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: disableCode }),
      })
      const data = await res.json()

      if (data.success) {
        setSuccess("MFA disabled successfully")
        setMfaStatus({ enabled: false, secret: null, qrCodeUrl: null, backupCodes: [] })
        setStep("status")
        setDisableCode("")
      } else {
        setError(data.error || "Failed to disable MFA")
      }
    } catch (error) {
      setError("Failed to disable MFA")
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess("Copied to clipboard!")
    setTimeout(() => setSuccess(""), 2000)
  }

  if (loading) {
    return (
      <SuperAdminLayout title="MFA Setup" description="Configure two-factor authentication">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-[#FFD700] animate-spin" />
        </div>
      </SuperAdminLayout>
    )
  }

  return (
    <SuperAdminLayout title="MFA Setup" description="Configure two-factor authentication">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-[#B8C5D6] hover:text-[#F5F5F5]"
          onClick={() => router.push("/s/security")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Security
        </Button>

        {/* Status Messages */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* MFA Status Card */}
        {step === "status" && (
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#FFD700]/20 rounded-lg">
                    <Key className="w-6 h-6 text-[#FFD700]" />
                  </div>
                  <div>
                    <CardTitle className="text-[#F5F5F5]">Two-Factor Authentication</CardTitle>
                    <CardDescription className="text-[#B8C5D6]">
                      Add an extra layer of security to your account
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  className={
                    mfaStatus.enabled
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  {mfaStatus.enabled ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" /> Enabled
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" /> Disabled
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-[#1A2F45] rounded-lg">
                <h4 className="text-[#F5F5F5] font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-[#B8C5D6] space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD700]">1.</span>
                    Download an authenticator app (Google Authenticator, Authy, etc.)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD700]">2.</span>
                    Scan the QR code or enter the secret key manually
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD700]">3.</span>
                    Enter the 6-digit code from your app to verify
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD700]">4.</span>
                    Save your backup codes in a secure location
                  </li>
                </ul>
              </div>

              {mfaStatus.enabled ? (
                <div className="space-y-4">
                  <Button variant="destructive" className="w-full" onClick={() => setStep("disable")}>
                    Disable MFA
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-[#FFD700] hover:bg-[#E5C200] text-black"
                  onClick={initiateMFASetup}
                  disabled={saving}
                >
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Setup MFA Now
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Setup Step - QR Code */}
        {step === "setup" && (
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5]">Step 1: Scan QR Code</CardTitle>
              <CardDescription className="text-[#B8C5D6]">
                Scan this QR code with your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  {mfaStatus.secret && (
                    <QRCodeSVG
                      value={`otpauth://totp/GoalBett%20Admin:${
                        typeof window !== "undefined"
                          ? localStorage.getItem("email") || "super@gmail.com"
                          : "super@gmail.com"
                      }?secret=${mfaStatus.secret}&issuer=GoalBett%20Admin&algorithm=SHA1&digits=6&period=30`}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  )}
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Or enter this secret key manually:</Label>
                <div className="flex gap-2">
                  <Input
                    value={mfaStatus.secret || ""}
                    readOnly
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] font-mono"
                  />
                  <Button
                    variant="outline"
                    className="border-[#2A3F55] text-[#F5F5F5] bg-transparent"
                    onClick={() => copyToClipboard(mfaStatus.secret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Step 2: Enter verification code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] text-center text-2xl tracking-widest"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2A3F55] text-[#F5F5F5] bg-transparent"
                  onClick={() => {
                    setStep("status")
                    setVerificationCode("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#FFD700] hover:bg-[#E5C200] text-black"
                  onClick={verifyAndEnableMFA}
                  disabled={saving || verificationCode.length !== 6}
                >
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Verify & Enable
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backup Codes Step */}
        {step === "backup" && (
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5]">Save Your Backup Codes</CardTitle>
              <CardDescription className="text-[#B8C5D6]">
                Store these codes securely. Each code can only be used once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-yellow-500/10 border-yellow-500/30">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  Save these backup codes now! You won't be able to see them again.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2">
                {mfaStatus.backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-[#1A2F45] rounded font-mono text-center text-[#F5F5F5]">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2A3F55] text-[#F5F5F5] bg-transparent"
                  onClick={() => copyToClipboard(mfaStatus.backupCodes.join("\n"))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
                <Button
                  className="flex-1 bg-[#FFD700] hover:bg-[#E5C200] text-black"
                  onClick={() => {
                    setStep("status")
                    fetchMFAStatus()
                  }}
                >
                  I've Saved My Codes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disable MFA Step */}
        {step === "disable" && (
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5]">Disable MFA</CardTitle>
              <CardDescription className="text-[#B8C5D6]">
                Enter your current MFA code to disable two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  Warning: Disabling MFA will make your account less secure
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Enter current MFA code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] text-center text-2xl tracking-widest"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2A3F55] text-[#F5F5F5] bg-transparent"
                  onClick={() => {
                    setStep("status")
                    setDisableCode("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={disableMFA}
                  disabled={saving || disableCode.length !== 6}
                >
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Disable MFA
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compatible Apps */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#F5F5F5] text-lg">Compatible Authenticator Apps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Google Authenticator", icon: "🔐" },
                { name: "Microsoft Authenticator", icon: "🔒" },
                { name: "Authy", icon: "🛡️" },
                { name: "1Password", icon: "🔑" },
              ].map((app) => (
                <div key={app.name} className="p-3 bg-[#1A2F45] rounded-lg text-center">
                  <div className="text-2xl mb-1">{app.icon}</div>
                  <div className="text-xs text-[#B8C5D6]">{app.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  )
}
