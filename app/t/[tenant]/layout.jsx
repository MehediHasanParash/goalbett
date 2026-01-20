// Tenant Layout (backwards compatibility fallback)
import { TenantProvider } from "@/components/providers/tenant-provider"

export default function TenantLayout({ children, params }) {
  const { tenant } = params

  // This is legacy path-based routing fallback
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
