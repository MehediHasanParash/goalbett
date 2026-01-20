"use client"

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F]">
      {/* Main Content */}
      <main className="w-full overflow-auto">{children}</main>
    </div>
  )
}
