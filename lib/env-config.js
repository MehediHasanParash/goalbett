export const envConfig = {
  // API
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",

  // Tenant
  TENANT_DOMAIN: process.env.NEXT_PUBLIC_TENANT_DOMAIN || "localhost",

  // Currency
  CURRENCY: process.env.NEXT_PUBLIC_CURRENCY || "USD",

  // Features
  GUEST_MODE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_GUEST_MODE !== "false",
  DEMO_MODE: true, // Always true in this deployment

  // Analytics
  ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID || "demo",

  // Security
  CSRF_TOKEN_ENABLED: true,
  HTTP_ONLY_COOKIES: true,

  // Locales
  SUPPORTED_LOCALES: ["en", "ar", "es", "fr", "pt", "sw"],
  DEFAULT_LOCALE: "en",

  // RTL Support
  RTL_LOCALES: ["ar"],
}
