"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { ShieldX, Globe, MapPin, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function GeoBlockedContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason") || "This service is not available in your region"
  const country = searchParams.get("country") || "your country"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-gray-800/50 border-red-500/30 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
                <ShieldX className="w-12 h-12 text-red-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border-2 border-red-500/50">
                <Globe className="w-4 h-4 text-red-400" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
            <p className="text-gray-400">This service is not available in your location</p>
          </div>

          {/* Country Info */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>
                Detected Location: <strong className="text-white">{country}</strong>
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 text-left">{reason}</p>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support with your account details.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              onClick={() => (window.location.href = "mailto:support@goalbett.com")}
            >
              Contact Support
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function GeoBlockedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      }
    >
      <GeoBlockedContent />
    </Suspense>
  )
}
