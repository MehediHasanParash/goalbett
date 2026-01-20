// Design configuration for multi-design white-label system
// Each design has completely different UI/UX, navigation, and visual identity

export const DESIGNS = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Traditional dark blue sportsbook with gold accents, sidebar navigation, card-based layout",
    preview: "/designs/classic-preview.png",
    colors: {
      primary: "#FFD700", // Gold
      secondary: "#0A1A2F", // Dark Navy Blue
      accent: "#1E3A5F", // Medium Blue
      background: "#0D1B2A", // Very Dark Blue
      surface: "#1B2838", // Card Background
      text: "#FFFFFF", // White text
      textMuted: "#8B9CAF", // Muted text
      success: "#22C55E", // Green
      error: "#EF4444", // Red
      warning: "#F59E0B", // Amber
      border: "#2A3F55", // Border color
    },
    navigation: "sidebar", // sidebar | bottom | top
    layout: "cards", // cards | list | grid
    borderRadius: "8px",
    fontFamily: "'Inter', sans-serif",
  },
  modern: {
    id: "modern",
    name: "Modern",
    description: "Minimalist light theme with purple gradients, bottom tab navigation, sleek rounded cards",
    preview: "/designs/modern-preview.png",
    colors: {
      primary: "#8B5CF6", // Purple
      secondary: "#F8FAFC", // Light Gray
      accent: "#A78BFA", // Light Purple
      background: "#FFFFFF", // White
      surface: "#F1F5F9", // Light Surface
      text: "#1E293B", // Dark text
      textMuted: "#64748B", // Muted text
      success: "#10B981", // Emerald
      error: "#F43F5E", // Rose
      warning: "#F59E0B", // Amber
      border: "#E2E8F0", // Light border
    },
    navigation: "bottom",
    layout: "rounded",
    borderRadius: "16px",
    fontFamily: "'Poppins', sans-serif",
  },
  neon: {
    id: "neon",
    name: "Neon",
    description: "Cyberpunk-inspired dark theme with neon green/cyan accents, glassmorphism effects",
    preview: "/designs/neon-preview.png",
    colors: {
      primary: "#00FF88", // Neon Green
      secondary: "#0F0F1A", // Very Dark Purple/Black
      accent: "#00D4FF", // Cyan
      background: "#0A0A14", // Near Black
      surface: "#1A1A2E", // Dark Surface
      text: "#FFFFFF", // White text
      textMuted: "#6B7280", // Muted text
      success: "#00FF88", // Neon Green
      error: "#FF3366", // Neon Pink/Red
      warning: "#FFAA00", // Neon Orange
      border: "#2D2D44", // Border color
    },
    navigation: "top",
    layout: "glass",
    borderRadius: "12px",
    fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
  },
}

export function getDesignConfig(designId) {
  return DESIGNS[designId] || DESIGNS.classic
}

export function getDesignCSS(designId) {
  const design = getDesignConfig(designId)
  return `
    :root {
      --design-primary: ${design.colors.primary};
      --design-secondary: ${design.colors.secondary};
      --design-accent: ${design.colors.accent};
      --design-background: ${design.colors.background};
      --design-surface: ${design.colors.surface};
      --design-text: ${design.colors.text};
      --design-text-muted: ${design.colors.textMuted};
      --design-success: ${design.colors.success};
      --design-error: ${design.colors.error};
      --design-warning: ${design.colors.warning};
      --design-border: ${design.colors.border};
      --design-radius: ${design.borderRadius};
      --design-font: ${design.fontFamily};
    }
  `
}
