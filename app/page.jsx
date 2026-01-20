"use client"
import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { useTenant } from "@/components/providers/tenant-provider"
import { BettingHeader } from "@/components/shared/betting-header"
import { useThemeColors } from "@/hooks/useThemeColors"
import { useAuth } from "@/hooks/useAuth"

const HomepageContent = dynamic(
  () => import("@/components/shared/homepage-content").then((mod) => ({ default: mod.HomepageContent })),
  {
    loading: () => <HomePageSkeleton />,
    ssr: false,
  },
)

function HomePageSkeleton() {
  return (
    <div className="animate-pulse px-4 pt-4 pb-24">
      {/* Hero skeleton */}
      <div className="h-40 bg-[#1a2f45] rounded-xl mb-6" />

      {/* Sports grid skeleton */}
      <div className="flex gap-3 overflow-x-auto mb-6 pb-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-16 h-20 bg-[#1a2f45] rounded-lg flex-shrink-0" />
        ))}
      </div>

      {/* Match cards skeleton */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-[#1a2f45] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { isLoading: tenantLoading } = useTenant()
  const { styles } = useThemeColors()
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a1a2f]">
        <HomePageSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden w-full" style={styles.pageBg}>
      <BettingHeader />
      <Suspense fallback={<HomePageSkeleton />}>
        <HomepageContent />
      </Suspense>
    </div>
  )
}
