"use client"

import { useState, useEffect } from "react"
import { SuperAdminSidebar } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  PlusCircle,
  Save,
  Edit,
  Copy,
  Trash2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Download,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

const COUNTRY_LIST = [
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "ET", name: "Ethiopia", currency: "ETB" },
  { code: "KE", name: "Kenya", currency: "KES" },
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
  { code: "GH", name: "Ghana", currency: "GHS" },
  { code: "UG", name: "Uganda", currency: "UGX" },
  { code: "TZ", name: "Tanzania", currency: "TZS" },
  { code: "RW", name: "Rwanda", currency: "RWF" },
  { code: "CM", name: "Cameroon", currency: "XAF" },
  { code: "CI", name: "Ivory Coast", currency: "XOF" },
  { code: "SN", name: "Senegal", currency: "XOF" },
  { code: "MZ", name: "Mozambique", currency: "MZN" },
  { code: "ZM", name: "Zambia", currency: "ZMW" },
  { code: "ZW", name: "Zimbabwe", currency: "ZWL" },
  { code: "BW", name: "Botswana", currency: "BWP" },
  { code: "NA", name: "Namibia", currency: "NAD" },
  { code: "MW", name: "Malawi", currency: "MWK" },
  { code: "AO", name: "Angola", currency: "AOA" },
  { code: "CD", name: "DR Congo", currency: "CDF" },
  { code: "EG", name: "Egypt", currency: "EGP" },
  { code: "MA", name: "Morocco", currency: "MAD" },
  { code: "TN", name: "Tunisia", currency: "TND" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "PH", name: "Philippines", currency: "PHP" },
  { code: "BR", name: "Brazil", currency: "BRL" },
  { code: "MX", name: "Mexico", currency: "MXN" },
  { code: "MT", name: "Malta", currency: "EUR" },
  { code: "CY", name: "Cyprus", currency: "EUR" },
  { code: "GI", name: "Gibraltar", currency: "GIP" },
  { code: "CW", name: "Curacao", currency: "ANG" },
]

const DEDUCTION_TYPES = [
  { value: "win_tax", label: "Win Tax" },
  { value: "betting_tax", label: "Betting Tax" },
  { value: "charity", label: "Charity" },
  { value: "withholding_tax", label: "Withholding Tax" },
  { value: "vat", label: "VAT" },
  { value: "excise_duty", label: "Excise Duty" },
  { value: "social_responsibility", label: "Social Responsibility" },
  { value: "gaming_levy", label: "Gaming Levy" },
  { value: "other", label: "Other" },
]

const CALCULATION_BASES = [
  { value: "gross_win", label: "Gross Win (Payout - Stake)" },
  { value: "net_profit", label: "Net Profit" },
  { value: "stake", label: "Stake Amount" },
  { value: "payout", label: "Total Payout" },
  { value: "ggr", label: "GGR (Operator Side)" },
  { value: "turnover", label: "Turnover" },
]

const DEFAULT_FORM = {
  countryCode: "",
  countryName: "",
  profileName: "standard",
  baseCurrency: "USD",
  status: "draft",
  playerDeductions: [],
  operatorDeductions: [],
  limits: {
    maxWinPerBet: null,
    maxWinPerDay: null,
    maxBetAmount: null,
    minBetAmount: 1,
  },
  featuresAllowed: {
    cashbackEnabled: true,
    bonusesEnabled: true,
    liveBettingEnabled: true,
    casinoEnabled: true,
    virtualSportsEnabled: true,
  },
  providerLocked: false,
  changeReason: "",
  regulatoryInfo: {
    licensingBody: "",
    licenseNumber: "",
    complianceNotes: "",
  },
}

