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
import { PlusCircle, Save, Edit, Copy, Trash2, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

const COUNTRY_LIST = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "ET", name: "Ethiopia" },
  { code: "KE", name: "Kenya" },
  { code: "NG", name: "Nigeria" },
  { code: "ZA", name: "South Africa" },
  { code: "GH", name: "Ghana" },
  { code: "UG", name: "Uganda" },
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

export default function JurisdictionRulesPage() {
  const [rules, setRules] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
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
    },
    providerLocked: false,
    changeReason: "",
  })

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/super/jurisdiction-rules")
      if (res.ok) {
        const data = await res.json()
        setRules(data)
      }
    } catch (error) {
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
      calculationBase: "gross_win",
      appliesTo: "player",
      applicationOrder: formData[type].length + 1,
      destinationAccount: type === "playerDeductions" ? "tax_payable" : "operator_revenue",
      rounding: "normal",
      description: "",
    }

    setFormData({
      ...formData,
      [type]: [...formData[type], newDeduction],
    })
  }

  const updateDeduction = (type, index, field, value) => {
    const updated = [...formData[type]]
    updated[index][field] = value
    setFormData({ ...formData, [type]: updated })
  }

  const removeDeduction = (type, index) => {
    const updated = formData[type].filter((_, i) => i !== index)
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

      const res = await fetch("/api/super/jurisdiction-rules", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ruleId: selectedRule?._id,
        }),
      })

      if (res.ok) {
        toast.success(`Rule ${isEditing ? "updated" : "created"} successfully`)
        fetchRules()
        resetForm()
      } else {
        const error = await res.json()
        toast.error(error.message || "Failed to save rule")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleEdit = (rule) => {
    setSelectedRule(rule)
    setFormData({
      countryCode: rule.countryCode,
      countryName: rule.countryName,
      profileName: rule.profileName,
      baseCurrency: rule.baseCurrency,
      status: rule.status,
      playerDeductions: rule.playerDeductions || [],
      operatorDeductions: rule.operatorDeductions || [],
      limits: rule.limits,
      featuresAllowed: rule.featuresAllowed,
      providerLocked: rule.providerLocked,
      changeReason: "",
    })
    setIsEditing(true)
  }

  const handleClone = (rule) => {
    setFormData({
      ...rule,
      countryCode: "",
      countryName: "",
      status: "draft",
      changeReason: "Cloned from " + rule.countryName,
    })
    setSelectedRule(null)
    setIsEditing(false)
  }

  const resetForm = () => {
    setSelectedRule(null)
    setIsEditing(false)
    setFormData({
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
      },
      providerLocked: false,
      changeReason: "",
    })
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
            <Button onClick={resetForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Rule
            </Button>
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
                <CardDescription>Select a rule to edit or clone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : rules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rules created yet</p>
                  ) : (
                    rules.map((rule) => (
                      <Card key={rule._id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {rule.countryName} ({rule.countryCode})
                            </h3>
                            <p className="text-xs text-muted-foreground">Profile: {rule.profileName}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant={rule.status === "active" ? "default" : "secondary"}>{rule.status}</Badge>
                              <Badge variant="outline">v{rule.version}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(rule)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleClone(rule)}>
                              <Copy className="h-3 w-3" />
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
                <CardTitle>{isEditing ? "Edit Rule" : "Create New Rule"}</CardTitle>
                <CardDescription>Configure financial rules for a jurisdiction</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="player">Player Deductions</TabsTrigger>
                    <TabsTrigger value="operator">Operator Deductions</TabsTrigger>
                    <TabsTrigger value="limits">Limits & Features</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select
                          value={formData.countryCode}
                          onValueChange={(value) => {
                            const country = COUNTRY_LIST.find((c) => c.code === value)
                            setFormData({
                              ...formData,
                              countryCode: value,
                              countryName: country?.name || "",
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_LIST.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name} ({country.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Profile Name</Label>
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
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Change Reason (Required for Active Status)</Label>
                      <Input
                        value={formData.changeReason}
                        onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                        placeholder="Describe why this rule is being created or modified"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="player" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Player-Side Deductions (Applied to Winnings)</h3>
                      <Button size="sm" onClick={() => addDeduction("playerDeductions")}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Deduction
                      </Button>
                    </div>

                    {formData.playerDeductions.map((deduction, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Type</Label>
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
                              onChange={(e) => updateDeduction("playerDeductions", index, "percentage", Number.parseFloat(e.target.value))}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Threshold</Label>
                            <Input
                              type="number"
                              value={deduction.threshold}
                              onChange={(e) => updateDeduction("playerDeductions", index, "threshold", Number.parseFloat(e.target.value))}
                              min="0"
                              placeholder="Apply only if win >= this"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Calculation Base</Label>
                            <Select
                              value={deduction.calculationBase}
                              onValueChange={(value) => updateDeduction("playerDeductions", index, "calculationBase", value)}
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
                            <Label>Application Order</Label>
                            <Input
                              type="number"
                              value={deduction.applicationOrder}
                              onChange={(e) => updateDeduction("playerDeductions", index, "applicationOrder", Number.parseInt(e.target.value))}
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
                              onChange={(e) => updateDeduction("playerDeductions", index, "description", e.target.value)}
                              placeholder="Explain this deduction"
                            />
                          </div>

                          <div className="col-span-3 flex justify-end">
                            <Button size="sm" variant="destructive" onClick={() => removeDeduction("playerDeductions", index)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="operator" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Operator-Side Deductions (Applied to GGR/Revenue)</h3>
                      <Button size="sm" onClick={() => addDeduction("operatorDeductions")}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Deduction
                      </Button>
                    </div>

                    {formData.operatorDeductions.map((deduction, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Type</Label>
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
                              onChange={(e) => updateDeduction("operatorDeductions", index, "percentage", Number.parseFloat(e.target.value))}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Calculation Base</Label>
                            <Select
                              value={deduction.calculationBase}
                              onValueChange={(value) => updateDeduction("operatorDeductions", index, "calculationBase", value)}
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

                          <div className="col-span-3 flex justify-end">
                            <Button size="sm" variant="destructive" onClick={() => removeDeduction("operatorDeductions", index)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="limits" className="space-y-4">
                    <h3 className="text-sm font-semibold">Betting Limits</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Win Per Bet</Label>
                        <Input
                          type="number"
                          value={formData.limits.maxWinPerBet || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: { ...formData.limits, maxWinPerBet: e.target.value ? Number.parseFloat(e.target.value) : null },
                            })
                          }
                          placeholder="No limit"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Win Per Day</Label>
                        <Input
                          type="number"
                          value={formData.limits.maxWinPerDay || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: { ...formData.limits, maxWinPerDay: e.target.value ? Number.parseFloat(e.target.value) : null },
                            })
                          }
                          placeholder="No limit"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Bet Amount</Label>
                        <Input
                          type="number"
                          value={formData.limits.maxBetAmount || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: { ...formData.limits, maxBetAmount: e.target.value ? Number.parseFloat(e.target.value) : null },
                            })
                          }
                          placeholder="No limit"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Min Bet Amount</Label>
                        <Input
                          type="number"
                          value={formData.limits.minBetAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limits: { ...formData.limits, minBetAmount: Number.parseFloat(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 mt-6">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? "Save Changes (Creates New Version)" : "Create Rule"}
                  </Button>
                  {isEditing && (
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
