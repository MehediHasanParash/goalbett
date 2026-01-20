// Super Admin Layout - Betengin.com
import { TenantProvider } from "@/components/providers/tenant-provider"

export const metadata = {
  title: "Betengin - Super Admin Platform",
  description: "Platform administration and provider management for betting operators",
  icons: {
    icon: "/icon.svg",
  },
}

export default function SuperAdminLayout({ children }) {
  return (
    <TenantProvider tenant="super" context="super-admin">
      {children}
    </TenantProvider>
  )
}
