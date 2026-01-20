const analyticsQueue = []

export function trackAnalyticsEvent(eventName, properties = {}) {
  const event = {
    name: eventName,
    properties: {
      ...properties,
      tenantId: localStorage.getItem("tenantId") || "guest",
      role: localStorage.getItem("userRole") || "guest",
      locale: navigator.language || "en-US",
      currency: localStorage.getItem("currency") || "USD",
      userId: localStorage.getItem("userId"),
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  }

  analyticsQueue.push(event)

  // Log to console in demo/development mode
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", event.name, event.properties)
  }

  // Send analytics data
  sendAnalyticsData(event)
}

function sendAnalyticsData(event) {
  // In demo mode, store locally instead of remote logging
  try {
    const events = JSON.parse(localStorage.getItem("analyticsEvents") || "[]")
    events.push(event)
    // Keep only the latest 50 events
    if (events.length > 50) {
      events.shift()
    }
    localStorage.setItem("analyticsEvents", JSON.stringify(events))
  } catch (error) {
    console.error("Analytics tracking error:", error)
  }
}

// Event types
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  ADD_TO_SLIP: "add_to_slip",
  PLACE_BET: "place_bet",
  CASH_IN_OUT: "cash_in_out",
  PROMO_TOGGLE: "promo_toggle",
  JACKPOT_TICKET: "jackpot_ticket",
  BETID_GENERATED: "betid_generated",
  AGE_GATE_ACCEPT: "age_gate_accept",
  AUTH_LOGIN: "auth_login",
  AUTH_SIGNUP: "auth_signup",
}

// Tracking helpers
export function trackPageView(pathname) {
  trackAnalyticsEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    pathname,
    referrer: document.referrer,
  })
}

export function trackAddToSlip(slipId, legCount, odds) {
  trackAnalyticsEvent(ANALYTICS_EVENTS.ADD_TO_SLIP, {
    slipId,
    legCount,
    odds,
  })
}

export function trackBetPlaced(betId, amount, potentialWin) {
  trackAnalyticsEvent(ANALYTICS_EVENTS.PLACE_BET, {
    betId,
    amount,
    potentialWin,
  })
}

export function trackBetIDGenerated(betId) {
  trackAnalyticsEvent(ANALYTICS_EVENTS.BETID_GENERATED, {
    betId,
    expiresIn: "24h",
  })
}
