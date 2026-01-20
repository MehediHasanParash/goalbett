"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Server, CheckCircle, XCircle, Trash2, Edit } from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"
import { LogoUploader } from "@/components/ui/logo-uploader"

export function ProviderManagement() {
  const [providers, setProviders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "Slots",
    description: "",
    status: "active",
    gamesCount: 0,
    revenue: 0,
    apiKey: "",
    apiSecret: "",
    apiUrl: "",
    webhookUrl: "",
    certificationId: "",
    currencies: [],
    languages: [],
    integrationMethod: "iframe",
    testMode: true,
    logo: "",
    thumbnail: "",
    primaryColor: "#FFD700",
    website: "",
    licenses: [],
    certifications: [],
    regions: [],
    restrictedCountries: [],
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const response = await fetch("/api/super/providers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setProviders(data.providers)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const token = getAuthToken()
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        status: formData.status,
        gamesCount: formData.gamesCount,
        revenue: formData.revenue,
        config: {
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          apiUrl: formData.apiUrl,
          webhookUrl: formData.webhookUrl,
          certificationId: formData.certificationId,
          currency: formData.currencies,
          languages: formData.languages,
        },
        integration: {
          method: formData.integrationMethod,
          testMode: formData.testMode,
        },
        branding: {
          logo: formData.logo,
          thumbnail: formData.thumbnail,
          primaryColor: formData.primaryColor,
          website: formData.website,
        },
        licensing: {
          licenses: formData.licenses,
          certifications: formData.certifications,
          regions: formData.regions,
          restrictedCountries: formData.restrictedCountries,
        },
      }

      const response = await fetch("/api/super/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (data.success) {
        setIsDialogOpen(false)
        resetForm()
        fetchProviders()
      }
    } catch (error) {
      console.error("Failed to create provider:", error)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const token = getAuthToken()
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        status: formData.status,
        gamesCount: formData.gamesCount,
        revenue: formData.revenue,
        config: {
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          apiUrl: formData.apiUrl,
          webhookUrl: formData.webhookUrl,
          certificationId: formData.certificationId,
          currency: formData.currencies,
          languages: formData.languages,
        },
        integration: {
          method: formData.integrationMethod,
          testMode: formData.testMode,
        },
        branding: {
          logo: formData.logo,
          thumbnail: formData.thumbnail,
          primaryColor: formData.primaryColor,
          website: formData.website,
        },
        licensing: {
          licenses: formData.licenses,
          certifications: formData.certifications,
          regions: formData.regions,
          restrictedCountries: formData.restrictedCountries,
        },
      }

      const response = await fetch(`/api/super/providers/${editingProvider._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (data.success) {
        setIsDialogOpen(false)
        setEditingProvider(null)
        resetForm()
        fetchProviders()
      }
    } catch (error) {
      console.error("Failed to update provider:", error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this provider?")) return

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/providers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        fetchProviders()
      }
    } catch (error) {
      console.error("Failed to delete provider:", error)
    }
  }

  const handleToggleStatus = async (provider) => {
    try {
      const token = getAuthToken()
      const newStatus = provider.status === "active" ? "inactive" : "active"
      const response = await fetch(`/api/super/providers/${provider._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...provider, status: newStatus }),
      })
      const data = await response.json()
      if (data.success) {
        fetchProviders()
      }
    } catch (error) {
      console.error("Failed to toggle provider status:", error)
    }
  }

  const openEditDialog = (provider) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name,
      type: provider.type,
      description: provider.description || "",
      status: provider.status,
      gamesCount: provider.gamesCount,
      revenue: provider.revenue,
      apiKey: provider.config?.apiKey || "",
      apiSecret: provider.config?.apiSecret || "",
      apiUrl: provider.config?.apiUrl || "",
      webhookUrl: provider.config?.webhookUrl || "",
      certificationId: provider.config?.certificationId || "",
      currencies: provider.config?.currency || [],
      languages: provider.config?.languages || [],
      integrationMethod: provider.integration?.method || "iframe",
      testMode: provider.integration?.testMode || true,
      logo: provider.branding?.logo || "",
      thumbnail: provider.branding?.thumbnail || "",
      primaryColor: provider.branding?.primaryColor || "#FFD700",
      website: provider.branding?.website || "",
      licenses: provider.licensing?.licenses || [],
      certifications: provider.licensing?.certifications || [],
      regions: provider.licensing?.regions || [],
      restrictedCountries: provider.licensing?.restrictedCountries || [],
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "Slots",
      description: "",
      status: "active",
      gamesCount: 0,
      revenue: 0,
      apiKey: "",
      apiSecret: "",
      apiUrl: "",
      webhookUrl: "",
      certificationId: "",
      currencies: [],
      languages: [],
      integrationMethod: "iframe",
      testMode: true,
      logo: "",
      thumbnail: "",
      primaryColor: "#FFD700",
      website: "",
      licenses: [],
      certifications: [],
      regions: [],
      restrictedCountries: [],
    })
    setEditingProvider(null)
  }

  const filteredProviders = providers.filter((provider) =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="text-[#B8C5D6]">Loading providers...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#FFD700]/20">
              <Server className="h-6 w-6 text-[#FFD700]" />
            </div>
            <div>
              <p className="text-[#B8C5D6] text-sm">Total Providers</p>
              <p className="text-2xl font-bold text-[#F5F5F5]">{stats.totalProviders || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-[#B8C5D6] text-sm">Active</p>
              <p className="text-2xl font-bold text-[#F5F5F5]">{stats.activeProviders || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Server className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[#B8C5D6] text-sm">Total Games</p>
              <p className="text-2xl font-bold text-[#F5F5F5]">{(stats.totalGames || 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Server className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-[#B8C5D6] text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-[#F5F5F5]">${((stats.totalRevenue || 0) / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
          <Input
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
          />
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700] text-xl">
                {editingProvider ? "Edit Provider" : "Create New Provider"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingProvider ? handleUpdate : handleCreate} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-[#FFD700] font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider Name *</Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="e.g. Evolution Gaming"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Live Casino">Live Casino</SelectItem>
                        <SelectItem value="Slots">Slots</SelectItem>
                        <SelectItem value="3D Slots">3D Slots</SelectItem>
                        <SelectItem value="Table Games">Table Games</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Virtual Sports">Virtual Sports</SelectItem>
                        <SelectItem value="Lottery">Lottery</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    rows={2}
                    placeholder="Brief description of the provider"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Games Count</Label>
                    <Input
                      type="number"
                      value={formData.gamesCount}
                      onChange={(e) => setFormData({ ...formData, gamesCount: Number.parseInt(e.target.value) || 0 })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Revenue ($)</Label>
                    <Input
                      type="number"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: Number.parseInt(e.target.value) || 0 })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="space-y-4 border-t border-[#2A3F55] pt-4">
                <h3 className="text-[#FFD700] font-semibold">API Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="Provider API Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Secret</Label>
                    <Input
                      type="password"
                      value={formData.apiSecret}
                      onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="Provider API Secret"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API URL</Label>
                    <Input
                      type="url"
                      value={formData.apiUrl}
                      onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="https://api.provider.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      type="url"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="https://webhook.provider.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Certification ID</Label>
                  <Input
                    value={formData.certificationId}
                    onChange={(e) => setFormData({ ...formData, certificationId: e.target.value })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    placeholder="Provider certification identifier"
                  />
                </div>
              </div>

              {/* Integration Settings */}
              <div className="space-y-4 border-t border-[#2A3F55] pt-4">
                <h3 className="text-[#FFD700] font-semibold">Integration Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Integration Method</Label>
                    <Select
                      value={formData.integrationMethod}
                      onValueChange={(value) => setFormData({ ...formData, integrationMethod: value })}
                    >
                      <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iframe">IFrame</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="seamless">Seamless</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.testMode}
                        onCheckedChange={(checked) => setFormData({ ...formData, testMode: checked })}
                      />
                      <Label>Test Mode</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branding */}
              <div className="space-y-4 border-t border-[#2A3F55] pt-4">
                <h3 className="text-[#FFD700] font-semibold">Branding</h3>
                <div className="grid grid-cols-2 gap-4">
                  <LogoUploader
                    label="Provider Logo"
                    value={formData.logo}
                    onChange={(url) => setFormData({ ...formData, logo: url })}
                    className="w-full"
                  />
                  <LogoUploader
                    label="Provider Thumbnail"
                    value={formData.thumbnail}
                    onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-20 h-10 bg-[#1A2F45] border-[#2A3F55]"
                      />
                      <Input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="flex-1 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                        placeholder="#FFD700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="https://provider.com"
                    />
                  </div>
                </div>
              </div>

              {/* Licensing & Compliance */}
              <div className="space-y-4 border-t border-[#2A3F55] pt-4">
                <h3 className="text-[#FFD700] font-semibold">Licensing & Compliance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Licenses (comma-separated)</Label>
                    <Input
                      value={formData.licenses.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          licenses: e.target.value
                            .split(",")
                            .map((l) => l.trim())
                            .filter(Boolean),
                        })
                      }
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="MGA, UKGC, Curacao"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Certifications (comma-separated)</Label>
                    <Input
                      value={formData.certifications.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          certifications: e.target.value
                            .split(",")
                            .map((c) => c.trim())
                            .filter(Boolean),
                        })
                      }
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="eCOGRA, iTech Labs, GLI"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supported Regions (comma-separated)</Label>
                    <Input
                      value={formData.regions.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          regions: e.target.value
                            .split(",")
                            .map((r) => r.trim())
                            .filter(Boolean),
                        })
                      }
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="EU, NA, APAC, LATAM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Restricted Countries (comma-separated)</Label>
                    <Input
                      value={formData.restrictedCountries.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          restrictedCountries: e.target.value
                            .split(",")
                            .map((c) => c.trim())
                            .filter(Boolean),
                        })
                      }
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="US, FR, ES"
                    />
                  </div>
                </div>
              </div>

              {/* Supported Currencies & Languages */}
              <div className="space-y-4 border-t border-[#2A3F55] pt-4">
                <h3 className="text-[#FFD700] font-semibold">Supported Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currencies (comma-separated)</Label>
                    <Input
                      value={formData.currencies.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currencies: e.target.value
                            .split(",")
                            .map((c) => c.trim())
                            .filter(Boolean),
                        })
                      }
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="USD, EUR, GBP, BTC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Languages (comma-separated)</Label>
                    <Input
                      value={formData.languages.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          languages: e.target.value
                            .split(",")
                            .map((l) => l.trim())
                            .filter(Boolean),
                        })
                      }
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      placeholder="en, es, fr, de"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                  className="border-[#2A3F55] text-[#B8C5D6]"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
                  {editingProvider ? "Update Provider" : "Create Provider"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => (
          <Card
            key={provider._id}
            className="bg-[#0D1F35]/80 border-[#2A3F55] hover:border-[#FFD700]/30 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-[#F5F5F5] text-xl">{provider.name}</CardTitle>
                <Switch checked={provider.status === "active"} onCheckedChange={() => handleToggleStatus(provider)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#B8C5D6] text-sm">Type</span>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{provider.type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#B8C5D6] text-sm">Games</span>
                <span className="text-[#F5F5F5] font-semibold">{provider.gamesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#B8C5D6] text-sm">Revenue</span>
                <span className="text-[#FFD700] font-semibold">${provider.revenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#B8C5D6] text-sm">Status</span>
                <Badge
                  className={
                    provider.status === "active"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  {provider.status === "active" ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {provider.status}
                </Badge>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2A3F55] text-[#B8C5D6] bg-transparent hover:bg-[#1A2F45] hover:text-[#F5F5F5]"
                  onClick={() => openEditDialog(provider)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(provider._id)}
                  className="border-[#2A3F55] text-red-400 bg-transparent hover:bg-red-500/10 hover:border-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#B8C5D6] text-lg">No providers found</p>
          <p className="text-[#B8C5D6]/60 text-sm mt-2">Create your first provider to get started</p>
        </div>
      )}
    </div>
  )
}
