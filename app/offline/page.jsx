"use client"

import { WifiOff, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-yellow-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">You're Offline</h1>
          <p className="text-gray-400">
            It looks like you've lost your internet connection. Some features may not be available until you're back
            online.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.location.reload()} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>

        <div className="pt-8 border-t border-gray-700/50">
          <p className="text-sm text-gray-500">
            While offline, you can still view previously loaded pages and your saved data.
          </p>
        </div>
      </div>
    </div>
  )
}
