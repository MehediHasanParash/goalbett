"use client"
import { createContext, useContext, useState, useEffect } from "react"
import { translations, languages } from "./translations"

const LanguageContext = createContext(undefined)

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState("en")
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved language preference
  useEffect(() => {
    const savedLocale = localStorage.getItem("locale")
    if (savedLocale && languages.find((l) => l.code === savedLocale)) {
      setLocale(savedLocale)
    }
    setIsLoaded(true)
  }, [])

  // Save language preference
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("locale", locale)
      // Update document direction for RTL languages
      const lang = languages.find((l) => l.code === locale)
      document.documentElement.dir = lang?.dir || "ltr"
      document.documentElement.lang = locale
    }
  }, [locale, isLoaded])

  const t = (key) => {
    if (!translations || !translations[key]) return key
    const trans = translations[key]
    return trans[locale] || trans.en || key
  }

  // Get current language info
  const currentLanguage = languages.find((l) => l.code === locale) || languages[0]

  const changeLanguage = (newLocale) => {
    if (languages.find((l) => l.code === newLocale)) {
      setLocale(newLocale)
      console.log("[v0] Language changed to:", newLocale)
    } else {
      console.warn("[v0] Unsupported language:", newLocale)
    }
  }

  return (
    <LanguageContext.Provider
      value={{
        locale,
        t,
        changeLanguage,
        languages,
        currentLanguage,
        isRTL: currentLanguage?.dir === "rtl",
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

// Export a simple hook for just getting translations
export function useTranslation() {
  const { t, locale, isRTL } = useLanguage()
  return { t, locale, isRTL }
}
