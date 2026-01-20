"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  ExternalLink,
  Server,
  Star,
  Activity,
  Bell,
  Zap,
  Copy,
  Check,
  Info,
} from "lucide-react"

export default function DomainManagerPage() {
  const [platformDomains, setPlatformDomains] = useState([])
  const [tenantDomains, setTenantDomains] = useState([])
  const [newPlatformDomain, setNewPlatformDomain] = useState("")
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [activeTab, setActiveTab] = useState("platform")
  const [healthCheckResult, setHealthCheckResult] = useState(null)
  const [settings, setSettings] = useState({
    autoFailover: true,
    healthCheckInterval: 5,
    notifyOnBlock: true,
  })
  const [dnsModal, setDnsModal] = useState({ open: false, domain: null, dnsRecords: [], verifying: false })
  const [copiedValue, setCopiedValue] = useState(null)
  const [addingDomain, setAddingDomain] = useState(false)

  useEffect(() => {
    fetchAllDomains()
  }, [])

  const fetchAllDomains = async () => {
    setLoading(true)
    try {
      const [platformRes, tenantRes] = await Promise.all([
        fetch("/api/super/platform-domains"),
        fetch("/api/super/domains"),
      ])

      const platformData = await platformRes.json()
      if (platformData.success) {
        setPlatformDomains(platformData.domains || [])
      }

      const tenantData = await tenantRes.json()
      if (tenantData.success) {
        setTenantDomains(tenantData.domains || [])
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error)
    } finally {
      setLoading(false)
    }
  }

  const addPlatformDomain = async () => {
    if (!newPlatformDomain.trim()) return

    setAddingDomain(true)
    try {
      const res = await fetch("/api/super/platform-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newPlatformDomain.trim() }),
      })
      const data = await res.json()

      if (data.success) {
        setPlatformDomains([...platformDomains, data.domain])
        setNewPlatformDomain("")

        // Show DNS records modal
        if (data.dnsRecords && data.dnsRecords.length > 0) {
          setDnsModal({
            open: true,
            domain: data.domain,
            dnsRecords: data.dnsRecords,
            verifying: false,
            message: data.message,
            vercelAdded: data.vercelAdded,
          })
        }
      } else {
        alert(data.error || "Failed to add domain")
      }
    } catch (error) {
      console.error("Failed to add platform domain:", error)
      alert("Failed to add domain")
    } finally {
      setAddingDomain(false)
    }
  }

  // ... existing code for removePlatformDomain, setPlatformPrimary, togglePlatformDomainActive ...

  const removePlatformDomain = async (id) => {
    if (!confirm("Are you sure you want to remove this backup domain?")) return

    try {
      const res = await fetch(`/api/super/platform-domains?id=${id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (data.success) {
        setPlatformDomains(platformDomains.filter((d) => d._id !== id))
      } else {
        alert(data.error || "Failed to delete domain")
      }
    } catch (error) {
      console.error("Failed to delete platform domain:", error)
    }
  }

  const setPlatformPrimary = async (id) => {
    try {
      const res = await fetch("/api/super/platform-domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "setPrimary" }),
      })
      const data = await res.json()

      if (data.success) {
        setPlatformDomains(
          platformDomains.map((d) => ({
            ...d,
            type: d._id === id ? "primary" : "backup",
          })),
        )
      }
    } catch (error) {
      console.error("Failed to set primary:", error)
    }
  }

  const togglePlatformDomainActive = async (id) => {
    try {
      const res = await fetch("/api/super/platform-domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggleActive" }),
      })
      const data = await res.json()

      if (data.success) {
        setPlatformDomains(platformDomains.map((d) => (d._id === id ? { ...d, isActive: !d.isActive } : d)))
      }
    } catch (error) {
      console.error("Failed to toggle active:", error)
    }
  }

  const verifyDomain = async (domainId) => {
    setDnsModal((prev) => ({ ...prev, verifying: true }))

    try {
      const res = await fetch("/api/super/platform-domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      })
      const data = await res.json()

      if (data.success) {
        if (data.verified) {
          // Update domain in list
          setPlatformDomains(
            platformDomains.map((d) => (d._id === domainId ? { ...d, status: "healthy", isActive: true } : d)),
          )
          setDnsModal((prev) => ({
            ...prev,
            verifying: false,
            domain: data.domain,
            message: data.message,
          }))
        } else {
          setDnsModal((prev) => ({
            ...prev,
            verifying: false,
            dnsRecords: data.dnsRecords || prev.dnsRecords,
            message: data.message,
          }))
        }
      } else {
        alert(data.error || "Verification failed")
        setDnsModal((prev) => ({ ...prev, verifying: false }))
      }
    } catch (error) {
      console.error("Failed to verify domain:", error)
      alert("Failed to verify domain")
      setDnsModal((prev) => ({ ...prev, verifying: false }))
    }
  }

  const viewDnsRecords = (domain) => {
    setDnsModal({
      open: true,
      domain,
      dnsRecords: domain.dnsRecords || [],
      verifying: false,
      message:
        domain.status === "healthy"
          ? "Domain is verified and active."
          : "Configure DNS records and click Verify to complete setup.",
    })
  }

  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      setTimeout(() => setCopiedValue(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const runHealthCheck = async () => {
    setChecking(true)
    setHealthCheckResult(null)

    try {
      const res = await fetch("/api/super/platform-domains/health-check", {
        method: "POST",
      })
      const data = await res.json()

      if (data.success) {
        setHealthCheckResult(data)
        await fetchAllDomains()

        if (data.failoverOccurred) {
          alert(`FAILOVER ALERT: Primary domain is down. Active domain is now: ${data.activeDomain}`)
        }
      }
    } catch (error) {
      console.error("Health check failed:", error)
      setHealthCheckResult({ error: error.message })
    } finally {
      setChecking(false)
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      healthy: { color: "bg-green-500", icon: CheckCircle, text: "Healthy" },
      blocked: { color: "bg-red-500", icon: XCircle, text: "Blocked" },
      checking: { color: "bg-yellow-500", icon: RefreshCw, text: "Checking" },
      pending_dns: { color: "bg-orange-500", icon: AlertTriangle, text: "Pending DNS" },
      degraded: { color: "bg-orange-500", icon: AlertTriangle, text: "Degraded" },
      offline: { color: "bg-gray-500", icon: XCircle, text: "Offline" },
    }
    const c = config[status] || config.checking
    const Icon = c.icon
    return (
      <Badge className={`${c.color} text-white flex items-center gap-1`}>
        <Icon className={`w-3 h-3 ${status === "checking" ? "animate-spin" : ""}`} />
        {c.text}
      </Badge>
    )
  }

  const platformHealthy = platformDomains.filter((d) => d.status === "healthy").length
  const platformBlocked = platformDomains.filter((d) => d.status === "blocked" || d.status === "offline").length

  return (
    <SuperAdminLayout title="Domain Rotator" description="Manage mirror domains and failover">
      <div className="space-y-6">
        {/* Health Check Result Alert */}
        {healthCheckResult && !healthCheckResult.error && (
          <Alert
            className={
              healthCheckResult.failoverOccurred ? "border-red-500 bg-red-500/10" : "border-green-500 bg-green-500/10"
            }
          >
            <Activity className="h-4 w-4" />
            <AlertTitle className="text-white">
              {healthCheckResult.failoverOccurred ? "Failover Activated!" : "Health Check Complete"}
            </AlertTitle>
            <AlertDescription className="text-[#B8C5D6]">
              {healthCheckResult.healthyCount}/{healthCheckResult.totalChecked} domains healthy. Active domain:{" "}
              <span className="text-[#FFD700] font-medium">{healthCheckResult.activeDomain}</span>
              {healthCheckResult.blockedDomains?.length > 0 && (
                <span className="text-red-400 ml-2">
                  Blocked: {healthCheckResult.blockedDomains.map((d) => d.domain).join(", ")}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Server className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Total Domains</p>
                  <p className="text-2xl font-bold text-white">{platformDomains.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Healthy</p>
                  <p className="text-2xl font-bold text-white">{platformHealthy}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Blocked</p>
                  <p className="text-2xl font-bold text-white">{platformBlocked}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Avg Response</p>
                  <p className="text-2xl font-bold text-white">
                    {platformDomains.length > 0
                      ? Math.round(
                          platformDomains.reduce((a, d) => a + (d.responseTime || 0), 0) / platformDomains.length,
                        )
                      : 0}
                    ms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Domain & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Mirror Domain
              </CardTitle>
              <CardDescription className="text-[#B8C5D6]">
                Add backup domains with automatic Vercel & DNS setup (max 10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="backup-domain.com"
                  value={newPlatformDomain}
                  onChange={(e) => setNewPlatformDomain(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addPlatformDomain()}
                  className="bg-[#0A1A2F] border-[#2A3F55] text-white"
                  disabled={platformDomains.length >= 10 || addingDomain}
                />
                <Button
                  onClick={addPlatformDomain}
                  className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
                  disabled={platformDomains.length >= 10 || addingDomain}
                >
                  {addingDomain ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {addingDomain ? "Adding..." : "Add"}
                </Button>
              </div>
              {platformDomains.length >= 10 && (
                <p className="text-yellow-400 text-sm mt-2">Maximum 10 domains reached</p>
              )}
              <p className="text-[#B8C5D6] text-xs mt-2">
                Domain will be added to Vercel automatically. DNS records will be provided after adding.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Failover Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#B8C5D6]" />
                  <Label className="text-[#B8C5D6]">Auto Failover</Label>
                </div>
                <Switch
                  checked={settings.autoFailover}
                  onCheckedChange={(v) => setSettings({ ...settings, autoFailover: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#B8C5D6]" />
                  <Label className="text-[#B8C5D6]">Notify on Block</Label>
                </div>
                <Switch
                  checked={settings.notifyOnBlock}
                  onCheckedChange={(v) => setSettings({ ...settings, notifyOnBlock: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#B8C5D6]" />
                  <Label className="text-[#B8C5D6]">Check Interval</Label>
                </div>
                <span className="text-white">{settings.healthCheckInterval} min</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domain List */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#FFD700]">Mirror Domains</CardTitle>
                <CardDescription className="text-[#B8C5D6]">
                  Manage domain rotation and health monitoring
                </CardDescription>
              </div>
              <Button
                onClick={runHealthCheck}
                disabled={checking}
                variant="outline"
                className="border-[#2A3F55] text-[#B8C5D6] bg-transparent hover:bg-[#2A3F55]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Checking..." : "Run Health Check"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-[#B8C5D6]">Loading domains...</div>
              ) : platformDomains.length === 0 ? (
                <div className="text-center py-8 text-[#B8C5D6]">
                  No domains configured. Add your primary domain to get started.
                </div>
              ) : (
                platformDomains.map((domain) => (
                  <div
                    key={domain._id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      domain.type === "primary"
                        ? "bg-[#FFD700]/10 border-[#FFD700]/30"
                        : domain.isActive
                          ? "bg-[#0A1A2F] border-[#2A3F55]"
                          : "bg-[#0A1A2F]/50 border-[#2A3F55]/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {domain.type === "primary" ? (
                        <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
                      ) : (
                        <Globe className="w-5 h-5 text-[#B8C5D6]" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium">{domain.domain}</span>
                          {domain.type === "primary" && <Badge className="bg-[#FFD700] text-[#0A1A2F]">Primary</Badge>}
                          {getStatusBadge(domain.status)}
                          {!domain.isActive && (
                            <Badge variant="outline" className="border-gray-500 text-gray-400">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#B8C5D6] mt-1">
                          {domain.lastHealthCheck && (
                            <span>
                              <Clock className="w-3 h-3 inline mr-1" />
                              Last check: {new Date(domain.lastHealthCheck).toLocaleTimeString()}
                            </span>
                          )}
                          {domain.responseTime && <span>Response: {domain.responseTime}ms</span>}
                          {domain.sslValid && <span className="text-green-400">SSL Valid</span>}
                          {domain.failoverCount > 0 && (
                            <span className="text-yellow-400">Failovers: {domain.failoverCount}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDnsRecords(domain)}
                        className="text-[#B8C5D6] hover:bg-[#2A3F55]"
                        title="View DNS Records"
                      >
                        <Info className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://${domain.domain}`, "_blank")}
                        className="text-[#B8C5D6] hover:bg-[#2A3F55]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>

                      {domain.type !== "primary" && (
                        <>
                          <Switch
                            checked={domain.isActive}
                            onCheckedChange={() => togglePlatformDomainActive(domain._id)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPlatformPrimary(domain._id)}
                            className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/20"
                          >
                            Set Primary
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlatformDomain(domain._id)}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-[#B8C5D6] space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Domain Rotation</h4>
              <p className="text-sm">
                Add up to 10 mirror domains as backups. The system automatically monitors each domain&apos;s health and
                will failover to a backup if the primary becomes blocked or slow.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Vercel Integration</h4>
              <p className="text-sm">
                When you add a domain, it&apos;s automatically registered with Vercel. DNS records are provided for you
                to configure with your domain registrar.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">DNS Configuration</h4>
              <p className="text-sm">
                After adding a domain, configure the DNS records shown in the DNS modal with your registrar. Click
                Verify to confirm the configuration is complete.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dnsModal.open} onOpenChange={(open) => setDnsModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700] flex items-center gap-2">
              <Globe className="w-5 h-5" />
              DNS Configuration: {dnsModal.domain?.domain}
            </DialogTitle>
            <DialogDescription className="text-[#B8C5D6]">
              {dnsModal.message || "Configure these DNS records with your domain registrar."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-[#B8C5D6]">Status:</span>
              {dnsModal.domain && getStatusBadge(dnsModal.domain.status)}
            </div>

            {/* DNS Records */}
            {dnsModal.dnsRecords && dnsModal.dnsRecords.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-white font-medium">Required DNS Records</h4>
                {dnsModal.dnsRecords.map((record, index) => (
                  <div key={index} className="bg-[#0A1A2F] rounded-lg p-4 border border-[#2A3F55]">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{record.type} Record</Badge>
                      <span className="text-xs text-[#B8C5D6]">{record.purpose}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-[#B8C5D6]">Name / Host</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-[#1A2F45] px-2 py-1 rounded text-sm flex-1 text-white">
                            {record.name}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(record.name)}
                            className="text-[#B8C5D6] hover:bg-[#2A3F55] p-1 h-auto"
                          >
                            {copiedValue === record.name ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-[#B8C5D6]">Value / Points To</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-[#1A2F45] px-2 py-1 rounded text-sm flex-1 text-white truncate">
                            {record.value}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(record.value)}
                            className="text-[#B8C5D6] hover:bg-[#2A3F55] p-1 h-auto"
                          >
                            {copiedValue === record.value ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0A1A2F] rounded-lg p-4 border border-[#2A3F55]">
                <p className="text-[#B8C5D6] text-sm">
                  No DNS records available. This may be because Vercel credentials are not configured, or the domain was
                  added manually.
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-white font-medium text-sm">Default DNS Setup:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[#B8C5D6]">Type</Label>
                      <code className="block bg-[#1A2F45] px-2 py-1 rounded text-sm mt-1">A or CNAME</code>
                    </div>
                    <div>
                      <Label className="text-xs text-[#B8C5D6]">Value</Label>
                      <code className="block bg-[#1A2F45] px-2 py-1 rounded text-sm mt-1">
                        76.76.21.21 or cname.vercel-dns.com
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <Alert className="bg-[#0A1A2F] border-[#2A3F55]">
              <Info className="h-4 w-4" />
              <AlertTitle className="text-white">Setup Instructions</AlertTitle>
              <AlertDescription className="text-[#B8C5D6] text-sm">
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Log in to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)</li>
                  <li>Navigate to DNS Management for {dnsModal.domain?.domain}</li>
                  <li>Add the DNS records shown above</li>
                  <li>Save changes and wait for propagation (5-60 minutes)</li>
                  <li>Click Verify below to confirm configuration</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDnsModal((prev) => ({ ...prev, open: false }))}
                className="border-[#2A3F55] text-[#B8C5D6] hover:bg-[#2A3F55]"
              >
                Close
              </Button>
              {dnsModal.domain?.status !== "healthy" && (
                <Button
                  onClick={() => verifyDomain(dnsModal.domain?._id)}
                  disabled={dnsModal.verifying}
                  className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
                >
                  {dnsModal.verifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify Domain
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}
