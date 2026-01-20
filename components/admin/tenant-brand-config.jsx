"use client"

import { useState, useEffect } from "react"
import { Save, Upload, Eye, AlertCircle, Copy, CheckCircle2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TenantBrandConfig() {
  const [activeTab, setActiveTab] = useState("branding")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tenantId, setTenantId] = useState(null)
  const [copyStatus, setCopyStatus] = useState({})
  const [domainStatus, setDomainStatus] = useState(null)
  const [dnsRecords, setDnsRecords] = useState(null)
  const [isAddingDomain, setIsAddingDomain] = useState(false)

  const [brandConfig, setBrandConfig] = useState({
    // Branding
    brandName: "",
    brandSlogan: "",
    logo: "",
    favicon: "",
    primaryColor: "#FFD700",
    secondaryColor: "#0A1A2F",
    accentColor: "#4A90E2",
    errorColor: "#DC2626",
    successColor: "#10B981",

    // Typography
    fontFamily: "Inter, sans-serif",
    headingFont: "Poppins, sans-serif",
    fontSize: {
      h1: 32,
      h2: 24,
      h3: 20,
      body: 14,
    },

    // Terms & Policies
    tosUrl: "/terms",
    privacyUrl: "/privacy",
    kycUrl: "/kyc-policy",
    companySupportEmail: "",
    companyPhone: "",

    // Email Configuration
    emailBrand: {
      logoUrl: "",
      senderName: "",
      senderEmail: "",
      supportEmail: "",
    },

    // Homepage Banner
    bannerTitle: "",
    bannerSubtitle: "",
    bannerImage: "",

    // Footer
    companyName: "",
    companyAddress: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
    },

    // Domain Management
    primaryDomain: "",
    subdomain: "",
    currency: "USD",

    // Features
    enableSocialLogin: true,
    enableLiveChat: true,
    enableNewsletterSignup: true,
    maintenanceMode: false,
  })

  useEffect(() => {
    fetchTenantConfig()
  }, [])

  const fetchTenantConfig = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Fetching tenant config...")
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/tenant/config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      console.log("[v0] Tenant config response:", data)

      if (data.success && data.tenant) {
        const tenant = data.tenant
        setTenantId(tenant._id)

        console.log("[v0] Setting brand config from tenant data:", {
          brandName: tenant.name,
          primaryDomain: tenant.primaryDomain,
          subdomain: tenant.subdomain,
          colors: {
            primary: tenant.theme?.primaryColor,
            secondary: tenant.theme?.secondaryColor,
          },
        })

        // Map tenant data to brandConfig
        setBrandConfig({
          brandName: tenant.name || "",
          brandSlogan: tenant.theme?.brandSlogan || "",
          logo: tenant.theme?.logoUrl || "",
          favicon: tenant.theme?.faviconUrl || "",
          primaryColor: tenant.theme?.primaryColor || "#FFD700",
          secondaryColor: tenant.theme?.secondaryColor || "#0A1A2F",
          accentColor: tenant.theme?.accentColor || "#4A90E2",
          errorColor: tenant.theme?.errorColor || "#DC2626",
          successColor: tenant.theme?.successColor || "#10B981",

          fontFamily: tenant.theme?.fontFamily || "Inter, sans-serif",
          headingFont: tenant.theme?.headingFont || "Poppins, sans-serif",
          fontSize: tenant.theme?.fontSize || {
            h1: 32,
            h2: 24,
            h3: 20,
            body: 14,
          },

          tosUrl: tenant.config?.termsUrl || "/terms",
          privacyUrl: tenant.config?.privacyUrl || "/privacy",
          kycUrl: tenant.config?.kycUrl || "/kyc-policy",
          companySupportEmail: tenant.email || "",
          companyPhone: tenant.phone || "",

          emailBrand: {
            logoUrl: tenant.theme?.emailLogoUrl || tenant.theme?.logoUrl || "",
            senderName: tenant.theme?.emailSenderName || tenant.name || "",
            senderEmail: tenant.theme?.emailSenderEmail || "",
            supportEmail: tenant.email || "",
          },

          bannerTitle: tenant.theme?.bannerTitle || "",
          bannerSubtitle: tenant.theme?.bannerSubtitle || "",
          bannerImage: tenant.theme?.bannerImage || "",

          companyName: tenant.legalName || tenant.name || "",
          companyAddress: tenant.address || "",
          socialMedia: {
            facebook: tenant.socialMedia?.facebook || "",
            twitter: tenant.socialMedia?.twitter || "",
            instagram: tenant.socialMedia?.instagram || "",
          },

          primaryDomain: tenant.primaryDomain || "",
          subdomain: tenant.subdomain || "",
          currency: tenant.currency || "USD",

          enableSocialLogin: tenant.config?.enableSocialLogin !== false,
          enableLiveChat: tenant.config?.enableLiveChat !== false,
          enableNewsletterSignup: tenant.config?.enableNewsletterSignup !== false,
          maintenanceMode: tenant.config?.maintenanceMode || false,
        })

        console.log("[v0] Brand config state updated successfully")
      } else {
        console.error("[v0] Failed to fetch tenant config:", data.error || "Unknown error")
      }
    } catch (error) {
      console.error("[v0] Error fetching tenant config:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!tenantId) {
      alert("Tenant ID not found. Please refresh the page.")
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/tenant/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId,
          config: brandConfig,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Brand configuration saved successfully!")
        await fetchTenantConfig()
      } else {
        alert(`Error: ${data.error || "Failed to save configuration"}`)
      }
    } catch (error) {
      console.error("Error saving config:", error)
      alert("Failed to save configuration. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleColorChange = (colorKey, value) => {
    setBrandConfig((prev) => ({ ...prev, [colorKey]: value }))
  }

  const handleAddToVercel = async () => {
    if (!brandConfig.primaryDomain) {
      alert("Please enter a custom domain first")
      return
    }

    setIsAddingDomain(true)
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/tenant/domains/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId,
          domain: brandConfig.primaryDomain,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setDnsRecords(data.dnsRecords)
        setDomainStatus("pending")
        alert("Domain added to Vercel! Configure DNS records to complete setup.")
      } else {
        alert(`Error: ${data.error || "Failed to add domain"}`)
      }
    } catch (error) {
      console.error("Error adding domain:", error)
    } finally {
      setIsAddingDomain(false)
    }
  }

  const handleVerifyDomain = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/tenant/domains/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain: brandConfig.primaryDomain,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.verified) {
          setDomainStatus("verified")
          alert("Domain verified successfully!")
        } else {
          alert("Domain not yet verified. Please ensure DNS records are configured correctly.")
        }
      }
    } catch (error) {
      console.error("Error verifying domain:", error)
    }
  }

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopyStatus({ ...copyStatus, [key]: true })
    setTimeout(() => {
      setCopyStatus({ ...copyStatus, [key]: false })
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#B8C5D6]">Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Brand Configuration</h1>
        <p className="text-[#B8C5D6]">Customize your brand identity and player experience</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-[#1A2F45] border-b border-[#2A3F55]">
          <TabsTrigger value="branding" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Branding
          </TabsTrigger>
          <TabsTrigger value="colors" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Colors
          </TabsTrigger>
          <TabsTrigger
            value="typography"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
          >
            Typography
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Policies
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Email
          </TabsTrigger>
          <TabsTrigger value="domain" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Domain
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Brand Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Brand Name</label>
                  <input
                    type="text"
                    value={brandConfig.brandName}
                    onChange={(e) => setBrandConfig({ ...brandConfig, brandName: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Brand Slogan</label>
                  <input
                    type="text"
                    value={brandConfig.brandSlogan}
                    onChange={(e) => setBrandConfig({ ...brandConfig, brandSlogan: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Logo URL</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={brandConfig.emailBrand.logoUrl}
                      onChange={(e) =>
                        setBrandConfig({
                          ...brandConfig,
                          emailBrand: { ...brandConfig.emailBrand, logoUrl: e.target.value },
                        })
                      }
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                    />
                    {brandConfig.emailBrand.logoUrl && (
                      <div className="relative w-full h-24 bg-[#1A2F45] border border-[#2A3F55] rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={brandConfig.emailBrand.logoUrl || "/placeholder.svg"}
                          alt="Brand Logo Preview"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.target.style.display = "none"
                            e.target.nextSibling.style.display = "flex"
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center text-[#B8C5D6] text-sm">
                          Invalid image URL
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Favicon</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center justify-center w-12 h-12 bg-[#1A2F45] border border-[#2A3F55] rounded-lg">
                      <span className="text-xs text-[#B8C5D6]">F</span>
                    </div>
                    <Button variant="outline" className="border-[#2A3F55] text-[#B8C5D6] bg-[#1A2F45]">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="border-t border-[#2A3F55] pt-4 space-y-4">
                <h3 className="text-[#F5F5F5] font-semibold">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Company Name</label>
                    <input
                      type="text"
                      value={brandConfig.companyName}
                      onChange={(e) => setBrandConfig({ ...brandConfig, companyName: e.target.value })}
                      className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Company Address</label>
                    <input
                      type="text"
                      value={brandConfig.companyAddress}
                      onChange={(e) => setBrandConfig({ ...brandConfig, companyAddress: e.target.value })}
                      className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Support Email</label>
                    <input
                      type="email"
                      value={brandConfig.companySupportEmail}
                      onChange={(e) => setBrandConfig({ ...brandConfig, companySupportEmail: e.target.value })}
                      className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Support Phone</label>
                    <input
                      type="tel"
                      value={brandConfig.companyPhone}
                      onChange={(e) => setBrandConfig({ ...brandConfig, companyPhone: e.target.value })}
                      className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                    />
                  </div>
                </div>

                {/* Social Media */}
                <div className="pt-4 border-t border-[#2A3F55]">
                  <h4 className="text-[#F5F5F5] font-semibold mb-3">Social Media</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Facebook</label>
                      <input
                        type="url"
                        value={brandConfig.socialMedia.facebook}
                        onChange={(e) =>
                          setBrandConfig({
                            ...brandConfig,
                            socialMedia: { ...brandConfig.socialMedia, facebook: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Twitter</label>
                      <input
                        type="url"
                        value={brandConfig.socialMedia.twitter}
                        onChange={(e) =>
                          setBrandConfig({
                            ...brandConfig,
                            socialMedia: { ...brandConfig.socialMedia, twitter: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Instagram</label>
                      <input
                        type="url"
                        value={brandConfig.socialMedia.instagram}
                        onChange={(e) =>
                          setBrandConfig({
                            ...brandConfig,
                            socialMedia: { ...brandConfig.socialMedia, instagram: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Color Palette</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#B8C5D6]">
                    Choose colors that match your brand identity. These will be used throughout the platform.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Primary Color", key: "primaryColor" },
                  { label: "Secondary Color", key: "secondaryColor" },
                  { label: "Accent Color", key: "accentColor" },
                  { label: "Error Color", key: "errorColor" },
                  { label: "Success Color", key: "successColor" },
                ].map((color) => (
                  <div key={color.key}>
                    <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">{color.label}</label>
                    <div className="flex gap-3">
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={brandConfig[color.key]}
                          onChange={(e) => handleColorChange(color.key, e.target.value)}
                          className="w-16 h-10 bg-[#1A2F45] border-[#2A3F55] cursor-pointer rounded-lg"
                        />
                      </div>
                      <input
                        type="text"
                        value={brandConfig[color.key]}
                        onChange={(e) => handleColorChange(color.key, e.target.value)}
                        className="flex-1 px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700] text-sm font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Color Preview */}
              <div className="border-t border-[#2A3F55] pt-4 mt-4">
                <h3 className="text-[#F5F5F5] font-semibold mb-3">Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-2">
                    <div
                      className="h-16 rounded-lg border-2 border-[#2A3F55]"
                      style={{ backgroundColor: brandConfig.primaryColor }}
                    ></div>
                    <p className="text-xs text-[#B8C5D6] text-center">Primary</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="h-16 rounded-lg border-2 border-[#2A3F55]"
                      style={{ backgroundColor: brandConfig.secondaryColor }}
                    ></div>
                    <p className="text-xs text-[#B8C5D6] text-center">Secondary</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="h-16 rounded-lg border-2 border-[#2A3F55]"
                      style={{ backgroundColor: brandConfig.accentColor }}
                    ></div>
                    <p className="text-xs text-[#B8C5D6] text-center">Accent</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="h-16 rounded-lg border-2 border-[#2A3F55]"
                      style={{ backgroundColor: brandConfig.errorColor }}
                    ></div>
                    <p className="text-xs text-[#B8C5D6] text-center">Error</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="h-16 rounded-lg border-2 border-[#2A3F55]"
                      style={{ backgroundColor: brandConfig.successColor }}
                    ></div>
                    <p className="text-xs text-[#B8C5D6] text-center">Success</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Typography Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Font Family</label>
                <select
                  value={brandConfig.fontFamily}
                  onChange={(e) => setBrandConfig({ ...brandConfig, fontFamily: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="Inter, sans-serif">Inter (Default)</option>
                  <option value="Poppins, sans-serif">Poppins</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="Open Sans, sans-serif">Open Sans</option>
                </select>
              </div>

              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Heading Font</label>
                <select
                  value={brandConfig.headingFont}
                  onChange={(e) => setBrandConfig({ ...brandConfig, headingFont: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="Poppins, sans-serif">Poppins (Default)</option>
                  <option value="Montserrat, sans-serif">Montserrat</option>
                  <option value="Bebas Neue, cursive">Bebas Neue</option>
                </select>
              </div>

              <div className="border-t border-[#2A3F55] pt-4 space-y-4">
                <h3 className="text-[#F5F5F5] font-semibold">Font Sizes (px)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(brandConfig.fontSize).map(([size, value]) => (
                    <div key={size}>
                      <label className="block text-[#B8C5D6] text-sm font-semibold mb-2 capitalize">{size}</label>
                      <input
                        type="number"
                        min="8"
                        max="64"
                        value={value}
                        onChange={(e) =>
                          setBrandConfig({
                            ...brandConfig,
                            fontSize: { ...brandConfig.fontSize, [size]: Number.parseInt(e.target.value) },
                          })
                        }
                        className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Terms & Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Terms of Service URL</label>
                <input
                  type="url"
                  value={brandConfig.tosUrl}
                  onChange={(e) => setBrandConfig({ ...brandConfig, tosUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  placeholder="/terms"
                />
              </div>
              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Privacy Policy URL</label>
                <input
                  type="url"
                  value={brandConfig.privacyUrl}
                  onChange={(e) => setBrandConfig({ ...brandConfig, privacyUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  placeholder="/privacy"
                />
              </div>
              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">KYC Policy URL</label>
                <input
                  type="url"
                  value={brandConfig.kycUrl}
                  onChange={(e) => setBrandConfig({ ...brandConfig, kycUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  placeholder="/kyc-policy"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Sender Name</label>
                <input
                  type="text"
                  value={brandConfig.emailBrand.senderName}
                  onChange={(e) =>
                    setBrandConfig({
                      ...brandConfig,
                      emailBrand: { ...brandConfig.emailBrand, senderName: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                />
              </div>
              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Sender Email</label>
                <input
                  type="email"
                  value={brandConfig.emailBrand.senderEmail}
                  onChange={(e) =>
                    setBrandConfig({
                      ...brandConfig,
                      emailBrand: { ...brandConfig.emailBrand, senderEmail: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Domain Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#B8C5D6]">
                    Manage your custom domain and DNS configuration. Your subdomain is always available as a backup.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Custom Primary Domain</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={brandConfig.primaryDomain}
                    onChange={(e) => setBrandConfig({ ...brandConfig, primaryDomain: e.target.value })}
                    placeholder="example.com"
                    className="flex-1 px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                  <Button
                    onClick={handleAddToVercel}
                    disabled={isAddingDomain || !brandConfig.primaryDomain}
                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
                  >
                    {isAddingDomain ? "Adding..." : "Add to Vercel"}
                  </Button>
                  <Button
                    onClick={handleVerifyDomain}
                    disabled={!brandConfig.primaryDomain}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                </div>
                {domainStatus && (
                  <p className="text-sm mt-2">
                    Status:{" "}
                    <span
                      className={
                        domainStatus === "verified" ? "text-green-400 font-semibold" : "text-yellow-400 font-semibold"
                      }
                    >
                      {domainStatus === "verified" ? "Verified" : "Pending Configuration"}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Subdomain (Secondary)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={brandConfig.subdomain}
                    onChange={(e) => setBrandConfig({ ...brandConfig, subdomain: e.target.value })}
                    className="flex-1 px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                    disabled
                  />
                  <span className="text-[#B8C5D6]">.goalbett.com</span>
                </div>
                <p className="text-xs text-[#B8C5D6] mt-2">Will be: {brandConfig.subdomain}.goalbett.com</p>
              </div>

              {dnsRecords && (
                <div className="border-t border-[#2A3F55] pt-4 space-y-4">
                  <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-[#FFD700] mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-[#FFD700] font-semibold">
                          DNS Configuration Required for {brandConfig.primaryDomain}
                        </h4>
                        <p className="text-sm text-[#B8C5D6] mt-1">
                          Configure the following DNS records with your domain registrar:
                        </p>
                      </div>
                    </div>

                    {dnsRecords.map((record, index) => (
                      <div key={index} className="bg-[#1A2F45] rounded-lg p-4 mb-3">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-[#F5F5F5] font-semibold">
                            Domain Configuration {record.type === "CNAME" ? "(Recommended)" : "(Fallback)"}
                          </h5>
                          <span className="px-3 py-1 bg-[#2A3F55] text-[#FFD700] text-xs font-bold rounded-full">
                            {record.type}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[#FFD700] text-sm font-semibold mb-2">Type:</label>
                            <div className="flex gap-2">
                              <div className="flex-1 px-4 py-2 bg-[#0D1F35] border border-[#2A3F55] text-[#F5F5F5] rounded-lg">
                                {record.type}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(record.type, `type-${index}`)}
                                className="text-[#FFD700]"
                              >
                                {copyStatus[`type-${index}`] ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[#FFD700] text-sm font-semibold mb-2">Name:</label>
                            <div className="flex gap-2">
                              <div className="flex-1 px-4 py-2 bg-[#0D1F35] border border-[#2A3F55] text-[#F5F5F5] rounded-lg">
                                {record.name}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(record.name, `name-${index}`)}
                                className="text-[#FFD700]"
                              >
                                {copyStatus[`name-${index}`] ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[#FFD700] text-sm font-semibold mb-2">Value:</label>
                            <div className="flex gap-2">
                              <div className="flex-1 px-4 py-2 bg-[#0D1F35] border border-[#2A3F55] text-[#F5F5F5] rounded-lg font-mono text-sm break-all">
                                {record.value}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(record.value, `value-${index}`)}
                                className="text-[#FFD700]"
                              >
                                {copyStatus[`value-${index}`] ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-lg p-4 mt-4">
                      <h5 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Step-by-Step Instructions:
                      </h5>
                      <ol className="space-y-2 text-sm text-[#B8C5D6] list-decimal list-inside">
                        <li>Log in to your domain registrar (GoDaddy, Namecheap, etc.)</li>
                        <li>Navigate to DNS Management or DNS Settings</li>
                        <li>Add a new DNS record with the values above</li>
                        <li>Save the changes and wait for DNS propagation (5-60 minutes)</li>
                        <li>Once propagated, your custom domain will be live!</li>
                      </ol>
                      <Button
                        variant="link"
                        className="text-[#FFD700] mt-3 p-0 h-auto"
                        onClick={() => window.open("https://vercel.com/docs/concepts/projects/domains", "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Vercel Domain Documentation
                      </Button>
                    </div>

                    <div className="bg-[#2A3F55]/30 border border-[#2A3F55] rounded-lg p-4 mt-4">
                      <h5 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Important Notes:
                      </h5>
                      <ul className="space-y-1 text-sm text-[#B8C5D6] list-disc list-inside">
                        <li>DNS propagation can take up to 48 hours (usually 5-60 minutes)</li>
                        <li>Vercel automatically provisions SSL certificates for your domain</li>
                        <li>Your subdomain will continue to work as a backup</li>
                        <li>After DNS configuration, click "Verify" to check the status</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="border-[#B8C5D6] text-[#B8C5D6] bg-transparent hover:bg-[#1A2F45]">
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Brand Configuration"}
        </Button>
      </div>
    </div>
  )
}
