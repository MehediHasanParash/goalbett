"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Shield,
  DollarSign,
  Headphones,
  UserCog,
  Edit,
  Trash2,
  Eye,
  X,
  Check,
  Building2,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getAuthToken, getUser } from "@/lib/auth-service"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from "@/lib/staff-permissions"

const roleIcons = {
  finance_manager: DollarSign,
  general_manager: UserCog,
  support_manager: Headphones,
  support_agent: Headphones,
}

const roleColors = {
  finance_manager: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  general_manager: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  support_manager: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  support_agent: "bg-orange-500/20 text-orange-400 border-orange-500/50",
}

const staffRoles = [
  { value: "finance_manager", label: "Finance Manager" },
  { value: "general_manager", label: "General Manager" },
  { value: "support_manager", label: "Support Manager" },
  { value: "support_agent", label: "Support Agent" },
]

export default function SuperAdminStaffPage() {
  const router = useRouter()
  const [staff, setStaff] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedTenant, setSelectedTenant] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    tenantId: "",
    department: "",
    notes: "",
    permissions: {},
  })

  useEffect(() => {
    const user = getUser()
    setCurrentUser(user)
    fetchStaff()
  }, [selectedRole, selectedTenant])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const params = new URLSearchParams()
      if (selectedRole !== "all") params.append("role", selectedRole)
      if (selectedTenant !== "all") params.append("tenant", selectedTenant)

      const response = await fetch(`/api/super/staff?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setStaff(data.staff)
        setTenants(data.tenants || [])
      } else {
        toast.error(data.error || "Failed to fetch staff")
      }
    } catch (error) {
      toast.error("Failed to fetch staff")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = async () => {
    try {
      if (!formData.fullName || !formData.email || !formData.password || !formData.role || !formData.tenantId) {
        toast.error("Please fill in all required fields including tenant")
        return
      }

      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters")
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address")
        return
      }

      const token = getAuthToken()
      const response = await fetch("/api/super/staff", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        setShowCreateModal(false)
        resetForm()
        fetchStaff()
      } else {
        toast.error(data.error || "Failed to create staff")
      }
    } catch (error) {
      toast.error("Failed to create staff")
    }
  }

  const handleUpdateStaff = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/staff/${selectedStaff._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        setShowEditModal(false)
        resetForm()
        fetchStaff()
      } else {
        toast.error(data.error || "Failed to update staff")
      }
    } catch (error) {
      toast.error("Failed to update staff")
    }
  }

  const handleDeleteStaff = async (staffId) => {
    if (!confirm("Are you sure you want to deactivate this staff member?")) return

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/staff/${staffId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        fetchStaff()
      } else {
        toast.error(data.error || "Failed to deactivate staff")
      }
    } catch (error) {
      toast.error("Failed to deactivate staff")
    }
  }

  const handleToggleActive = async (staffMember) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/staff/${staffMember._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !staffMember.isActive }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Staff member ${staffMember.isActive ? "deactivated" : "activated"} successfully`)
        fetchStaff()
      } else {
        toast.error(data.error || "Failed to update staff status")
      }
    } catch (error) {
      toast.error("Failed to update staff status")
    }
  }

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "",
      tenantId: "",
      department: "",
      notes: "",
      permissions: {},
    })
    setSelectedStaff(null)
  }

  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember)
    setFormData({
      fullName: staffMember.fullName,
      email: staffMember.email,
      phone: staffMember.phone || "",
      password: "",
      role: staffMember.role,
      tenantId: staffMember.tenant_id?._id || staffMember.tenant_id || "",
      department: staffMember.staffMetadata?.department || "",
      notes: staffMember.staffMetadata?.notes || "",
      permissions: staffMember.permissions || {},
    })
    setShowEditModal(true)
  }

  const openViewModal = (staffMember) => {
    setSelectedStaff(staffMember)
    setShowViewModal(true)
  }

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const staffStats = {
    total: staff.length,
    active: staff.filter((s) => s.isActive).length,
    finance: staff.filter((s) => s.role === "finance_manager").length,
    gm: staff.filter((s) => s.role === "general_manager").length,
    support: staff.filter((s) => ["support_manager", "support_agent"].includes(s.role)).length,
  }

  const exportStaff = () => {
    const csvData = filteredStaff.map((s) => ({
      Name: s.fullName,
      Email: s.email,
      Role: ROLE_DISPLAY_NAMES[s.role] || s.role,
      Tenant: s.tenant_id?.name || "N/A",
      Status: s.isActive ? "Active" : "Inactive",
      Created: new Date(s.createdAt).toLocaleDateString(),
    }))

    const headers = Object.keys(csvData[0] || {})
    const csv = [headers.join(","), ...csvData.map((row) => headers.map((h) => `"${row[h]}"`).join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `staff-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Staff data exported successfully")
  }

  return (
    <SuperAdminLayout title="Staff Management" description="Create and manage staff roles across all tenants">
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchStaff()}
              variant="outline"
              size="sm"
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={exportStaff}
              variant="outline"
              size="sm"
              className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FFD700]/20 rounded-lg">
                  <Users className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{staffStats.total}</p>
                  <p className="text-xs text-[#B8C5D6]">Total Staff</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{staffStats.active}</p>
                  <p className="text-xs text-[#B8C5D6]">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{staffStats.finance}</p>
                  <p className="text-xs text-[#B8C5D6]">Finance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <UserCog className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{staffStats.gm}</p>
                  <p className="text-xs text-[#B8C5D6]">Managers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Headphones className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{staffStats.support}</p>
                  <p className="text-xs text-[#B8C5D6]">Support</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-white"
                />
              </div>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="w-full md:w-56 bg-[#1A2F45] border-[#2A3F55] text-white">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by tenant" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                  <SelectItem value="all">All Tenants</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant._id} value={tenant._id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full md:w-48 bg-[#1A2F45] border-[#2A3F55] text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                  <SelectItem value="all">All Roles</SelectItem>
                  {staffRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-white">Staff Members</CardTitle>
            <CardDescription className="text-[#B8C5D6]">
              {filteredStaff.length} staff member{filteredStaff.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-[#B8C5D6]">Loading...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[#2A3F55] mx-auto mb-3" />
                <p className="text-[#B8C5D6]">No staff members found</p>
                <Button onClick={() => setShowCreateModal(true)} className="mt-4 bg-[#FFD700] text-[#0A1A2F]">
                  Add Your First Staff Member
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStaff.map((staffMember) => {
                  const RoleIcon = roleIcons[staffMember.role] || Shield
                  return (
                    <div
                      key={staffMember._id}
                      className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55] hover:border-[#FFD700]/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                          <RoleIcon className="w-6 h-6 text-[#FFD700]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{staffMember.fullName}</h3>
                          <p className="text-sm text-[#B8C5D6]">{staffMember.email}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={`text-xs ${roleColors[staffMember.role]}`}>
                              {ROLE_DISPLAY_NAMES[staffMember.role] || staffMember.role}
                            </Badge>
                            <Badge className="bg-[#2A3F55] text-[#B8C5D6] border-[#2A3F55] text-xs">
                              <Building2 className="w-3 h-3 mr-1" />
                              {staffMember.tenant_id?.name || "No Tenant"}
                            </Badge>
                            {staffMember.isActive ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2">
                          <span className="text-xs text-[#B8C5D6]">Active</span>
                          <Switch
                            checked={staffMember.isActive}
                            onCheckedChange={() => handleToggleActive(staffMember)}
                          />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-[#B8C5D6]">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1A2F45] border-[#2A3F55]">
                            <DropdownMenuItem
                              onClick={() => openViewModal(staffMember)}
                              className="text-white hover:bg-[#2A3F55]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditModal(staffMember)}
                              className="text-white hover:bg-[#2A3F55]"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteStaff(staffMember._id)}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Staff Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Add New Staff Member</DialogTitle>
              <DialogDescription className="text-[#B8C5D6]">
                Create a new staff account and assign to a tenant
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="bg-[#1A2F45] border-[#2A3F55]">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="permissions">Permissions Info</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Full Name *</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Password *</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <p className="text-xs text-[#8A9DB0]">Minimum 6 characters</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Assign to Tenant *</Label>
                    <Select value={formData.tenantId} onValueChange={(v) => setFormData({ ...formData, tenantId: v })}>
                      <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-white">
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant._id} value={tenant._id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8C5D6]">Role *</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                      <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-white">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                        {staffRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.role && (
                  <div className="p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                    <h4 className="font-medium text-white mb-2">{ROLE_DISPLAY_NAMES[formData.role]} Permissions</h4>
                    <p className="text-sm text-[#B8C5D6] mb-3">{ROLE_DESCRIPTIONS[formData.role]}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLE_PERMISSIONS[formData.role]?.can?.map((perm, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-green-400">
                          <Check className="w-3 h-3" />
                          <span>{perm}</span>
                        </div>
                      ))}
                    </div>
                    {ROLE_PERMISSIONS[formData.role]?.cannot?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#2A3F55]">
                        <p className="text-xs text-[#B8C5D6] mb-2">Cannot:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {ROLE_PERMISSIONS[formData.role]?.cannot?.slice(0, 4).map((perm, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-red-400">
                              <X className="w-3 h-3" />
                              <span>{perm}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    placeholder="e.g., Finance, Operations, Support"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    placeholder="Additional notes about this staff member..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {staffRoles.map((role) => (
                    <div key={role.value} className="p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const Icon = roleIcons[role.value] || Shield
                          return <Icon className="w-5 h-5 text-[#FFD700]" />
                        })()}
                        <h4 className="font-medium text-white">{role.label}</h4>
                      </div>
                      <p className="text-sm text-[#B8C5D6] mb-3">{ROLE_DESCRIPTIONS[role.value]}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {ROLE_PERMISSIONS[role.value]?.can?.slice(0, 6).map((perm, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-green-400">
                            <Check className="w-3 h-3" />
                            <span>{perm}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="border-[#2A3F55] text-[#B8C5D6]"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateStaff} className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90">
                Create Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Staff Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Edit Staff Member</DialogTitle>
              <DialogDescription className="text-[#B8C5D6]">
                Update staff member details and permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Full Name *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">New Password (leave blank to keep current)</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Tenant</Label>
                  <Select value={formData.tenantId} onValueChange={(v) => setFormData({ ...formData, tenantId: v })}>
                    <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-white">
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant._id} value={tenant._id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#B8C5D6]">Role</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                    <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                      {staffRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-white"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  resetForm()
                }}
                className="border-[#2A3F55] text-[#B8C5D6]"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateStaff} className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Staff Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#FFD700]">Staff Details</DialogTitle>
            </DialogHeader>

            {selectedStaff && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                    {(() => {
                      const RoleIcon = roleIcons[selectedStaff.role] || Shield
                      return <RoleIcon className="w-8 h-8 text-[#FFD700]" />
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedStaff.fullName}</h3>
                    <p className="text-[#B8C5D6]">{selectedStaff.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${roleColors[selectedStaff.role]}`}>
                        {ROLE_DISPLAY_NAMES[selectedStaff.role]}
                      </Badge>
                      <Badge className="bg-[#2A3F55] text-[#B8C5D6] text-xs">
                        {selectedStaff.tenant_id?.name || "No Tenant"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-[#1A2F45] rounded-lg">
                  <div>
                    <p className="text-xs text-[#B8C5D6]">Phone</p>
                    <p className="text-white">{selectedStaff.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#B8C5D6]">Status</p>
                    <p className={selectedStaff.isActive ? "text-green-400" : "text-red-400"}>
                      {selectedStaff.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#B8C5D6]">Department</p>
                    <p className="text-white">{selectedStaff.staffMetadata?.department || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#B8C5D6]">Created</p>
                    <p className="text-white">{new Date(selectedStaff.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedStaff.staffMetadata?.notes && (
                  <div className="p-4 bg-[#1A2F45] rounded-lg">
                    <p className="text-xs text-[#B8C5D6] mb-1">Notes</p>
                    <p className="text-white text-sm">{selectedStaff.staffMetadata.notes}</p>
                  </div>
                )}

                <div className="p-4 bg-[#1A2F45] rounded-lg">
                  <p className="text-xs text-[#B8C5D6] mb-2">Permissions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_PERMISSIONS[selectedStaff.role]?.can?.slice(0, 8).map((perm, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-green-400">
                        <Check className="w-3 h-3" />
                        <span>{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setShowViewModal(false)} className="bg-[#2A3F55] text-white">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}
