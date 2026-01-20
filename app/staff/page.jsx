"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/auth-service"

export default function StaffIndexPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.push("/staff/login")
      return
    }

    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case "finance_manager":
        router.push("/staff/finance")
        break
      case "general_manager":
        router.push("/staff/gm")
        break
      case "support_manager":
      case "support_agent":
        router.push("/staff/support")
        break
      default:
        router.push("/staff/login")
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
