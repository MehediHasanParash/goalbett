"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Trash2,
  Settings,
  Users,
  DollarSign,
  Globe,
  Copy,
  Check,
  XCircle,
  CheckCircle,
  ToggleLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  Edit,
  Cog,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TenantConfigModal } from "./tenant-config-modal"
import { LogoUploader } from "@/components/ui/logo-uploader"
import { getAuthToken } from "@/lib/auth-service"
import { UNIQUE_CURRENCY_OPTIONS } from "@/lib/currency-config"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const generateSlug = (businessName) => {
  if (!businessName) return ""
  return businessName
    .toLowerCase()
    .replace(/\s+ltd\.?$/i, "") // Remove "LTD" suffix
    .replace(/\s+llc\.?$/i, "") // Remove "LLC" suffix
    .replace(/\s+inc\.?$/i, "") // Remove "Inc" suffix
    .replace(/\s+corp\.?$/i, "") // Remove "Corp" suffix
    .replace(/\s+co\.?$/i, "") // Remove "Co" suffix
    .replace(/[^a-z0-9]+/g, "") // Remove all non-alphanumeric chars (no hyphens)
    .replace(/^-|-$/g, "")
}

const generateDomainUrl = (slug) => {
  if (!slug) return ""
  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost"
  if (isLocalhost) {
    return `${slug}.localhost:3000`
  }
  // For production - use subdomain format
  let baseDomain = typeof window !== "undefined" ? window.location.hostname : "goalbett.com"

  if (baseDomain.startsWith("www.")) {
    baseDomain = baseDomain.replace(/^www\./, "")
  }

  const parts = baseDomain.split(".")

  // Check if it's a Vercel subdomain format (e.g., goal-bett.vercel.app)
  if (parts.length >= 3 && parts[parts.length - 2] === "vercel") {
    // Vercel subdomain format: subdomain.app-name.vercel.app
    return `https://${slug}.${parts.slice(-3).join(".")}`
  }

  // Custom domain format (e.g., goalbett.com -> betmax.goalbett.com)
  return `https://${slug}.${baseDomain}`
}

