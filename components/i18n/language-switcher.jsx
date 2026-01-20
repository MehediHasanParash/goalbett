"use client"

import { useState } from "react"
import { Globe, Check, X } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export default function LanguageSwitcher({ onClose }) {
  const [isOpen, setIsOpen] = useState(!onClose) // If onClose is provided, start open
  const { locale, changeLanguage, languages, t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLanguages =
    languages?.filter(
      (lang) =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  const handleLocaleChange = (code) => {
    changeLanguage(code)
    setIsOpen(false)
    if (onClose) onClose()
  }

  const currentLanguage = languages?.find((l) => l.code === locale)

  // If used as a dropdown (no onClose prop)
  if (!onClose) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg hover:bg-[#2A3F55] transition-colors flex items-center gap-2 text-[#F5F5F5]"
        >
          <Globe size={18} />
          <span className="text-sm font-semibold hidden sm:inline">
            {currentLanguage?.flag} {currentLanguage?.name || "English"}
          </span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full right-0 mt-2 bg-[#0F2537] border border-[#2A3F55] rounded-xl shadow-2xl z-50 w-72 max-h-96 overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-[#2A3F55]">
                <input
                  type="text"
                  placeholder={t?.("search") || "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5] text-sm placeholder-[#B8C5D6] focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              {/* Language List */}
              <div className="overflow-y-auto max-h-64">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLocaleChange(lang.code)}
                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#1A2F45] transition-colors ${
                      locale === lang.code ? "bg-[#1A2F45]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-[#F5F5F5]">{lang.name}</span>
                    </div>
                    {locale === lang.code && <Check className="h-4 w-4 text-[#FFD700]" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // If used as a panel (onClose prop provided)
  return (
    <div className="bg-[#0F2537] border border-[#2A3F55] rounded-xl shadow-2xl w-80 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A3F55]">
        <h3 className="text-[#F5F5F5] font-semibold">{t?.("language") || "Language"}</h3>
        <button onClick={onClose} className="p-1 hover:bg-[#1A2F45] rounded-lg transition-colors">
          <X className="h-4 w-4 text-[#B8C5D6]" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#2A3F55]">
        <input
          type="text"
          placeholder={t?.("search") || "Search..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5] text-sm placeholder-[#B8C5D6] focus:outline-none focus:border-[#FFD700]"
        />
      </div>

      {/* Language List */}
      <div className="overflow-y-auto max-h-64">
        {filteredLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#1A2F45] transition-colors ${
              locale === lang.code ? "bg-[#1A2F45]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{lang.flag}</span>
              <span className="text-[#F5F5F5]">{lang.name}</span>
            </div>
            {locale === lang.code && <Check className="h-4 w-4 text-[#FFD700]" />}
          </button>
        ))}
      </div>
    </div>
  )
}
