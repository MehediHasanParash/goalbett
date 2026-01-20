"use client"
import { useState } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { BrandedButton } from "@/components/ui/branded-button"
import { Save, RotateCcw, AlertCircle, DollarSign, Percent } from "lucide-react"

export function FinancialSettings() {
  const [settings, setSettings] = useState({
    winLimit: {
      enabled: true,
      amount: 5000,
    },
    winTax: {
      enabled: true,
      percentage: 5,
    },
    tax: {
      enabled: true,
      percentage: 2,
    },
    charity: {
      enabled: true,
      percentage: 1,
    },
    cashback: {
      enabled: true,
      oneGameLoss: 5,
      twoGameLoss: 10,
      threeGameLoss: 15,
    },
  })

  const [saved, setSaved] = useState(false)

  const updateSetting = (path, value) => {
    const keys = path.split(".")
    setSettings((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev))
      let current = newSettings
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newSettings
    })
    setSaved(false)
  }

  const saveSettings = () => {
    localStorage.setItem("financialSettings", JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const resetSettings = () => {
    setSettings({
      winLimit: {
        enabled: true,
        amount: 5000,
      },
      winTax: {
        enabled: true,
        percentage: 5,
      },
      tax: {
        enabled: true,
        percentage: 2,
      },
      charity: {
        enabled: true,
        percentage: 1,
      },
      cashback: {
        enabled: true,
        oneGameLoss: 5,
        twoGameLoss: 10,
        threeGameLoss: 15,
      },
    })
    setSaved(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Financial Controls</h2>
        <p className="text-muted-foreground">Manage your betting limits, taxes, and rewards</p>
      </div>

      {/* Save Status */}
      {saved && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-center animate-pulse">
          Financial settings saved successfully!
        </div>
      )}

      {/* Win Limit */}
      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold">Win Limit</h3>
                <p className="text-xs text-muted-foreground">Maximum winnings per day</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting("winLimit.enabled", !settings.winLimit.enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.winLimit.enabled ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.winLimit.enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {settings.winLimit.enabled && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Limit Amount ($)</label>
                <input
                  type="number"
                  value={settings.winLimit.amount}
                  onChange={(e) => updateSetting("winLimit.amount", Number(e.target.value))}
                  className="mt-2 w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  min="0"
                  step="100"
                />
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-400">When you reach this limit, no more winnings will be credited.</p>
              </div>
            </div>
          )}
        </div>
      </Card3D>

      {/* Win Tax */}
      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold">Win Tax</h3>
                <p className="text-xs text-muted-foreground">Tax applied on winnings</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting("winTax.enabled", !settings.winTax.enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.winTax.enabled ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.winTax.enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {settings.winTax.enabled && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tax Percentage (%)</label>
                <input
                  type="number"
                  value={settings.winTax.percentage}
                  onChange={(e) => updateSetting("winTax.percentage", Number(e.target.value))}
                  className="mt-2 w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-400">
                  {settings.winTax.percentage}% of your winnings will be deducted as tax.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card3D>

      {/* Betting Tax */}
      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold">Betting Tax</h3>
                <p className="text-xs text-muted-foreground">Tax applied on each bet stake</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting("tax.enabled", !settings.tax.enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.tax.enabled ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.tax.enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {settings.tax.enabled && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tax Percentage (%)</label>
                <input
                  type="number"
                  value={settings.tax.percentage}
                  onChange={(e) => updateSetting("tax.percentage", Number(e.target.value))}
                  className="mt-2 w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-400">
                  {settings.tax.percentage}% of your bet stake will be collected as tax.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card3D>

      {/* Charity Contribution */}
      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold">Charity Contribution</h3>
                <p className="text-xs text-muted-foreground">% of winnings donated to charity</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting("charity.enabled", !settings.charity.enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.charity.enabled ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.charity.enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {settings.charity.enabled && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Charity Percentage (%)</label>
                <input
                  type="number"
                  value={settings.charity.percentage}
                  onChange={(e) => updateSetting("charity.percentage", Number(e.target.value))}
                  className="mt-2 w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">
                  {settings.charity.percentage}% of your winnings will be donated to charitable causes.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card3D>

      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold">Cashback on Losses</h3>
                <p className="text-xs text-muted-foreground">Get cash back when you lose bets</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting("cashback.enabled", !settings.cashback.enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.cashback.enabled ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.cashback.enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {settings.cashback.enabled && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Cashback on 1-Game Loss ($)</label>
                <input
                  type="number"
                  value={settings.cashback.oneGameLoss}
                  onChange={(e) => updateSetting("cashback.oneGameLoss", Number(e.target.value))}
                  className="mt-2 w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cashback on 2-Game Loss ($)</label>
                <input
                  type="number"
                  value={settings.cashback.twoGameLoss}
                  onChange={(e) => updateSetting("cashback.twoGameLoss", Number(e.target.value))}
                  className="mt-2 w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cashback on 3-Game Loss ($)</label>
                <input
                  type="number"
                  value={settings.cashback.threeGameLoss}
                  onChange={(e) => updateSetting("cashback.threeGameLoss", Number(e.target.value))}
                  className="mt-2 w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  min="0"
                  step="1"
                />
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-400">
                  Get ${settings.cashback.oneGameLoss} cash back on 1-game losses, ${settings.cashback.twoGameLoss} on
                  2-game losses, and ${settings.cashback.threeGameLoss} on 3-game losses.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card3D>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <BrandedButton
          variant="primary"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={saveSettings}
        >
          <Save className="w-5 h-5" />
          Save Settings
        </BrandedButton>
        <BrandedButton
          variant="secondary"
          className="flex items-center justify-center gap-2 px-6"
          onClick={resetSettings}
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </BrandedButton>
      </div>

      {/* Info Card */}
      <Card3D>
        <div className="glass p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          <h3 className="font-bold mb-2">Financial Control Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Set realistic win limits to manage your expectations</li>
            <li>• Monitor your taxes and contributions regularly</li>
            <li>• Cashback helps offset losses on multi-game bets</li>
            <li>• All settings apply to future bets only</li>
          </ul>
        </div>
      </Card3D>
    </div>
  )
}
