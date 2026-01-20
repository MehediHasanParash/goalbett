"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Globe, CheckCircle, ArrowLeft, Copy, Info, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DomainIsolationPage() {
  const router = useRouter()
  const [currentHost, setCurrentHost] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHost(window.location.host)
    }
  }, [])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess("Copied to clipboard!")
    setTimeout(() => setSuccess(""), 2000)
  }

  const superAdminDomain = "betengin.com"
  const isCorrectDomain = currentHost.includes("betengin.com") || currentHost.includes("localhost")

  return (
    <SuperAdminLayout title="Domain Isolation" description="Super Admin domain security settings">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-[#B8C5D6] hover:text-[#F5F5F5]"
          onClick={() => router.push("/s/security")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Security
        </Button>

        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* Current Status */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#FFD700]/20 rounded-lg">
                  <Lock className="w-6 h-6 text-[#FFD700]" />
                </div>
                <div>
                  <CardTitle className="text-[#F5F5F5]">Domain Isolation</CardTitle>
                  <CardDescription className="text-[#B8C5D6]">Super Admin is isolated to betengin.com</CardDescription>
                </div>
              </div>
              <Badge
                className={
                  isCorrectDomain
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {isCorrectDomain ? "Secure Domain" : "Wrong Domain"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1A2F45] rounded-lg">
                <div className="text-sm text-[#B8C5D6] mb-1">Current Host</div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#FFD700]" />
                  <span className="font-mono text-[#F5F5F5]">{currentHost || "Loading..."}</span>
                </div>
              </div>
              <div className="p-4 bg-[#1A2F45] rounded-lg">
                <div className="text-sm text-[#B8C5D6] mb-1">Super Admin Domain</div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="font-mono text-[#F5F5F5]">{superAdminDomain}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#B8C5D6] h-6 w-6 p-0"
                    onClick={() => copyToClipboard(superAdminDomain)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain Structure */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#F5F5F5]">Platform Domain Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-[#1A2F45] rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div className="flex-1">
                  <div className="text-[#F5F5F5] font-medium">Super Admin</div>
                  <div className="text-sm text-[#B8C5D6] font-mono">betengin.com</div>
                  <div className="text-xs text-[#B8C5D6] mt-1">
                    Platform management, tenant administration, system settings
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-[#1A2F45] rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-[#F5F5F5] font-medium">Player Domain</div>
                  <div className="text-sm text-[#B8C5D6] font-mono">goalbett.com</div>
                  <div className="text-xs text-[#B8C5D6] mt-1">Player-facing betting platform</div>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-[#1A2F45] rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="text-[#F5F5F5] font-medium">Tenant Subdomains</div>
                  <div className="text-sm text-[#B8C5D6] font-mono">{"<tenant>"}.goalbett.com</div>
                  <div className="text-xs text-[#B8C5D6] mt-1">White-label tenant portals</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#F5F5F5]">How Domain Isolation Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-[#1A2F45] rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FFD700]/20 rounded-full flex items-center justify-center text-[#FFD700] font-bold">
                  1
                </div>
                <div>
                  <div className="text-[#F5F5F5] font-medium">Dedicated Domain</div>
                  <div className="text-sm text-[#B8C5D6]">
                    Super Admin is only accessible at betengin.com - completely separate from player and tenant domains
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-[#1A2F45] rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FFD700]/20 rounded-full flex items-center justify-center text-[#FFD700] font-bold">
                  2
                </div>
                <div>
                  <div className="text-[#F5F5F5] font-medium">Middleware Protection</div>
                  <div className="text-sm text-[#B8C5D6]">
                    All /s/ routes are blocked on non-admin domains. Requests are validated at the middleware level.
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-[#1A2F45] rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FFD700]/20 rounded-full flex items-center justify-center text-[#FFD700] font-bold">
                  3
                </div>
                <div>
                  <div className="text-[#F5F5F5] font-medium">MFA for Sensitive Routes</div>
                  <div className="text-sm text-[#B8C5D6]">
                    Sensitive routes like /s/financials and /s/audit-logs require additional MFA verification
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-[#1A2F45] rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FFD700]/20 rounded-full flex items-center justify-center text-[#FFD700] font-bold">
                  4
                </div>
                <div>
                  <div className="text-[#F5F5F5] font-medium">Combined with IP Allowlist</div>
                  <div className="text-sm text-[#B8C5D6]">
                    For maximum security, combine domain isolation with IP allowlisting from Security settings
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#F5F5F5]">Environment Configuration</CardTitle>
            <CardDescription className="text-[#B8C5D6]">
              Required environment variables for domain isolation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Info className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                These variables should be set in your production environment
              </AlertDescription>
            </Alert>

            <div className="p-3 bg-[#1A2F45] rounded-lg font-mono text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#B8C5D6]">SUPER_ADMIN_DOMAIN=betengin.com</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#B8C5D6] h-6"
                  onClick={() => copyToClipboard("SUPER_ADMIN_DOMAIN=betengin.com")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#B8C5D6]">NEXT_PUBLIC_SUPER_ADMIN_DOMAIN=betengin.com</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#B8C5D6] h-6"
                  onClick={() => copyToClipboard("NEXT_PUBLIC_SUPER_ADMIN_DOMAIN=betengin.com")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Benefits */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#F5F5F5]">Security Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-[#B8C5D6]">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span>Admin URL (betengin.com) is separate from player-facing domains</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span>Separate domain means separate cookies and session isolation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span>Players and tenants cannot access /s/ routes on their domains</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span>MFA required for sensitive financial and audit routes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span>Can be combined with IP allowlisting for additional protection</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  )
}
