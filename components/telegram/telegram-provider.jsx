"use client"

import { createContext, useContext, useEffect, useState } from "react"
import TelegramSDK from "@/lib/telegram-sdk"

const TelegramContext = createContext({
  isInTelegram: false,
  user: null,
  colorScheme: "dark",
  viewport: { height: 0, stableHeight: 0, isExpanded: false },
  sdk: TelegramSDK,
})

export function useTelegram() {
  return useContext(TelegramContext)
}

export function TelegramProvider({ children }) {
  const [isInTelegram, setIsInTelegram] = useState(false)
  const [user, setUser] = useState(null)
  const [colorScheme, setColorScheme] = useState("dark")
  const [viewport, setViewport] = useState({ height: 0, stableHeight: 0, isExpanded: false })

  useEffect(() => {
    const checkTelegram = () => {
      const available = TelegramSDK.isAvailable()
      setIsInTelegram(available)

      if (available) {
        TelegramSDK.init()
        setUser(TelegramSDK.getUser())
        setColorScheme(TelegramSDK.getColorScheme())
        setViewport(TelegramSDK.getViewport())

        // Listen for viewport changes
        const webApp = TelegramSDK.getWebApp()
        if (webApp) {
          webApp.onEvent("viewportChanged", () => {
            setViewport(TelegramSDK.getViewport())
          })
        }
      }
    }

    // Check immediately and after a delay (for slow loading)
    checkTelegram()
    const timeout = setTimeout(checkTelegram, 500)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <TelegramContext.Provider value={{ isInTelegram, user, colorScheme, viewport, sdk: TelegramSDK }}>
      {children}
    </TelegramContext.Provider>
  )
}
