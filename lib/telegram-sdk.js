// Telegram Mini App (TMA) SDK Wrapper
// Provides integration with Telegram WebApp API

const isTelegramWebApp = () => {
  if (typeof window === "undefined") return false
  return !!window.Telegram?.WebApp
}

const getTelegramWebApp = () => {
  if (!isTelegramWebApp()) return null
  return window.Telegram.WebApp
}

export const TelegramSDK = {
  // Check if running inside Telegram
  isAvailable: isTelegramWebApp,

  // Get WebApp instance
  getWebApp: getTelegramWebApp,

  // Initialize the app
  init: () => {
    const webApp = getTelegramWebApp()
    if (!webApp) return false

    webApp.ready()
    webApp.expand()

    // Set theme
    document.documentElement.style.setProperty("--tg-theme-bg-color", webApp.themeParams.bg_color || "#0A1A2F")
    document.documentElement.style.setProperty("--tg-theme-text-color", webApp.themeParams.text_color || "#FFFFFF")
    document.documentElement.style.setProperty("--tg-theme-button-color", webApp.themeParams.button_color || "#FFD700")

    return true
  },

  // Get user info
  getUser: () => {
    const webApp = getTelegramWebApp()
    if (!webApp?.initDataUnsafe?.user) return null

    return {
      id: webApp.initDataUnsafe.user.id,
      firstName: webApp.initDataUnsafe.user.first_name,
      lastName: webApp.initDataUnsafe.user.last_name,
      username: webApp.initDataUnsafe.user.username,
      languageCode: webApp.initDataUnsafe.user.language_code,
      isPremium: webApp.initDataUnsafe.user.is_premium,
    }
  },

  // Get init data for backend verification
  getInitData: () => {
    const webApp = getTelegramWebApp()
    return webApp?.initData || null
  },

  // Show main button
  showMainButton: (text, onClick) => {
    const webApp = getTelegramWebApp()
    if (!webApp) return

    webApp.MainButton.text = text
    webApp.MainButton.onClick(onClick)
    webApp.MainButton.show()
  },

  // Hide main button
  hideMainButton: () => {
    const webApp = getTelegramWebApp()
    if (!webApp) return
    webApp.MainButton.hide()
  },

  // Show back button
  showBackButton: (onClick) => {
    const webApp = getTelegramWebApp()
    if (!webApp) return

    webApp.BackButton.onClick(onClick)
    webApp.BackButton.show()
  },

  // Hide back button
  hideBackButton: () => {
    const webApp = getTelegramWebApp()
    if (!webApp) return
    webApp.BackButton.hide()
  },

  // Show confirmation popup
  showConfirm: (message, callback) => {
    const webApp = getTelegramWebApp()
    if (!webApp) {
      callback(confirm(message))
      return
    }
    webApp.showConfirm(message, callback)
  },

  // Show alert
  showAlert: (message) => {
    const webApp = getTelegramWebApp()
    if (!webApp) {
      alert(message)
      return
    }
    webApp.showAlert(message)
  },

  // Haptic feedback
  haptic: {
    impact: (style = "medium") => {
      const webApp = getTelegramWebApp()
      webApp?.HapticFeedback?.impactOccurred(style)
    },
    notification: (type = "success") => {
      const webApp = getTelegramWebApp()
      webApp?.HapticFeedback?.notificationOccurred(type)
    },
    selection: () => {
      const webApp = getTelegramWebApp()
      webApp?.HapticFeedback?.selectionChanged()
    },
  },

  // Share to chat
  shareToChat: (url, text) => {
    const webApp = getTelegramWebApp()
    if (webApp?.switchInlineQuery) {
      webApp.switchInlineQuery(text, ["users", "groups", "channels"])
    } else {
      // Fallback to Telegram share URL
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank")
    }
  },

  // Open Telegram link
  openTelegramLink: (url) => {
    const webApp = getTelegramWebApp()
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url)
    } else {
      window.open(url, "_blank")
    }
  },

  // Close the app
  close: () => {
    const webApp = getTelegramWebApp()
    webApp?.close()
  },

  // Get color scheme
  getColorScheme: () => {
    const webApp = getTelegramWebApp()
    return webApp?.colorScheme || "dark"
  },

  // Get viewport info
  getViewport: () => {
    const webApp = getTelegramWebApp()
    return {
      height: webApp?.viewportHeight || window.innerHeight,
      stableHeight: webApp?.viewportStableHeight || window.innerHeight,
      isExpanded: webApp?.isExpanded || false,
    }
  },
}

export default TelegramSDK
