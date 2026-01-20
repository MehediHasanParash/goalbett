"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getLocale, isRTL, getTranslation } from "@/lib/i18n-service"

const TranslationContext = createContext()

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider")
  }
  return context
}

export default function TranslationProvider({ children }) {
  const [locale, setLocale] = useState(null)
  const [rtl, setRtl] = useState(false)

  useEffect(() => {
    const current = getLocale()
    setLocale(current)
    setRtl(isRTL(current))

    // Apply RTL to HTML element
    document.documentElement.dir = isRTL(current) ? "rtl" : "ltr"
  }, [])

  const t = (namespace, key) => {
    if (!locale) return key
    return getTranslation(locale, namespace, key)
  }

  return <TranslationContext.Provider value={{ locale, rtl, t }}>{children}</TranslationContext.Provider>
}
