"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Save, AlertCircle, CheckCircle, RefreshCw, ExternalLink, Copy, Check, Trophy, Monitor } from "lucide-react"
import { LogoUploader } from "@/components/ui/logo-uploader"
import { UNIQUE_CURRENCY_OPTIONS } from "@/lib/currency-config"

const DESIGN_OPTIONS = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional sports betting look with gold accents",
    preview: "/designs/classic-preview.png",
    colors: { primary: "#FFD700", secondary: "#0A1A2F", accent: "#4A90E2" },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean, minimalist design with gradients",
    preview: "/designs/modern-preview.png",
    colors: { primary: "#3B82F6", secondary: "#1E293B", accent: "#22C55E" },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Vibrant cyberpunk-inspired theme with glowing effects",
    preview: "/designs/neon-preview.png",
    colors: { primary: "#FF00FF", secondary: "#0D0D1A", accent: "#00FFFF" },
  },
]

export function TenantConfigModal({ isOpen, onClose, tenant, onSave }) {
  const [activeTab, setActiveTab] = useState("general")
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    subdomain: "",
    primaryDomain: "",
    currency: "USD",
    timezone: "UTC",
    primaryColor: "#FFD700",
    secondaryColor: "#0A1A2F",
    accentColor: "#4A90E2",
    logoUrl: "",
    brandName: "",
    status: "pending",
    designId: "classic",
    megaJackpotLabel: "MEGA JACKPOT",
    dailyJackpotLabel: "DAILY JACKPOT",
    hourlyJackpotLabel: "HOURLY JACKPOT",
    paymentProviders: {
      bank: { enabled: true, apiKey: "", secretKey: "" },
      mpesa: { enabled: true, apiKey: "", merchantId: "" },
      orange: { enabled: true, apiKey: "", merchantId: "" },
      card: { enabled: true, apiKey: "", secretKey: "" },
      airtime: { enabled: false, apiKey: "", apiSecret: "" },
      crypto: { enabled: false, apiKey: "", walletAddress: "" },
    },
    oddsProviders: {
      provider1: { enabled: false, apiKey: "", marginPercentage: 5 },
      provider2: { enabled: false, apiKey: "", marginPercentage: 5 },
    },
    enabledModules: ["sports", "casino"],
    riskSettings: {
      maxBetPerSlip: 10000,
      maxDailyExposure: 100000,
      autoLimitThreshold: 50000,
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [showDNSInstructions, setShowDNSInstructions] = useState(false)
  const [domainStatus, setDomainStatus] = useState(null)
  const [dnsRecords, setDnsRecords] = useState([])
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false)
  const [copiedRecord, setCopiedRecord] = useState(null)

  useEffect(() => {
    if (tenant) {
      console.log("[v0] Loading tenant config:", tenant)
      const domain = tenant.tenantConfig?.domain || tenant.domain || ""
      setFormData({
        name: tenant.businessName || tenant.tenantConfig?.businessName || tenant.fullName || "",
        domain: domain,
        subdomain: tenant.tenantConfig?.subdomain || "",
        primaryDomain: tenant.tenantConfig?.primaryDomain || tenant.primaryDomain || "",
        currency: tenant.tenantConfig?.currency || tenant.currency || "USD",
        timezone: tenant.tenantConfig?.timezone || "UTC",
        primaryColor: tenant.tenantConfig?.primaryColor || "#FFD700",
        secondaryColor: tenant.tenantConfig?.secondaryColor || "#0A1A2F",
        accentColor: tenant.tenantConfig?.accentColor || "#4A90E2",
        logoUrl: tenant.tenantConfig?.logoUrl || "",
        brandName: tenant.tenantConfig?.brandName || tenant.businessName || tenant.tenantConfig?.businessName || "",
        status: tenant.tenantConfig?.status || tenant.status || "active",
        designId: tenant.designId || tenant.tenantConfig?.designId || "classic",
        megaJackpotLabel: tenant.tenantConfig?.megaJackpotLabel || "MEGA JACKPOT",
        dailyJackpotLabel: tenant.tenantConfig?.dailyJackpotLabel || "DAILY JACKPOT",
        hourlyJackpotLabel: tenant.tenantConfig?.hourlyJackpotLabel || "HOURLY JACKPOT",
        paymentProviders: tenant.tenantConfig?.paymentProviders || {
          bank: { enabled: true, apiKey: "", secretKey: "" },
          mpesa: { enabled: true, apiKey: "", merchantId: "" },
          orange: { enabled: true, apiKey: "", merchantId: "" },
          card: { enabled: true, apiKey: "", secretKey: "" },
          airtime: { enabled: false, apiKey: "", apiSecret: "" },
          crypto: { enabled: false, apiKey: "", walletAddress: "" },
        },
        oddsProviders: tenant.tenantConfig?.oddsProviders || {
          provider1: { enabled: false, apiKey: "", marginPercentage: 5 },
          provider2: { enabled: false, apiKey: "", marginPercentage: 5 },
        },
        enabledModules: tenant.tenantConfig?.enabledModules || [],
        riskSettings: tenant.tenantConfig?.riskSettings || {
          maxBetPerSlip: 10000,
          maxDailyExposure: 100000,
          autoLimitThreshold: 50000,
        },
      })
      console.log(
        "[v0] Form data initialized with designId:",
        tenant.designId || tenant.tenantConfig?.designId || "classic",
      )
      // Initialize domain status if primaryDomain exists
      if (tenant.tenantConfig?.primaryDomain || tenant.primaryDomain) {
        const initialDomain = tenant.tenantConfig?.primaryDomain || tenant.primaryDomain
        const verifyInitialDomain = async () => {
          try {
            const response = await fetch(`/api/super/tenants/domains/status?domain=${initialDomain}`)
            const data = await response.json()
            setDomainStatus({
              added: data.added,
              verified: data.verified,
              configured: data.configured,
            })
            if (data.dnsRecords) {
              setDnsRecords(data.dnsRecords)
            }
            if (data.added) {
              setShowDNSInstructions(true)
            }
          } catch (error) {
            console.error("Error fetching initial domain status:", error)
          }
        }
        verifyInitialDomain()
      }
    }
  }, [tenant])

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNestedChange = (section, subsection, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section]?.[subsection],
          [field]: value,
        },
      },
    }))
  }

  const handleAddDomainToVercel = async () => {
    if (!formData.primaryDomain) {
      alert("Please enter a custom domain first")
      return
    }

    setIsAddingDomain(true)
    try {
      const response = await fetch("/api/super/tenants/domains/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: formData.primaryDomain,
          tenantId: tenant._id,
        }),
      })

      const data = await response.json()

      if (data.manualSetup) {
        alert(
          "Vercel API credentials not configured. Please add the domain manually in Vercel dashboard:\n\n" +
            "1. Go to: https://vercel.com/dashboard\n" +
            "2. Select your project (goal-bett)\n" +
            "3. Go to Settings → Domains\n" +
            "4. Add domain: " +
            formData.primaryDomain +
            "\n" +
            "5. Follow Vercel's DNS instructions\n" +
            "6. Click 'Verify Domain' here once DNS is configured",
        )
        setIsAddingDomain(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to add domain")
      }

      console.log("[v0] DNS records from Vercel API:", data.dnsRecords)

      setDnsRecords(data.dnsRecords || [])
      setDomainStatus({
        added: true,
        verified: data.domain?.verified || false,
        configured: data.domain?.configured || false,
      })
      setShowDNSInstructions(true)

      alert(
        data.alreadyExists
          ? "Domain already exists in Vercel! DNS records loaded below."
          : "Domain added to Vercel successfully! Please configure DNS records shown below.",
      )
    } catch (error) {
      console.error("Error adding domain:", error)
      alert("Failed to add domain: " + error.message)
    } finally {
      setIsAddingDomain(false)
    }
  }

  const handleVerifyDomain = async () => {
    if (!formData.primaryDomain) {
      alert("No domain to verify")
      return
    }

    setIsVerifyingDomain(true)
    try {
      const response = await fetch("/api/super/tenants/domains/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: formData.primaryDomain,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify domain")
      }

      setDomainStatus({
        added: true,
        verified: data.verified,
        configured: data.configured,
      })

      if (data.verified && data.configured) {
        alert("Domain verified and configured successfully! Your custom domain is now live.")
      } else if (data.verified) {
        alert("Domain verified but not fully configured. Please wait a few minutes for SSL provisioning.")
      } else {
        alert(
          "Domain not yet verified. Please ensure DNS records are correctly configured and wait for propagation (5-60 minutes).",
        )
      }
    } catch (error) {
      console.error("Error verifying domain:", error)
      alert("Failed to verify domain: " + error.message)
    } finally {
      setIsVerifyingDomain(false)
    }
  }

  const copyToClipboard = (text, recordIndex) => {
    navigator.clipboard.writeText(text)
    setCopiedRecord(recordIndex)
    setTimeout(() => setCopiedRecord(null), 2000)
  }

  const handleSave = async () => {
    console.log("[v0] handleSave called")
    console.log("[v0] Current formData:", formData)
    console.log("[v0] Tenant ID:", tenant._id)

    setIsSaving(true)
    try {
      const updatedTenantData = {
        _id: tenant._id,
        designId: formData.designId,
        tenantConfig: {
          businessName: formData.name,
          domain: formData.domain,
          subdomain: formData.subdomain,
          primaryDomain: formData.primaryDomain,
          currency: formData.currency,
          timezone: formData.timezone,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          logoUrl: formData.logoUrl,
          brandName: formData.brandName || formData.name,
          status: formData.status,
          designId: formData.designId,
          megaJackpotLabel: formData.megaJackpotLabel,
          dailyJackpotLabel: formData.dailyJackpotLabel,
          hourlyJackpotLabel: formData.hourlyJackpotLabel,
          paymentProviders: formData.paymentProviders,
          oddsProviders: formData.oddsProviders,
          enabledModules: formData.enabledModules,
          riskSettings: formData.riskSettings,
        },
      }

      console.log("[v0] Calling onSave with:", updatedTenantData)

      await onSave(updatedTenantData)

      console.log("[v0] onSave completed successfully")
      onClose()
      setIsSaving(false)
    } catch (error) {
      console.error("[v0] Error saving tenant config:", error)
      alert("Failed to update tenant configuration: " + error.message)
      setIsSaving(false)
    }
  }

  const toggleModule = (module) => {
    setFormData((prev) => ({
      ...prev,
      enabledModules: prev.enabledModules.includes(module)
        ? prev.enabledModules.filter((m) => m !== module)
        : [...prev.enabledModules, module],
    }))
  }

  const togglePaymentProvider = (provider) => {
    setFormData((prev) => ({
      ...prev,
      paymentProviders: {
        ...prev.paymentProviders,
        [provider]: {
          ...prev.paymentProviders[provider],
          enabled: !prev.paymentProviders[provider].enabled,
        },
      },
    }))
  }

  const handleDesignSelect = (designId) => {
    const design = DESIGN_OPTIONS.find((d) => d.id === designId)
    setFormData((prev) => ({
      ...prev,
      designId: designId,
      // Optionally update colors when design changes
      // primaryColor: design?.colors.primary || prev.primaryColor,
      // secondaryColor: design?.colors.secondary || prev.secondaryColor,
      // accentColor: design?.colors.accent || prev.accentColor,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D1F35] border border-[#2A3F55] text-[#F5F5F5] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-[#2A3F55] sticky top-0 bg-[#0D1F35] z-10 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[#FFD700]">{tenant ? "Configure Tenant" : "Create New Tenant"}</DialogTitle>
            <Badge
              className={`${formData.status === "active" ? "bg-green-500" : formData.status === "pending" ? "bg-yellow-500" : "bg-red-500"}`}
            >
              {formData.status}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-[#1A2F45] border-b border-[#2A3F55]">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="branding"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Branding
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Payment
            </TabsTrigger>
            <TabsTrigger value="odds" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              Odds
            </TabsTrigger>
            <TabsTrigger
              value="modules"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Modules
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              Risk
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#B8C5D6] mb-2 block">Tenant Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="e.g., GoalBet Ethiopia"
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] placeholder-[#B8C5D6] focus:border-[#FFD700]"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-[#B8C5D6] mb-2 block">Custom Primary Domain</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.primaryDomain}
                    onChange={(e) => handleFieldChange("primaryDomain", e.target.value)}
                    placeholder="e.g., betafrica.net"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] placeholder-[#B8C5D6] focus:border-[#FFD700] flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddDomainToVercel}
                    disabled={isAddingDomain || !formData.primaryDomain}
                    className="bg-[#FFD700] hover:bg-[#E6C200] text-[#0A1A2F]"
                  >
                    {isAddingDomain ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>Add to Vercel</>
                    )}
                  </Button>
                  {domainStatus?.added && (
                    <Button
                      type="button"
                      onClick={handleVerifyDomain}
                      disabled={isVerifyingDomain}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isVerifyingDomain ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {domainStatus && (
                  <div className="flex gap-2 mt-2">
                    <Badge className={domainStatus.verified ? "bg-green-500" : "bg-yellow-500"}>
                      {domainStatus.verified ? "Verified" : "Pending Verification"}
                    </Badge>
                    <Badge className={domainStatus.configured ? "bg-green-500" : "bg-yellow-500"}>
                      {domainStatus.configured ? "Configured" : "Pending Configuration"}
                    </Badge>
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowDNSInstructions(!showDNSInstructions)}
                    className="text-xs text-[#FFD700] hover:underline"
                  >
                    {showDNSInstructions ? "Hide" : "Show"} DNS Setup Instructions
                  </button>
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Open Vercel Dashboard
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div>
                <Label className="text-[#B8C5D6] mb-2 block">Subdomain (Secondary)</Label>
                <Input
                  value={formData.subdomain}
                  onChange={(e) => handleFieldChange("subdomain", e.target.value)}
                  placeholder="e.g., betafrica"
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] placeholder-[#B8C5D6] focus:border-[#FFD700]"
                />
                <p className="text-xs text-[#B8C5D6] mt-1">Will be: {formData.subdomain || "subdomain"}.goalbett.com</p>
              </div>
              <div>
                <Label className="text-[#B8C5D6] mb-2 block">Currency</Label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleFieldChange("currency", e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                >
                  {UNIQUE_CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showDNSInstructions && formData.primaryDomain && (
              <div className="bg-[#1A2F45] border border-[#FFD700]/30 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#FFD700] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-[#FFD700] font-semibold text-lg mb-2">
                      DNS Configuration Required for {formData.primaryDomain}
                    </h3>
                    <p className="text-[#B8C5D6] text-sm mb-4">
                      {dnsRecords.length > 0
                        ? "Configure the following DNS records with your domain registrar:"
                        : 'Click "Add to Vercel" button above to generate DNS records for this domain.'}
                    </p>
                  </div>
                </div>

                {dnsRecords.length > 0 ? (
                  <div className="space-y-4">
                    {dnsRecords.map((record, index) => (
                      <div key={index} className="bg-[#0D1F35] border border-[#2A3F55] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[#F5F5F5] font-semibold">{record.purpose}</h4>
                          <Badge className="bg-[#FFD700]/20 text-[#FFD700]">{record.type}</Badge>
                        </div>
                        <div className="space-y-2 font-mono text-sm">
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center justify-between bg-[#1A2F45] rounded p-2">
                              <div>
                                <span className="text-[#FFD700]">Type:</span>{" "}
                                <span className="text-[#B8C5D6]">{record.type}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-[#1A2F45] rounded p-2">
                              <div>
                                <span className="text-[#FFD700]">Name:</span>{" "}
                                <span className="text-[#B8C5D6]">{record.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(record.name, `${index}-name`)}
                                className="text-[#FFD700] hover:text-[#E6C200]"
                              >
                                {copiedRecord === `${index}-name` ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center justify-between bg-[#1A2F45] rounded p-2">
                              <div className="flex-1 overflow-hidden">
                                <span className="text-[#FFD700]">Value:</span>{" "}
                                <span className="text-[#B8C5D6] break-all">{record.value}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(record.value, `${index}-value`)}
                                className="text-[#FFD700] hover:text-[#E6C200] ml-2"
                              >
                                {copiedRecord === `${index}-value` ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Step-by-step instructions */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Step-by-Step Instructions:
                      </h4>
                      <ol className="space-y-2 text-[#B8C5D6] text-sm list-decimal list-inside">
                        <li>Log in to your domain registrar (GoDaddy, Namecheap, etc.)</li>
                        <li>Navigate to DNS Management or DNS Settings for {formData.primaryDomain}</li>
                        <li>Add each DNS record shown above (use the copy buttons for accuracy)</li>
                        <li>Save the changes and wait for DNS propagation (5-60 minutes)</li>
                        <li>Click the "Verify" button above to check domain status</li>
                        <li>Once verified and configured, your custom domain will be live!</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <h4 className="text-yellow-400 font-semibold mb-2">Important Notes:</h4>
                      <ul className="space-y-1 text-[#B8C5D6] text-sm list-disc list-inside">
                        <li>DNS propagation can take up to 48 hours (usually 5-60 minutes)</li>
                        <li>The subdomain ({formData.subdomain}.goalbett.com) works immediately as backup</li>
                        <li>Custom domain becomes PRIMARY once verified and configured</li>
                        <li>SSL certificate is automatically provisioned by Vercel</li>
                        <li>The DNS records above are fetched directly from Vercel for accuracy</li>
                        <li>If you see multiple A records, you can use any one of them</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
                    <p className="text-[#B8C5D6] mb-4">
                      To get DNS records for your custom domain, you need to add it to Vercel first.
                    </p>
                    <Button
                      type="button"
                      onClick={handleAddDomainToVercel}
                      disabled={isAddingDomain || !formData.primaryDomain}
                      className="bg-[#FFD700] hover:bg-[#E6C200] text-[#0A1A2F]"
                    >
                      {isAddingDomain ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Adding Domain...
                        </>
                      ) : (
                        <>Add {formData.primaryDomain} to Vercel</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-[#B8C5D6] mb-2 block">Status</Label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                className="w-full px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <Label className="text-[#B8C5D6] mb-2 block">Timezone</Label>
              <select
                value={formData.timezone}
                onChange={(e) => handleFieldChange("timezone", e.target.value)}
                className="w-full px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Cairo">Africa/Cairo (EAT)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
              </select>
            </div>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6 p-6">
            <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#B8C5D6]">
                  Configure your tenant's branding including logo, colors, and brand name. These settings will be
                  applied to all pages for this tenant.
                </p>
              </div>
            </div>

            <div className="border-b border-[#2A3F55] pb-6">
              <h3 className="text-[#F5F5F5] font-semibold mb-3 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#FFD700]" />
                Design Template
              </h3>
              <p className="text-xs text-[#B8C5D6] mb-4">
                Select a design template for the tenant's frontend. Each design has its own color scheme and layout
                style.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {DESIGN_OPTIONS.map((design) => (
                  <div
                    key={design.id}
                    onClick={() => handleDesignSelect(design.id)}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      formData.designId === design.id
                        ? "border-[#FFD700] bg-[#FFD700]/10"
                        : "border-[#2A3F55] bg-[#1A2F45] hover:border-[#FFD700]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[#F5F5F5] font-semibold">{design.name}</h4>
                      {formData.designId === design.id && <CheckCircle className="w-5 h-5 text-[#FFD700]" />}
                    </div>
                    <p className="text-xs text-[#B8C5D6] mb-3">{design.description}</p>
                    {/* Color preview */}
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded-full border border-[#2A3F55]"
                        style={{ backgroundColor: design.colors.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-8 h-8 rounded-full border border-[#2A3F55]"
                        style={{ backgroundColor: design.colors.secondary }}
                        title="Secondary"
                      />
                      <div
                        className="w-8 h-8 rounded-full border border-[#2A3F55]"
                        style={{ backgroundColor: design.colors.accent }}
                        title="Accent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <LogoUploader
              value={formData.logoUrl}
              onChange={(url, publicId) => handleFieldChange("logoUrl", url)}
              label="Tenant Logo"
            />

            {/* Brand Name */}
            <div>
              <Label className="text-[#B8C5D6] mb-2 block">Brand Name</Label>
              <Input
                value={formData.brandName}
                onChange={(e) => handleFieldChange("brandName", e.target.value)}
                placeholder="e.g., XBet Casino"
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] placeholder-[#B8C5D6] focus:border-[#FFD700]"
              />
              <p className="text-xs text-[#B8C5D6] mt-1">
                This name will be displayed in the header and throughout the site
              </p>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[#B8C5D6] mb-2 block">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleFieldChange("primaryColor", e.target.value)}
                    className="w-12 h-10 bg-[#1A2F45] border-[#2A3F55] cursor-pointer p-1"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => handleFieldChange("primaryColor", e.target.value)}
                    placeholder="#FFD700"
                    className="flex-1 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <p className="text-xs text-[#B8C5D6] mt-1">Used for buttons, links, highlights</p>
              </div>
              <div>
                <Label className="text-[#B8C5D6] mb-2 block">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleFieldChange("secondaryColor", e.target.value)}
                    className="w-12 h-10 bg-[#1A2F45] border-[#2A3F55] cursor-pointer p-1"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => handleFieldChange("secondaryColor", e.target.value)}
                    placeholder="#0A1A2F"
                    className="flex-1 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <p className="text-xs text-[#B8C5D6] mt-1">Used for backgrounds, cards</p>
              </div>
              <div>
                <Label className="text-[#B8C5D6] mb-2 block">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => handleFieldChange("accentColor", e.target.value)}
                    className="w-12 h-10 bg-[#1A2F45] border-[#2A3F55] cursor-pointer p-1"
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) => handleFieldChange("accentColor", e.target.value)}
                    placeholder="#4A90E2"
                    className="flex-1 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <p className="text-xs text-[#B8C5D6] mt-1">Used for special elements, icons</p>
              </div>
            </div>

            {/* Color Preview */}
            <div className="border-t border-[#2A3F55] pt-4">
              <h3 className="text-[#F5F5F5] font-semibold mb-3">Preview</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <div
                    className="h-16 rounded-lg border-2 border-[#2A3F55]"
                    style={{ backgroundColor: formData.primaryColor }}
                  ></div>
                  <p className="text-xs text-[#B8C5D6] text-center">Primary</p>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-16 rounded-lg border-2 border-[#2A3F55]"
                    style={{ backgroundColor: formData.secondaryColor }}
                  ></div>
                  <p className="text-xs text-[#B8C5D6] text-center">Secondary</p>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-16 rounded-lg border-2 border-[#2A3F55]"
                    style={{ backgroundColor: formData.accentColor }}
                  ></div>
                  <p className="text-xs text-[#B8C5D6] text-center">Accent</p>
                </div>
              </div>
            </div>

            {/* Casino Jackpot Labels */}
            <div className="border-t border-[#2A3F55] pt-6 mt-6">
              <h3 className="text-[#F5F5F5] font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FFD700]" />
                Casino Jackpot Labels
              </h3>
              <p className="text-xs text-[#B8C5D6] mb-4">
                Customize the jackpot ticker text that appears on casino pages
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-[#B8C5D6] mb-2 block">Mega Jackpot Label</Label>
                  <Input
                    value={formData.megaJackpotLabel}
                    onChange={(e) => handleFieldChange("megaJackpotLabel", e.target.value)}
                    placeholder="MEGA JACKPOT"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] placeholder-[#B8C5D6] focus:border-[#FFD700]"
                  />
                  <p className="text-xs text-[#B8C5D6] mt-1">E.g., "GRAND PRIZE", "SUPER JACKPOT"</p>
                </div>
                <div>
                  <Label className="text-[#B8C5D6] mb-2 block">Daily Jackpot Label</Label>
                  <Input
                    value={formData.dailyJackpotLabel}
                    onChange={(e) => handleFieldChange("dailyJackpotLabel", e.target.value)}
                    placeholder="DAILY JACKPOT"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] placeholder-[#B8C5D6] focus:border-[#FFD700]"
                  />
                  <p className="text-xs text-[#B8C5D6] mt-1">E.g., "TODAY'S PRIZE", "DAILY WINNER"</p>
                </div>
                <div>
                  <Label className="text-[#B8C5D6] mb-2 block">Hourly Jackpot Label</Label>
                  <Input
                    value={formData.hourlyJackpotLabel}
                    onChange={(e) => handleFieldChange("hourlyJackpotLabel", e.target.value)}
                    placeholder="HOURLY JACKPOT"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5] placeholder-[#B8C5D6] focus:border-[#FFD700]"
                  />
                  <p className="text-xs text-[#B8C5D6] mt-1">E.g., "QUICK WIN", "HOURLY PRIZE"</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Payment Gateway Settings Tab */}
          <TabsContent value="payment" className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData.paymentProviders).map(([provider, config]) => (
                <div key={provider} className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[#F5F5F5] capitalize">{provider.replace("_", " ")}</Label>
                    <button
                      type="button"
                      onClick={() => togglePaymentProvider(provider)}
                      className={`w-12 h-6 rounded-full transition-colors ${config.enabled ? "bg-green-500" : "bg-[#2A3F55]"}`}
                    >
                      <span
                        className={`block w-5 h-5 bg-white rounded-full transition-transform ${config.enabled ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                  {config.enabled && (
                    <div className="space-y-2">
                      <Input
                        value={config.apiKey || ""}
                        onChange={(e) => handleNestedChange("paymentProviders", provider, "apiKey", e.target.value)}
                        placeholder="API Key"
                        className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] text-sm"
                      />
                      {config.secretKey !== undefined && (
                        <Input
                          value={config.secretKey || ""}
                          onChange={(e) =>
                            handleNestedChange("paymentProviders", provider, "secretKey", e.target.value)
                          }
                          placeholder="Secret Key"
                          type="password"
                          className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] text-sm"
                        />
                      )}
                      {config.merchantId !== undefined && (
                        <Input
                          value={config.merchantId || ""}
                          onChange={(e) =>
                            handleNestedChange("paymentProviders", provider, "merchantId", e.target.value)
                          }
                          placeholder="Merchant ID"
                          className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] text-sm"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Odds Tab */}
          <TabsContent value="odds" className="space-y-4 p-6">
            {Object.entries(formData.oddsProviders).map(([provider, config]) => (
              <div key={provider} className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[#F5F5F5] capitalize">{provider.replace("_", " ")}</Label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        oddsProviders: {
                          ...prev.oddsProviders,
                          [provider]: {
                            ...prev.oddsProviders[provider],
                            enabled: !prev.oddsProviders[provider].enabled,
                          },
                        },
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors ${config.enabled ? "bg-green-500" : "bg-[#2A3F55]"}`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full transition-transform ${config.enabled ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                {config.enabled && (
                  <div className="space-y-2">
                    <Input
                      value={config.apiKey || ""}
                      onChange={(e) => handleNestedChange("oddsProviders", provider, "apiKey", e.target.value)}
                      placeholder="API Key"
                      className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-[#B8C5D6] text-sm">Margin %</Label>
                      <Input
                        type="number"
                        value={config.marginPercentage || 5}
                        onChange={(e) =>
                          handleNestedChange("oddsProviders", provider, "marginPercentage", Number(e.target.value))
                        }
                        className="w-20 bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              {["sports", "casino", "virtual", "lottery", "jackpot", "promotions"].map((module) => (
                <div
                  key={module}
                  onClick={() => toggleModule(module)}
                  className={`cursor-pointer p-4 rounded-lg border ${
                    formData.enabledModules.includes(module)
                      ? "border-[#FFD700] bg-[#FFD700]/10"
                      : "border-[#2A3F55] bg-[#1A2F45]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#F5F5F5] capitalize">{module}</span>
                    {formData.enabledModules.includes(module) && <CheckCircle className="w-5 h-5 text-[#FFD700]" />}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#B8C5D6] mb-2 block">Max Bet Per Slip</Label>
                <Input
                  type="number"
                  value={formData.riskSettings.maxBetPerSlip}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      riskSettings: {
                        ...prev.riskSettings,
                        maxBetPerSlip: Number(e.target.value),
                      },
                    }))
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label className="text-[#B8C5D6] mb-2 block">Max Daily Exposure</Label>
                <Input
                  type="number"
                  value={formData.riskSettings.maxDailyExposure}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      riskSettings: {
                        ...prev.riskSettings,
                        maxDailyExposure: Number(e.target.value),
                      },
                    }))
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label className="text-[#B8C5D6] mb-2 block">Auto Limit Threshold</Label>
                <Input
                  type="number"
                  value={formData.riskSettings.autoLimitThreshold}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      riskSettings: {
                        ...prev.riskSettings,
                        autoLimitThreshold: Number(e.target.value),
                      },
                    }))
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-[#2A3F55] pt-4 sticky bottom-0 bg-[#0D1F35]">
          <Button variant="outline" onClick={onClose} className="border-[#2A3F55] text-[#B8C5D6] bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#FFD700] hover:bg-[#E6C200] text-[#0A1A2F]">
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
