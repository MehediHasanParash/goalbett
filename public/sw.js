// Service Worker for PWA - Banning-Proof Infrastructure
const CACHE_VERSION = "v4"
const STATIC_CACHE = `goalbet-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `goalbet-dynamic-${CACHE_VERSION}`
const DOMAIN_CACHE = `goalbet-domains-${CACHE_VERSION}`
const OFFLINE_URL = "/offline"

const DOMAIN_CONFIG = {
  primary: "goalbett.com",
  fallbacks: [], // Will be populated from API
  activeEndpoint: null,
  lastCheck: null,
  checkInterval: 5 * 60 * 1000, // 5 minutes
}

const PRECACHE_ASSETS = ["/offline", "/icon.svg", "/apple-icon.png", "/playerIcon.png"]
const CACHE_FIRST_PATTERNS = [/\.(woff2?|ttf|eot)$/, /\/icons\//]
const NETWORK_FIRST_PATTERNS = [/\/api\//, /\/manifest.*\.json$/]

function isDevMode() {
  return self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1"
}

async function getActiveEndpoint() {
  // Check cache first
  const cache = await caches.open(DOMAIN_CACHE)
  const cached = await cache.match("active-endpoint")

  if (cached) {
    const data = await cached.json()
    const age = Date.now() - new Date(data.updatedAt).getTime()

    // Use cached if less than 5 minutes old
    if (age < DOMAIN_CONFIG.checkInterval) {
      DOMAIN_CONFIG.activeEndpoint = data.active
      DOMAIN_CONFIG.fallbacks = data.fallbacks || []
      return data.active
    }
  }

  // Fetch fresh data
  try {
    const response = await fetch("/api/domains/active", {
      cache: "no-store",
      headers: { "X-SW-Request": "true" },
    })

    if (response.ok) {
      const data = await response.json()
      DOMAIN_CONFIG.activeEndpoint = data.active
      DOMAIN_CONFIG.fallbacks = data.fallbacks || []
      DOMAIN_CONFIG.lastCheck = Date.now()

      // Cache the response
      await cache.put("active-endpoint", new Response(JSON.stringify(data)))

      return data.active
    }
  } catch (error) {
    console.log("[SW] Failed to fetch active endpoint, using fallback")
  }

  return DOMAIN_CONFIG.activeEndpoint || DOMAIN_CONFIG.primary
}

async function fetchWithFailover(request) {
  const url = new URL(request.url)

  // Try primary first
  try {
    const response = await fetch(request)
    if (response.ok || response.status < 500) {
      return response
    }
  } catch (error) {
    console.log("[SW] Primary request failed:", error.message)
  }

  // Try fallback domains
  for (const fallbackDomain of DOMAIN_CONFIG.fallbacks) {
    try {
      const fallbackUrl = new URL(url.pathname + url.search, `https://${fallbackDomain}`)
      const fallbackRequest = new Request(fallbackUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" ? request.body : undefined,
        mode: "cors",
        credentials: "omit",
      })

      const response = await fetch(fallbackRequest)
      if (response.ok) {
        console.log("[SW] Failover successful to:", fallbackDomain)
        // Notify app about failover
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "DOMAIN_FAILOVER",
              from: url.hostname,
              to: fallbackDomain,
            })
          })
        })
        return response
      }
    } catch (error) {
      console.log("[SW] Failover failed for:", fallbackDomain)
    }
  }

  // All failed, return offline response
  return caches.match(OFFLINE_URL) || new Response("Offline", { status: 503 })
}

// Install event
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker v4...")
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn("[SW] Precache failed:", err)
        })
      }),
      getActiveEndpoint(),
    ]),
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker v4...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith("goalbet-") && !cacheName.includes(CACHE_VERSION)
          })
          .map((cacheName) => {
            console.log("[SW] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event with failover support
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET") return
  if (!request.url.startsWith("http")) return

  // Dev mode: minimal caching
  if (isDevMode()) {
    if (/\.(woff2?|ttf|eot)$/.test(url.pathname)) {
      event.respondWith(cacheFirst(request))
      return
    }
    event.respondWith(networkOnly(request))
    return
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request).catch(() => fetchWithFailover(request)))
    return
  }

  // Cache first for fonts
  if (CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Network first for everything else
  event.respondWith(networkFirst(request))
})

async function networkOnly(request) {
  try {
    return await fetch(request)
  } catch (error) {
    if (request.mode === "navigate") {
      const cached = await caches.match(OFFLINE_URL)
      if (cached) return cached
    }
    return new Response("Offline", { status: 503 })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response("Offline", { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.mode === "navigate") {
      return caches.match(OFFLINE_URL)
    }
    return new Response("Offline", { status: 503 })
  }
}

setInterval(async () => {
  if (!isDevMode()) {
    await getActiveEndpoint()
  }
}, DOMAIN_CONFIG.checkInterval)

// Handle messages
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting()
  }
  if (event.data === "clearCache") {
    console.log("[SW] Clearing all caches...")
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name))
    })
  }
  if (event.data === "refreshDomains") {
    getActiveEndpoint().then((domain) => {
      event.source?.postMessage({ type: "DOMAINS_REFRESHED", active: domain })
    })
  }
})
