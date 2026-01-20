"use client"

import { useState } from "react"
import { X, Upload } from "lucide-react"

export default function GamesSingleUploader({ onComplete, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    provider: "",
    category: "Slots",
    rtp: 95,
    volatility: "Medium",
    tags: "",
    launchUrl: "",
  })
  const [heroImage, setHeroImage] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: "" })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setHeroImage(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    const newErrors = {}

    if (!formData.title) newErrors.title = "Title required"
    if (!formData.provider) newErrors.provider = "Provider required"
    if (!heroImage) newErrors.heroImage = "Hero image required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsUploading(true)

    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newGame = {
      id: Date.now().toString(),
      ...formData,
      rtp: Number.parseFloat(formData.rtp),
      heroImage,
    }

    setIsUploading(false)
    onComplete(newGame)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Upload Single Game</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Game Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange("title")}
                  placeholder="Game title"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Provider</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={handleInputChange("provider")}
                  placeholder="Provider name"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                {errors.provider && <p className="text-xs text-destructive mt-1">{errors.provider}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={handleInputChange("category")}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option>Slots</option>
                  <option>Table Games</option>
                  <option>Live Casino</option>
                  <option>Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">RTP (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.rtp}
                  onChange={handleInputChange("rtp")}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Volatility</label>
                <select
                  value={formData.volatility}
                  onChange={handleInputChange("volatility")}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Launch URL</label>
              <input
                type="url"
                value={formData.launchUrl}
                onChange={handleInputChange("launchUrl")}
                placeholder="https://example.com/game"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={handleInputChange("tags")}
                placeholder="popular, new, favorite (comma-separated)"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Hero Image</h3>

            {heroImage ? (
              <div className="relative rounded-lg overflow-hidden border-2 border-secondary">
                <img src={heroImage || "/placeholder.svg"} alt="Hero" className="w-full h-48 object-cover" />
                <button
                  onClick={() => setHeroImage(null)}
                  className="absolute top-2 right-2 p-1 bg-destructive rounded hover:bg-destructive/80 transition-colors"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-secondary transition-colors">
                <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="font-semibold text-foreground mb-1">Click to upload</p>
                <p className="text-xs text-muted-foreground">PNG, JPG (1200x600 recommended)</p>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
            {errors.heroImage && <p className="text-xs text-destructive">{errors.heroImage}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Upload Game"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
