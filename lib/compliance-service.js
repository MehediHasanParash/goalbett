const AGE_GATE_KEY = "ageGateAccepted"
const COOKIE_CONSENT_KEY = "cookieConsent"
const GEO_BLOCK_KEY = "geoBlockedCountries"

// Restricted jurisdictions (example list)
const RESTRICTED_JURISDICTIONS = [
  "US",
  "UK",
  "CN",
  "RU", // Can be configured per tenant
]

const isClientSide = () => typeof window !== "undefined"

export const isAgeGateAccepted = () => {
  if (!isClientSide()) return false
  return localStorage.getItem(AGE_GATE_KEY) === "true"
}

export const acceptAgeGate = () => {
  if (!isClientSide()) return
  localStorage.setItem(AGE_GATE_KEY, "true")
  localStorage.setItem("ageGateAcceptedAt", Date.now().toString())
}

export const rejectAgeGate = () => {
  if (!isClientSide()) return
  localStorage.removeItem(AGE_GATE_KEY)
}

export const getCookieConsent = () => {
  if (!isClientSide()) return null
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
  return consent ? JSON.parse(consent) : null
}

export const setCookieConsent = (preferences) => {
  if (!isClientSide()) return
  localStorage.setItem(
    COOKIE_CONSENT_KEY,
    JSON.stringify({
      ...preferences,
      timestamp: Date.now(),
    }),
  )
}

export const hasCookieConsent = (type = "analytics") => {
  if (!isClientSide()) return false
  const consent = getCookieConsent()
  return consent ? consent[type] === true : false
}

export const checkGeoRestriction = async (countryCode) => {
  return RESTRICTED_JURISDICTIONS.includes(countryCode)
}

export const getGeoBlockedMessage = (locale = "en") => {
  const messages = {
    en: "This service is not available in your jurisdiction. Please check local regulations.",
    ar: "هذه الخدمة غير متاحة في ولايتك القضائية. يرجى التحقق من اللوائح المحلية.",
    fr: "Ce service n'est pas disponible dans votre juridiction. Veuillez vérifier la réglementation locale.",
  }
  return messages[locale] || messages.en
}

export const canPlaceBets = () => {
  return isAgeGateAccepted()
}

export const canDeposit = (isGeoBocked = false) => {
  return isAgeGateAccepted() && !isGeoBocked
}

// Responsible Gaming Service
export const setSessionLimits = (limitMinutes = 120) => {
  if (!isClientSide()) return
  const expiresAt = Date.now() + limitMinutes * 60 * 1000
  localStorage.setItem("sessionLimitExpiry", expiresAt.toString())
}

export const getSessionRemainingTime = () => {
  if (!isClientSide()) return { milliseconds: 0, minutes: 0, seconds: 0 }
  const expiry = Number.parseInt(localStorage.getItem("sessionLimitExpiry") || "0")
  const remaining = Math.max(0, expiry - Date.now())
  return {
    milliseconds: remaining,
    minutes: Math.floor(remaining / 60000),
    seconds: Math.floor((remaining % 60000) / 1000),
  }
}

export const isSessionExpired = () => {
  if (!isClientSide()) return false
  const expiry = Number.parseInt(localStorage.getItem("sessionLimitExpiry") || "0")
  return Date.now() > expiry
}

// Deposit Limits
export const setDepositLimit = (amountPerDay, periodDays = 1) => {
  if (!isClientSide()) return
  localStorage.setItem("depositLimitAmount", amountPerDay.toString())
  localStorage.setItem("depositLimitPeriod", periodDays.toString())
}

export const recordDeposit = (amount) => {
  if (!isClientSide()) return
  const deposited = Number.parseInt(localStorage.getItem("depositedToday") || "0")
  localStorage.setItem("depositedToday", (deposited + amount).toString())
}

// Self-Exclusion
export const setSelfExclusion = (durationDays = 30) => {
  if (!isClientSide()) return
  const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000
  localStorage.setItem("selfExclusionExpiry", expiresAt.toString())
}

export const isSelfExcluded = () => {
  if (!isClientSide()) return false
  const expiry = Number.parseInt(localStorage.getItem("selfExclusionExpiry") || "0")
  return Date.now() < expiry
}

export const getSelfExclusionRemaining = () => {
  if (!isClientSide()) return 0
  const expiry = Number.parseInt(localStorage.getItem("selfExclusionExpiry") || "0")
  const remaining = Math.max(0, expiry - Date.now())
  return Math.floor(remaining / (24 * 60 * 60 * 1000))
}

// Loss Limit
export const setLossLimit = (amountPerMonth) => {
  if (!isClientSide()) return
  localStorage.setItem("lossLimitAmount", amountPerMonth.toString())
}

export const recordLoss = (amount) => {
  if (!isClientSide()) return
  const lossMonth = localStorage.getItem("lossMonthDate")
  const currentMonth = new Date().toISOString().slice(0, 7)

  if (lossMonth !== currentMonth) {
    localStorage.setItem("lossMonthDate", currentMonth)
    localStorage.setItem("totalLossThisMonth", amount.toString())
  } else {
    const totalLoss = Number.parseFloat(localStorage.getItem("totalLossThisMonth") || "0")
    localStorage.setItem("totalLossThisMonth", (totalLoss + amount).toString())
  }
}

export const getLossLimitStatus = () => {
  if (!isClientSide()) return { limit: 0, spent: 0, remaining: 0, exceedsLimit: false }
  const limit = Number.parseFloat(localStorage.getItem("lossLimitAmount") || "0")
  const totalLoss = Number.parseFloat(localStorage.getItem("totalLossThisMonth") || "0")
  return {
    limit,
    spent: totalLoss,
    remaining: Math.max(0, limit - totalLoss),
    exceedsLimit: totalLoss > limit,
  }
}
