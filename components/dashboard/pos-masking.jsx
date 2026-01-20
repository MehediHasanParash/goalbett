"use client"
import { useState, useEffect } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { Lock, Globe } from "lucide-react"

export function PosMasking() {
  const [settings, setSettings] = useState({
    enabled: false,
    countries: ["US", "UK", "CA", "AU"],
  })

  useEffect(() => {
    const saved = localStorage.getItem("posMaskingSettings")
    if (saved) setSettings(JSON.parse(saved))
  }, [])

  const toggleMasking = () => {
    const newSettings = { ...settings, enabled: !settings.enabled }
    setSettings(newSettings)
    localStorage.setItem("posMaskingSettings", JSON.stringify(newSettings))
  }

  return (
    <Card3D>
      <div className="glass p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-bold">POS Masking</h3>
              <p className="text-xs text-muted-foreground">Hide personal info in restricted countries</p>
            </div>
          </div>
          <button
            onClick={toggleMasking}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? "bg-green-500" : "bg-gray-500"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                settings.enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {settings.enabled && (
          <div className="space-y-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-400" />
              <p className="text-sm text-green-400">Active in countries: {settings.countries.join(", ")}</p>
            </div>
            <p className="text-xs text-green-400/80">
              Personal information is masked according to local regulations in these countries.
            </p>
          </div>
        )}
      </div>
    </Card3D>
  )
}
