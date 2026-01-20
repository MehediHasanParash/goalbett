"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Edit2, Trash2, Save, RefreshCw, Database, Upload, X, ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import RoleProtectedLayout from "@/components/auth/role-protected-layout"
import { ROLES, getAuthToken } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SuperAdminSidebar } from "@/components/admin/super-admin-sidebar"
import Image from "next/image"

export default function SportsManagement() {
  const router = useRouter()
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSport, setEditingSport] = useState(null)
  const [seeding, setSeeding] = useState(false)
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
    order: 0,
    isActive: true,
    isFeatured: false,
    category: "sports",
  })

  useEffect(() => {
    fetchSports()
  }, [])

  const fetchSports = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/sports")
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        setSports(data.data)
      }
    } catch (error) {
      console.error("Error fetching sports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDatabase = async () => {
    if (!confirm("This will clear all existing sports and events. Continue?")) return

    try {
      setSeeding(true)
      const response = await fetch("/api/super/sports/seed", {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        alert(`Seeded ${data.data.sports} sports and ${data.data.events} events!`)
        fetchSports()
      }
    } catch (error) {
      console.error("Error seeding:", error)
      alert("Failed to seed database")
    } finally {
      setSeeding(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setIconFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveFile = () => {
    setIconFile(null)
    setIconPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadIcon = async () => {
    if (!iconFile) return formData.icon

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", iconFile)

      const response = await fetch("/api/upload/sport-icon", {
        method: "POST",
        body: uploadFormData,
      })

      const data = await response.json()
      if (data.success) {
        return data.iconUrl
      } else {
        throw new Error(data.error || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading icon:", error)
      alert("Failed to upload icon: " + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      let iconUrl = formData.icon
      if (iconFile) {
        iconUrl = await uploadIcon()
        if (!iconUrl) return // Upload failed
      }

      const token = getAuthToken()
      const url = editingSport ? `/api/super/sports/${editingSport._id}` : "/api/super/sports"
      const method = editingSport ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, icon: iconUrl }),
      })

      const data = await response.json()
      if (data.success) {
        setIsModalOpen(false)
        setEditingSport(null)
        fetchSports()
        resetForm()
      }
    } catch (error) {
      console.error("Error saving sport:", error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this sport?")) return

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/super/sports/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchSports()
      }
    } catch (error) {
      console.error("Error deleting sport:", error)
    }
  }

  const handleEdit = (sport) => {
    setEditingSport(sport)
    setFormData({
      name: sport.name,
      slug: sport.slug,
      icon: sport.icon,
      order: sport.order,
      isActive: sport.isActive,
      isFeatured: sport.isFeatured,
      category: sport.category,
    })
    setIconPreview(sport.icon)
    setIconFile(null)
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      icon: "",
      order: 0,
      isActive: true,
      isFeatured: false,
      category: "sports",
    })
    setIconFile(null)
    setIconPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <RoleProtectedLayout allowedRoles={[ROLES.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]">
        <SuperAdminSidebar />

        <div className="lg:ml-72">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#FFD700]">Sports Management</h1>
                <p className="text-[#B8C5D6] mt-2">Manage sports categories and settings</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {seeding ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Seed Database
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    resetForm()
                    setEditingSport(null)
                    setIsModalOpen(true)
                  }}
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sport
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-[#FFD700] mx-auto" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sports.map((sport) => (
                  <Card key={sport._id} className="bg-[#0D1F35] border-[#2A3F55]">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sport.icon && (
                            <div className="w-10 h-10 rounded-lg bg-[#1A2F45] flex items-center justify-center overflow-hidden">
                              <Image
                                src={sport.icon || "/placeholder.svg"}
                                alt={sport.name}
                                width={32}
                                height={32}
                                className="object-contain"
                              />
                            </div>
                          )}
                          <span className="text-[#F5F5F5]">{sport.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(sport)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(sport._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-[#B8C5D6]">
                          <span className="font-semibold">Slug:</span> {sport.slug}
                        </p>
                        <p className="text-sm text-[#B8C5D6]">
                          <span className="font-semibold">Category:</span> {sport.category}
                        </p>
                        <p className="text-sm text-[#B8C5D6]">
                          <span className="font-semibold">Order:</span> {sport.order}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Badge
                            className={sport.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                          >
                            {sport.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {sport.isFeatured && <Badge className="bg-[#FFD700]/20 text-[#FFD700]">Featured</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]">
                <DialogHeader>
                  <DialogTitle>{editingSport ? "Edit Sport" : "Add New Sport"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Soccer"
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>

                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="soccer"
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>

                  <div>
                    <Label>Sport Icon</Label>
                    <div className="mt-2 space-y-3">
                      {/* Icon Preview */}
                      {iconPreview ? (
                        <div className="relative w-24 h-24 rounded-lg border-2 border-[#2A3F55] bg-[#1A2F45] overflow-hidden">
                          <Image
                            src={iconPreview || "/placeholder.svg"}
                            alt="Icon preview"
                            fill
                            className="object-contain p-2"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-24 h-24 rounded-lg border-2 border-dashed border-[#2A3F55] bg-[#1A2F45] flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700] transition-colors"
                        >
                          <ImageIcon className="w-8 h-8 text-[#B8C5D6]" />
                          <span className="text-xs text-[#B8C5D6] mt-1">Upload</span>
                        </div>
                      )}

                      {/* File input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {/* Upload button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#B8C5D6] hover:text-[#F5F5F5]"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {iconPreview ? "Change Icon" : "Upload Icon"}
                      </Button>

                      {iconFile && <p className="text-xs text-[#B8C5D6]">Selected: {iconFile.name}</p>}
                    </div>
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="esports">Esports</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="casino">Casino</SelectItem>
                        <SelectItem value="racing">Racing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number.parseInt(e.target.value) })}
                      className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Active</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Featured</span>
                    </label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  )
}
