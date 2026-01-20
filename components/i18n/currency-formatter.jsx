"use client"

import { formatCurrency } from "@/lib/i18n-service"
import { useTranslation } from "./translation-provider"

export default function CurrencyFormatter({ amount, locale = null }) {
  const { locale: currentLocale } = useTranslation()
  const displayLocale = locale || currentLocale

  return <span>{formatCurrency(amount, displayLocale)}</span>
}
