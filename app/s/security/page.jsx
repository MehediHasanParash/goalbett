"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Key, Globe, Lock, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SecurityDashboardPage() {
  const router = useRouter()
  const [securityStatus, setSecurityStatus] = useState({
    mfaEnabled: false,
    ipAllowlistCount: 0,
    domainIsolation: false,
    loading: true,
  })

  useEffect(() => {
    fetchSecurityStatus()
  }, [])

  const fetchSecurityStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const headers = { Authorization: `Bearer ${token}` }

      const mfaRes = await fetch("/api/super/mfa/status", { headers })
      const mfaData = await mfaRes.json()

      // Fetch IP allowlist
      const ipRes = await fetch("/api/super/ip-allowlist", { headers })
      const ipData = await ipRes.json()

      setSecurityStatus({
        mfaEnabled: mfaData.enabled || false,
        ipAllowlistCount: ipData.totalActive || 0,
        domainIsolation: process.env.NEXT_PUBLIC_SUPER_ADMIN_DOMAIN ? true : false,
        loading: false,
      })
    } catch (error) {
      console.error("Error fetching security status:", error)
      setSecurityStatus((prev) => ({ ...prev, loading: false }))
    }
  }

  const securityFeatures = [
    {
      title: "MFA / Two-Factor Authentication",
      description:
        "Protect your account with TOTP-based two-factor authentication using Google Authenticator or similar apps.",
      icon: Key,
      status: securityStatus.mfaEnabled,
      statusText: securityStatus.mfaEnabled ? "Enabled" : "Not Configured",
      href: "/s/security/mfa",
      actionText: securityStatus.mfaEnabled ? "Manage MFA" : "Setup MFA",
    },
    {
      title: "IP Allowlist",
      description:
        "Restrict Super Admin access to specific IP addresses. Only approved IPs can access the admin panel.",
      icon: Globe,
      status: securityStatus.ipAllowlistCount > 0,
      statusText:
        securityStatus.ipAllowlistCount > 0 ? `${securityStatus.ipAllowlistCount} IP(s) Configured` : "No Restrictions",
      href: "/s/security/ip-allowlist",
      actionText: "Manage IP Allowlist",
    },
    {
      title: "Domain Isolation",
      description: "Super Admin is isolated to betengin.com - completely separate from player and tenant domains.",
      icon: Lock,
      status: securityStatus.domainIsolation,
      statusText: securityStatus.domainIsolation ? "Configured" : "Using Default",
      href: "/s/security/domain",
      actionText: "View Settings",
    },
  ]

  return (
    <SuperAdminLayout
      title="Security Center"
      description="Manage authentication, access control, and security settings"
    >
      <div className="space-y-6">
        {/* Security Overview */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#FFD700]/20 rounded-lg">
                <Shield className="w-6 h-6 text-[#FFD700]" />
              </div>
              <div>
                <CardTitle className="text-[#F5F5F5]">Security Overview</CardTitle>
                <CardDescription className="text-[#B8C5D6]">
                  Configure security features to protect your Super Admin access
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#1A2F45] rounded-lg text-center">
                <div className="text-3xl font-bold text-[#FFD700]">{securityStatus.mfaEnabled ? "1" : "0"}/1</div>
                <div className="text-sm text-[#B8C5D6]">MFA Status</div>
              </div>
              <div className="p-4 bg-[#1A2F45] rounded-lg text-center">
                <div className="text-3xl font-bold text-[#FFD700]">{securityStatus.ipAllowlistCount}</div>
                <div className="text-sm text-[#B8C5D6]">Allowed IPs</div>
              </div>
              <div className="p-4 bg-[#1A2F45] rounded-lg text-center">
                <div className="text-3xl font-bold text-[#FFD700]">{securityStatus.domainIsolation ? "Yes" : "No"}</div>
                <div className="text-sm text-[#B8C5D6]">Domain Isolated</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature) => (
            <Card
              key={feature.title}
              className="bg-[#0D1F35] border-[#2A3F55] hover:border-[#FFD700]/50 transition-colors cursor-pointer"
              onClick={() => router.push(feature.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-[#1A2F45] rounded-lg">
                    <feature.icon className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <Badge
                    variant={feature.status ? "default" : "secondary"}
                    className={
                      feature.status
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-[#1A2F45] text-[#B8C5D6] border-[#2A3F55]"
                    }
                  >
                    {feature.status ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {feature.statusText}
                  </Badge>
                </div>
                <CardTitle className="text-[#F5F5F5] text-lg mt-4">{feature.title}</CardTitle>
                <CardDescription className="text-[#B8C5D6]">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5]"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(feature.href)
                  }}
                >
                  {feature.actionText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Recommendations */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#F5F5F5]">Security Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!securityStatus.mfaEnabled && (
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <XCircle className="w-5 h-5 text-yellow-400" />
                  <div className="flex-1">
                    <div className="text-[#F5F5F5] font-medium">Enable MFA</div>
                    <div className="text-sm text-[#B8C5D6]">
                      Two-factor authentication adds an extra layer of security to your account
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => router.push("/s/security/mfa")}
                  >
                    Enable Now
                  </Button>
                </div>
              )}
              {securityStatus.ipAllowlistCount === 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <XCircle className="w-5 h-5 text-yellow-400" />
                  <div className="flex-1">
                    <div className="text-[#F5F5F5] font-medium">Configure IP Allowlist</div>
                    <div className="text-sm text-[#B8C5D6]">Restrict admin access to trusted IP addresses only</div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => router.push("/s/security/ip-allowlist")}
                  >
                    Configure
                  </Button>
                </div>
              )}
              {securityStatus.mfaEnabled && securityStatus.ipAllowlistCount > 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <div className="text-[#F5F5F5] font-medium">Security Status: Good</div>
                    <div className="text-sm text-[#B8C5D6]">Your account has recommended security features enabled</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  )
}
