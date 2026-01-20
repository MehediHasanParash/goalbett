"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

const LowBandwidthContext = createContext({
  isLowBandwidth: false,
  toggleLowBandwidth: () => {},
  setLowBandwidth: () => {},
  settings: {
    disableAnimations: true,
    disableImages: false,
    disableVideos: true,
    reducedQuality: true,
    prefetchDisabled: true,
  },
  updateSettings: () => {},
})

export function useLowBandwidth() {
  return useContext(LowBandwidthContext)
}

const STORAGE_KEY = "low-bandwidth-mode"
const SETTINGS_KEY = "low-bandwidth-settings"

const DEFAULT_SETTINGS = {
  disableAnimations: true,
  disableImages: false,
  disableVideos: true,
  reducedQuality: true,
  prefetchDisabled: true,
}

export function LowBandwidthProvider({ children }) {
  const [isLowBandwidth, setIsLowBandwidth] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from localStorage and detect slow connection
  useEffect(() => {
    if (typeof window === "undefined") return

    // Load saved preference
    const savedMode = localStorage.getItem(STORAGE_KEY)
    const savedSettings = localStorage.getItem(SETTINGS_KEY)

    if (savedMode !== null) {
      setIsLowBandwidth(savedMode === "true")
    } else {
      // Auto-detect slow connection
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (connection) {
        const isSlowConnection =
          connection.saveData ||
          connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g" ||
          connection.downlink < 1.5

        if (isSlowConnection) {
          setIsLowBandwidth(true)
          localStorage.setItem(STORAGE_KEY, "true")
        }
      }
    }

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        setSettings(DEFAULT_SETTINGS)
      }
    }

    setIsInitialized(true)
  }, [])

  // Apply CSS classes when mode changes
  useEffect(() => {
    if (!isInitialized) return

    const root = document.documentElement

    if (isLowBandwidth) {
      root.classList.add("low-bandwidth")

      if (settings.disableAnimations) {
        root.classList.add("reduce-motion")
        root.style.setProperty("--animation-duration", "0s")
        root.style.setProperty("--transition-duration", "0s")
      }

      if (settings.disableImages) {
        root.classList.add("disable-images")
      }

      if (settings.reducedQuality) {
        root.classList.add("reduced-quality")
      }
    } else {
      root.classList.remove("low-bandwidth", "reduce-motion", "disable-images", "reduced-quality")
      root.style.removeProperty("--animation-duration")
      root.style.removeProperty("--transition-duration")
    }
  }, [isLowBandwidth, settings, isInitialized])

  const toggleLowBandwidth = useCallback(() => {
    setIsLowBandwidth((prev) => {
      const newValue = !prev
      localStorage.setItem(STORAGE_KEY, String(newValue))
      return newValue
    })
  }, [])

  const setLowBandwidthMode = useCallback((value) => {
    setIsLowBandwidth(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }, [])

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <LowBandwidthContext.Provider
      value={{
        isLowBandwidth,
        toggleLowBandwidth,
        setLowBandwidth: setLowBandwidthMode,
        settings,
        updateSettings,
      }}
    >
      {children}
    </LowBandwidthContext.Provider>
  )
}
