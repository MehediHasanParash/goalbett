"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SuperAdminSidebar } from "@/components/admin/super-admin-sidebar"
import { toast } from "@/components/ui/use-toast"
import { Trophy, Crown, Gem, Save, RefreshCw, DollarSign, Settings, Eye, Loader2, Globe, Building } from "lucide-react"

const DEFAULT_JACKPOT_TICKER = {
  enabled: true,
  megaJackpot: { label: "MEGA JACKPOT", amount: 2847392, isActive: true },
  dailyJackpot: { label: "DAILY JACKPOT", amount: 47293, isActive: true },
  hourlyJackpot: { label: "HOURLY JACKPOT", amount: 3847, isActive: true },
  autoIncrement: { enabled: true, megaRate: 50, dailyRate: 10, hourlyRate: 5, intervalSeconds: 3 },
}

export default function JackpotTickerPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState("mainsite")

  // Main site (provider) config
  const [mainSiteConfig, setMainSiteConfig] = useState(null)
  const [mainSiteId, setMainSiteId] = useState(null)
  const [mainSiteName, setMainSiteName] = useState("GoalBet")

  // Tenants
  const [tenants, setTenants] = useState([])
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [tenantConfig, setTenantConfig] = useState(null)

  // Preview animation state
  const [previewAmounts, setPreviewAmounts] = useState({
    mega: 2847392,
    daily: 47293,
    hourly: 3847,
  })

  const currentConfig = activeSection === "mainsite" ? mainSiteConfig : tenantConfig

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedTenantId && activeSection === "tenants") {
      const tenant = tenants.find((t) => t._id === selectedTenantId)
      if (tenant) {
        setTenantConfig(tenant.jackpotTicker || { ...DEFAULT_JACKPOT_TICKER })
        setPreviewAmounts({
          mega: tenant.jackpotTicker?.megaJackpot?.amount || 2847392,
          daily: tenant.jackpotTicker?.dailyJackpot?.amount || 47293,
          hourly: tenant.jackpotTicker?.hourlyJackpot?.amount || 3847,
        })
      }
    }
  }, [selectedTenantId, activeSection, tenants])

  // Preview animation
  useEffect(() => {
    if (!currentConfig || !currentConfig.autoIncrement?.enabled) return

    const interval = setInterval(
      () => {
        setPreviewAmounts((prev) => ({
          mega: prev.mega + (currentConfig.autoIncrement?.megaRate || 50),
          daily: prev.daily + (currentConfig.autoIncrement?.dailyRate || 10),
          hourly: prev.hourly + (currentConfig.autoIncrement?.hourlyRate || 5),
        }))
      },
      (currentConfig.autoIncrement?.intervalSeconds || 3) * 1000,
    )

    return () => clearInterval(interval)
  }, [currentConfig]) // Updated to capture currentConfig directly

  // Update preview amounts when config changes
  useEffect(() => {
    if (currentConfig) {
      setPreviewAmounts({
        mega: currentConfig.megaJackpot?.amount || 2847392,
        daily: currentConfig.dailyJackpot?.amount || 47293,
        hourly: currentConfig.hourlyJackpot?.amount || 3847,
      })
    }
  }, [currentConfig])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/super/jackpot-ticker", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Fetched jackpot ticker data:", data)

        // Set provider/main site config
        if (data.provider) {
          setMainSiteId(data.provider._id)
          setMainSiteName(data.provider.name || "GoalBet")
          const providerConfig = data.provider.jackpotTicker || { ...DEFAULT_JACKPOT_TICKER }
          setMainSiteConfig(providerConfig)

          if (activeSection === "mainsite") {
            setPreviewAmounts({
              mega: providerConfig.megaJackpot?.amount || 2847392,
              daily: providerConfig.dailyJackpot?.amount || 47293,
              hourly: providerConfig.hourlyJackpot?.amount || 3847,
            })
          }
        } else {
          console.log("[v0] No provider found in response")
          setMainSiteConfig(null)
          setMainSiteId(null)
        }

        // Set tenants (non-providers)
        const otherTenants = data.tenants || []
        setTenants(otherTenants)

        if (otherTenants.length > 0 && !selectedTenantId) {
          setSelectedTenantId(otherTenants[0]._id)
          setTenantConfig(otherTenants[0].jackpotTicker || { ...DEFAULT_JACKPOT_TICKER })
        }
      } else {
        const errorData = await response.json()
        console.error("[v0] Error response:", errorData)
        toast({ title: "Error", description: errorData.error || "Failed to fetch data", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const targetId = activeSection === "mainsite" ? mainSiteId : selectedTenantId
    const targetConfig = activeSection === "mainsite" ? mainSiteConfig : tenantConfig
    const targetName =
      activeSection === "mainsite" ? mainSiteName : tenants.find((t) => t._id === selectedTenantId)?.name

    if (!targetId) {
      toast({ title: "Error", description: "No target selected", variant: "destructive" })
      return
    }

    if (!targetConfig) {
      toast({ title: "Error", description: "No configuration to save", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem("auth_token")
      console.log("[v0] Saving jackpot ticker for:", targetName, "ID:", targetId)
      console.log("[v0] Config to save:", JSON.stringify(targetConfig, null, 2))

      const response = await fetch("/api/super/jackpot-ticker", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: targetId,
          jackpotTicker: targetConfig,
        }),
      })

      const data = await response.json()
      console.log("[v0] Save response:", data)

      if (response.ok && data.success) {
        toast({ title: "Success", description: `Jackpot ticker saved for ${targetName}` })
        // Refresh to get updated data from server
        await fetchData()
      } else {
        toast({ title: "Error", description: data.error || "Failed to save", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error saving:", error)
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const updateConfig = (type, field, value) => {
    const setter = activeSection === "mainsite" ? setMainSiteConfig : setTenantConfig
    setter((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value,
        },
      }
    })
  }

  const setConfigEnabled = (enabled) => {
    const setter = activeSection === "mainsite" ? setMainSiteConfig : setTenantConfig
    setter((prev) => {
      if (!prev) return prev
      return { ...prev, enabled }
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0A1A2F]">
        <SuperAdminSidebar />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0A1A2F]">
      <SuperAdminSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6 ml-84">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#FFD700]">Jackpot Ticker Management</h1>
              <p className="text-[#B8C5D6] text-sm mt-1">Configure the jackpot ticker that displays on casino pages</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchData}
                className="border-[#2A3F55] text-[#B8C5D6] hover:bg-[#1A2F45] bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !currentConfig}
                className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Main Site vs Tenants Toggle */}
          <div className="flex gap-4">
            <Button
              onClick={() => setActiveSection("mainsite")}
              className={`flex-1 h-20 flex flex-col items-center justify-center gap-2 ${
                activeSection === "mainsite"
                  ? "bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
                  : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55] border border-[#2A3F55]"
              }`}
            >
              <Globe className="h-6 w-6" />
              <span className="font-semibold">Main Site ({mainSiteName})</span>
            </Button>
            <Button
              onClick={() => setActiveSection("tenants")}
              className={`flex-1 h-20 flex flex-col items-center justify-center gap-2 ${
                activeSection === "tenants"
                  ? "bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
                  : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55] border border-[#2A3F55]"
              }`}
            >
              <Building className="h-6 w-6" />
              <span className="font-semibold">Tenants ({tenants.length})</span>
            </Button>
          </div>

          {/* Main Site Section */}
          {activeSection === "mainsite" && !mainSiteConfig && (
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="py-12 text-center">
                <p className="text-[#B8C5D6]">
                  No provider tenant found. Please ensure the GoalBet provider tenant exists with type: "provider".
                </p>
                <Button onClick={fetchData} className="mt-4 bg-[#FFD700] text-[#0A1A2F]">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tenant Selection (only for tenants section) */}
          {activeSection === "tenants" && (
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#FFD700]" />
                  Select Tenant
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tenants.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tenants.map((tenant) => (
                      <button
                        key={tenant._id}
                        onClick={() => setSelectedTenantId(tenant._id)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          selectedTenantId === tenant._id
                            ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]"
                            : "bg-[#1A2F45] border-[#2A3F55] text-[#B8C5D6] hover:border-[#FFD700]/50"
                        }`}
                      >
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-xs opacity-70">{tenant.slug}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#B8C5D6]">No tenants available</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Show config only if we have data */}
          {currentConfig && (
            <>
              {/* Live Preview */}
              <Card className="bg-[#0D1F35] border-[#2A3F55] overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                    <Eye className="h-5 w-5 text-[#FFD700]" />
                    Live Preview
                    {activeSection === "mainsite"
                      ? ` (${mainSiteName})`
                      : ` (${tenants.find((t) => t._id === selectedTenantId)?.name || "Tenant"})`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {currentConfig.enabled ? (
                    <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1A2F] py-3 overflow-hidden">
                      <div className="animate-marquee whitespace-nowrap flex items-center space-x-8 px-4">
                        {currentConfig.megaJackpot?.isActive && (
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5" />
                            <span className="font-bold text-sm">
                              {currentConfig.megaJackpot.label}: {formatCurrency(previewAmounts.mega)}
                            </span>
                          </div>
                        )}
                        {currentConfig.dailyJackpot?.isActive && (
                          <div className="flex items-center space-x-2">
                            <Crown className="h-5 w-5" />
                            <span className="font-bold text-sm">
                              {currentConfig.dailyJackpot.label}: {formatCurrency(previewAmounts.daily)}
                            </span>
                          </div>
                        )}
                        {currentConfig.hourlyJackpot?.isActive && (
                          <div className="flex items-center space-x-2">
                            <Gem className="h-5 w-5" />
                            <span className="font-bold text-sm">
                              {currentConfig.hourlyJackpot.label}: {formatCurrency(previewAmounts.hourly)}
                            </span>
                          </div>
                        )}
                        {/* Duplicate for continuous scroll */}
                        {currentConfig.megaJackpot?.isActive && (
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5" />
                            <span className="font-bold text-sm">
                              {currentConfig.megaJackpot.label}: {formatCurrency(previewAmounts.mega)}
                            </span>
                          </div>
                        )}
                        {currentConfig.dailyJackpot?.isActive && (
                          <div className="flex items-center space-x-2">
                            <Crown className="h-5 w-5" />
                            <span className="font-bold text-sm">
                              {currentConfig.dailyJackpot.label}: {formatCurrency(previewAmounts.daily)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1A2F45] py-4 text-center text-[#B8C5D6]">Ticker is disabled</div>
                  )}
                </CardContent>
              </Card>

              {/* Configuration Tabs */}
              <Tabs defaultValue="jackpots" className="space-y-4">
                <TabsList className="bg-[#1A2F45] border border-[#2A3F55]">
                  <TabsTrigger
                    value="jackpots"
                    className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Jackpot Values
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="jackpots" className="space-y-4">
                  {/* Global Enable */}
                  <Card className="bg-[#0D1F35] border-[#2A3F55]">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#F5F5F5] text-lg">Enable Jackpot Ticker</Label>
                          <p className="text-[#B8C5D6] text-sm mt-1">Show the jackpot ticker on casino pages</p>
                        </div>
                        <Switch
                          checked={currentConfig.enabled}
                          onCheckedChange={(checked) => setConfigEnabled(checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mega Jackpot */}
                  <Card className="bg-[#0D1F35] border-[#2A3F55]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-[#FFD700]" />
                          Mega Jackpot
                        </CardTitle>
                        <Switch
                          checked={currentConfig.megaJackpot?.isActive ?? true}
                          onCheckedChange={(checked) => updateConfig("megaJackpot", "isActive", checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Label</Label>
                          <Input
                            value={currentConfig.megaJackpot?.label || ""}
                            onChange={(e) => updateConfig("megaJackpot", "label", e.target.value)}
                            placeholder="MEGA JACKPOT"
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Amount ($)</Label>
                          <Input
                            type="number"
                            value={currentConfig.megaJackpot?.amount || 0}
                            onChange={(e) => updateConfig("megaJackpot", "amount", Number(e.target.value))}
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Daily Jackpot */}
                  <Card className="bg-[#0D1F35] border-[#2A3F55]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                          <Crown className="h-5 w-5 text-purple-400" />
                          Daily Jackpot
                        </CardTitle>
                        <Switch
                          checked={currentConfig.dailyJackpot?.isActive ?? true}
                          onCheckedChange={(checked) => updateConfig("dailyJackpot", "isActive", checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Label</Label>
                          <Input
                            value={currentConfig.dailyJackpot?.label || ""}
                            onChange={(e) => updateConfig("dailyJackpot", "label", e.target.value)}
                            placeholder="DAILY JACKPOT"
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Amount ($)</Label>
                          <Input
                            type="number"
                            value={currentConfig.dailyJackpot?.amount || 0}
                            onChange={(e) => updateConfig("dailyJackpot", "amount", Number(e.target.value))}
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hourly Jackpot */}
                  <Card className="bg-[#0D1F35] border-[#2A3F55]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                          <Gem className="h-5 w-5 text-cyan-400" />
                          Hourly Jackpot
                        </CardTitle>
                        <Switch
                          checked={currentConfig.hourlyJackpot?.isActive ?? true}
                          onCheckedChange={(checked) => updateConfig("hourlyJackpot", "isActive", checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Label</Label>
                          <Input
                            value={currentConfig.hourlyJackpot?.label || ""}
                            onChange={(e) => updateConfig("hourlyJackpot", "label", e.target.value)}
                            placeholder="HOURLY JACKPOT"
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Amount ($)</Label>
                          <Input
                            type="number"
                            value={currentConfig.hourlyJackpot?.amount || 0}
                            onChange={(e) => updateConfig("hourlyJackpot", "amount", Number(e.target.value))}
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  {/* Auto Increment Settings */}
                  <Card className="bg-[#0D1F35] border-[#2A3F55]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[#F5F5F5]">Auto Increment Animation</CardTitle>
                        <Switch
                          checked={currentConfig.autoIncrement?.enabled ?? true}
                          onCheckedChange={(checked) => updateConfig("autoIncrement", "enabled", checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-[#B8C5D6] text-sm">
                        Configure how the jackpot amounts animate/increment over time for visual effect
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Mega Rate ($)</Label>
                          <Input
                            type="number"
                            value={currentConfig.autoIncrement?.megaRate || 50}
                            onChange={(e) => updateConfig("autoIncrement", "megaRate", Number(e.target.value))}
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Daily Rate ($)</Label>
                          <Input
                            type="number"
                            value={currentConfig.autoIncrement?.dailyRate || 10}
                            onChange={(e) => updateConfig("autoIncrement", "dailyRate", Number(e.target.value))}
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Hourly Rate ($)</Label>
                          <Input
                            type="number"
                            value={currentConfig.autoIncrement?.hourlyRate || 5}
                            onChange={(e) => updateConfig("autoIncrement", "hourlyRate", Number(e.target.value))}
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#B8C5D6]">Interval (sec)</Label>
                          <Input
                            type="number"
                            value={currentConfig.autoIncrement?.intervalSeconds || 3}
                            onChange={(e) => updateConfig("autoIncrement", "intervalSeconds", Number(e.target.value))}
                            className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  )
}
