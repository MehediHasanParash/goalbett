"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, Link, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function LogoUploader({ value, onChange, label = "Logo", className = "" }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState("upload")
  const [urlInput, setUrlInput] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setError("")
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.logoUrl) {
        onChange(data.logoUrl, data.publicId)
      } else {
        setError(data.error || "Upload failed")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      setError("Please enter a URL")
      return
    }

    try {
      new URL(urlInput)
    } catch {
      setError("Please enter a valid URL")
      return
    }

    setError("")
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("logoUrl", urlInput)

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.logoUrl) {
        onChange(data.logoUrl, null)
        setUrlInput("")
      } else {
        setError(data.error || "Failed to set URL")
      }
    } catch (err) {
      console.error("URL error:", err)
      setError("Failed to set logo URL")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange("", null)
    setUrlInput("")
    setError("")
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-[#B8C5D6]">{label}</Label>

      {value && (
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-lg border-2 border-[#2A3F55] overflow-hidden bg-[#1A2F45]">
            <Image
              src={value || "/placeholder.svg"}
              alt="Logo preview"
              width={96}
              height={96}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=96&width=96"
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!value && (
        <Tabs value={uploadMethod} onValueChange={setUploadMethod} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1A2F45] border border-[#2A3F55]">
            <TabsTrigger value="upload" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
              <Link className="w-4 h-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#2A3F55] rounded-lg p-6 text-center cursor-pointer hover:border-[#FFD700] transition-colors bg-[#1A2F45]/50"
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin mb-2" />
                  <p className="text-sm text-[#B8C5D6]">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-[#B8C5D6] mb-2" />
                  <p className="text-sm text-[#B8C5D6]">Click to upload or drag and drop</p>
                  <p className="text-xs text-[#B8C5D6]/60 mt-1">PNG, JPG, SVG up to 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-3">
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                disabled={isUploading}
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={isUploading || !urlInput.trim()}
                className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
