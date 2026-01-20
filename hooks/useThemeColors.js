"use client"

import { useMemo } from "react"
import { useTenant } from "@/components/providers/tenant-provider"

// Theme color definitions - BASE colors for each design template
const THEME_COLORS = {
  classic: {
    bgDark: "#0A1A2F",
    bgCard: "#0D1F35",
    bgMuted: "#1A2F45",
    border: "#2A3F55",
    accent: "#FFD700",
    accentForeground: "#0A1A2F",
    text: "#F5F5F5",
    textMuted: "#B8C5D6",
    gradient: "from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]",
    gradientAlt: "from-[#0D1F35] via-[#1A2F45] to-[#0D1F35]",
  },
  modern: {
    bgDark: "#f8fafc",
    bgCard: "#ffffff",
    bgMuted: "#f1f5f9",
    border: "#e2e8f0",
    accent: "#7c3aed",
    accentForeground: "#ffffff",
    text: "#1e293b",
    textMuted: "#64748b",
    gradient: "from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc]",
    gradientAlt: "from-[#ffffff] via-[#f8fafc] to-[#ffffff]",
  },
  neon: {
    bgDark: "#0a0a0f",
    bgCard: "#12121a",
    bgMuted: "#1a1a25",
    border: "#2a2a3a",
    accent: "#00ffd5",
    accentForeground: "#0a0a0f",
    text: "#e0e0e0",
    textMuted: "#888899",
    gradient: "from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]",
    gradientAlt: "from-[#12121a] via-[#1a1a25] to-[#12121a]",
  },
}

const getContrastColor = (hex) => {
  if (!hex || typeof hex !== "string") return "#000000"
  const cleanHex = hex.replace("#", "")
  if (cleanHex.length !== 6) return "#000000"
  const r = Number.parseInt(cleanHex.substring(0, 2), 16)
  const g = Number.parseInt(cleanHex.substring(2, 4), 16)
  const b = Number.parseInt(cleanHex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

const isValidHex = (color) => {
  if (!color || typeof color !== "string") return false
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

export function useThemeColors() {
  const { designId, tenant } = useTenant()

  const colors = useMemo(() => {
    // Get base colors from design template
    const baseColors = THEME_COLORS[designId] || THEME_COLORS.classic

    const tenantTheme = tenant?.theme || {}
    const customPrimary = tenantTheme.primaryColor
    const customAccent = tenantTheme.accentColor || customPrimary
    const customSecondary = tenantTheme.secondaryColor

    console.log(
      "[v0] [useThemeColors] Design:",
      designId,
      "Custom primary:",
      customPrimary,
      "Custom accent:",
      customAccent,
    )

    const finalAccent = isValidHex(customPrimary) ? customPrimary : baseColors.accent
    const finalAccentForeground = isValidHex(customPrimary)
      ? getContrastColor(customPrimary)
      : baseColors.accentForeground

    const finalBgDark = isValidHex(customSecondary) ? customSecondary : baseColors.bgDark

    return {
      ...baseColors,
      accent: finalAccent,
      accentForeground: finalAccentForeground,
      // Keep secondary color customization optional
      bgDark: finalBgDark,
    }
  }, [designId, tenant?.theme])

  // Helper to generate inline styles
  const getStyles = useMemo(() => {
    return {
      pageBg: {
        background: `linear-gradient(to bottom right, ${colors.bgDark}, ${colors.bgCard}, ${colors.bgDark})`,
        color: colors.text,
      },
      cardBg: {
        backgroundColor: colors.bgCard,
        borderColor: colors.border,
      },
      mutedBg: {
        backgroundColor: colors.bgMuted,
        borderColor: colors.border,
      },
      accentText: {
        color: colors.accent,
      },
      accentBg: {
        backgroundColor: colors.accent,
        color: colors.accentForeground,
      },
      border: {
        borderColor: colors.border,
      },
      text: {
        color: colors.text,
      },
      textMuted: {
        color: colors.textMuted,
      },
    }
  }, [colors])

  // CSS class helpers
  const classes = useMemo(() => {
    return {
      pageBg: `bg-gradient-to-br ${colors.gradient}`,
      cardBg: `bg-[${colors.bgCard}] border-[${colors.border}]`,
      mutedBg: `bg-[${colors.bgMuted}]`,
      accentText: `text-[${colors.accent}]`,
      accentBg: `bg-[${colors.accent}] text-[${colors.accentForeground}]`,
      text: `text-[${colors.text}]`,
      textMuted: `text-[${colors.textMuted}]`,
      border: `border-[${colors.border}]`,
    }
  }, [colors])

  return {
    colors,
    styles: getStyles,
    classes,
    designId,
    isModern: designId === "modern",
    isNeon: designId === "neon",
    isClassic: designId === "classic" || !designId,
  }
}