export default function JurisdictionRulesPage() {
  const [rules, setRules] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [formData, setFormData] = useState(DEFAULT_FORM)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/super/jurisdiction-rules")
      if (res.ok) {
        const data = await res.json()
        setRules(Array.isArray(data) ? data : [])
      } else {
        toast.error("Failed to load rules")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Failed to load jurisdiction rules")
    } finally {
      setLoading(false)
    }
  }

  const addDeduction = (type) => {
    const newDeduction = {
      name: "",
      enabled: true,
      percentage: 0,
      threshold: 0,
      calculationBase: type === "playerDeductions" ? "gross_win" : "ggr",
      appliesTo: type === "playerDeductions" ? "player" : "operator",
      applicationOrder: formData[type].length + 1,
      destinationAccount: type === "playerDeductions" ? "tax_payable" : "operator_revenue",
      rounding: "normal",
      description: "",
    }
    setFormData({ ...formData, [type]: [...formData[type], newDeduction] })
  }

  const updateDeduction = (type, index, field, value) => {
    const updated = [...formData[type]]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, [type]: updated })
  }

  const removeDeduction = (type, index) => {
    const updated = formData[type].filter((_, i) => i !== index)
    updated.forEach((d, i) => (d.applicationOrder = i + 1))
    setFormData({ ...formData, [type]: updated })
  }

  const handleSave = async () => {
    try {
      if (!formData.countryCode || !formData.countryName) {
        toast.error("Please select a country")
        return
      }
      if (!formData.changeReason && formData.status === "active") {
        toast.error("Please provide a reason for this change")
        return
      }
      for (const d of formData.playerDeductions) {
        if (!d.name) {
          toast.error("All player deductions must have a type selected")
          return
        }
      }
      for (const d of formData.operatorDeductions) {
        if (!d.name) {
          toast.error("All operator deductions must have a type selected")
          return
        }
      }

      setSaving(true)
      const payload = { ...formData, ruleId: isEditing ? selectedRule?._id : undefined }

      const res = await fetch("/api/super/jurisdiction-rules", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Rule ${isEditing ? "updated" : "created"} successfully`)
        fetchRules()
        resetForm()
      } else {
        toast.error(data.error || data.message || "Failed to save rule")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ruleId) => {
    if (!confirm("Are you sure you want to delete this rule?")) return

    try {
      const res = await fetch(`/api/super/jurisdiction-rules?id=${ruleId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Rule deleted")
        fetchRules()
        if (selectedRule?._id === ruleId) resetForm()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete")
      }
    } catch (error) {
      toast.error("Failed to delete rule")
    }
  }

  const handleEdit = (rule) => {
    setSelectedRule(rule)
    setFormData({
      countryCode: rule.countryCode || "",
      countryName: rule.countryName || "",
      profileName: rule.profileName || "standard",
      baseCurrency: rule.baseCurrency || "USD",
      status: rule.status || "draft",
      playerDeductions: rule.playerDeductions || [],
      operatorDeductions: rule.operatorDeductions || [],
      limits: rule.limits || DEFAULT_FORM.limits,
      featuresAllowed: rule.featuresAllowed || DEFAULT_FORM.featuresAllowed,
      providerLocked: rule.providerLocked || false,
      changeReason: "",
      regulatoryInfo: rule.regulatoryInfo || DEFAULT_FORM.regulatoryInfo,
    })
    setIsEditing(true)
    setActiveTab("basic")
  }

  const handleClone = (rule) => {
    setFormData({
      countryCode: "",
      countryName: "",
      profileName: rule.profileName + "_copy",
      baseCurrency: rule.baseCurrency || "USD",
      status: "draft",
      playerDeductions: rule.playerDeductions?.map((d) => ({ ...d })) || [],
      operatorDeductions: rule.operatorDeductions?.map((d) => ({ ...d })) || [],
      limits: { ...DEFAULT_FORM.limits, ...rule.limits },
      featuresAllowed: { ...DEFAULT_FORM.featuresAllowed, ...rule.featuresAllowed },
      providerLocked: false,
      changeReason: `Cloned from ${rule.countryName}`,
      regulatoryInfo: { ...DEFAULT_FORM.regulatoryInfo },
    })
    setSelectedRule(null)
    setIsEditing(false)
    setActiveTab("basic")
    toast.info("Rule cloned - select a new country and save")
  }

  const resetForm = () => {
    setSelectedRule(null)
    setIsEditing(false)
    setFormData(DEFAULT_FORM)
    setActiveTab("basic")
  }

  const handleCountryChange = (code) => {
    const country = COUNTRY_LIST.find((c) => c.code === code)
    if (country) {
      setFormData({ ...formData, countryCode: code, countryName: country.name, baseCurrency: country.currency })
    }
  }

  const exportRules = () => {
    const dataStr = JSON.stringify(rules, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const link = document.createElement("a")
    link.href = dataUri
    link.download = `jurisdiction-rules-${new Date().toISOString().split("T")[0]}.json`
    link.click()
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SuperAdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Jurisdiction Rules Management</h1>
              <p className="text-muted-foreground">
                Configure tax, charity, and financial rules per country. Rules are enforced in the backend.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportRules} disabled={rules.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" onClick={fetchRules}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={resetForm}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Rule
              </Button>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              CRITICAL: All changes to active rules create new versions. Old bets remain tied to their original rule
              version. Never modify hard-coded values in code.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Existing Rules</CardTitle>
                <CardDescription>Select a rule to edit or clone ({rules.length} total)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : rules.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No rules created yet</p>
                    </div>
                  ) : (
                    rules.map((rule) => (
                      <Card
                        key={rule._id}
                        className={`p-3 cursor-pointer transition-colors ${selectedRule?._id === rule._id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                        onClick={() => handleEdit(rule)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {rule.countryName} ({rule.countryCode})
                            </h3>
                            <p className="text-xs text-muted-foreground">Profile: {rule.profileName}</p>
                            <p className="text-xs text-muted-foreground">Currency: {rule.baseCurrency}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <Badge
                                variant={
                                  rule.status === "active" ? "default" : rule.status === "draft" ? "secondary" : "outline"
                                }
                              >
                                {rule.status}
                              </Badge>
                              <Badge variant="outline">v{rule.version}</Badge>
                              {rule.playerDeductions?.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {rule.playerDeductions.length} taxes
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(rule)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClone(rule)
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(rule._id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{isEditing ? `Edit Rule: ${formData.countryName}` : "Create New Rule"}</CardTitle>
                <CardDescription>Configure financial rules for a jurisdiction</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid grid-cols-5">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="player">Player Taxes</TabsTrigger>
                    <TabsTrigger value="operator">Operator Taxes</TabsTrigger>
                    <TabsTrigger value="limits">Limits</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Country *</Label>
                        <Select value={formData.countryCode} onValueChange={handleCountryChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_LIST.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name} ({country.code}) - {country.currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Profile Name *</Label>
                        <Input
                          value={formData.profileName}
                          onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                          placeholder="standard"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Base Currency</Label>
                        <Input
                          value={formData.baseCurrency}
                          onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value.toUpperCase() })}
                          placeholder="USD"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status *</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft (not enforced)</SelectItem>
                            <SelectItem value="active">Active (enforced)</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Change Reason {formData.status === "active" && "*"}</Label>
                      <Textarea
                        value={formData.changeReason}
                        onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                        placeholder="Describe why this rule is being created or modified"
                        rows={2}
                      />
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3">Regulatory Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Licensing Body</Label>
                          <Input
                            value={formData.regulatoryInfo?.licensingBody || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                regulatoryInfo: { ...formData.regulatoryInfo, licensingBody: e.target.value },
                              })
                            }
                            placeholder="e.g., Ethiopian Gaming Board"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>License Number</Label>
                          <Input
                            value={formData.regulatoryInfo?.licenseNumber || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                regulatoryInfo: { ...formData.regulatoryInfo, licenseNumber: e.target.value },
                              })
                            }
                            placeholder="License reference"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="player" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Player-Side Deductions</h3>
                        <p className="text-sm text-muted-foreground">Applied to player winnings or stakes</p>
                      </div>
                      <Button size="sm" onClick={() => addDeduction("playerDeductions")}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Deduction
                      </Button>
                    </div>
                    {formData.playerDeductions.length === 0 ? (
                      <div className="border border-dashed rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">No player deductions configured</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => addDeduction("playerDeductions")}
                        >
                          Add First Deduction
                        </Button>
                      </div>
                    ) : (
                      formData.playerDeductions.map((deduction, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={deduction.enabled}
                                onCheckedChange={(checked) =>
                                  updateDeduction("playerDeductions", index, "enabled", checked)
                                }
                              />
                              <span className="text-sm font-medium">{deduction.enabled ? "Enabled" : "Disabled"}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeDeduction("playerDeductions", index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Type *</Label>
                              <Select
                                value={deduction.name}
                                onValueChange={(value) => updateDeduction("playerDeductions", index, "name", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DEDUCTION_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Percentage (%)</Label>
                              <Input
                                type="number"
                                value={deduction.percentage}
                                onChange={(e) =>
                                  updateDeduction("playerDeductions", index, "percentage", parseFloat(e.target.value) || 0)
                                }
                                min="0"
                                max="100"
                                step="0.1"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Threshold ({formData.baseCurrency})</Label>
                              <Input
                                type="number"
                                value={deduction.threshold}
                                onChange={(e) =>
                                  updateDeduction("playerDeductions", index, "threshold", parseFloat(e.target.value) || 0)
                                }
                                min="0"
                                placeholder="Apply only if >= this"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Calculation Base</Label>
                              <Select
                                value={deduction.calculationBase}
                                onValueChange={(value) =>
                                  updateDeduction("playerDeductions", index, "calculationBase", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CALCULATION_BASES.map((base) => (
                                    <SelectItem key={base.value} value={base.value}>
                                      {base.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Order</Label>
                              <Input
                                type="number"
                                value={deduction.applicationOrder}
                                onChange={(e) =>
                                  updateDeduction("playerDeductions", index, "applicationOrder", parseInt(e.target.value) || 1)
                                }
                                min="1"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Rounding</Label>
                              <Select
                                value={deduction.rounding}
                                onValueChange={(value) => updateDeduction("playerDeductions", index, "rounding", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="floor">Floor (Round Down)</SelectItem>
                                  <SelectItem value="ceil">Ceil (Round Up)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-3 space-y-2">
                              <Label>Description</Label>
                              <Input
                                value={deduction.description}
                                onChange={(e) =>
                                  updateDeduction("playerDeductions", index, "description", e.target.value)
                                }
                                placeholder="e.g., Ethiopian 15% win tax as per Gaming Proclamation"
                              />
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="operator" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Operator-Side Deductions</h3>
                        <p className="text-sm text-muted-foreground">Applied to GGR/Revenue (tenant-level)</p>
                      </div>
                      <Button size="sm" onClick={() => addDeduction("operatorDeductions")}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Deduction
                      </Button>
                    </div>
                    {formData.operatorDeductions.length === 0 ? (
                      <div className="border border-dashed rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">No operator deductions configured</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => addDeduction("operatorDeductions")}
                        >
                          Add First Deduction
                        </Button>
                      </div>
                    ) : (
                      formData.operatorDeductions.map((deduction, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={deduction.enabled}
                                onCheckedChange={(checked) =>
                                  updateDeduction("operatorDeductions", index, "enabled", checked)
                                }
                              />
                              <span className="text-sm font-medium">{deduction.enabled ? "Enabled" : "Disabled"}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeDeduction("operatorDeductions", index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>Type *</Label>
                              <Select
                                value={deduction.name}
                                onValueChange={(value) => updateDeduction("operatorDeductions", index, "name", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DEDUCTION_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Percentage (%)</Label>
                              <Input
                                type="number"
                                value={deduction.percentage}
                                onChange={(e) =>
                                  updateDeduction("operatorDeductions", index, "percentage", parseFloat(e.target.value) || 0)
                                }
                                min="0"
                                max="100"
                                step="0.1"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Calculation Base</Label>
                              <Select
                                value={deduction.calculationBase}
                                onValueChange={(value) =>
                                  updateDeduction("operatorDeductions", index, "calculationBase", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CALCULATION_BASES.map((base) => (
                                    <SelectItem key={base.value} value={base.value}>
                                      {base.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-3 space-y-2">
                              <Label>Description</Label>
                              <Input
                                value={deduction.description}
                                onChange={(e) =>
                                  updateDeduction("operatorDeductions", index, "description", e.target.value)
                                }
                                placeholder="e.g., 5% charity contribution on GGR"
                              />
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="limits" className="space-y-4">
                    <h3 className="font-semibold">Betting Limits</h3>
                    <p className="text-sm text-muted-foreground mb-4">Configure max/min amounts for this jurisdiction</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Win Per Bet ({formData.baseCurrency})</Label>
                        <Input
                          type="number"
                          value={formData.limits.maxWinPerBet || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: { ...formData.limits, maxWinPerBet: e.target.value ? parseFloat(e.target.value) : null },
                            })
                          }
                          placeholder="No limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Win Per Day ({formData.baseCurrency})</Label>
                        <Input
                          type="number"
                          value={formData.limits.maxWinPerDay || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: { ...formData.limits, maxWinPerDay: e.target.value ? parseFloat(e.target.value) : null },
                            })
                          }
                          placeholder="No limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Bet Amount ({formData.baseCurrency})</Label>
                        <Input
                          type="number"
                          value={formData.limits.maxBetAmount || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: { ...formData.limits, maxBetAmount: e.target.value ? parseFloat(e.target.value) : null },
                            })
                          }
                          placeholder="No limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Min Bet Amount ({formData.baseCurrency})</Label>
                        <Input
                          type="number"
                          value={formData.limits.minBetAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: { ...formData.limits, minBetAmount: parseFloat(e.target.value) || 1 },
                            })
                          }
                          min="0"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <h3 className="font-semibold">Allowed Features</h3>
                    <p className="text-sm text-muted-foreground mb-4">Enable or disable features for this jurisdiction</p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base">Cashback</Label>
                          <p className="text-sm text-muted-foreground">Allow cashback promotions for players</p>
                        </div>
                        <Switch
                          checked={formData.featuresAllowed.cashbackEnabled}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              featuresAllowed: { ...formData.featuresAllowed, cashbackEnabled: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base">Bonuses</Label>
                          <p className="text-sm text-muted-foreground">Allow welcome bonuses and promotions</p>
                        </div>
                        <Switch
                          checked={formData.featuresAllowed.bonusesEnabled}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              featuresAllowed: { ...formData.featuresAllowed, bonusesEnabled: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base">Live Betting</Label>
                          <p className="text-sm text-muted-foreground">Allow in-play/live betting</p>
                        </div>
                        <Switch
                          checked={formData.featuresAllowed.liveBettingEnabled}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              featuresAllowed: { ...formData.featuresAllowed, liveBettingEnabled: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base">Casino Games</Label>
                          <p className="text-sm text-muted-foreground">Allow casino/slots games</p>
                        </div>
                        <Switch
                          checked={formData.featuresAllowed.casinoEnabled !== false}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              featuresAllowed: { ...formData.featuresAllowed, casinoEnabled: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base">Virtual Sports</Label>
                          <p className="text-sm text-muted-foreground">Allow virtual sports betting</p>
                        </div>
                        <Switch
                          checked={formData.featuresAllowed.virtualSportsEnabled !== false}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              featuresAllowed: { ...formData.featuresAllowed, virtualSportsEnabled: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
                        <div>
                          <Label className="text-base">Provider Locked</Label>
                          <p className="text-sm text-muted-foreground">Tenants cannot override these rules</p>
                        </div>
                        <Switch
                          checked={formData.providerLocked}
                          onCheckedChange={(checked) => setFormData({ ...formData, providerLocked: checked })}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button onClick={handleSave} className="flex-1" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {isEditing ? "Save Changes (New Version)" : "Create Rule"}
                      </>
                    )}
                  </Button>
                  {(isEditing || formData.countryCode) && (
                    <Button onClick={resetForm} variant="outline">
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
