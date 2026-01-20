"use client"
import { useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export function LanguageSelector({ variant = "dropdown" }) {
  const { locale, changeLanguage, languages, currentLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (variant === "modal") {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
          <input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5] placeholder-[#B8C5D6]/50 focus:outline-none focus:border-[#FFD700]"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                locale === lang.code
                  ? "bg-[#FFD700]/20 border border-[#FFD700]"
                  : "bg-[#1A2F45] border border-[#2A3F55] hover:border-[#FFD700]/50"
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{lang.nativeName}</div>
                <div className="text-xs text-[#B8C5D6]">{lang.name}</div>
              </div>
              {locale === lang.code && <Check className="w-4 h-4 text-[#FFD700]" />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg hover:border-[#FFD700]/50 transition-colors"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#0A1A2F] border border-[#2A3F55] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2 border-b border-[#2A3F55]">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                <input
                  type="text"
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-sm text-[#F5F5F5] placeholder-[#B8C5D6]/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code)
                    setIsOpen(false)
                    setSearchQuery("")
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-[#1A2F45] transition-colors ${
                    locale === lang.code ? "bg-[#FFD700]/10" : ""
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm">{lang.nativeName}</div>
                  </div>
                  {locale === lang.code && <Check className="w-4 h-4 text-[#FFD700]" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
