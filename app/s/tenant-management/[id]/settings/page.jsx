"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Trophy,
  Calendar,
  ImageIcon,
  Gamepad2,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Shield,
  Bell,
  Palette,
  Activity,
  FileText,
  ArrowLeft,
  Save,
  DollarSign,
  Percent,
  AlertTriangle,
  Zap,
  Database,
  Layers,
  PiggyBank,
  Scale,
  TrendingUp,
  Wallet,
  BadgePercent,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAuthToken } from "@/lib/auth-service"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/s/dashboard" },
  { icon: Trophy, label: "Sports", href: "/s/sports" },
  { icon: Calendar, label: "Matches", href: "/s/matches" },
  { icon: ImageIcon, label: "Banners", href: "/s/banners" },
  { icon: Gamepad2, label: "Games Library", href: "/s/games-library" },
  { icon: Building2, label: "Providers", href: "/s/providers" },
  { icon: Building2, label: "Tenants", href: "/s/tenant-management", active: true },
  { icon: Users, label: "Agents", href: "/s/agents" },
  { icon: Users, label: "Players", href: "/s/players" },
  { icon: FileText, label: "Bet Management", href: "/s/bet-management" },
  { icon: Bell, label: "Notifications", href: "/s/notifications" },
  { icon: CreditCard, label: "Financials", href: "/s/financials" },
  { icon: BarChart3, label: "Analytics", href: "/s/analytics" },
  { icon: Shield, label: "Compliance", href: "/s/compliance" },
  { icon: Palette, label: "White-Label Theme", href: "/s/theme" },
  { icon: Activity, label: "USSD Monitoring", href: "/s/ussd-monitoring" },
]

const SPORTS_LIST = [
  { id: "football", name: "Football", icon: "⚽" },
  { id: "basketball", name: "Basketball", icon: "🏀" },
  { id: "tennis", name: "Tennis", icon: "🎾" },
  { id: "cricket", name: "Cricket", icon: "🏏" },
  { id: "rugby", name: "Rugby", icon: "🏉" },
  { id: "hockey", name: "Hockey", icon: "🏒" },
  { id: "baseball", name: "Baseball", icon: "⚾" },
  { id: "volleyball", name: "Volleyball", icon: "🏐" },
  { id: "handball", name: "Handball", icon: "🤾" },
  { id: "boxing", name: "Boxing", icon: "🥊" },
  { id: "mma", name: "MMA", icon: "🥋" },
  { id: "esports", name: "Esports", icon: "🎮" },
]

const PAYMENT_PROVIDERS = [
  { id: "mpesa", name: "M-Pesa", region: "East Africa" },
  { id: "airtel", name: "Airtel Money", region: "Africa" },
  { id: "telebirr", name: "Telebirr", region: "Ethiopia" },
  { id: "orange", name: "Orange Money", region: "West Africa" },
  { id: "airtime", name: "Airtime", region: "Africa" },
  { id: "stripe", name: "Stripe", region: "Global" },
  { id: "paystack", name: "Paystack", region: "Africa" },
  { id: "flutterwave", name: "Flutterwave", region: "Africa" },
  { id: "bank", name: "Bank Transfer", region: "Global" },
  { id: "crypto", name: "Cryptocurrency", region: "Global" },
]

const CASINO_PROVIDERS = [
  { id: "evolution", name: "Evolution Gaming" },
  { id: "pragmatic", name: "Pragmatic Play" },
  { id: "netent", name: "NetEnt" },
  { id: "microgaming", name: "Microgaming" },
  { id: "playtech", name: "Playtech" },
  { id: "betsoft", name: "Betsoft" },
  { id: "ezugi", name: "Ezugi" },
  { id: "spribe", name: "Spribe" },
]

