"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { SuperAdminTenantManagement } from "@/components/admin/super-admin-tenant-management"

export default function TenantManagementPage() {
  return (
    <SuperAdminLayout title="Tenant Management" description="Create and manage all tenants on the platform">
      <SuperAdminTenantManagement />
    </SuperAdminLayout>
  )
}
