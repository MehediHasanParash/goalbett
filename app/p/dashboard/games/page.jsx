"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PlayerGamesRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/games")
  }, [router])

  return null
}