export function SuperAdminTenantManagement() {
  const router = useRouter()
  const [tenants, setTenants] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copiedDomain, setCopiedDomain] = useState(false)

  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [topupFormData, setTopupFormData] = useState({
    amount: "",
    method: "prepaid",
    reference: "",
    notes: "",
  })
  const [adjustFormData, setAdjustFormData] = useState({
    amount: "",
    type: "CREDIT",
    reason: "",
    reference: "",
  })

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    slug: "", // Added slug field
    domain: "",
    primaryDomain: "", // Added primaryDomain field
    status: "active", // Default to active
    currency: "USD",
    timezone: "UTC",
    logoUrl: "",
    logoPublicId: "",
    primaryColor: "#FFD700",
    secondaryColor: "#0A1A2F",
    accentColor: "#4A90E2",
  })

  const handleBusinessNameChange = (value) => {
    const slug = generateSlug(value)
    const domain = generateDomainUrl(slug)
    setFormData({
      ...formData,
      businessName: value,
      slug: slug,
      domain: domain,
    })
  }

  const handleSlugChange = (value) => {
    const cleanSlug = value.toLowerCase().replace(/[^a-z0-9]/g, "")
    const domain = generateDomainUrl(cleanSlug)
    setFormData({
      ...formData,
      slug: cleanSlug,
      domain: domain,
    })
  }

  const copyDomain = () => {
    navigator.clipboard.writeText(formData.domain)
    setCopiedDomain(true)
    setTimeout(() => setCopiedDomain(false), 2000)
  }

  const handleOpenSettings = (tenantId) => {
    router.push(`/s/tenant-management/${tenantId}/settings`)
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch("/api/super/tenants", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log(
          "[v0] Fetched tenants data:",
          data.tenants?.map((t) => ({
            name: t.name,
            walletBalance: t.wallet?.balance,
            walletAvailableBalance: t.wallet?.availableBalance,
            walletCurrency: t.wallet?.currency,
          })),
        )

        const mappedTenants = (data.tenants || []).map((tenant) => {
          const mappedBalance = tenant.wallet?.balance || tenant.wallet?.availableBalance || 0
          console.log("[v0] Mapping tenant:", {
            name: tenant.name,
            originalBalance: tenant.wallet?.balance,
            availableBalance: tenant.wallet?.availableBalance,
            mappedBalance,
          })

          return {
            _id: tenant.id,
            fullName: tenant.adminName || tenant.name,
            email: tenant.adminEmail,
            businessName: tenant.name,
            status: tenant.status,
            currency: tenant.default_currency,
            domain: tenant.configs?.domain || tenant.domain_list?.[0]?.domain,
            logoUrl: tenant.theme?.logoUrl || "",
            agentCount: tenant.stats?.agents || 0,
            adminCount: tenant.stats?.admins || 0,
            balance: mappedBalance,
            createdAt: tenant.created_at,
            designId: tenant.designId, // Added designId
            tenantConfig: {
              status: tenant.status,
              currency: tenant.default_currency,
              domain: tenant.configs?.domain || tenant.domain_list?.[0]?.domain,
              subdomain: tenant.configs?.subdomain || "",
              enabledModules: tenant.configs?.enabledModules || [],
              paymentProviders: tenant.configs?.paymentProviders || {},
              oddsProviders: tenant.configs?.oddsProviders || {},
              riskSettings: tenant.configs?.riskSettings || {},
              logoUrl: tenant.theme?.logoUrl || "",
              primaryColor: tenant.theme?.primaryColor || "#FFD700",
              secondaryColor: tenant.theme?.secondaryColor || "#0A1A2F",
              accentColor: tenant.theme?.accentColor || "#4A90E2", // Added accentColor
              brandName: tenant.theme?.brandName || "", // Added brandName
              designId: tenant.designId || "classic", // Added designId with default
            },
          }
        })
        setTenants(mappedTenants)
      }
    } catch (error) {
      console.error("Error fetching tenants:", error)
    }
  }

  const handleTopup = (tenant) => {
    setSelectedTenant(tenant)
    setTopupFormData({
      amount: "",
      method: "prepaid",
      reference: "",
      notes: "",
    })
    setIsTopupModalOpen(true)
  }

  const handleAdjust = (tenant) => {
    setSelectedTenant(tenant)
    setAdjustFormData({
      amount: "",
      type: "CREDIT",
      reason: "",
      reference: "",
    })
    setIsAdjustModalOpen(true)
  }

  const submitTopup = async () => {
    if (!topupFormData.amount || Number.parseFloat(topupFormData.amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (!topupFormData.reference) {
      alert("Please enter a reference number")
      return
    }

    setLoading(true)
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/tenants/${selectedTenant._id}/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(topupFormData.amount),
          method: topupFormData.method,
          reference: topupFormData.reference,
          notes: topupFormData.notes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const newBalance = data.data?.wallet?.availableBalance || data.newBalance || 0
        const currency = data.data?.wallet?.currency || selectedTenant.currency || "ETB"
        alert(`Topup successful! New balance: ${newBalance} ${currency}`)
        setIsTopupModalOpen(false)
        fetchTenants()
      } else {
        alert(data.error || "Failed to process topup")
      }
    } catch (error) {
      console.error("Error processing topup:", error)
      alert("Error processing topup")
    } finally {
      setLoading(false)
    }
  }

  const submitAdjustment = async () => {
    if (!adjustFormData.amount || Number.parseFloat(adjustFormData.amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (!adjustFormData.reason.trim()) {
      alert("Please enter a reason for this adjustment")
      return
    }

    setLoading(true)
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/tenants/${selectedTenant._id}/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(adjustFormData.amount),
          adjustmentType: adjustFormData.type,
          reason: adjustFormData.reason,
          reference: adjustFormData.reference,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const newBalance = data.data?.wallet?.availableBalance || data.newBalance || 0
        const currency = data.data?.wallet?.currency || selectedTenant.default_currency || "USD"
        alert(`Adjustment successful! New balance: ${newBalance} ${currency}`)
        setIsAdjustModalOpen(false)
        fetchTenants()
      } else {
        alert(data.error || "Failed to process adjustment")
      }
    } catch (error) {
      console.error("Error processing adjustment:", error)
      alert("Error processing adjustment")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = getAuthToken()
      const slug = formData.slug || generateSlug(formData.businessName || formData.name)

      const tenantData = {
        name: formData.name,
        slug: formData.slug,
        email: formData.email,
        password: formData.password,
        subdomain: formData.slug,
        primaryDomain: formData.primaryDomain || null,
        businessName: formData.businessName,
        currency: formData.currency,
        timezone: formData.timezone,
        status: formData.status,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        type: "client",
        theme: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          logoUrl: formData.logoUrl,
          brandName: formData.businessName,
        },
        designId: formData.designId || "classic", // Added designId
      }

      const response = await fetch("/api/super/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tenantData),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Tenant created successfully!")
        setIsCreateModalOpen(false)
        setFormData({
          name: "",
          email: "",
          password: "",
          businessName: "",
          slug: "",
          domain: "",
          primaryDomain: "",
          status: "active",
          currency: "USD",
          timezone: "UTC",
          logoUrl: "",
          logoPublicId: "",
          primaryColor: "#FFD700",
          secondaryColor: "#0A1A2F",
          accentColor: "#4A90E2",
          designId: "classic", // Reset designId
        })
        fetchTenants()
      } else {
        alert(data.error || "Failed to create tenant")
      }
    } catch (error) {
      console.error("Error creating tenant:", error)
      alert("Error creating tenant")
    } finally {
      setLoading(false)
    }
  }

  const filteredTenants = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.businessName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "trial":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "inactive":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "suspended":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const handleConfigTenant = async (tenant) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/tenants/${tenant._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Tenant details response:", data.tenant)
        setSelectedTenant({
          ...tenant,
          designId: data.tenant?.designId || tenant.designId || "classic",
          tenantConfig: {
            ...tenant.tenantConfig,
            ...data.tenant?.configs,
            logoUrl: data.tenant?.theme?.logoUrl || tenant.tenantConfig?.logoUrl,
            primaryColor: data.tenant?.theme?.primaryColor || tenant.tenantConfig?.primaryColor,
            secondaryColor: data.tenant?.theme?.secondaryColor || tenant.tenantConfig?.secondaryColor,
            accentColor: data.tenant?.theme?.accentColor || tenant.tenantConfig?.accentColor,
            brandName: data.tenant?.theme?.brandName || tenant.tenantConfig?.brandName,
            designId: data.tenant?.designId || tenant.designId || "classic",
          },
        })
        setIsConfigModalOpen(true)
      }
    } catch (error) {
      console.error("Error fetching tenant details:", error)
    }
  }

  const handleDeleteTenant = async (tenantId) => {
    if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        alert("Authentication required. Please log in again.")
        return
      }

      const response = await fetch(`/api/super/tenants/${tenantId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        alert("Tenant deleted successfully")
        await fetchTenants()
      } else {
        alert(`Failed to delete tenant: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error deleting tenant:", error)
      alert(`Error deleting tenant: ${error.message}`)
    }
  }

  const handleUpdateTenant = async (updatedTenant) => {
    console.log("[v0] handleUpdateTenant called with:", updatedTenant)

    if (!updatedTenant?._id) {
      console.error("[v0] No tenant ID provided for update")
      alert("Failed to update tenant: No tenant ID")
      return
    }

    try {
      const token = getAuthToken()

      const payload = {
        config: {
          businessName: updatedTenant.tenantConfig?.businessName,
          domain: updatedTenant.tenantConfig?.domain,
          subdomain: updatedTenant.tenantConfig?.subdomain,
          primaryDomain: updatedTenant.tenantConfig?.primaryDomain,
          currency: updatedTenant.tenantConfig?.currency,
          timezone: updatedTenant.tenantConfig?.timezone,
          status: updatedTenant.tenantConfig?.status,
          enabledModules: updatedTenant.tenantConfig?.enabledModules,
          paymentProviders: updatedTenant.tenantConfig?.paymentProviders,
          oddsProviders: updatedTenant.tenantConfig?.oddsProviders,
          riskSettings: updatedTenant.tenantConfig?.riskSettings,
          logoUrl: updatedTenant.tenantConfig?.logoUrl,
          primaryColor: updatedTenant.tenantConfig?.primaryColor,
          secondaryColor: updatedTenant.tenantConfig?.secondaryColor,
          accentColor: updatedTenant.tenantConfig?.accentColor,
          brandName: updatedTenant.tenantConfig?.brandName,
          megaJackpotLabel: updatedTenant.tenantConfig?.megaJackpotLabel,
          dailyJackpotLabel: updatedTenant.tenantConfig?.dailyJackpotLabel,
          hourlyJackpotLabel: updatedTenant.tenantConfig?.hourlyJackpotLabel,
          designId: updatedTenant.tenantConfig?.designId || updatedTenant.designId || "classic",
        },
      }

      console.log("[v0] Sending PUT request with payload:", JSON.stringify(payload, null, 2))

      const response = await fetch(`/api/super/tenants/${updatedTenant._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Response status:", response.status)
      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (response.ok) {
        alert("Tenant configuration updated successfully!")
        setIsConfigModalOpen(false)
        setSelectedTenant(null)
        fetchTenants()
      } else {
        alert(data.error || "Failed to update tenant")
      }
    } catch (error) {
      console.error("[v0] Error updating tenant:", error)
      alert("Failed to update tenant configuration")
    }
  }

  const handleChangeStatus = async (tenantId, action) => {
    const confirmMessages = {
      suspend: "Ban this tenant?",
      activate: "Activate this tenant?",
      deactivate: "Deactivate this tenant?",
    }

    if (!confirm(confirmMessages[action])) {
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        alert("Authentication required. Please log in again.")
        return
      }

      const response = await fetch(`/api/super/tenants/${tenantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || "Status updated successfully")
        await fetchTenants()
      } else {
        alert(`Failed to update status: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error updating tenant status:", error)
      alert(`Error updating status: ${error.message}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#FFD700]">Tenant Management</h2>
          <p className="text-[#B8C5D6]">Manage all registered tenants and their configurations</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#FFD700] hover:bg-[#E6C200] text-[#0A1A2F]">
          <Plus className="w-4 h-4 mr-2" />
          Create Tenant
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8C5D6] w-4 h-4" />
        <Input
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/5 border-[#FFD700]/30 text-white"
        />
      </div>

      {/* Tenant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <Card key={tenant._id} className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {tenant.tenantConfig?.logoUrl ? (
                    <img
                      src={tenant.tenantConfig.logoUrl || "/placeholder.svg"}
                      alt={tenant.businessName}
                      className="w-10 h-10 rounded-lg object-contain bg-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
                      <span className="text-[#FFD700] font-bold">
                        {(tenant.businessName || tenant.fullName || "T").charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-[#F5F5F5] text-lg">{tenant.businessName || tenant.fullName}</CardTitle>
                    <p className="text-[#B8C5D6] text-sm">{tenant.email}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(tenant.status)}>{tenant.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-[#B8C5D6]">Wallet Balance</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleTopup(tenant)}
                      size="sm"
                      className="h-6 px-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                      variant="outline"
                    >
                      <TrendingUp className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleAdjust(tenant)}
                      size="sm"
                      className="h-6 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                      variant="outline"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {tenant.balance?.toFixed(2) || "0.00"} {tenant.currency || "ETB"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#1A2F45]/50 rounded-lg p-3 border border-[#2A3F55]">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-[#FFD700]" />
                    <span className="text-xs text-[#B8C5D6]">Agents</span>
                  </div>
                  <p className="text-lg font-bold text-[#F5F5F5]">{tenant.agentCount || 0}</p>
                </div>
                <div className="bg-[#1A2F45]/50 rounded-lg p-3 border border-[#2A3F55]">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-[#B8C5D6]">Admins</span>
                  </div>
                  <p className="text-lg font-bold text-[#F5F5F5]">{tenant.adminCount || 0}</p>
                </div>
                <div className="bg-[#1A2F45]/50 rounded-lg p-3 border border-[#2A3F55]">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-[#B8C5D6]">Currency</span>
                  </div>
                  <p className="text-sm font-bold text-green-400">
                    {tenant.tenantConfig?.currency || tenant.currency || "USD"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-[#B8C5D6] pt-2 border-t border-[#2A3F55]">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {tenant.tenantConfig?.primaryDomain ||
                    tenant.primaryDomain ||
                    tenant.tenantConfig?.domain ||
                    tenant.domain ||
                    "Not set"}
                </span>
                <span>{new Date(tenant.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleConfigTenant(tenant)}
                  size="sm"
                  className="flex-1 bg-[#1A2F45] hover:bg-[#2A3F55] text-[#FFD700] border border-[#2A3F55]"
                  variant="outline"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Configure
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-[#1A2F45] hover:bg-[#2A3F55] text-white border border-[#2A3F55]"
                      variant="outline"
                    >
                      <Cog className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0D1F35] border-[#2A3F55] text-white">
                    <DropdownMenuItem
                      onClick={() => handleOpenSettings(tenant._id)}
                      className="hover:bg-[#1A2F45] cursor-pointer"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#2A3F55]" />
                    <DropdownMenuItem
                      onClick={() => handleDeleteTenant(tenant._id)}
                      className="hover:bg-red-500/20 text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Tenant
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-2">
                {tenant.status === "active" && (
                  <>
                    <Button
                      onClick={() => handleChangeStatus(tenant._id, "suspend")}
                      size="sm"
                      className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                      variant="outline"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Ban
                    </Button>
                    <Button
                      onClick={() => handleChangeStatus(tenant._id, "deactivate")}
                      size="sm"
                      className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
                      variant="outline"
                    >
                      <ToggleLeft className="w-3 h-3 mr-1" />
                      Deactivate
                    </Button>
                  </>
                )}
                {(tenant.status === "suspended" || tenant.status === "inactive") && (
                  <Button
                    onClick={() => handleChangeStatus(tenant._id, "activate")}
                    size="sm"
                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    variant="outline"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Activate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#B8C5D6] text-lg">No tenants found</p>
          <p className="text-[#B8C5D6] text-sm mt-2">Create your first tenant to get started</p>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-[#0A1A2F] border border-[#FFD700]/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#FFD700]">Create New Tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTenant} className="space-y-4">
            {/* Logo Upload */}
            <LogoUploader
              value={formData.logoUrl}
              onChange={(url, publicId) =>
                setFormData({
                  ...formData,
                  logoUrl: url,
                  logoPublicId: publicId,
                })
              }
              label="Tenant Logo"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-[#F5F5F5]">
                  Contact Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border-[#FFD700]/30 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-[#F5F5F5]">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-[#FFD700]/30 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName" className="text-[#F5F5F5]">
                  Business Name *
                </Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  className="bg-white/5 border-[#FFD700]/30 text-white"
                  placeholder="e.g., BetMax"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug" className="text-[#F5F5F5]">
                  Subdomain Slug *
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="bg-white/5 border-[#FFD700]/30 text-white flex-1"
                  placeholder="e.g., betmax"
                  required
                />
                <p className="text-xs text-[#B8C5D6] mt-1">Only lowercase letters and numbers allowed</p>
              </div>
            </div>

            <div>
              <Label htmlFor="domain" className="text-[#F5F5F5]">
                Tenant Domain (Auto-generated)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  value={formData.domain}
                  readOnly
                  className="bg-white/5 border-[#FFD700]/30 text-white flex-1"
                  placeholder="Domain will be generated automatically"
                />
                <Button
                  type="button"
                  onClick={copyDomain}
                  variant="outline"
                  size="icon"
                  className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent"
                  disabled={!formData.domain}
                >
                  {copiedDomain ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-[#B8C5D6] mt-1">This domain will be used to access the tenant's platform</p>
            </div>

            {/* Custom Domain field */}
            <div>
              <Label htmlFor="primaryDomain" className="text-[#F5F5F5]">
                Custom Domain (Optional)
              </Label>
              <Input
                id="primaryDomain"
                value={formData.primaryDomain}
                onChange={(e) => setFormData({ ...formData, primaryDomain: e.target.value })}
                className="bg-white/5 border-[#FFD700]/30 text-white flex-1"
                placeholder="e.g., betafrica.net"
              />
              <p className="text-xs text-[#B8C5D6] mt-1">
                Add a custom domain that the tenant owns. This will be their primary domain (subdomain will be
                secondary).
              </p>
              <p className="text-xs text-yellow-400 mt-1">
                Note: DNS configuration required after creation. See documentation below.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status" className="text-[#F5F5F5]">
                  Initial Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-white/5 border-[#FFD700]/30 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1A2F] border-[#FFD700]/30">
                    <SelectItem value="active" className="text-white hover:bg-[#1A2F45]">
                      Active
                    </SelectItem>
                    <SelectItem value="trial" className="text-white hover:bg-[#1A2F45]">
                      Trial
                    </SelectItem>
                    <SelectItem value="pending" className="text-white hover:bg-[#1A2F45]">
                      Pending
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="password" className="text-[#F5F5F5]">
                  Admin Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white/5 border-[#FFD700]/30 text-white"
                  required
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[#F5F5F5]">Primary Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="bg-white/5 border-[#FFD700]/30 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[#F5F5F5]">Secondary Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="bg-white/5 border-[#FFD700]/30 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[#F5F5F5]">Accent Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="bg-white/5 border-[#FFD700]/30 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Design Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="designId" className="text-[#F5F5F5]">
                  Design Template
                </Label>
                <Select
                  value={formData.designId}
                  onValueChange={(value) => setFormData({ ...formData, designId: value })}
                >
                  <SelectTrigger className="bg-white/5 border-[#FFD700]/30 text-white">
                    <SelectValue placeholder="Select design template" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1A2F] border-[#FFD700]/30">
                    <SelectItem value="classic" className="text-white hover:bg-[#1A2F45]">
                      Classic
                    </SelectItem>
                    <SelectItem value="modern" className="text-white hover:bg-[#1A2F45]">
                      Modern
                    </SelectItem>
                    <SelectItem value="minimalist" className="text-white hover:bg-[#1A2F45]">
                      Minimalist
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency" className="text-[#F5F5F5]">
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="bg-white/5 border-[#FFD700]/30 text-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1A2F] border-[#FFD700]/30 max-h-[300px]">
                    {UNIQUE_CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value} className="text-white hover:bg-[#1A2F45]">
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timezone" className="text-[#F5F5F5]">
                  Timezone
                </Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger className="bg-white/5 border-[#FFD700]/30 text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1A2F] border-[#FFD700]/30">
                    <SelectItem value="UTC" className="text-white hover:bg-[#1A2F45]">
                      UTC
                    </SelectItem>
                    <SelectItem value="Africa/Lagos" className="text-white hover:bg-[#1A2F45]">
                      Africa/Lagos
                    </SelectItem>
                    <SelectItem value="Africa/Nairobi" className="text-white hover:bg-[#1A2F45]">
                      Africa/Nairobi
                    </SelectItem>
                    <SelectItem value="Europe/London" className="text-white hover:bg-[#1A2F45]">
                      Europe/London
                    </SelectItem>
                    <SelectItem value="America/New_York" className="text-white hover:bg-[#1A2F45]">
                      America/New_York
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="border-[#FFD700]/30 text-[#F5F5F5] hover:bg-[#1A2F45]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#FFD700] hover:bg-[#E6C200] text-[#0A1A2F]">
                {loading ? "Creating..." : "Create Tenant"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Config Modal */}
      {selectedTenant && (
        <TenantConfigModal
          tenant={selectedTenant}
          isOpen={isConfigModalOpen}
          onClose={() => {
            setIsConfigModalOpen(false)
            setSelectedTenant(null)
          }}
          onSave={handleUpdateTenant}
        />
      )}

      <Dialog open={isTopupModalOpen} onOpenChange={setIsTopupModalOpen}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">Top Up Tenant Wallet</DialogTitle>
            <DialogDescription className="text-[#B8C5D6]">
              Add funds to {selectedTenant?.businessName || selectedTenant?.fullName}'s wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topup-method" className="text-[#F5F5F5]">
                Top-Up Method
              </Label>
              <Select
                value={topupFormData.method}
                onValueChange={(value) => setTopupFormData({ ...topupFormData, method: value })}
              >
                <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                  <SelectItem value="prepaid" className="text-[#F5F5F5]">
                    Prepaid / Deposit (Tenant wired money)
                  </SelectItem>
                  <SelectItem value="credit_line" className="text-[#F5F5F5]">
                    Credit Line (Manual credit)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#B8C5D6]">
                {topupFormData.method === "prepaid"
                  ? "Tenant paid upfront, no monthly fee, revenue share applies"
                  : "Manual credit line, reconciliation done later"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topup-amount" className="text-[#F5F5F5]">
                Amount ({selectedTenant?.currency || "ETB"})
              </Label>
              <Input
                id="topup-amount"
                type="number"
                placeholder="Enter amount"
                value={topupFormData.amount}
                onChange={(e) => setTopupFormData({ ...topupFormData, amount: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topup-reference" className="text-[#F5F5F5]">
                Reference Number *
              </Label>
              <Input
                id="topup-reference"
                type="text"
                placeholder="Bank transfer reference or credit line ID"
                value={topupFormData.reference}
                onChange={(e) => setTopupFormData({ ...topupFormData, reference: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topup-notes" className="text-[#F5F5F5]">
                Notes (Optional)
              </Label>
              <Textarea
                id="topup-notes"
                placeholder="Additional notes about this topup"
                value={topupFormData.notes}
                onChange={(e) => setTopupFormData({ ...topupFormData, notes: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] min-h-[80px]"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                Current Balance: <span className="font-bold">{selectedTenant?.balance?.toFixed(2) || "0.00"}</span>{" "}
                {selectedTenant?.currency || "ETB"}
              </p>
              {topupFormData.amount && (
                <p className="text-sm text-green-300 mt-1">
                  New Balance:{" "}
                  <span className="font-bold">
                    {((selectedTenant?.balance || 0) + Number.parseFloat(topupFormData.amount || 0)).toFixed(2)}
                  </span>{" "}
                  {selectedTenant?.currency || "ETB"}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsTopupModalOpen(false)}
              variant="outline"
              className="bg-transparent border-[#2A3F55] text-[#F5F5F5] hover:bg-[#1A2F45]"
            >
              Cancel
            </Button>
            <Button
              onClick={submitTopup}
              disabled={loading || !topupFormData.amount || !topupFormData.reference}
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
            >
              {loading ? "Processing..." : "Confirm Top-Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">Adjust Tenant Balance</DialogTitle>
            <DialogDescription className="text-[#B8C5D6]">
              Manually adjust {selectedTenant?.businessName || selectedTenant?.fullName}'s wallet balance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjust-type" className="text-[#F5F5F5]">
                Adjustment Type
              </Label>
              <Select
                value={adjustFormData.type}
                onValueChange={(value) => setAdjustFormData({ ...adjustFormData, type: value })}
              >
                <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                  <SelectItem value="CREDIT" className="text-[#F5F5F5]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Credit (Add funds)
                    </div>
                  </SelectItem>
                  <SelectItem value="DEBIT" className="text-[#F5F5F5]">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      Debit (Remove funds)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-amount" className="text-[#F5F5F5]">
                Amount ({selectedTenant?.currency || "ETB"})
              </Label>
              <Input
                id="adjust-amount"
                type="number"
                placeholder="Enter amount"
                value={adjustFormData.amount}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, amount: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-reason" className="text-[#F5F5F5]">
                Reason *
              </Label>
              <Textarea
                id="adjust-reason"
                placeholder="Explain why this adjustment is being made"
                value={adjustFormData.reason}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-reference" className="text-[#F5F5F5]">
                Reference (Optional)
              </Label>
              <Input
                id="adjust-reference"
                type="text"
                placeholder="Reference number or ID"
                value={adjustFormData.reference}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, reference: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>

            <div
              className={`${adjustFormData.type === "CREDIT" ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"} border rounded-lg p-3`}
            >
              <p className="text-sm text-[#B8C5D6]">
                Current Balance: <span className="font-bold">{selectedTenant?.balance?.toFixed(2) || "0.00"}</span>{" "}
                {selectedTenant?.currency || "ETB"}
              </p>
              {adjustFormData.amount && (
                <p className={`text-sm mt-1 ${adjustFormData.type === "CREDIT" ? "text-green-300" : "text-red-300"}`}>
                  New Balance:{" "}
                  <span className="font-bold">
                    {(
                      (selectedTenant?.balance || 0) +
                      (adjustFormData.type === "CREDIT" ? 1 : -1) * Number.parseFloat(adjustFormData.amount || 0)
                    ).toFixed(2)}
                  </span>{" "}
                  {selectedTenant?.currency || "ETB"}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsAdjustModalOpen(false)}
              variant="outline"
              className="bg-transparent border-[#2A3F55] text-[#F5F5F5] hover:bg-[#1A2F45]"
            >
              Cancel
            </Button>
            <Button
              onClick={submitAdjustment}
              disabled={loading || !adjustFormData.amount || !adjustFormData.reason.trim()}
              className={`${adjustFormData.type === "CREDIT" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}
            >
              {loading ? "Processing..." : `Confirm ${adjustFormData.type === "CREDIT" ? "Credit" : "Debit"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
