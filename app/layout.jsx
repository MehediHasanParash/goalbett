import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { TenantProvider } from "@/components/providers/tenant-provider"
import { LanguageProvider } from "@/lib/i18n/language-context"
import { PWAProvider } from "@/components/pwa/pwa-provider"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { LowBandwidthProvider } from "@/lib/contexts/low-bandwidth-context"
import { ConnectionBanner } from "@/components/low-bandwidth/connection-banner"
import { GeoBlockChecker } from "@/components/geo-block-checker"

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-geist-mono",
})

export const metadata = {
  title: "GoalBett - Sports Betting Platform",
  description: "Your premier destination for sports betting",
  generator: "v0.app",
  themeColor: "#FFD700",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GoalBett",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFD700",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="GoalBett" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GoalBett" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0A1A2F" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/player/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/player/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/player/icon-192x192.png" />

        {/* Splash Screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-640x1136.png"
          media="(device-width: 320px) and (device-height: 568px)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px)"
        />
      </head>
      <body className="font-sans antialiased">
        <LowBandwidthProvider>
          <PWAProvider>
            <LanguageProvider>
              <TenantProvider>
                <GeoBlockChecker>
                  <OfflineIndicator />
                  {children}
                  <InstallPrompt />
                  <ConnectionBanner />
                </GeoBlockChecker>
              </TenantProvider>
            </LanguageProvider>
          </PWAProvider>
        </LowBandwidthProvider>
        <Analytics />
      </body>
    </html>
  )
}