export default function TenantSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState(null)
  const [activeTab, setActiveTab] = useState("taxes")

  // Settings state
  const [settings, setSettings] = useState({
    // Tax Rules
    taxes: {
      bettingTax: { enabled: false, rate: 0, type: "stake" },
      withholdingTax: { enabled: false, rate: 0, threshold: 0 },
      vat: { enabled: false, rate: 0 },
      exciseDuty: { enabled: false, rate: 0 },
    },
    // Betting Limits
    limits: {
      minStake: 10,
      maxStake: 100000,
      maxPotentialWin: 1000000,
      maxSelectionsPerSlip: 30,
      maxDailyDeposit: 500000,
      maxDailyWithdrawal: 200000,
      minWithdrawal: 100,
      maxOdds: 1000,
      minOdds: 1.01,
      cashoutEnabled: true,
      partialCashoutEnabled: true,
      autoCashoutEnabled: false,
    },
    // Odds Margins
    oddsMargins: {
      defaultMargin: 5,
      liveMarginIncrease: 2,
      sportMargins: {},
    },
    // Payment Methods
    payments: {
      enabledProviders: [],
      providerConfigs: {},
    },
    // Casino Providers
    casino: {
      enabledProviders: [],
      providerConfigs: {},
    },
    // Sports Feed
    feeds: {
      primaryProvider: "lsports",
      backupProvider: "",
      liveScoresEnabled: true,
      oddsFeedEnabled: true,
      autoUpdateInterval: 30,
    },
    // Risk Management
    risk: {
      maxLiabilityPerEvent: 1000000,
      maxLiabilityPerSport: 5000000,
      maxLiabilityTotal: 10000000,
      autoAcceptThreshold: 50000,
      manualReviewThreshold: 100000,
      suspiciousActivityDetection: true,
      maxWinStreak: 10,
      voidOnDisconnect: false,
      delayedBettingSeconds: 5,
    },
  })

  useEffect(() => {
    fetchTenant()
  }, [tenantId])

  const fetchTenant = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setTenant(data.tenant)

        // Load existing settings
        if (data.tenant.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.tenant.settings,
          }))
        }
      }
    } catch (error) {
      console.error("Error fetching tenant:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/tenants/${tenantId}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        alert("Settings saved successfully!")
      } else {
        const data = await response.json()
        alert(`Failed to save: ${data.error}`)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateTaxes = (key, field, value) => {
    setSettings((prev) => ({
      ...prev,
      taxes: {
        ...prev.taxes,
        [key]: { ...prev.taxes[key], [field]: value },
      },
    }))
  }

  const updateLimits = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      limits: { ...prev.limits, [key]: value },
    }))
  }

  const updateSportMargin = (sportId, value) => {
    setSettings((prev) => ({
      ...prev,
      oddsMargins: {
        ...prev.oddsMargins,
        sportMargins: { ...prev.oddsMargins.sportMargins, [sportId]: value },
      },
    }))
  }

  const togglePaymentProvider = (providerId) => {
    setSettings((prev) => {
      const enabled = prev.payments.enabledProviders.includes(providerId)
      return {
        ...prev,
        payments: {
          ...prev.payments,
          enabledProviders: enabled
            ? prev.payments.enabledProviders.filter((p) => p !== providerId)
            : [...prev.payments.enabledProviders, providerId],
        },
      }
    })
  }

  const toggleCasinoProvider = (providerId) => {
    setSettings((prev) => {
      const enabled = prev.casino.enabledProviders.includes(providerId)
      return {
        ...prev,
        casino: {
          ...prev.casino,
          enabledProviders: enabled
            ? prev.casino.enabledProviders.filter((p) => p !== providerId)
            : [...prev.casino.enabledProviders, providerId],
        },
      }
    })
  }

  const updateRisk = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      risk: { ...prev.risk, [key]: value },
    }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0A1A2F]">
        <aside className="w-64 bg-[#0D1F35] border-r border-[#1A2F45] p-4">
          <div className="text-[#FFD700] font-bold text-xl mb-8">Super Admin</div>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  item.active ? "bg-[#FFD700]/10 text-[#FFD700]" : "text-[#B8C5D6] hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0A1A2F]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0D1F35] border-r border-[#1A2F45] p-4">
        <div className="text-[#FFD700] font-bold text-xl mb-8">Super Admin</div>
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                item.active ? "bg-[#FFD700]/10 text-[#FFD700]" : "text-[#B8C5D6] hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/s/tenant-management")}
              className="text-[#B8C5D6] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#FFD700]">
                {tenant?.businessName || tenant?.name} - Advanced Settings
              </h1>
              <p className="text-[#B8C5D6]">Configure taxes, limits, odds, payments, and risk management</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-[#FFD700] hover:bg-[#E6C200] text-[#0A1A2F]">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0D1F35] border border-[#2A3F55] mb-6">
            <TabsTrigger value="taxes" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              <Scale className="w-4 h-4 mr-2" />
              Taxes
            </TabsTrigger>
            <TabsTrigger value="limits" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              <Layers className="w-4 h-4 mr-2" />
              Limits
            </TabsTrigger>
            <TabsTrigger value="odds" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              <BadgePercent className="w-4 h-4 mr-2" />
              Odds Margin
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="casino" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Casino
            </TabsTrigger>
            <TabsTrigger value="feeds" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              <Radio className="w-4 h-4 mr-2" />
              Sports Feed
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Risk
            </TabsTrigger>
          </TabsList>

          {/* Taxes Tab */}
          <TabsContent value="taxes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Betting Tax */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-[#FFD700]" />
                    Betting Tax
                  </CardTitle>
                  <CardDescription className="text-[#B8C5D6]">
                    Tax applied on betting stakes or winnings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Betting Tax</Label>
                    <Switch
                      checked={settings.taxes.bettingTax.enabled}
                      onCheckedChange={(v) => updateTaxes("bettingTax", "enabled", v)}
                    />
                  </div>
                  {settings.taxes.bettingTax.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[#B8C5D6]">Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={settings.taxes.bettingTax.rate}
                          onChange={(e) => updateTaxes("bettingTax", "rate", Number.parseFloat(e.target.value) || 0)}
                          className="bg-white/5 border-[#2A3F55] text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#B8C5D6]">Apply On</Label>
                        <Select
                          value={settings.taxes.bettingTax.type}
                          onValueChange={(v) => updateTaxes("bettingTax", "type", v)}
                        >
                          <SelectTrigger className="bg-white/5 border-[#2A3F55] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                            <SelectItem value="stake">Stake Amount</SelectItem>
                            <SelectItem value="winnings">Winnings Only</SelectItem>
                            <SelectItem value="profit">Net Profit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Withholding Tax */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[#FFD700]" />
                    Withholding Tax
                  </CardTitle>
                  <CardDescription className="text-[#B8C5D6]">Tax withheld on large winnings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Withholding Tax</Label>
                    <Switch
                      checked={settings.taxes.withholdingTax.enabled}
                      onCheckedChange={(v) => updateTaxes("withholdingTax", "enabled", v)}
                    />
                  </div>
                  {settings.taxes.withholdingTax.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[#B8C5D6]">Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={settings.taxes.withholdingTax.rate}
                          onChange={(e) =>
                            updateTaxes("withholdingTax", "rate", Number.parseFloat(e.target.value) || 0)
                          }
                          className="bg-white/5 border-[#2A3F55] text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#B8C5D6]">Threshold Amount</Label>
                        <Input
                          type="number"
                          value={settings.taxes.withholdingTax.threshold}
                          onChange={(e) =>
                            updateTaxes("withholdingTax", "threshold", Number.parseFloat(e.target.value) || 0)
                          }
                          className="bg-white/5 border-[#2A3F55] text-white"
                        />
                        <p className="text-xs text-[#B8C5D6]">Tax applies when winnings exceed this amount</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* VAT */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Percent className="w-5 h-5 text-[#FFD700]" />
                    VAT / GST
                  </CardTitle>
                  <CardDescription className="text-[#B8C5D6]">Value Added Tax configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable VAT</Label>
                    <Switch
                      checked={settings.taxes.vat.enabled}
                      onCheckedChange={(v) => updateTaxes("vat", "enabled", v)}
                    />
                  </div>
                  {settings.taxes.vat.enabled && (
                    <div className="space-y-2">
                      <Label className="text-[#B8C5D6]">VAT Rate (%)</Label>
                      <Input
                        type="number"
                        value={settings.taxes.vat.rate}
                        onChange={(e) => updateTaxes("vat", "rate", Number.parseFloat(e.target.value) || 0)}
                        className="bg-white/5 border-[#2A3F55] text-white"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Excise Duty */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#FFD700]" />
                    Excise Duty
                  </CardTitle>
                  <CardDescription className="text-[#B8C5D6]">Excise duty on betting services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Excise Duty</Label>
                    <Switch
                      checked={settings.taxes.exciseDuty.enabled}
                      onCheckedChange={(v) => updateTaxes("exciseDuty", "enabled", v)}
                    />
                  </div>
                  {settings.taxes.exciseDuty.enabled && (
                    <div className="space-y-2">
                      <Label className="text-[#B8C5D6]">Excise Rate (%)</Label>
                      <Input
                        type="number"
                        value={settings.taxes.exciseDuty.rate}
                        onChange={(e) => updateTaxes("exciseDuty", "rate", Number.parseFloat(e.target.value) || 0)}
                        className="bg-white/5 border-[#2A3F55] text-white"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Limits Tab */}
          <TabsContent value="limits" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stake Limits */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white">Stake Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Minimum Stake</Label>
                    <Input
                      type="number"
                      value={settings.limits.minStake}
                      onChange={(e) => updateLimits("minStake", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Maximum Stake</Label>
                    <Input
                      type="number"
                      value={settings.limits.maxStake}
                      onChange={(e) => updateLimits("maxStake", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Winning Limits */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white">Winning Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Max Potential Win</Label>
                    <Input
                      type="number"
                      value={settings.limits.maxPotentialWin}
                      onChange={(e) => updateLimits("maxPotentialWin", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Max Selections Per Slip</Label>
                    <Input
                      type="number"
                      value={settings.limits.maxSelectionsPerSlip}
                      onChange={(e) => updateLimits("maxSelectionsPerSlip", Number.parseInt(e.target.value) || 1)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Deposit/Withdrawal Limits */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white">Transaction Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Max Daily Deposit</Label>
                    <Input
                      type="number"
                      value={settings.limits.maxDailyDeposit}
                      onChange={(e) => updateLimits("maxDailyDeposit", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Max Daily Withdrawal</Label>
                    <Input
                      type="number"
                      value={settings.limits.maxDailyWithdrawal}
                      onChange={(e) => updateLimits("maxDailyWithdrawal", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Min Withdrawal</Label>
                    <Input
                      type="number"
                      value={settings.limits.minWithdrawal}
                      onChange={(e) => updateLimits("minWithdrawal", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Odds Limits */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white">Odds Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Minimum Odds</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.limits.minOdds}
                      onChange={(e) => updateLimits("minOdds", Number.parseFloat(e.target.value) || 1.01)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Maximum Odds</Label>
                    <Input
                      type="number"
                      value={settings.limits.maxOdds}
                      onChange={(e) => updateLimits("maxOdds", Number.parseFloat(e.target.value) || 1000)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Cashout Settings */}
              <Card className="bg-[#0D1F35] border-[#2A3F55] md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Cashout Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <Label className="text-white">Enable Cashout</Label>
                      <Switch
                        checked={settings.limits.cashoutEnabled}
                        onCheckedChange={(v) => updateLimits("cashoutEnabled", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <Label className="text-white">Partial Cashout</Label>
                      <Switch
                        checked={settings.limits.partialCashoutEnabled}
                        onCheckedChange={(v) => updateLimits("partialCashoutEnabled", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <Label className="text-white">Auto Cashout</Label>
                      <Switch
                        checked={settings.limits.autoCashoutEnabled}
                        onCheckedChange={(v) => updateLimits("autoCashoutEnabled", v)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Odds Margin Tab */}
          <TabsContent value="odds" className="space-y-6">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">Default Margin Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Default Margin (%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[settings.oddsMargins.defaultMargin]}
                        onValueChange={([v]) =>
                          setSettings((prev) => ({
                            ...prev,
                            oddsMargins: { ...prev.oddsMargins, defaultMargin: v },
                          }))
                        }
                        max={20}
                        step={0.5}
                        className="flex-1"
                      />
                      <span className="text-[#FFD700] font-bold w-16 text-right">
                        {settings.oddsMargins.defaultMargin}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Live Betting Margin Increase (%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[settings.oddsMargins.liveMarginIncrease]}
                        onValueChange={([v]) =>
                          setSettings((prev) => ({
                            ...prev,
                            oddsMargins: { ...prev.oddsMargins, liveMarginIncrease: v },
                          }))
                        }
                        max={10}
                        step={0.5}
                        className="flex-1"
                      />
                      <span className="text-[#FFD700] font-bold w-16 text-right">
                        +{settings.oddsMargins.liveMarginIncrease}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">Per-Sport Margins</CardTitle>
                <CardDescription className="text-[#B8C5D6]">
                  Override default margin for specific sports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {SPORTS_LIST.map((sport) => (
                    <div key={sport.id} className="p-4 bg-white/5 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{sport.icon}</span>
                        <Label className="text-white">{sport.name}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[settings.oddsMargins.sportMargins[sport.id] ?? settings.oddsMargins.defaultMargin]}
                          onValueChange={([v]) => updateSportMargin(sport.id, v)}
                          max={20}
                          step={0.5}
                          className="flex-1"
                        />
                        <span className="text-[#FFD700] font-bold text-sm w-12 text-right">
                          {settings.oddsMargins.sportMargins[sport.id] ?? settings.oddsMargins.defaultMargin}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">Payment Providers</CardTitle>
                <CardDescription className="text-[#B8C5D6]">Enable payment methods for this tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PAYMENT_PROVIDERS.map((provider) => (
                    <div
                      key={provider.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        settings.payments.enabledProviders.includes(provider.id)
                          ? "bg-[#FFD700]/10 border-[#FFD700]"
                          : "bg-white/5 border-[#2A3F55] hover:border-[#FFD700]/50"
                      }`}
                      onClick={() => togglePaymentProvider(provider.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{provider.name}</p>
                          <p className="text-[#B8C5D6] text-sm">{provider.region}</p>
                        </div>
                        <Switch
                          checked={settings.payments.enabledProviders.includes(provider.id)}
                          onCheckedChange={() => togglePaymentProvider(provider.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Casino Tab */}
          <TabsContent value="casino" className="space-y-6">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-white">Casino Providers</CardTitle>
                <CardDescription className="text-[#B8C5D6]">
                  Enable casino game providers for this tenant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CASINO_PROVIDERS.map((provider) => (
                    <div
                      key={provider.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        settings.casino.enabledProviders.includes(provider.id)
                          ? "bg-purple-500/10 border-purple-500"
                          : "bg-white/5 border-[#2A3F55] hover:border-purple-500/50"
                      }`}
                      onClick={() => toggleCasinoProvider(provider.id)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium">{provider.name}</p>
                        <Switch
                          checked={settings.casino.enabledProviders.includes(provider.id)}
                          onCheckedChange={() => toggleCasinoProvider(provider.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sports Feed Tab */}
          <TabsContent value="feeds" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#FFD700]" />
                    Data Provider
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Primary Provider</Label>
                    <Select
                      value={settings.feeds.primaryProvider}
                      onValueChange={(v) =>
                        setSettings((prev) => ({
                          ...prev,
                          feeds: { ...prev.feeds, primaryProvider: v },
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-[#2A3F55] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                        <SelectItem value="lsports">LSports</SelectItem>
                        <SelectItem value="betradar">Betradar</SelectItem>
                        <SelectItem value="betconstruct">BetConstruct</SelectItem>
                        <SelectItem value="sportsgrid">SportsGrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Backup Provider</Label>
                    <Select
                      value={settings.feeds.backupProvider || "none"}
                      onValueChange={(v) =>
                        setSettings((prev) => ({
                          ...prev,
                          feeds: { ...prev.feeds, backupProvider: v === "none" ? "" : v },
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-[#2A3F55] text-white">
                        <SelectValue placeholder="Select backup" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="lsports">LSports</SelectItem>
                        <SelectItem value="betradar">Betradar</SelectItem>
                        <SelectItem value="betconstruct">BetConstruct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#FFD700]" />
                    Feed Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Live Scores</Label>
                    <Switch
                      checked={settings.feeds.liveScoresEnabled}
                      onCheckedChange={(v) =>
                        setSettings((prev) => ({
                          ...prev,
                          feeds: { ...prev.feeds, liveScoresEnabled: v },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Odds Feed</Label>
                    <Switch
                      checked={settings.feeds.oddsFeedEnabled}
                      onCheckedChange={(v) =>
                        setSettings((prev) => ({
                          ...prev,
                          feeds: { ...prev.feeds, oddsFeedEnabled: v },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Auto Update Interval (seconds)</Label>
                    <Input
                      type="number"
                      value={settings.feeds.autoUpdateInterval}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          feeds: { ...prev.feeds, autoUpdateInterval: Number.parseInt(e.target.value) || 30 },
                        }))
                      }
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Liability Limits */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FFD700]" />
                    Liability Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Max Liability Per Event</Label>
                    <Input
                      type="number"
                      value={settings.risk.maxLiabilityPerEvent}
                      onChange={(e) => updateRisk("maxLiabilityPerEvent", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Max Liability Per Sport</Label>
                    <Input
                      type="number"
                      value={settings.risk.maxLiabilityPerSport}
                      onChange={(e) => updateRisk("maxLiabilityPerSport", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Max Total Liability</Label>
                    <Input
                      type="number"
                      value={settings.risk.maxLiabilityTotal}
                      onChange={(e) => updateRisk("maxLiabilityTotal", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bet Review */}
              <Card className="bg-[#0D1F35] border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#FFD700]" />
                    Bet Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Auto Accept Threshold</Label>
                    <Input
                      type="number"
                      value={settings.risk.autoAcceptThreshold}
                      onChange={(e) => updateRisk("autoAcceptThreshold", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                    <p className="text-xs text-[#B8C5D6]">Bets below this amount auto-accept</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Manual Review Threshold</Label>
                    <Input
                      type="number"
                      value={settings.risk.manualReviewThreshold}
                      onChange={(e) => updateRisk("manualReviewThreshold", Number.parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-[#2A3F55] text-white"
                    />
                    <p className="text-xs text-[#B8C5D6]">Bets above this require manual approval</p>
                  </div>
                </CardContent>
              </Card>

              {/* Fraud Prevention */}
              <Card className="bg-[#0D1F35] border-[#2A3F55] md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#FFD700]" />
                    Fraud Prevention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <Label className="text-white text-sm">Suspicious Activity Detection</Label>
                      <Switch
                        checked={settings.risk.suspiciousActivityDetection}
                        onCheckedChange={(v) => updateRisk("suspiciousActivityDetection", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <Label className="text-white text-sm">Void on Disconnect</Label>
                      <Switch
                        checked={settings.risk.voidOnDisconnect}
                        onCheckedChange={(v) => updateRisk("voidOnDisconnect", v)}
                      />
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg space-y-2">
                      <Label className="text-[#B8C5D6] text-sm">Max Win Streak Alert</Label>
                      <Input
                        type="number"
                        value={settings.risk.maxWinStreak}
                        onChange={(e) => updateRisk("maxWinStreak", Number.parseInt(e.target.value) || 10)}
                        className="bg-white/10 border-[#2A3F55] text-white h-8"
                      />
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg space-y-2">
                      <Label className="text-[#B8C5D6] text-sm">Delayed Betting (sec)</Label>
                      <Input
                        type="number"
                        value={settings.risk.delayedBettingSeconds}
                        onChange={(e) => updateRisk("delayedBettingSeconds", Number.parseInt(e.target.value) || 0)}
                        className="bg-white/10 border-[#2A3F55] text-white h-8"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
