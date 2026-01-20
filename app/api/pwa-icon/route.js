import { NextResponse } from "next/server"

const ROLE_COLORS = {
  player: { bg: "#0A1A2F", fg: "#FFD700", accent: "#FFD700", letter: "P" },
  "super-admin": { bg: "#0F172A", fg: "#6366F1", accent: "#6366F1", letter: "S" },
  tenant: { bg: "#0F172A", fg: "#10B981", accent: "#10B981", letter: "T" },
  agent: { bg: "#0F172A", fg: "#8B5CF6", accent: "#8B5CF6", letter: "A" },
  subagent: { bg: "#0F172A", fg: "#F59E0B", accent: "#F59E0B", letter: "SA" },
  admin: { bg: "#0F172A", fg: "#EF4444", accent: "#EF4444", letter: "AD" },
  staff: { bg: "#0F172A", fg: "#EC4899", accent: "#EC4899", letter: "ST" },
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const size = Number.parseInt(searchParams.get("size") || "192")
  const role = searchParams.get("role") || "player"

  const colors = ROLE_COLORS[role] || ROLE_COLORS.player

  // Generate SVG icon with role-specific colors
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="180" height="180" rx="37" fill="${colors.bg}"/>
      <g style="transform: scale(95%); transform-origin: center">
        <path fill="${colors.fg}"
          d="M101.141 53H136.632C151.023 53 162.689 64.6662 162.689 79.0573V112.904H148.112V79.0573C148.112 78.7105 148.098 78.3662 148.072 78.0251L112.581 112.898C112.701 112.902 112.821 112.904 112.941 112.904H148.112V126.672H112.941C98.5504 126.672 86.5638 114.891 86.5638 100.5V66.7434H101.141V100.5C101.141 101.15 101.191 101.792 101.289 102.422L137.56 66.7816C137.255 66.7563 136.945 66.7434 136.632 66.7434H101.141V53Z"/>
        <path fill="${colors.fg}"
          d="M65.2926 124.136L14 66.7372H34.6355L64.7495 100.436V66.7372H80.1365V118.47C80.1365 126.278 70.4953 129.958 65.2926 124.136Z"/>
      </g>
      <rect x="125" y="125" width="50" height="50" rx="12" fill="${colors.accent}"/>
      <text x="150" y="158" font-family="Arial, sans-serif" font-size="${colors.letter.length > 1 ? "18" : "24"}" font-weight="bold" fill="${colors.bg}" text-anchor="middle">
        ${colors.letter}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
