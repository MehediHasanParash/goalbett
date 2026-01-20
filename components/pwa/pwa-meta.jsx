"use client"

import { useEffect, useState } from "react"

export function PWAMeta() {
  const [manifest, setManifest] = useState("/manifest.json")
  const [themeColor, setThemeColor] = useState("#FFD700")

  useEffect(() => {
    const pathname = window.location.pathname

    if (pathname.startsWith("/s/") || pathname === "/s") {
      setManifest("/manifest-super-admin.json")
      setThemeColor("#6366F1")
    } else if (pathname.startsWith("/t/") || pathname === "/t") {
      setManifest("/manifest-tenant.json")
      setThemeColor("#10B981")
    } else if (pathname.startsWith("/a/") || pathname === "/a") {
      setManifest("/manifest-agent.json")
      setThemeColor("#8B5CF6")
    } else if (pathname.startsWith("/sa/") || pathname === "/sa") {
      setManifest("/manifest-subagent.json")
      setThemeColor("#F59E0B")
    } else if (pathname.startsWith("/admin/") || pathname === "/admin") {
      setManifest("/manifest-admin.json")
      setThemeColor("#EF4444")
    } else if (pathname.startsWith("/staff/") || pathname === "/staff") {
      setManifest("/manifest-staff.json")
      setThemeColor("#EC4899")
    } else {
      setManifest("/manifest-player.json")
      setThemeColor("#FFD700")
    }

    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.content = themeColor
    }

    // Update manifest link
    const manifestLink = document.querySelector('link[rel="manifest"]')
    if (manifestLink) {
      manifestLink.href = manifest
    }
  }, [manifest, themeColor])

  return null
}
