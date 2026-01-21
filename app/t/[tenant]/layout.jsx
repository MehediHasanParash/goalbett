"use client"

import { use } from "react"
import { TenantProvider } from "@/components/providers/tenant-provider"

export default function TenantLayout({ children, params }) {
  const resolvedParams = use(params)
  const { tenant } = resolvedParams

  const pathname = typeof window !== "undefined" ? window.location.pathname : ""

  let context = "public"
  if (pathname.includes("/admin")) {
    context = "tenant-admin"
  } else if (pathname.includes("/agent")) {
    context = "agent"
  }

  return (
    <TenantProvider tenant={tenant} context={context}>
      {children}
    </TenantProvider>
  )
}
