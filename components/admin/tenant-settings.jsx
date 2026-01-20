"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Lock,
  Globe,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Copy,
  CheckCheck,
} from "lucide-react"

export function TenantSettings() {
  const [activeTab, setActiveTab] = useState("password")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Domain management state
  const [domainConfig, setDomainConfig] = useState({
    primaryDomain: "",
    subdomain: "",
    status: "loading",
  })
  const [dnsRecords, setDnsRecords] = useState([])
  const [copiedField, setCopiedField] = useState("")
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    fetchDomainConfig()
  }, [])

  const fetchDomainConfig = async () => {
    try {
      const response = await fetch("/api/tenant/current")
      const data = await response.json()

      if (data.tenant) {
        setDomainConfig({
          primaryDomain: data.tenant.primaryDomain || "",
          subdomain: data.tenant.subdomain || "",
          status: data.tenant.primaryDomain ? "configured" : "not-configured",
        })
      }
    } catch (error) {
      console.error("Error fetching domain config:", error)
      setMessage({ type: "error", text: "Failed to load domain configuration" })
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long" })
      return
    }

    setIsSaving(true)
    setMessage({ type: "", text: "" })

    try {
      const response = await fetch("/api/tenant/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Password changed successfully" })
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to change password" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddDomain = async () => {
    if (!domainConfig.primaryDomain) {
      setMessage({ type: "error", text: "Please enter a domain name" })
      return
    }

    setIsAddingDomain(true)
    setMessage({ type: "", text: "" })

    try {
      const response = await fetch("/api/super/tenants/domains/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domainConfig.primaryDomain,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Domain added to Vercel successfully" })
        setDnsRecords(data.dnsRecords || [])
        setDomainConfig((prev) => ({ ...prev, status: "pending-configuration" }))
      } else {
        setMessage({ type: "error", text: data.error || "Failed to add domain" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setIsAddingDomain(false)
    }
  }

  const handleVerifyDomain = async () => {
    setIsVerifying(true)
    setMessage({ type: "", text: "" })

    try {
      const response = await fetch("/api/super/tenants/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domainConfig.primaryDomain,
        }),
      })

      const data = await response.json()

      if (response.ok && data.verified) {
        setMessage({ type: "success", text: "Domain verified successfully!" })
        setDomainConfig((prev) => ({ ...prev, status: "verified" }))
        await fetchDomainConfig()
      } else {
        setMessage({
          type: "error",
          text: data.error || "Domain verification pending. Please check your DNS settings.",
        })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred during verification" })
    } finally {
      setIsVerifying(false)
    }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(""), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Settings</h1>
        <p className="text-[#B8C5D6]">Manage your account settings and domain configuration</p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-500/20 border-green-500 text-green-400"
              : "bg-red-500/20 border-red-500 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1A2F45] border-b border-[#2A3F55]">
          <TabsTrigger value="password" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Password
          </TabsTrigger>
          <TabsTrigger value="domain" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Domain
          </TabsTrigger>
        </TabsList>

        {/* Password Tab */}
        <TabsContent value="password" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 pr-10 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8C5D6] hover:text-[#F5F5F5]"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2 pr-10 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8C5D6] hover:text-[#F5F5F5]"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#B8C5D6] mt-1">Must be at least 8 characters long</p>
                </div>

                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 pr-10 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8C5D6] hover:text-[#F5F5F5]"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Domain Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Domains */}
              <div className="space-y-3">
                <h3 className="text-[#F5F5F5] font-semibold">Current Domains</h3>
                {domainConfig.subdomain && (
                  <div className="p-3 bg-[#1A2F45] border border-[#2A3F55] rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#B8C5D6]">Subdomain (Secondary)</p>
                        <p className="text-[#F5F5F5] font-mono">{domainConfig.subdomain}.goalbett.com</p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    </div>
                  </div>
                )}

                {domainConfig.primaryDomain && (
                  <div className="p-3 bg-[#1A2F45] border border-[#FFD700] rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#B8C5D6]">Primary Domain</p>
                        <p className="text-[#FFD700] font-mono">{domainConfig.primaryDomain}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          domainConfig.status === "verified"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {domainConfig.status === "verified" ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Add/Change Domain */}
              <div className="space-y-4">
                <h3 className="text-[#F5F5F5] font-semibold">
                  {domainConfig.primaryDomain ? "Change Primary Domain" : "Add Custom Domain"}
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="yourdomain.com"
                    value={domainConfig.primaryDomain}
                    onChange={(e) => setDomainConfig({ ...domainConfig, primaryDomain: e.target.value })}
                    className="flex-1 px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                  <Button
                    onClick={handleAddDomain}
                    disabled={isAddingDomain || !domainConfig.primaryDomain}
                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
                  >
                    {isAddingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Vercel"}
                  </Button>
                </div>
              </div>

              {/* DNS Configuration Instructions */}
              {dnsRecords.length > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-400 mb-2">DNS Configuration Required</h4>
                        <p className="text-sm text-[#B8C5D6]">
                          Add the following DNS records to your domain registrar to complete the setup:
                        </p>
                      </div>
                    </div>
                  </div>

                  {dnsRecords.map((record, index) => (
                    <div key={index} className="p-4 bg-[#1A2F45] border border-[#2A3F55] rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-[#F5F5F5]">
                          {record.type === "CNAME" ? "CNAME Record (Recommended)" : "A Record (Alternative)"}
                        </h4>
                        <span className="px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] rounded text-xs font-semibold">
                          {record.type}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-[#B8C5D6] mb-1 block">Type</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-[#0D1F35] rounded text-[#FFD700] font-mono text-sm">
                              {record.type}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(record.type, `type-${index}`)}
                              className="border-[#2A3F55] text-[#B8C5D6]"
                            >
                              {copiedField === `type-${index}` ? (
                                <CheckCheck className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-[#B8C5D6] mb-1 block">Name</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-[#0D1F35] rounded text-[#F5F5F5] font-mono text-sm">
                              @ or {domainConfig.primaryDomain}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard("@", `name-${index}`)}
                              className="border-[#2A3F55] text-[#B8C5D6]"
                            >
                              {copiedField === `name-${index}` ? (
                                <CheckCheck className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-[#B8C5D6] mb-1 block">Value</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-[#0D1F35] rounded text-green-400 font-mono text-sm break-all">
                              {record.value}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(record.value, `value-${index}`)}
                              className="border-[#2A3F55] text-[#B8C5D6]"
                            >
                              {copiedField === `value-${index}` ? (
                                <CheckCheck className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="space-y-3">
                    <h4 className="text-[#F5F5F5] font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Step-by-Step Instructions:
                    </h4>
                    <ol className="space-y-3 text-sm text-[#B8C5D6]">
                      <li className="flex gap-2">
                        <span className="text-[#FFD700] font-bold">1.</span>
                        <span>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#FFD700] font-bold">2.</span>
                        <span>
                          Navigate to <strong>DNS Management</strong> or <strong>DNS Settings</strong> for your domain
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#FFD700] font-bold">3.</span>
                        <div>
                          <span className="text-yellow-400 font-semibold">Important:</span> Delete any existing A or
                          CNAME records pointing to @ or your root domain before adding new ones
                          <ul className="mt-1 ml-4 text-xs text-[#B8C5D6]/80 list-disc">
                            <li>Look for existing A records with Name "@" or your domain name</li>
                            <li>Look for existing CNAME records with Name "@" or "www"</li>
                            <li>Delete these old records to avoid conflicts</li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#FFD700] font-bold">4.</span>
                        <div>
                          <span>Add the DNS records shown above (use the copy buttons for accuracy)</span>
                          <ul className="mt-1 ml-4 text-xs text-[#B8C5D6]/80 list-disc">
                            <li>
                              <strong>Recommended:</strong> Use the CNAME record if your registrar supports it
                            </li>
                            <li>
                              <strong>Alternative:</strong> Use the A record if CNAME doesn't work for root domain
                            </li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#FFD700] font-bold">5.</span>
                        <span>
                          Save the changes and wait for DNS propagation (typically 5-60 minutes, can take up to 48
                          hours)
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#FFD700] font-bold">6.</span>
                        <span>
                          Click the <strong>"Verify Domain"</strong> button below to check if your domain is configured
                          correctly
                        </span>
                      </li>
                    </ol>

                    {/* Important Notes */}
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <h5 className="text-blue-400 font-semibold mb-2">Important Notes:</h5>
                      <ul className="space-y-1 text-xs text-[#B8C5D6]">
                        <li>• DNS propagation can take up to 48 hours (usually 5-60 minutes)</li>
                        <li>• The subdomain ({domainConfig.subdomain}.goalbett.com) works immediately as backup</li>
                        <li>• Custom domain becomes PRIMARY once verified and configured</li>
                        <li>• SSL certificate is automatically provisioned by Vercel</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleVerifyDomain}
                      disabled={isVerifying}
                      className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify Domain
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open("https://vercel.com/docs/projects/domains", "_blank")}
                      className="border-[#2A3F55] text-[#B8C5D6]"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Help
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
