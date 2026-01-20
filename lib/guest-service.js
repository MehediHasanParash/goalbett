import { v4 as uuidv4 } from "uuid"

const GUEST_SLIP_STORAGE_KEY = "guestSlip"
const GUEST_BETID_CACHE = "guestBetIds"
const BETID_TTL = 24 * 60 * 60 * 1000 // 24 hours

const isClientSide = () => typeof window !== "undefined"

// Generate BetID format: GB-{6 uppercase alphanumeric}
export const generateBetId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let betId = "GB-"
  for (let i = 0; i < 6; i++) {
    betId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return betId
}

// Create QR representation (simplified - in production use qrcode.react)
export const generateQRData = (betId) => {
  return `https://goalbet.app/guest/betslip/${betId}`
}

// Save guest slip to localStorage
export const saveGuestSlip = (tenantId, slip) => {
  if (!isClientSide()) return null

  const betId = generateBetId()
  const guestSlip = {
    betId,
    slip,
    createdAt: Date.now(),
    expiresAt: Date.now() + BETID_TTL,
    tenantId,
    guestHash: uuidv4(),
    qrData: generateQRData(betId),
  }

  const key = `${GUEST_SLIP_STORAGE_KEY}:${tenantId}`
  localStorage.setItem(key, JSON.stringify(guestSlip))

  // Cache BetID for deduplication
  const cache = JSON.parse(localStorage.getItem(GUEST_BETID_CACHE) || "{}")
  cache[betId] = { tenantId, createdAt: Date.now() }
  localStorage.setItem(GUEST_BETID_CACHE, JSON.stringify(cache))

  return guestSlip
}

// Retrieve guest slip
export const getGuestSlip = (tenantId) => {
  if (!isClientSide()) return null

  const key = `${GUEST_SLIP_STORAGE_KEY}:${tenantId}`
  const data = localStorage.getItem(key)
  if (!data) return null

  const slip = JSON.parse(data)
  if (Date.now() > slip.expiresAt) {
    localStorage.removeItem(key)
    return null
  }

  return slip
}

// Check if odds changed (re-pricing)
export const checkOddsChanged = (oldSlip, newSlip) => {
  const changedLegs = []

  oldSlip.legs.forEach((oldLeg, idx) => {
    const newLeg = newSlip.legs[idx]
    if (oldLeg.odds !== newLeg.odds) {
      changedLegs.push({
        ...newLeg,
        oldOdds: oldLeg.odds,
        newOdds: newLeg.odds,
      })
    }
  })

  return changedLegs
}

// Rate limiting for BetID creation (1 per 10s per IP/tenant)
export const getRateLimitKey = (tenantId, ip) => {
  return `betid_ratelimit:${tenantId}:${ip}`
}

export const checkRateLimit = (tenantId, ip) => {
  if (!isClientSide()) return true

  const key = getRateLimitKey(tenantId, ip)
  const lastCreated = Number.parseInt(localStorage.getItem(key) || "0")
  const now = Date.now()

  if (now - lastCreated < 10000) {
    return false
  }

  localStorage.setItem(key, now.toString())
  return true
}
