"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Globe,
  Shield,
  ShieldOff,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Upload,
  Filter,
  User,
  Network,
  Eye,
  Power,
  Info,
} from "lucide-react"
import { toast } from "sonner"

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌍"
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt())
  return String.fromCodePoint(...codePoints)
}

export default function GeoAccessPage() {
  const [activeTab, setActiveTab] = useState("countries")
  const [countries, setCountries] = useState([])
  const [exceptions, setExceptions] = useState([])
  const [logs, setLogs] = useState([])
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const [globalSettings, setGlobalSettings] = useState({
    enabled: false,
    mode: "blacklist",
    defaultAction: "ALLOW",
    blockMessage: "This service is not available in your country.",
  })
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Modal states
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [showExceptionModal, setShowExceptionModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [testIp, setTestIp] = useState("")
  const [testResult, setTestResult] = useState(null)

  // Exception form
  const [exceptionForm, setExceptionForm] = useState({
    type: "ACCOUNT",
    accountEmail: "",
    ipOrCidr: "",
    countryCode: "",
    status: "ALLOW",
    startsAt: "",
    endsAt: "",
    note: "",
  })

  // Bulk import
  const [bulkCountries, setBulkCountries] = useState("")
  const [bulkStatus, setBulkStatus] = useState("BLOCK")

  useEffect(() => {
    fetchGlobalSettings()
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchGlobalSettings = async () => {
    const token = localStorage.getItem("auth_token")
    try {
      const res = await fetch("/api/super/platform-settings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.settings?.geoBlocking) {
        setGlobalSettings(data.settings.geoBlocking)
      }
    } catch (error) {
      console.error("Failed to fetch global settings:", error)
    }
  }

  const toggleGeoBlocking = async (enabled) => {
    setSettingsLoading(true)
    const token = localStorage.getItem("auth_token")

    try {
      const res = await fetch("/api/super/platform-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: "geoBlocking",
          updates: { ...globalSettings, enabled },
        }),
      })

      const data = await res.json()
      if (data.success) {
        setGlobalSettings((prev) => ({ ...prev, enabled }))
        toast.success(enabled ? "Geo Blocking ENABLED for all tenants" : "Geo Blocking DISABLED for all tenants")
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to update settings")
    } finally {
      setSettingsLoading(false)
    }
  }

  const updateGlobalSettings = async (updates) => {
    setSettingsLoading(true)
    const token = localStorage.getItem("auth_token")

    try {
      const res = await fetch("/api/super/platform-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: "geoBlocking",
          updates: { ...globalSettings, ...updates },
        }),
      })

      const data = await res.json()
      if (data.success) {
        setGlobalSettings((prev) => ({ ...prev, ...updates }))
        toast.success("Settings updated")
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to update settings")
    } finally {
      setSettingsLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    const token = localStorage.getItem("auth_token")

    try {
      if (activeTab === "countries") {
        const res = await fetch("/api/super/geo-access/countries", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setCountries(data.countries)
          setStats(data.stats)
        }
      } else if (activeTab === "exceptions") {
        const res = await fetch("/api/super/geo-access/exceptions", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setExceptions(data.exceptions)
        }
      } else if (activeTab === "logs") {
        const res = await fetch("/api/super/geo-access/logs", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setLogs(data.logs)
          setStats(data.stats)
        }
      } else if (activeTab === "history") {
        const res = await fetch("/api/super/geo-access/logs?type=history", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setHistory(data.logs)
        }
      }
    } catch (error) {
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const updateCountryRule = async (country, updates) => {
    const token = localStorage.getItem("auth_token")

    try {
      const res = await fetch("/api/super/geo-access/countries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          countryCode: country.countryCode,
          countryName: country.countryName,
          ...country,
          ...updates,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`${country.countryName} rule updated`)
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to update rule")
    }
  }

  const handleBulkImport = async () => {
    const token = localStorage.getItem("auth_token")
    const codes = bulkCountries
      .split(/[\n,]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length === 2)

    if (codes.length === 0) {
      toast.error("No valid country codes found")
      return
    }

    try {
      const res = await fetch("/api/super/geo-access/countries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          countryCodes: codes,
          status: bulkStatus,
          reason: `Bulk import: ${bulkStatus}`,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Updated ${data.updated} countries`)
        setShowBulkModal(false)
        setBulkCountries("")
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to bulk update")
    }
  }

  const createException = async () => {
    const token = localStorage.getItem("auth_token")

    try {
      const res = await fetch("/api/super/geo-access/exceptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(exceptionForm),
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Exception created")
        setShowExceptionModal(false)
        setExceptionForm({
          type: "ACCOUNT",
          accountEmail: "",
          ipOrCidr: "",
          countryCode: "",
          status: "ALLOW",
          startsAt: "",
          endsAt: "",
          note: "",
        })
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to create exception")
    }
  }

  const deleteException = async (id) => {
    const token = localStorage.getItem("auth_token")

    try {
      const res = await fetch(`/api/super/geo-access/exceptions?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Exception deleted")
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to delete exception")
    }
  }

  const testIpAccess = async () => {
    const token = localStorage.getItem("auth_token")

    try {
      const res = await fetch("/api/super/geo-access/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ip: testIp }),
      })

      const data = await res.json()
      if (data.success) {
        setTestResult(data)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to test IP")
    }
  }

  const filteredCountries = countries.filter((c) => {
    const matchesSearch =
      c.countryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.countryCode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "blocked" && c.status === "BLOCK" && c.enabled) ||
      (filterStatus === "allowed" && (c.status === "ALLOW" || !c.enabled))
    return matchesSearch && matchesFilter
  })

  return (
    <SuperAdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Geo Access Control</h1>
            <p className="text-muted-foreground">Manage country-based access rules for tenant player portals</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTestModal(true)}>
              <Search className="w-4 h-4 mr-2" />
              Test IP
            </Button>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card
          className={`border-2 ${globalSettings.enabled ? "border-green-500 bg-green-500/5" : "border-amber-500 bg-amber-500/5"}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${globalSettings.enabled ? "bg-green-500/20" : "bg-amber-500/20"}`}>
                  <Power className={`w-8 h-8 ${globalSettings.enabled ? "text-green-500" : "text-amber-500"}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    Geo Blocking Master Switch
                    {globalSettings.enabled ? (
                      <Badge className="bg-green-500">ACTIVE</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500">
                        INACTIVE
                      </Badge>
                    )}
                  </h2>
                  <p className="text-muted-foreground">
                    {globalSettings.enabled
                      ? "Geo blocking is active. Players from blocked countries cannot access tenant portals."
                      : "Geo blocking is disabled. All countries can access tenant portals."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium">
                    {globalSettings.enabled ? "Disable" : "Enable"} Geo Blocking
                  </span>
                  <span className="text-xs text-muted-foreground">Applies to all tenant player portals</span>
                </div>
                <Switch
                  checked={globalSettings.enabled}
                  onCheckedChange={toggleGeoBlocking}
                  disabled={settingsLoading}
                  className="scale-125"
                />
              </div>
            </div>

            {globalSettings.enabled && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Mode</Label>
                  <Select value={globalSettings.mode} onValueChange={(value) => updateGlobalSettings({ mode: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blacklist">Blacklist (Block specific countries)</SelectItem>
                      <SelectItem value="whitelist">Whitelist (Allow only specific countries)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Default Action</Label>
                  <Select
                    value={globalSettings.defaultAction}
                    onValueChange={(value) => updateGlobalSettings({ defaultAction: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALLOW">Allow (if no rule)</SelectItem>
                      <SelectItem value="BLOCK">Block (if no rule)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Block Message</Label>
                  <Input
                    value={globalSettings.blockMessage}
                    onChange={(e) => setGlobalSettings((prev) => ({ ...prev, blockMessage: e.target.value }))}
                    onBlur={() => updateGlobalSettings({ blockMessage: globalSettings.blockMessage })}
                    className="mt-1"
                    placeholder="Message shown to blocked users"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!globalSettings.enabled && (
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-500">Geo Blocking is Currently Disabled</p>
              <p className="text-sm text-muted-foreground mt-1">
                Country rules below are saved but not enforced. Enable the master switch above to start blocking players
                from restricted countries on tenant portals (goalbett.com, etc.). This does NOT affect the Super Admin
                portal (betengin.com).
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Countries</p>
                  <p className="text-2xl font-bold">{stats.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <ShieldOff className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blocked Countries</p>
                  <p className="text-2xl font-bold text-destructive">{stats.blocked || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Allowed Countries</p>
                  <p className="text-2xl font-bold text-green-500">{stats.allowed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blocked Today</p>
                  <p className="text-2xl font-bold text-amber-500">{stats.blockedToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted">
            <TabsTrigger value="countries">Country Rules</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="logs">Access Logs</TabsTrigger>
            <TabsTrigger value="history">Audit History</TabsTrigger>
          </TabsList>

          {/* Country Rules Tab */}
          <TabsContent value="countries" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Country Access Rules</CardTitle>
                    <CardDescription>
                      Toggle access for each country (applies to tenant player portals only)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowBulkModal(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search countries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="blocked">Blocked Only</SelectItem>
                      <SelectItem value="allowed">Allowed Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border border-border max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Block Signup</TableHead>
                        <TableHead>Block Deposits</TableHead>
                        <TableHead>Block Betting</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : filteredCountries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No countries found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCountries.map((country) => (
                          <TableRow key={country.countryCode}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getFlagEmoji(country.countryCode)}</span>
                                <div>
                                  <p className="font-medium">{country.countryName}</p>
                                  <p className="text-xs text-muted-foreground">{country.countryCode}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={country.status === "BLOCK" && country.enabled}
                                onCheckedChange={(checked) =>
                                  updateCountryRule(country, {
                                    status: checked ? "BLOCK" : "ALLOW",
                                    enabled: true,
                                  })
                                }
                              />
                              <span className="ml-2 text-sm">
                                {country.status === "BLOCK" && country.enabled ? (
                                  <Badge variant="destructive">Blocked</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-green-500 border-green-500">
                                    Allowed
                                  </Badge>
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={country.blockSignup}
                                disabled={country.status !== "BLOCK"}
                                onCheckedChange={(checked) => updateCountryRule(country, { blockSignup: checked })}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={country.blockDeposits}
                                disabled={country.status !== "BLOCK"}
                                onCheckedChange={(checked) => updateCountryRule(country, { blockDeposits: checked })}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={country.blockBetting}
                                disabled={country.status !== "BLOCK"}
                                onCheckedChange={(checked) => updateCountryRule(country, { blockBetting: checked })}
                              />
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                                {country.reason || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCountry(country)
                                  setShowCountryModal(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exceptions Tab */}
          <TabsContent value="exceptions" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Access Exceptions</CardTitle>
                    <CardDescription>Override country rules for specific accounts or IPs</CardDescription>
                  </div>
                  <Button onClick={() => setShowExceptionModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exception
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : exceptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No exceptions configured
                          </TableCell>
                        </TableRow>
                      ) : (
                        exceptions.map((exception) => (
                          <TableRow key={exception._id}>
                            <TableCell>
                              <Badge variant="outline">
                                {exception.type === "ACCOUNT" ? (
                                  <>
                                    <User className="w-3 h-3 mr-1" /> Account
                                  </>
                                ) : (
                                  <>
                                    <Network className="w-3 h-3 mr-1" /> IP/CIDR
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {exception.type === "ACCOUNT" ? exception.accountEmail : exception.ipOrCidr}
                            </TableCell>
                            <TableCell>
                              {exception.countryCode ? (
                                <span className="flex items-center gap-1">
                                  {getFlagEmoji(exception.countryCode)} {exception.countryCode}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">All</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {exception.status === "ALLOW" ? (
                                <Badge className="bg-green-500">Allow</Badge>
                              ) : (
                                <Badge variant="destructive">Block</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {exception.endsAt ? (
                                new Date(exception.endsAt).toLocaleDateString()
                              ) : (
                                <span className="text-muted-foreground">Forever</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                                {exception.note || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteException(exception._id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Recent Access Logs</CardTitle>
                <CardDescription>Recent geo-based access decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Path</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No access logs yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log, index) => (
                          <TableRow key={log._id || index}>
                            <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
                            <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                {getFlagEmoji(log.countryCode)} {log.countryCode}
                              </span>
                            </TableCell>
                            <TableCell>
                              {log.action === "ALLOW" ? (
                                <Badge variant="outline" className="text-green-500 border-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Allowed
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" /> Blocked
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{log.reason || "-"}</TableCell>
                            <TableCell className="text-sm font-mono">{log.path || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Rule Change History</CardTitle>
                <CardDescription>Audit trail of country rule changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Changed By</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No history yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        history.map((item, index) => (
                          <TableRow key={item._id || index}>
                            <TableCell className="text-sm">{new Date(item.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                {getFlagEmoji(item.countryCode)} {item.countryCode}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.newStatus === "BLOCK" ? "destructive" : "outline"}>
                                {item.previousStatus} → {item.newStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{item.changedBy?.email || "System"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.reason || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test IP Modal */}
        <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test IP Access</DialogTitle>
              <DialogDescription>Check if an IP address would be allowed or blocked</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>IP Address</Label>
                <Input placeholder="e.g., 8.8.8.8" value={testIp} onChange={(e) => setTestIp(e.target.value)} />
              </div>
              {testResult && (
                <div
                  className={`p-4 rounded-lg ${testResult.allowed ? "bg-green-500/10 border border-green-500" : "bg-destructive/10 border border-destructive"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.allowed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span className="font-medium">{testResult.allowed ? "Access Allowed" : "Access Blocked"}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      Country: {getFlagEmoji(testResult.countryCode)} {testResult.countryCode} ({testResult.countryName}
                      )
                    </p>
                    <p>Reason: {testResult.reason}</p>
                    {testResult.exception && <p>Exception Applied: Yes</p>}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTestModal(false)}>
                Close
              </Button>
              <Button onClick={testIpAccess}>Test Access</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Exception Modal */}
        <Dialog open={showExceptionModal} onOpenChange={setShowExceptionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Access Exception</DialogTitle>
              <DialogDescription>Create an override for country rules</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Exception Type</Label>
                <Select
                  value={exceptionForm.type}
                  onValueChange={(value) => setExceptionForm((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCOUNT">Account (Email)</SelectItem>
                    <SelectItem value="IP">IP Address</SelectItem>
                    <SelectItem value="CIDR">CIDR Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exceptionForm.type === "ACCOUNT" ? (
                <div>
                  <Label>Account Email</Label>
                  <Input
                    placeholder="user@example.com"
                    value={exceptionForm.accountEmail}
                    onChange={(e) => setExceptionForm((prev) => ({ ...prev, accountEmail: e.target.value }))}
                  />
                </div>
              ) : (
                <div>
                  <Label>{exceptionForm.type === "CIDR" ? "CIDR Range" : "IP Address"}</Label>
                  <Input
                    placeholder={exceptionForm.type === "CIDR" ? "192.168.0.0/24" : "192.168.1.1"}
                    value={exceptionForm.ipOrCidr}
                    onChange={(e) => setExceptionForm((prev) => ({ ...prev, ipOrCidr: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label>Country Code (optional)</Label>
                <Input
                  placeholder="US, GB, etc. (leave empty for all)"
                  value={exceptionForm.countryCode}
                  onChange={(e) => setExceptionForm((prev) => ({ ...prev, countryCode: e.target.value.toUpperCase() }))}
                  maxLength={2}
                />
              </div>

              <div>
                <Label>Action</Label>
                <Select
                  value={exceptionForm.status}
                  onValueChange={(value) => setExceptionForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOW">Allow Access</SelectItem>
                    <SelectItem value="BLOCK">Block Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valid Until (optional)</Label>
                <Input
                  type="date"
                  value={exceptionForm.endsAt}
                  onChange={(e) => setExceptionForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                />
              </div>

              <div>
                <Label>Note</Label>
                <Textarea
                  placeholder="Reason for this exception..."
                  value={exceptionForm.note}
                  onChange={(e) => setExceptionForm((prev) => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExceptionModal(false)}>
                Cancel
              </Button>
              <Button onClick={createException}>Create Exception</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Modal */}
        <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Import Countries</DialogTitle>
              <DialogDescription>Add multiple country codes at once</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Country Codes</Label>
                <Textarea
                  placeholder="Enter country codes separated by commas or new lines:
US, GB, DE
FR
IT"
                  value={bulkCountries}
                  onChange={(e) => setBulkCountries(e.target.value)}
                  rows={6}
                />
              </div>
              <div>
                <Label>Action</Label>
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BLOCK">Block All Listed</SelectItem>
                    <SelectItem value="ALLOW">Allow All Listed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkImport}>Import</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Country Details Modal */}
        <Dialog open={showCountryModal} onOpenChange={setShowCountryModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCountry && (
                  <span className="flex items-center gap-2">
                    {getFlagEmoji(selectedCountry.countryCode)} {selectedCountry.countryName}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>Country access rule details</DialogDescription>
            </DialogHeader>
            {selectedCountry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="font-medium">
                      {selectedCountry.status === "BLOCK" && selectedCountry.enabled ? "Blocked" : "Allowed"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Country Code</Label>
                    <p className="font-medium">{selectedCountry.countryCode}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Block Signup</Label>
                    <p className="font-medium">{selectedCountry.blockSignup ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Block Deposits</Label>
                    <p className="font-medium">{selectedCountry.blockDeposits ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Block Betting</Label>
                    <p className="font-medium">{selectedCountry.blockBetting ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Modified</Label>
                    <p className="font-medium">
                      {selectedCountry.updatedAt ? new Date(selectedCountry.updatedAt).toLocaleString() : "Never"}
                    </p>
                  </div>
                </div>
                {selectedCountry.reason && (
                  <div>
                    <Label className="text-muted-foreground">Reason</Label>
                    <p className="text-sm">{selectedCountry.reason}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCountryModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}
