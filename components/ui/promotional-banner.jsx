"use client"
import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export function PromotionalBanner() {
  const [currentBanner, setCurrentBanner] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  // Default/fallback banners if none are configured
  const defaultBanners = [
    {
      _id: "default-1",
      title: "Welcome Bonus 100%",
      description: "Get 100% bonus on your first deposit up to $500",
      imageUrl: "/casino-welcome-bonus.png",
      buttonText: "Claim Now",
      link: "/auth",
    },
    {
      _id: "default-2",
      title: "Jackpot Madness",
      description: "Win up to $1,000,000 in our progressive jackpot slots",
      imageUrl: "/jackpot-slots-casino.jpg",
      buttonText: "Play Now",
      link: "/casino/jackpots",
    },
    {
      _id: "default-3",
      title: "Live Casino Bonus",
      description: "20% cashback on all live casino games this weekend",
      imageUrl: "/live-casino-roulette.jpg",
      buttonText: "Join Now",
      link: "/casino/live-casino",
    },
  ]

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/public/banners")
        const data = await res.json()

        if (data.success && data.data && data.data.length > 0) {
          setBanners(data.data)
        } else {
          // Use default banners if none configured
          setBanners(defaultBanners)
        }
      } catch (error) {
        console.error("Failed to fetch banners:", error)
        setBanners(defaultBanners)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return

    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  if (!isVisible) return null

  if (loading) {
    return (
      <div className="relative bg-gradient-to-r from-[#0D1F35] to-[#1A2F45] border border-[#FFD700]/30 rounded-2xl overflow-hidden shadow-2xl mb-6 h-48 md:h-64 flex items-center justify-center">
        <div className="w-8 h-8 animate-spin text-[#FFD700]">Loading...</div>
      </div>
    )
  }

  if (banners.length === 0) return null

  const banner = banners[currentBanner]

  return (
    <div className="relative bg-gradient-to-r from-[#0D1F35] to-[#1A2F45] border border-[#FFD700]/30 rounded-3xl overflow-hidden shadow-2xl mb-6">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative h-48 md:h-64">
        <img
          src={banner.imageUrl || banner.image || "/placeholder.svg"}
          alt={banner.title}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1A2F] via-transparent to-[#0A1A2F]/80" />

        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12">
          {banners.length > 1 && (
            <button
              onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div className="text-center max-w-2xl flex-1">
            <h2 className="text-2xl md:text-4xl font-bold text-[#FFD700] mb-2">{banner.title}</h2>
            <p className="text-sm md:text-lg text-[#F5F5F5] mb-4">{banner.description || banner.subtitle}</p>
            <a
              href={banner.link || "#"}
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1A2F] font-bold rounded-xl hover:scale-105 transition-transform"
            >
              {banner.buttonText || banner.cta || "Learn More"}
            </a>
          </div>

          {banners.length > 1 && (
            <button
              onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentBanner ? "bg-[#FFD700] w-8" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
