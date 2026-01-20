"use client"
import { useState } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Save, RotateCcw, Globe, DollarSign, Percent } from "lucide-react"
import { UNIQUE_CURRENCY_OPTIONS } from "@/lib/currency-config"

export function SystemSettings() {
  const [settings, setSettings] = useState({
    siteName: "Casino Royal",
    currency: "USD",
    language: "en",
    minBet: "10",
    maxBet: "10000",
    commission: "5",
    timezone: "UTC",
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    setSettings({
      siteName: "Casino Royal",
      currency: "USD",
      language: "en",
      minBet: "10",
      maxBet: "10000",
      commission: "5",
      timezone: "UTC",
    })
  }

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5] p-6">
      <div className="max-w-4xl mx-auto mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">System Settings</h1>
          <p className="text-muted-foreground">Configure your betting platform</p>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-center animate-pulse">
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          <Card3D>
            <div className="glass p-6 rounded-2xl">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#FFD700]" />
                General Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Site Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] rounded-xl text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Default Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] rounded-xl text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Default Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] rounded-xl text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
                  >
                    {UNIQUE_CURRENCY_OPTIONS.map((curr) => (
                      <option key={curr.value} value={curr.value}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] rounded-xl text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST - Eastern Time</option>
                    <option value="PST">PST - Pacific Time</option>
                    <option value="IST">IST - Indian Standard Time</option>
                  </select>
                </div>
              </div>
            </div>
          </Card3D>

          <Card3D>
            <div className="glass p-6 rounded-2xl">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#FFD700]" />
                Betting Limits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Bet</label>
                  <input
                    type="number"
                    value={settings.minBet}
                    onChange={(e) => setSettings({ ...settings, minBet: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] rounded-xl text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Maximum Bet</label>
                  <input
                    type="number"
                    value={settings.maxBet}
                    onChange={(e) => setSettings({ ...settings, maxBet: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] rounded-xl text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
              </div>
            </div>
          </Card3D>

          <Card3D>
            <div className="glass p-6 rounded-2xl">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#FFD700]" />
                Commission Settings
              </h3>
              <div>
                <label className="block text-sm font-medium mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  value={settings.commission}
                  onChange={(e) => setSettings({ ...settings, commission: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1A2F45] border border-[#2A3F55] rounded-xl text-[#F5F5F5] focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>
          </Card3D>

          <div className="flex gap-4">
            <AnimatedButton variant="primary" className="flex-1 flex  bg-[#FFD700] text-[#0A1A2F]" onClick={handleSave}>
              <div className="flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                Save Settings
              </div>
            </AnimatedButton>
            <AnimatedButton
              variant="glass"
              className="flex items-center justify-center gap-2 px-6"
              onClick={handleReset}
            >
              <div className="flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Reset
              </div>
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  )
}
