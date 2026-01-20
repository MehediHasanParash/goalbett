"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Building2, Plus, Users, DollarSign, TrendingUp, Globe } from "lucide-react"

export default function ProviderDashboard() {
  const router = useRouter()
  const [tenants, setTenants] = useState([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    slug: "",
    logoUrl: "",
    primaryColor: "#0066FF",
    secondaryColor: "#FFD700",
    accentColor: "#4A90E2",
    customDomain: "",
    adminEmail: "",
    adminPassword: "",
    revenueSharePercentage: 10,
    currency: "USD",
    timezone: "UTC",
  })

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    console.log("[v0] [Provider Dashboard] Loading tenants...")
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch("/api/provider/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      console.log("[v0] [Provider Dashboard] Tenants loaded:", data.tenants?.length || 0)
      setTenants(data.tenants || [])
    } catch (error) {
      console.error("[v0] [Provider Dashboard] Error loading tenants:", error)
    }
  }

  const handleCreateTenant = async (e) => {
    e.preventDefault()
    console.log("[v0] [Provider Dashboard] Creating tenant with data:", formData)

    setIsLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch("/api/provider/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      console.log("[v0] [Provider Dashboard] Server response:", data)

      if (res.ok) {
        console.log("[v0] [Provider Dashboard] ✓ Tenant created successfully!")
        alert(
          `Tenant created successfully!\n\nAccess URL: ${data.tenant.accessUrl}\nAdmin Email: ${data.tenant.adminEmail}`,
        )
        setIsCreateDialogOpen(false)
        loadTenants()
        setFormData({
          companyName: "",
          slug: "",
          logoUrl: "",
          primaryColor: "#0066FF",
          secondaryColor: "#FFD700",
          accentColor: "#4A90E2",
          customDomain: "",
          adminEmail: "",
          adminPassword: "",
          revenueSharePercentage: 10,
          currency: "USD",
          timezone: "UTC",
        })
      } else {
        console.error("[v0] [Provider Dashboard] ✗ Error:", data.error)
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] [Provider Dashboard] ✗ Request failed:", error)
      alert("Failed to create tenant. Check console for details.")
    } finally {
      setIsLoading(false)
    }
  }

  const totalRevenue = tenants.reduce((sum, t) => sum + (t.stats?.totalRevenue || 0), 0)
  const totalProviderRevenue = tenants.reduce((sum, t) => sum + (t.stats?.totalProviderRevenue || 0), 0)
  const totalUsers = tenants.reduce((sum, t) => sum + (t.stats?.players || 0) + (t.stats?.agents || 0), 0)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">GoalBet Provider Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your white-label client tenants</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create New Tenant
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tenants</p>
                <p className="text-3xl font-bold text-foreground mt-2">{tenants.length}</p>
              </div>
              <Building2 className="h-12 w-12 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalUsers}</p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground mt-2">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Provider Revenue</p>
                <p className="text-3xl font-bold text-primary mt-2">${totalProviderRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-primary opacity-20" />
            </div>
          </Card>
        </div>

        {/* Tenants List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Client Tenants</h2>
          <div className="space-y-4">
            {tenants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>No client tenants yet. Create your first tenant to get started!</p>
              </div>
            ) : (
              tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: tenant.theme?.primaryColor || "#0066FF" }}
                    >
                      {tenant.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{tenant.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Slug: {tenant.slug}</span>
                        {tenant.domain && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {tenant.domain}
                          </span>
                        )}
                        <span>Revenue Share: {tenant.revenueShare?.providerPercentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Players</p>
                      <p className="text-lg font-bold">{tenant.stats?.players || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-lg font-bold text-primary">
                        ${(tenant.stats?.totalProviderRevenue || 0).toFixed(2)}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        tenant.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : tenant.status === "trial"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {tenant.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Create Tenant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Client Tenant</DialogTitle>
            <DialogDescription>Set up a new white-label betting platform for your client</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTenant} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="XBet Casino"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug * (lowercase, no spaces)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, "-") })}
                  placeholder="xbet"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="logoUrl">Logo URL (optional)</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#0066FF"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#FFD700"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    placeholder="#4A90E2"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="customDomain">Custom Domain (optional)</Label>
              <Input
                id="customDomain"
                value={formData.customDomain}
                onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                placeholder="xbet.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@xbet.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adminPassword">Admin Password *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="revenueShare">Revenue Share % (Provider)</Label>
                <Input
                  id="revenueShare"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.revenueSharePercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, revenueSharePercentage: Number.parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="USD"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="UTC"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
