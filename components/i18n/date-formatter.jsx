"use client"

import { formatDate } from "@/lib/i18n-service"
import { useTranslation } from "./translation-provider"

export default function DateFormatter({ date, locale = null, format = "short" }) {
  const { locale: currentLocale } = useTranslation()
  const displayLocale = locale || currentLocale

  if (format === "short") {
    return <span>{formatDate(date, displayLocale)}</span>
  }

  const dateObj = new Date(date)
  const formatted = new Intl.DateTimeFormat(displayLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj)

  return <span>{formatted}</span>
}
