"use client"

import { useState, useEffect } from "react"
import { Check, Monitor, Save, RefreshCw, AlertCircle, CheckCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTenant } from "@/components/providers/tenant-provider"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"

function DesignManagementContent() {
  const { designId: currentTenantDesign, switchDesign, applyDesignTheme } = useTenant()
  const [selectedDesign, setSelectedDesign] = useState("classic")
  const [currentDesign, setCurrentDesign] = useState("classic")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [previewMode, setPreviewMode] = useState(null)

  const designs = [
    {
      id: "classic",
      name: "Classic",
      tagline: "Traditional Dark Sportsbook",
      description:
        "Dark blue theme with gold accents, sidebar navigation, card-based layout. Professional and trusted look.",
      colors: ["#FFD700", "#0A1A2F", "#1B2838", "#4A90E2"],
      features: ["Sidebar Navigation", "Card Layout", "Gold Accents", "Dark Theme"],
      gradient: "from-[#FFD700] via-[#0A1A2F] to-[#1B2838]",
    },
    {
      id: "modern",
      name: "Modern",
      tagline: "Light & Minimalist",
      description:
        "Clean light theme with purple gradients, bottom tab navigation, rounded cards. Mobile-first design.",
      colors: ["#8B5CF6", "#FFFFFF", "#F1F5F9", "#A78BFA"],
      features: ["Bottom Tabs", "Light Theme", "Rounded Cards", "Purple Accent"],
      gradient: "from-[#8B5CF6] via-[#FFFFFF] to-[#F1F5F9]",
    },
    {
      id: "neon",
      name: "Neon",
      tagline: "Cyberpunk Gaming",
      description: "Dark theme with neon green/cyan accents, glassmorphism effects. Perfect for gaming audiences.",
      colors: ["#00FF88", "#0A0A14", "#1A1A2E", "#00D4FF"],
      features: ["Top Navigation", "Glassmorphism", "Neon Effects", "Cyber Style"],
      gradient: "from-[#00FF88] via-[#0A0A14] to-[#00D4FF]",
    },
  ]

  useEffect(() => {
    if (currentTenantDesign) {
      setCurrentDesign(currentTenantDesign)
      setSelectedDesign(currentTenantDesign)
    }
  }, [currentTenantDesign])

  const handleMouseEnter = (designId) => {
    setPreviewMode(designId)
    applyDesignTheme(designId)
  }

  const handleMouseLeave = () => {
    setPreviewMode(null)
    applyDesignTheme(selectedDesign)
  }

  const handleSelectDesign = (designId) => {
    setSelectedDesign(designId)
    applyDesignTheme(designId)
  }

  const saveDesign = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const result = await switchDesign(selectedDesign)
      if (result.success) {
        setCurrentDesign(selectedDesign)
        setMessage({ type: "success", text: "Design updated successfully! All players will see the new theme." })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update design" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save design" })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-5xl">
      {/* Preview Mode Badge */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A2F45] rounded-full">
          <Sparkles className="w-4 h-4 text-[#FFD700]" />
          <span className="text-sm text-[#FFD700] font-medium">
            {previewMode ? `Previewing: ${previewMode}` : "Live Theme"}
          </span>
        </div>
      </div>

      {/* Current Design Status */}
      <Card className="bg-[#0D1F35] border-[#2A3F55] mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFD700]/20 rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-sm text-[#B8C5D6]">Current Active Design</p>
                <p className="font-semibold text-lg text-[#F5F5F5] capitalize">{currentDesign}</p>
              </div>
            </div>
            {selectedDesign !== currentDesign && (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Unsaved changes</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-500/20 border border-emerald-500/30"
              : "bg-red-500/20 border border-red-500/30"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={message.type === "success" ? "text-emerald-400" : "text-red-400"}>{message.text}</span>
        </div>
      )}

      {/* Design Options */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {designs.map((design) => (
          <div
            key={design.id}
            onClick={() => handleSelectDesign(design.id)}
            onMouseEnter={() => handleMouseEnter(design.id)}
            onMouseLeave={handleMouseLeave}
            className={`relative cursor-pointer transition-all duration-300 ${
              selectedDesign === design.id ? "scale-[1.02]" : "hover:scale-[1.01]"
            }`}
          >
            {selectedDesign === design.id && (
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl blur opacity-50 animate-pulse"></div>
            )}
            <Card
              className={`relative bg-[#0D1F35] border-2 transition-all duration-300 overflow-hidden ${
                selectedDesign === design.id
                  ? "border-[#FFD700] shadow-lg shadow-[#FFD700]/20"
                  : "border-[#2A3F55] hover:border-[#3A4F65]"
              }`}
            >
              {/* Color Preview */}
              <div className="h-28 relative overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${design.colors[0]} 0%, ${design.colors[1]} 50%, ${design.colors[2]} 100%)`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1F35] via-transparent to-transparent" />

                {/* Selection Badge */}
                {selectedDesign === design.id && (
                  <div className="absolute top-3 right-3 bg-[#FFD700] text-[#0A1A2F] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Check className="w-3.5 h-3.5" />
                    Selected
                  </div>
                )}
                {currentDesign === design.id && selectedDesign !== design.id && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    Active
                  </div>
                )}

                {/* Color Swatches */}
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {design.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-white/30 shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <CardContent className="p-5">
                <h3 className="text-xl font-bold mb-1 text-[#F5F5F5]">{design.name}</h3>
                <p className="text-sm text-[#FFD700] font-medium mb-2">{design.tagline}</p>
                <p className="text-xs text-[#B8C5D6] mb-4 leading-relaxed">{design.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {design.features.map((f, i) => (
                    <span key={i} className="text-[10px] bg-[#1A2F45] text-[#B8C5D6] px-2 py-1 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
        <div>
          <p className="font-semibold text-lg text-[#F5F5F5]">Ready to apply changes?</p>
          <p className="text-sm text-[#B8C5D6]">The new design will be applied to all players immediately</p>
        </div>
        <Button
          onClick={saveDesign}
          disabled={saving || selectedDesign === currentDesign}
          className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90 disabled:opacity-50 px-6 py-2.5 font-semibold"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Design
            </>
          )}
        </Button>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-[#1A2F45]/50 border border-[#2A3F55] rounded-xl p-5">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#F5F5F5]">
          <AlertCircle className="w-4 h-4 text-[#FFD700]" />
          How Theme System Works
        </h4>
        <ul className="text-sm text-[#B8C5D6] space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-[#FFD700]">•</span>
            <span>
              Design changes only affect visual appearance (colors, styles) - all data and functionality remains the
              same
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FFD700]">•</span>
            <span>Hover over a design to preview it instantly on this page</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FFD700]">•</span>
            <span>
              Click "Save Design" to apply the theme to all player pages (Homepage, Sports, Casino, Menu, etc.)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FFD700]">•</span>
            <span>Super Admins and Tenant Admins can change themes for their platform</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default function DesignManagementPage() {
  return (
    <SuperAdminLayout title="Design Management" description="Select the visual theme for your player-facing pages">
      <DesignManagementContent />
    </SuperAdminLayout>
  )
}
