"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAuthToken, getUser } from "@/lib/auth-service"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Key,
  Plus,
  Activity,
  AlertTriangle,
  Copy,
  Edit,
  Globe,
  TrendingUp,
  HelpCircle,
  RefreshCw,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Building2,
  Users,
  ExternalLink,
} from "lucide-react"

const ALL_SCOPES = [
  { id: "read:bets", label: "Read Bets", category: "Read" },
  { id: "read:players", label: "Read Players", category: "Read" },
  { id: "read:transactions", label: "Read Transactions", category: "Read" },
  { id: "read:events", label: "Read Events", category: "Read" },
  { id: "read:odds", label: "Read Odds", category: "Read" },
  { id: "read:reports", label: "Read Reports", category: "Read" },
  { id: "read:wallets", label: "Read Wallets", category: "Read" },
  { id: "write:bets", label: "Write Bets", category: "Write" },
  { id: "write:players", label: "Write Players", category: "Write" },
  { id: "write:transactions", label: "Write Transactions", category: "Write" },
  { id: "write:wallets", label: "Write Wallets", category: "Write" },
  { id: "admin:full", label: "Full Admin Access", category: "Admin" },
  { id: "admin:reports", label: "Admin Reports", category: "Admin" },
  { id: "webhooks:receive", label: "Receive Webhooks", category: "Webhooks" },
  { id: "webhooks:manage", label: "Manage Webhooks", category: "Webhooks" },
  { id: "global:read", label: "Global Read Access", category: "Global" },
  { id: "global:write", label: "Global Write Access", category: "Global" },
  { id: "global:admin", label: "Global Admin Access", category: "Global" },
]

const KEY_TYPES = [
  { id: "tenant", label: "Tenant Specific", description: "Access data for a specific tenant only", icon: Building2 },
  { id: "global", label: "Global/Platform", description: "Access platform-wide data across all tenants", icon: Globe },
  {
    id: "external",
    label: "External Partner",
    description: "For third-party integrations and partners",
    icon: ExternalLink,
  },
  {
    id: "partner",
    label: "Business Partner",
    description: "For strategic business partners with special access",
    icon: Users,
  },
]

