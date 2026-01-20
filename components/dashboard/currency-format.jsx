"use client"

import { CURRENCIES } from "@/lib/i18n-service"

export function FormatCurrency({ amount = 0, currency = "USD", showSymbol = true, className = "" }) {
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.USD

  const formatter = new Intl.NumberFormat(currencyInfo.locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: currency === "UGX" || currency === "CDF" || currency === "GNF" ? 0 : 2,
  })

  const formatted = formatter.format(amount)

  return <span className={className}>{formatted}</span>
}
