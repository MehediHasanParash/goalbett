"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react"

export function TenantFooter() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFooterConfig()
  }, [])

  const fetchFooterConfig = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/tenant/config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error("Error fetching footer config:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !config) {
    return null
  }

  const primaryColor = config.colors?.primary || "#FFD700"
  const secondaryColor = config.colors?.secondary || "#0A1A2F"

  return (
    <footer
      className="relative border-t overflow-hidden"
      style={{
        backgroundColor: secondaryColor,
        borderColor: `${primaryColor}30`,
      }}
    >
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}20 0%, transparent 50%, ${primaryColor}20 100%)`,
          animation: "gradient-shift 15s ease infinite",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            {config.emailBrand?.logoUrl ? (
              <img
                src={config.emailBrand.logoUrl || "/placeholder.svg"}
                alt={config.brandName}
                className="h-12 object-contain"
              />
            ) : (
              <h3 className="text-2xl font-bold" style={{ color: primaryColor }}>
                {config.brandName || "Brand"}
              </h3>
            )}
            <p className="text-sm text-gray-400">{config.brandSlogan || "Your Premier Betting Platform"}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: primaryColor }}>
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              {["Sports", "Casino", "Live Betting", "Promotions"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: primaryColor }}>
              Support
            </h4>
            <ul className="space-y-3 text-sm">
              {config.companyInfo?.supportEmail && (
                <li className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                  <a href={`mailto:${config.companyInfo.supportEmail}`} className="hover:text-white transition-colors">
                    {config.companyInfo.supportEmail}
                  </a>
                </li>
              )}
              {config.companyInfo?.supportPhone && (
                <li className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                  <a href={`tel:${config.companyInfo.supportPhone}`} className="hover:text-white transition-colors">
                    {config.companyInfo.supportPhone}
                  </a>
                </li>
              )}
              {config.companyInfo?.address && (
                <li className="flex items-start gap-2 text-gray-400">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                  <span>{config.companyInfo.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: primaryColor }}>
              Follow Us
            </h4>
            <div className="flex gap-4">
              {config.socialMedia?.facebook && (
                <a
                  href={config.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                  style={{
                    borderColor: `${primaryColor}40`,
                    backgroundColor: `${primaryColor}10`,
                    color: primaryColor,
                  }}
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {config.socialMedia?.twitter && (
                <a
                  href={config.socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                  style={{
                    borderColor: `${primaryColor}40`,
                    backgroundColor: `${primaryColor}10`,
                    color: primaryColor,
                  }}
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {config.socialMedia?.instagram && (
                <a
                  href={config.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                  style={{
                    borderColor: `${primaryColor}40`,
                    backgroundColor: `${primaryColor}10`,
                    color: primaryColor,
                  }}
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <p>
            &copy; {new Date().getFullYear()} {config.brandName || "Brand"}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Responsible Gaming
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            transform: translateX(-25%) translateY(-25%) rotate(0deg);
          }
          50% {
            transform: translateX(25%) translateY(25%) rotate(180deg);
          }
        }
      `}</style>
    </footer>
  )
}
