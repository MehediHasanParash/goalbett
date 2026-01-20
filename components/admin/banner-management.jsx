"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export { BannerManagement }
export default BannerManagement

function BannerManagement({ isSuperAdmin = false }) {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    buttonText: "",
    link: "",
    linkType: "betting",
    type: "hero",
    size: "large",
    position: 0,
    isActive: true,
  })

  const apiEndpoint = isSuperAdmin ? "/api/super/banners" : "/api/admin/banners"

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const response = await fetch(apiEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        setBanners(result.data)
      }
    } catch (error) {
      console.error("Fetch banners error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = getAuthToken()
      const url = editingBanner ? `${apiEndpoint}/${editingBanner._id}` : apiEndpoint
      const method = editingBanner ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (result.success) {
        alert(editingBanner ? "Banner updated successfully!" : "Banner created successfully!")
        setShowModal(false)
        resetForm()
        fetchBanners()
      } else {
        alert(result.error || "Failed to save banner")
      }
    } catch (error) {
      console.error("Save banner error:", error)
      alert("Failed to save banner")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return

    try {
      const token = getAuthToken()
      const response = await fetch(`${apiEndpoint}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        alert("Banner deleted successfully!")
        fetchBanners()
      } else {
        alert(result.error || "Failed to delete banner")
      }
    } catch (error) {
      console.error("Delete banner error:", error)
      alert("Failed to delete banner")
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      description: banner.description || "",
      imageUrl: banner.imageUrl,
      buttonText: banner.buttonText || "",
      link: banner.link || "",
      linkType: banner.linkType || "betting",
      type: banner.type || "hero",
      size: banner.size || "large",
      position: banner.position || 0,
      isActive: banner.isActive || true,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingBanner(null)
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      buttonText: "",
      link: "",
      linkType: "betting",
      type: "hero",
      size: "large",
      position: 0,
      isActive: true,
    })
  }

  const handleOpenModal = () => {
    resetForm()
    setShowModal(true)
  }

  if (loading) {
    return <div className="p-6 text-center">Loading banners...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{isSuperAdmin ? "Platform Banners" : "Tenant Banners"}</h2>
          <p className="text-muted-foreground">
            Manage hero carousel banners for the {isSuperAdmin ? "entire platform" : "your tenant"}
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      <div className="grid gap-4">
        {banners.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No banners yet. Create your first banner to get started.
          </Card>
        ) : (
          banners.map((banner) => (
            <Card key={banner._id} className="p-4">
              <div className="flex gap-4">
                <img
                  src={banner.imageUrl || "/placeholder.svg"}
                  alt={banner.title}
                  className="w-32 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{banner.title}</h3>
                      <p className="text-sm text-muted-foreground">{banner.description}</p>
                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 bg-muted rounded">Size: {banner.size}</span>
                        <span className="px-2 py-1 bg-muted rounded">Type: {banner.linkType}</span>
                        <span className="px-2 py-1 bg-muted rounded">Position: {banner.position}</span>
                        {banner.isActive ? (
                          <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(banner._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Create New Banner"}</DialogTitle>
            <DialogDescription>
              Configure the banner settings. Use image URLs for the banner background.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL *</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/banner-image.jpg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buttonText">Button Text</Label>
                <Input
                  id="buttonText"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkType">Link Type</Label>
                <Select value={formData.linkType} onValueChange={(val) => setFormData({ ...formData, linkType: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="betting">Betting</SelectItem>
                    <SelectItem value="casino">Casino</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link URL *</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="/sports or /casino or custom URL"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Banner Size</Label>
                <Select value={formData.size} onValueChange={(val) => setFormData({ ...formData, size: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position Order</Label>
                <Input
                  id="position"
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={formData.isActive ? "active" : "inactive"}
                  onValueChange={(val) => setFormData({ ...formData, isActive: val === "active" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingBanner ? "Update Banner" : "Create Banner"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