export default function ApiGovernancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [apiKeys, setApiKeys] = useState([])
  const [tenants, setTenants] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [newKey, setNewKey] = useState(null)
  const [showSecret, setShowSecret] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    keyType: "tenant", // Added keyType
    tenantId: "",
    allowedTenants: [], // Added for global/external keys
    environment: "sandbox",
    rateLimitMinute: "60",
    rateLimitHour: "1000",
    rateLimitDay: "10000",
    monthlyQuota: "100000",
    ipWhitelistEnabled: false,
    ipWhitelist: [],
    scopes: ["read:events", "read:odds"],
    partnerInfo: {
      organizationName: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      notes: "",
    },
  })
  const [ipInput, setIpInput] = useState("")

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = getAuthToken()
        const user = getUser()

        if (!token || !user) {
          router.replace("/s/login")
          return false
        }

        if (user.role !== "superadmin" && user.role !== "super_admin") {
          router.replace("/s/login")
          return false
        }

        return true
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        router.replace("/s/login")
        return false
      }
    }

    const isAuth = checkAuth()
    if (isAuth) {
      setAuthenticated(true)
      fetchData()
      fetchAnalytics()
    }
  }, [router])

  const fetchData = async () => {
    try {
      console.log("[v0] Fetching API governance data...")
      const token = getAuthToken()
      if (!token) return

      const res = await fetch("/api/super/api-governance", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      console.log("[v0] API Governance response:", {
        success: data.success,
        apiKeysCount: data.apiKeys?.length,
        tenantsCount: data.tenants?.length,
        tenants: data.tenants,
        error: data.error,
      })

      if (data.success) {
        setApiKeys(data.apiKeys || [])
        setTenants(data.tenants || [])
      } else {
        console.error("[v0] API Governance fetch failed:", data.error)
        await fetchTenantsFallback()
      }
    } catch (error) {
      console.error("[v0] Error fetching API keys:", error)
      await fetchTenantsFallback()
    } finally {
      setLoading(false)
    }
  }

  const fetchTenantsFallback = async () => {
    try {
      console.log("[v0] Trying fallback tenant fetch from /api/super/tenants...")
      const token = getAuthToken()
      if (!token) return

      const res = await fetch("/api/super/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      console.log("[v0] Fallback tenants response:", data)

      if (data.tenants && Array.isArray(data.tenants)) {
        const mappedTenants = data.tenants.map((t) => ({
          id: t.id || t._id,
          _id: t.id || t._id,
          name: t.name,
        }))
        console.log("[v0] Mapped tenants:", mappedTenants)
        setTenants(mappedTenants)
      }
    } catch (error) {
      console.error("[v0] Fallback tenant fetch failed:", error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const res = await fetch("/api/super/api-governance?action=analytics", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setAnalytics(data.analytics)
        // Also get tenants from analytics response if available
        if (data.tenants) {
          setTenants(data.tenants)
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching analytics:", error)
    }
  }

  const handleCreateKey = async () => {
    try {
      if (formData.keyType === "tenant" && !formData.tenantId) {
        alert("Please select a tenant for tenant-specific API key")
        return
      }

      if (
        (formData.keyType === "external" || formData.keyType === "partner") &&
        !formData.partnerInfo.organizationName
      ) {
        alert("Please enter organization name for external/partner API key")
        return
      }

      console.log("[v0] Creating API key with data:", formData)

      const token = getAuthToken()
      if (!token) return

      const res = await fetch("/api/super/api-governance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "create",
          name: formData.name,
          description: formData.description,
          keyType: formData.keyType, // Include keyType
          tenantId: formData.keyType === "tenant" ? formData.tenantId : null, // Only send tenantId for tenant keys
          allowedTenants: formData.keyType !== "tenant" ? formData.allowedTenants : [], // Send allowed tenants for non-tenant keys
          partnerInfo: formData.keyType !== "tenant" ? formData.partnerInfo : null, // Send partner info
          environment: formData.environment,
          rateLimit: {
            requestsPerMinute: Number.parseInt(formData.rateLimitMinute) || 60,
            requestsPerHour: Number.parseInt(formData.rateLimitHour) || 1000,
            requestsPerDay: Number.parseInt(formData.rateLimitDay) || 10000,
          },
          ipWhitelist: {
            enabled: formData.ipWhitelistEnabled,
            addresses: formData.ipWhitelist,
          },
          scopes: formData.scopes,
          quota: {
            monthlyLimit: Number.parseInt(formData.monthlyQuota) || 100000,
          },
        }),
      })

      const data = await res.json()
      console.log("[v0] Create key response:", data)

      if (data.success) {
        setNewKey(data)
        setShowCreateModal(false)
        setShowKeyModal(true)
        fetchData()
        // Reset form
        setFormData({
          name: "",
          description: "",
          keyType: "tenant",
          tenantId: "",
          allowedTenants: [],
          environment: "sandbox",
          rateLimitMinute: "60",
          rateLimitHour: "1000",
          rateLimitDay: "10000",
          monthlyQuota: "100000",
          ipWhitelistEnabled: false,
          ipWhitelist: [],
          scopes: ["read:events", "read:odds"],
          partnerInfo: {
            organizationName: "",
            contactEmail: "",
            contactPhone: "",
            website: "",
            notes: "",
          },
        })
      } else {
        alert("Error creating API key: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.error("[v0] Error creating API key:", error)
      alert("Error creating API key: " + error.message)
    }
  }

  const handleUpdateKey = async () => {
    if (!editingKey) return
    try {
      const token = getAuthToken()
      if (!token) return

      const res = await fetch(`/api/super/api-governance/${editingKey._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingKey),
      })
      const data = await res.json()
      if (data.success) {
        setShowEditModal(false)
        fetchData()
      } else {
        alert("Error updating API key: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.error("[v0] Error updating API key:", error)
      alert("Error updating API key: " + error.message)
    }
  }

  const handleRevokeKey = async (keyId) => {
    if (!confirm("Are you sure you want to revoke this API key? This cannot be undone.")) return
    try {
      const token = getAuthToken()
      if (!token) return

      const res = await fetch(`/api/super/api-governance/${keyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert("Error revoking API key: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.error("[v0] Error revoking API key:", error)
      alert("Error revoking API key: " + error.message)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const addIpAddress = () => {
    if (ipInput && !formData.ipWhitelist.includes(ipInput)) {
      setFormData({
        ...formData,
        ipWhitelist: [...formData.ipWhitelist, ipInput],
      })
      setIpInput("")
    }
  }

  const removeIpAddress = (ip) => {
    setFormData({
      ...formData,
      ipWhitelist: formData.ipWhitelist.filter((a) => a !== ip),
    })
  }

  const toggleAllowedTenant = (tenantId) => {
    const current = formData.allowedTenants || []
    if (current.includes(tenantId)) {
      setFormData({ ...formData, allowedTenants: current.filter((id) => id !== tenantId) })
    } else {
      setFormData({ ...formData, allowedTenants: [...current, tenantId] })
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A84B]"></div>
      </div>
    )
  }

  const getKeyTypeBadge = (keyType) => {
    switch (keyType) {
      case "global":
        return <Badge className="bg-purple-500/20 text-purple-400">Global</Badge>
      case "external":
        return <Badge className="bg-blue-500/20 text-blue-400">External</Badge>
      case "partner":
        return <Badge className="bg-green-500/20 text-green-400">Partner</Badge>
      default:
        return <Badge className="bg-amber-500/20 text-amber-400">Tenant</Badge>
    }
  }

  return (
    <SuperAdminLayout title="API Governance" description="Manage API keys, rate limits, and monitor API usage">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#D4A84B]">API Governance</h1>
            <p className="text-[#8A9BAD]">Manage API keys, rate limits, and monitor usage</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowHelpModal(true)}
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              How This Works
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                fetchData()
                fetchAnalytics()
              }}
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="bg-[#D4A84B] text-[#0A1A2F] hover:bg-[#E5B95C]">
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1A2F45] border-[#2A3F55]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-[#0F2132] border-[#1A3550]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#D4A84B]/20 rounded-lg">
                      <Key className="w-5 h-5 text-[#D4A84B]" />
                    </div>
                    <div>
                      <p className="text-[#8A9BAD] text-sm">Active Keys</p>
                      <p className="text-2xl font-bold text-[#F5F5F5]">
                        {apiKeys.filter((k) => k.status === "active").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0F2132] border-[#1A3550]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[#8A9BAD] text-sm">Requests Today</p>
                      <p className="text-2xl font-bold text-[#F5F5F5]">{analytics?.requestsToday || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0F2132] border-[#1A3550]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[#8A9BAD] text-sm">Success Rate</p>
                      <p className="text-2xl font-bold text-[#F5F5F5]">{analytics?.successRate || "99.9"}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0F2132] border-[#1A3550]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[#8A9BAD] text-sm">Rate Limited</p>
                      <p className="text-2xl font-bold text-[#F5F5F5]">{analytics?.rateLimitedToday || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent API Keys */}
            <Card className="bg-[#0F2132] border-[#1A3550]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">Recent API Keys</CardTitle>
                <CardDescription className="text-[#8A9BAD]">Recently created or updated API keys</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A84B]"></div>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-[#8A9BAD]">
                    <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No API keys created yet</p>
                    <Button onClick={() => setShowCreateModal(true)} className="mt-4 bg-[#D4A84B] text-[#0A1A2F]">
                      Create Your First API Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.slice(0, 5).map((key) => (
                      <div key={key._id} className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Key className="w-5 h-5 text-[#D4A84B]" />
                          <div>
                            <p className="text-[#F5F5F5] font-medium">{key.name}</p>
                            <div className="flex items-center gap-2 text-sm text-[#8A9BAD]">
                              <code className="text-xs bg-[#0A1A2F] px-2 py-0.5 rounded">{key.keyPrefix}...</code>
                              {getKeyTypeBadge(key.keyType)}
                              {key.tenantId?.name && <span>• Tenant: {key.tenantId.name}</span>}
                              {key.partnerInfo?.organizationName && (
                                <span>• Partner: {key.partnerInfo.organizationName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              key.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : key.status === "revoked"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }
                          >
                            {key.status}
                          </Badge>
                          <Badge
                            className={
                              key.environment === "production"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-blue-500/20 text-blue-400"
                            }
                          >
                            {key.environment}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-4">
            <Card className="bg-[#0F2132] border-[#1A3550]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">API Keys</CardTitle>
                <CardDescription className="text-[#8A9BAD]">Manage API keys for external integrations</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A84B]"></div>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-[#8A9BAD]">
                    <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No API keys created yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div
                        key={key._id}
                        className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-[#D4A84B]/20 rounded-lg">
                            <Key className="w-6 h-6 text-[#D4A84B]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[#F5F5F5] font-semibold">{key.name}</p>
                              {getKeyTypeBadge(key.keyType)}
                            </div>
                            <code className="text-xs text-[#8A9BAD] bg-[#0A1A2F] px-2 py-0.5 rounded">
                              {key.keyPrefix}...
                            </code>
                            <div className="flex items-center gap-4 mt-1 text-xs text-[#6A7B8D]">
                              {key.tenantId?.name && <span>Tenant: {key.tenantId.name}</span>}
                              {key.partnerInfo?.organizationName && (
                                <span>Partner: {key.partnerInfo.organizationName}</span>
                              )}
                              <span>Rate: {key.rateLimit?.requestsPerMinute || 60}/min</span>
                              <span>
                                Quota: {key.quota?.currentUsage || 0}/{key.quota?.monthlyLimit || 100000}
                              </span>
                              <span>
                                Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {key.scopes?.slice(0, 4).map((scope) => (
                                <Badge
                                  key={scope}
                                  variant="outline"
                                  className="text-xs border-[#2A3F55] text-[#8A9BAD]"
                                >
                                  {scope}
                                </Badge>
                              ))}
                              {key.scopes?.length > 4 && (
                                <Badge variant="outline" className="text-xs border-[#2A3F55] text-[#8A9BAD]">
                                  +{key.scopes.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={
                              key.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : key.status === "revoked"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }
                          >
                            {key.status}
                          </Badge>
                          <Badge
                            className={
                              key.environment === "production"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-blue-500/20 text-blue-400"
                            }
                          >
                            {key.environment}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingKey(key)
                              setShowEditModal(true)
                            }}
                            className="text-[#8A9BAD] hover:text-[#F5F5F5]"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRevokeKey(key._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4">
            <Card className="bg-[#0F2132] border-[#1A3550]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">API Usage Monitoring</CardTitle>
                <CardDescription className="text-[#8A9BAD]">Track API usage and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-[#8A9BAD]">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Monitoring dashboard coming soon</p>
                  <p className="text-sm mt-2">Real-time metrics and alerts will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-4">
            <Card className="bg-[#0F2132] border-[#1A3550]">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5]">API Documentation</CardTitle>
                <CardDescription className="text-[#8A9BAD]">Learn how to use the API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <h3 className="text-[#FFD700] text-lg font-semibold mb-2">Authentication</h3>
                    <p className="text-[#B8C5D6] mb-3">
                      Include your API key in the <code className="text-[#D4A84B]">X-Api-Key</code> header:
                    </p>
                    <pre className="bg-[#0A1A2F] p-4 rounded-lg overflow-x-auto">
                      <code className="text-green-400">{`curl -X GET "https://api.yourplatform.com/api/external/v1/bets" \\
  -H "X-Api-Key: gb_test_abc123..." \\
  -H "Content-Type: application/json"`}</code>
                    </pre>
                  </div>

                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <h3 className="text-[#FFD700] text-lg font-semibold mb-2">Available Endpoints</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-[#0A1A2F] rounded">
                        <Badge className="bg-green-500/20 text-green-400">GET</Badge>
                        <code className="text-[#F5F5F5]">/api/external/v1/bets</code>
                        <span className="text-[#B8C5D6] text-sm">List bets</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-[#0A1A2F] rounded">
                        <Badge className="bg-green-500/20 text-green-400">GET</Badge>
                        <code className="text-[#F5F5F5]">/api/external/v1/players</code>
                        <span className="text-[#B8C5D6] text-sm">List players</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-[#0A1A2F] rounded">
                        <Badge className="bg-green-500/20 text-green-400">GET</Badge>
                        <code className="text-[#F5F5F5]">/api/external/v1/events</code>
                        <span className="text-[#B8C5D6] text-sm">List events</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-[#0A1A2F] rounded">
                        <Badge className="bg-green-500/20 text-green-400">GET</Badge>
                        <code className="text-[#F5F5F5]">/api/external/v1/odds/:eventId</code>
                        <span className="text-[#B8C5D6] text-sm">Get odds for event</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-[#0A1A2F] rounded">
                        <Badge className="bg-green-500/20 text-green-400">GET</Badge>
                        <code className="text-[#F5F5F5]">/api/external/v1/transactions</code>
                        <span className="text-[#B8C5D6] text-sm">List transactions</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-[#0A1A2F] rounded">
                        <Badge className="bg-green-500/20 text-green-400">GET</Badge>
                        <code className="text-[#F5F5F5]">/api/external/v1/health</code>
                        <span className="text-[#B8C5D6] text-sm">API health check</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <h3 className="text-[#FFD700] text-lg font-semibold mb-2">Rate Limits</h3>
                    <p className="text-[#B8C5D6] mb-3">Rate limit information is included in every response:</p>
                    <pre className="bg-[#0A1A2F] p-4 rounded-lg overflow-x-auto">
                      <code className="text-blue-400">{`{
  "success": true,
  "data": { ... },
  "meta": {
    "rateLimit": {
      "remaining": { "minute": 55, "hour": 990, "day": 9900 },
      "limit": { "minute": 60, "hour": 1000, "day": 10000 }
    }
  }
}`}</code>
                    </pre>
                  </div>

                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <h3 className="text-[#FFD700] text-lg font-semibold mb-2">Error Codes</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-500/20 text-red-400">401</Badge>
                        <span className="text-[#F5F5F5]">MISSING_API_KEY / INVALID_API_KEY</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-500/20 text-red-400">403</Badge>
                        <span className="text-[#F5F5F5]">IP_NOT_WHITELISTED / INSUFFICIENT_SCOPE</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-orange-500/20 text-orange-400">429</Badge>
                        <span className="text-[#F5F5F5]">RATE_LIMIT_EXCEEDED / QUOTA_EXCEEDED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create API Key Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-[#0F2132] border-[#1A3550] text-[#F5F5F5] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#D4A84B]">Create API Key</DialogTitle>
              <DialogDescription className="text-[#8A9BAD]">
                Generate a new API key for external integrations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div>
                <Label className="text-[#D4A84B] font-semibold mb-3 block">Key Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {KEY_TYPES.map((type) => (
                    <div
                      key={type.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          keyType: type.id,
                          tenantId: type.id === "tenant" ? formData.tenantId : "",
                        })
                      }
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.keyType === type.id
                          ? "border-[#D4A84B] bg-[#D4A84B]/10"
                          : "border-[#2A3F55] bg-[#1A2F45] hover:border-[#3A4F65]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <type.icon
                          className={`w-5 h-5 ${formData.keyType === type.id ? "text-[#D4A84B]" : "text-[#8A9BAD]"}`}
                        />
                        <div>
                          <p
                            className={`font-medium ${formData.keyType === type.id ? "text-[#D4A84B]" : "text-[#F5F5F5]"}`}
                          >
                            {type.label}
                          </p>
                          <p className="text-xs text-[#8A9BAD]">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#B8C5D6]">Key Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My API Key"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Environment *</Label>
                  <Select
                    value={formData.environment}
                    onValueChange={(v) => setFormData({ ...formData, environment: v })}
                  >
                    <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.keyType === "tenant" && (
                <div>
                  <Label className="text-[#B8C5D6]">Tenant *</Label>
                  <Select value={formData.tenantId} onValueChange={(v) => setFormData({ ...formData, tenantId: v })}>
                    <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                      {tenants && tenants.length > 0 ? (
                        tenants.map((t) => (
                          <SelectItem key={t.id || t._id} value={t.id || t._id}>
                            {t.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-[#8A9BAD] text-sm">No tenants available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.keyType !== "tenant" && (
                <div>
                  <Label className="text-[#B8C5D6]">Allowed Tenants (Optional)</Label>
                  <p className="text-xs text-[#6A7B8D] mb-2">
                    Select which tenants this key can access. Leave empty for all tenants.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                    {tenants && tenants.length > 0 ? (
                      tenants.map((t) => (
                        <div key={t.id || t._id} className="flex items-center gap-2">
                          <Checkbox
                            id={`tenant-${t.id || t._id}`}
                            checked={(formData.allowedTenants || []).includes(t.id || t._id)}
                            onCheckedChange={() => toggleAllowedTenant(t.id || t._id)}
                          />
                          <Label htmlFor={`tenant-${t.id || t._id}`} className="text-sm text-[#B8C5D6] cursor-pointer">
                            {t.name}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#6A7B8D] col-span-2">No tenants available</p>
                    )}
                  </div>
                </div>
              )}

              {(formData.keyType === "external" || formData.keyType === "partner") && (
                <div className="space-y-4 p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                  <Label className="text-[#D4A84B] font-semibold">Partner/Organization Information</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Organization Name *</Label>
                      <Input
                        value={formData.partnerInfo.organizationName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partnerInfo: { ...formData.partnerInfo, organizationName: e.target.value },
                          })
                        }
                        placeholder="Company Name"
                        className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Contact Email</Label>
                      <Input
                        type="email"
                        value={formData.partnerInfo.contactEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partnerInfo: { ...formData.partnerInfo, contactEmail: e.target.value },
                          })
                        }
                        placeholder="contact@company.com"
                        className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Contact Phone</Label>
                      <Input
                        value={formData.partnerInfo.contactPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partnerInfo: { ...formData.partnerInfo, contactPhone: e.target.value },
                          })
                        }
                        placeholder="+1 234 567 8900"
                        className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Website</Label>
                      <Input
                        value={formData.partnerInfo.website}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partnerInfo: { ...formData.partnerInfo, website: e.target.value },
                          })
                        }
                        placeholder="https://company.com"
                        className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6] text-xs">Notes</Label>
                    <Textarea
                      value={formData.partnerInfo.notes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          partnerInfo: { ...formData.partnerInfo, notes: e.target.value },
                        })
                      }
                      placeholder="Additional notes about this partner..."
                      className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-[#B8C5D6]">Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this key used for?"
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>

              {/* Rate Limits */}
              <div>
                <Label className="text-[#D4A84B] font-semibold">Rate Limits</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label className="text-[#B8C5D6] text-xs">Per Minute</Label>
                    <Input
                      type="number"
                      value={formData.rateLimitMinute}
                      onChange={(e) => setFormData({ ...formData, rateLimitMinute: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6] text-xs">Per Hour</Label>
                    <Input
                      type="number"
                      value={formData.rateLimitHour}
                      onChange={(e) => setFormData({ ...formData, rateLimitHour: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6] text-xs">Per Day</Label>
                    <Input
                      type="number"
                      value={formData.rateLimitDay}
                      onChange={(e) => setFormData({ ...formData, rateLimitDay: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Quota */}
              <div>
                <Label className="text-[#B8C5D6]">Monthly Quota</Label>
                <Input
                  type="number"
                  value={formData.monthlyQuota}
                  onChange={(e) => setFormData({ ...formData, monthlyQuota: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>

              {/* IP Whitelist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[#D4A84B] font-semibold">IP Whitelist</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.ipWhitelistEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, ipWhitelistEnabled: checked })}
                    />
                    <span className="text-sm text-[#8A9BAD]">
                      {formData.ipWhitelistEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                {formData.ipWhitelistEnabled && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={ipInput}
                        onChange={(e) => setIpInput(e.target.value)}
                        placeholder="Enter IP address (e.g., 192.168.1.1)"
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                      <Button onClick={addIpAddress} variant="outline" className="border-[#2A3F55] bg-transparent">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.ipWhitelist.map((ip) => (
                        <Badge
                          key={ip}
                          className="bg-[#1A2F45] text-[#B8C5D6] cursor-pointer hover:bg-red-500/20"
                          onClick={() => removeIpAddress(ip)}
                        >
                          {ip} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* API Scopes */}
              <div>
                <Label className="text-[#D4A84B] font-semibold">API Scopes</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-2 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                  {ALL_SCOPES.map((scope) => (
                    <div key={scope.id} className="flex items-center gap-2">
                      <Checkbox
                        id={scope.id}
                        checked={formData.scopes.includes(scope.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, scopes: [...formData.scopes, scope.id] })
                          } else {
                            setFormData({ ...formData, scopes: formData.scopes.filter((s) => s !== scope.id) })
                          }
                        }}
                      />
                      <Label htmlFor={scope.id} className="text-sm text-[#B8C5D6] cursor-pointer">
                        {scope.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-[#2A3F55] text-[#B8C5D6]"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateKey} className="bg-[#D4A84B] text-[#0A1A2F] hover:bg-[#E5B95C]">
                Create API Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Key Success Modal */}
        <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
          <DialogContent className="bg-[#0F2132] border-[#1A3550] text-[#F5F5F5]">
            <DialogHeader>
              <DialogTitle className="text-green-400 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                API Key Created Successfully
              </DialogTitle>
              <DialogDescription className="text-[#8A9BAD]">
                Save this key now - you won't be able to see it again!
              </DialogDescription>
            </DialogHeader>
            {newKey && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                  <Label className="text-[#B8C5D6] text-sm">API Key</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-[#0A1A2F] p-2 rounded text-[#D4A84B] font-mono text-sm break-all">
                      {showSecret ? newKey.apiKey : "••••••••••••••••••••••••••••••••"}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newKey.apiKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-orange-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    This key will only be shown once. Please save it securely.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowKeyModal(false)} className="bg-[#D4A84B] text-[#0A1A2F]">
                I've Saved My Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Key Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-[#0F2132] border-[#1A3550] text-[#F5F5F5] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#D4A84B]">Edit API Key</DialogTitle>
            </DialogHeader>
            {editingKey && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-[#B8C5D6]">Status</Label>
                  <Select value={editingKey.status} onValueChange={(v) => setEditingKey({ ...editingKey, status: v })}>
                    <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[#B8C5D6] text-xs">Rate/Min</Label>
                    <Input
                      type="number"
                      value={editingKey.rateLimit?.requestsPerMinute || 60}
                      onChange={(e) =>
                        setEditingKey({
                          ...editingKey,
                          rateLimit: { ...editingKey.rateLimit, requestsPerMinute: Number.parseInt(e.target.value) },
                        })
                      }
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6] text-xs">Rate/Hour</Label>
                    <Input
                      type="number"
                      value={editingKey.rateLimit?.requestsPerHour || 1000}
                      onChange={(e) =>
                        setEditingKey({
                          ...editingKey,
                          rateLimit: { ...editingKey.rateLimit, requestsPerHour: Number.parseInt(e.target.value) },
                        })
                      }
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#B8C5D6] text-xs">Rate/Day</Label>
                    <Input
                      type="number"
                      value={editingKey.rateLimit?.requestsPerDay || 10000}
                      onChange={(e) =>
                        setEditingKey({
                          ...editingKey,
                          rateLimit: { ...editingKey.rateLimit, requestsPerDay: Number.parseInt(e.target.value) },
                        })
                      }
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="border-[#2A3F55]">
                Cancel
              </Button>
              <Button onClick={handleUpdateKey} className="bg-[#D4A84B] text-[#0A1A2F]">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Help Modal */}
        <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
          <DialogContent className="bg-[#0F2132] border-[#1A3550] text-[#F5F5F5] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#D4A84B]">How API Governance Works</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-[#B8C5D6]">
              <div>
                <h4 className="text-[#F5F5F5] font-semibold mb-2">API Key Types</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>Tenant Specific:</strong> Access data for a specific tenant only
                  </li>
                  <li>
                    <strong>Global/Platform:</strong> Access platform-wide data across tenants
                  </li>
                  <li>
                    <strong>External Partner:</strong> For third-party integrations
                  </li>
                  <li>
                    <strong>Business Partner:</strong> For strategic partners with special access
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-[#F5F5F5] font-semibold mb-2">Environments</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>Sandbox:</strong> For testing, uses test data
                  </li>
                  <li>
                    <strong>Production:</strong> Live data, use with caution
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-[#F5F5F5] font-semibold mb-2">Rate Limits</h4>
                <p className="text-sm">
                  Control how many API requests can be made per minute/hour/day to protect your system.
                </p>
              </div>
              <div>
                <h4 className="text-[#F5F5F5] font-semibold mb-2">Scopes</h4>
                <p className="text-sm">
                  Define what data and actions the API key can access. Follow principle of least privilege.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowHelpModal(false)} className="bg-[#D4A84B] text-[#0A1A2F]">
                Got It
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}
