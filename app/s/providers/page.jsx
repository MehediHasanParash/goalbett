"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { ProviderManagement } from "@/components/admin/provider-management"

export default function ProvidersPage() {
  return (
    <SuperAdminLayout title="Provider Management" description="Manage game and payment providers">
      <ProviderManagement />
    </SuperAdminLayout>
  )
}
