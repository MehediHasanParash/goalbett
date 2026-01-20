"use client"
import { useState, useEffect } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { Save, RotateCcw } from "lucide-react"
import { SUPPORTED_LANGUAGES } from "@/lib/currency-config"

const DISPLAY_CURRENCIES = [
  // Fiat currencies from pasted-text.txt
  { code: "USD", symbol: "$", name: "United States Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "Sh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "₵", name: "Ghana Cedi" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "UGX", symbol: "Sh", name: "Ugandan Shilling" },
  { code: "TZS", symbol: "Sh", name: "Tanzanian Shilling" },
  { code: "ETB", symbol: "Br", name: "Ethiopian Birr" },
  { code: "ERN", symbol: "Nfk", name: "Eritrean Nakfa" },
  { code: "RWF", symbol: "Fr", name: "Rwandan Franc" },
  { code: "BIF", symbol: "Fr", name: "Burundian Franc" },
  { code: "MWK", symbol: "MK", name: "Malawian Kwacha" },
  { code: "ZMW", symbol: "ZK", name: "Zambian Kwacha" },
  { code: "AOA", symbol: "Kz", name: "Angolan Kwanza" },
  { code: "MZN", symbol: "MT", name: "Mozambican Metical" },
  { code: "XOF", symbol: "Fr", name: "West African CFA Franc" },
  { code: "XAF", symbol: "Fr", name: "Central African CFA Franc" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
  { code: "EGP", symbol: "£", name: "Egyptian Pound" },
  { code: "DZD", symbol: "د.ج", name: "Algerian Dinar" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  // Cryptocurrencies
  { code: "USDT", symbol: "₮", name: "USDT (TRC20/ERC20)" },
  { code: "BTC", symbol: "₿", name: "Bitcoin" },
  { code: "ETH", symbol: "Ξ", name: "Ethereum" },
]

export function CurrencySettings() {
  const [settings, setSettings] = useState({
    currency: "USD",
    language: "en",
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("currencySettings")
    if (saved) setSettings(JSON.parse(saved))
  }, [])

  const languages = SUPPORTED_LANGUAGES

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const saveSettings = () => {
    localStorage.setItem("currencySettings", JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const resetSettings = () => {
    setSettings({ currency: "USD", language: "en" })
    setSaved(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Language & Currency Settings</h2>
        <p className="text-muted-foreground">Select your preferred language and currency</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-center animate-pulse">
          Settings saved successfully!
        </div>
      )}

      {/* Language Selection */}
      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-bold mb-4">Select Language</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => updateSetting("language", lang.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  settings.language === lang.value
                    ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]"
                    : "bg-[#1A2F45] border-[#2A3F55] text-[#B8C5D6] hover:border-[#FFD700]/50"
                }`}
              >
                <div className="font-bold text-sm">{lang.label}</div>
              </button>
            ))}
          </div>
        </div>
      </Card3D>

      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-bold mb-4">Select Currency</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {DISPLAY_CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                onClick={() => updateSetting("currency", curr.code)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  settings.currency === curr.code
                    ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]"
                    : "bg-[#1A2F45] border-[#2A3F55] text-[#B8C5D6] hover:border-[#FFD700]/50"
                }`}
              >
                <div className="font-bold text-lg">{curr.symbol}</div>
                <div className="text-xs">{curr.code}</div>
                <div className="text-xs truncate">{curr.name}</div>
              </button>
            ))}
          </div>
        </div>
      </Card3D>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={saveSettings}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD700] text-[#0A1A2F] rounded-lg hover:bg-[#FFD700]/90 font-bold transition-colors"
        >
          <Save className="w-5 h-5" />
          Save
        </button>
        <button
          onClick={resetSettings}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1A2F45] text-[#B8C5D6] rounded-lg hover:bg-[#FFD700]/50 font-bold transition-colors border border-[#2A3F55]"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>
    </div>
  )
}
