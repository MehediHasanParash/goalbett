"use client"

import { useEffect, useRef } from "react"
import { useTenant } from "./tenant-provider"

// Theme color mappings - maps hardcoded colors to theme colors
const THEME_COLORS = {
  classic: {
    // Keep original colors for classic theme
    bgDark: "#0A1A2F",
    bgCard: "#0D1F35",
    bgMuted: "#1A2F45",
    border: "#2A3F55",
    accent: "#FFD700",
    accentForeground: "#0A1A2F",
    text: "#F5F5F5",
    textMuted: "#B8C5D6",
  },
  modern: {
    // Light purple theme
    bgDark: "#f8fafc",
    bgCard: "#ffffff",
    bgMuted: "#f1f5f9",
    border: "#e2e8f0",
    accent: "#7c3aed",
    accentForeground: "#ffffff",
    text: "#1e293b",
    textMuted: "#64748b",
  },
  neon: {
    // Cyberpunk theme
    bgDark: "#0a0a0f",
    bgCard: "#12121a",
    bgMuted: "#1a1a25",
    border: "#2a2a3a",
    accent: "#00ffd5",
    accentForeground: "#0a0a0f",
    text: "#e0e0e0",
    textMuted: "#888899",
  },
}

// Color mappings from original to theme
const COLOR_MAPPINGS = {
  // Background colors
  "#0A1A2F": "bgDark",
  "#0a1a2f": "bgDark",
  "#0D1F35": "bgCard",
  "#0d1f35": "bgCard",
  "#1A2F45": "bgMuted",
  "#1a2f45": "bgMuted",
  // Border colors
  "#2A3F55": "border",
  "#2a3f55": "border",
  // Accent colors
  "#FFD700": "accent",
  "#ffd700": "accent",
  // Text colors
  "#F5F5F5": "text",
  "#f5f5f5": "text",
  "#B8C5D6": "textMuted",
  "#b8c5d6": "textMuted",
}

export function ThemeWrapper({ children }) {
  const { designId } = useTenant()
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!wrapperRef.current || designId === "classic") return

    const themeColors = THEME_COLORS[designId] || THEME_COLORS.classic

    // Function to process an element's styles
    const processElement = (element) => {
      if (!element || element.nodeType !== 1) return

      const computedStyle = window.getComputedStyle(element)
      const classList = element.className?.toString() || ""

      // Check background color in class names
      for (const [originalColor, colorKey] of Object.entries(COLOR_MAPPINGS)) {
        // Check for background color classes
        if (classList.includes(`bg-[${originalColor}]`) || classList.includes(`bg-[${originalColor.toLowerCase()}]`)) {
          element.style.backgroundColor = themeColors[colorKey]
        }

        // Check for border color classes
        if (
          classList.includes(`border-[${originalColor}]`) ||
          classList.includes(`border-[${originalColor.toLowerCase()}]`)
        ) {
          element.style.borderColor = themeColors[colorKey]
        }

        // Check for text color classes
        if (
          classList.includes(`text-[${originalColor}]`) ||
          classList.includes(`text-[${originalColor.toLowerCase()}]`)
        ) {
          element.style.color = themeColors[colorKey]
        }

        // Check for from/via/to gradient classes
        if (
          classList.includes(`from-[${originalColor}]`) ||
          classList.includes(`from-[${originalColor.toLowerCase()}]`)
        ) {
          element.style.setProperty("--tw-gradient-from", themeColors[colorKey])
        }
        if (
          classList.includes(`via-[${originalColor}]`) ||
          classList.includes(`via-[${originalColor.toLowerCase()}]`)
        ) {
          element.style.setProperty("--tw-gradient-via", themeColors[colorKey])
        }
        if (classList.includes(`to-[${originalColor}]`) || classList.includes(`to-[${originalColor.toLowerCase()}]`)) {
          element.style.setProperty("--tw-gradient-to", themeColors[colorKey])
        }
      }

      // Handle special classes
      if (classList.includes("text-secondary")) {
        element.style.color = themeColors.accent
      }
      if (classList.includes("bg-secondary")) {
        element.style.backgroundColor = themeColors.accent
      }
      if (classList.includes("border-secondary")) {
        element.style.borderColor = themeColors.accent
      }
      if (classList.includes("text-secondary-foreground")) {
        element.style.color = themeColors.accentForeground
      }

      // Handle hover states with data attribute
      if (classList.includes("hover:bg-") || classList.includes("hover:text-") || classList.includes("hover:border-")) {
        element.setAttribute("data-theme-hover", designId)
      }
    }

    // Process all elements
    const processAllElements = () => {
      const allElements = wrapperRef.current.querySelectorAll("*")
      allElements.forEach(processElement)
    }

    // Initial processing
    processAllElements()

    // Set up MutationObserver to handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              processElement(node)
              const children = node.querySelectorAll?.("*")
              children?.forEach(processElement)
            }
          })
        }
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          processElement(mutation.target)
        }
      })
    })

    observer.observe(wrapperRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [designId])

  // Add theme-specific body styles
  useEffect(() => {
    const themeColors = THEME_COLORS[designId] || THEME_COLORS.classic

    // Set CSS variables on document root
    document.documentElement.style.setProperty("--theme-bg-dark", themeColors.bgDark)
    document.documentElement.style.setProperty("--theme-bg-card", themeColors.bgCard)
    document.documentElement.style.setProperty("--theme-bg-muted", themeColors.bgMuted)
    document.documentElement.style.setProperty("--theme-border", themeColors.border)
    document.documentElement.style.setProperty("--theme-accent", themeColors.accent)
    document.documentElement.style.setProperty("--theme-accent-foreground", themeColors.accentForeground)
    document.documentElement.style.setProperty("--theme-text", themeColors.text)
    document.documentElement.style.setProperty("--theme-text-muted", themeColors.textMuted)

    // Also set on body for good measure
    document.body.style.backgroundColor = themeColors.bgDark
    document.body.style.color = themeColors.text
  }, [designId])

  return (
    <div ref={wrapperRef} data-theme-wrapper={designId} className="theme-wrapper">
      {children}
    </div>
  )
}
