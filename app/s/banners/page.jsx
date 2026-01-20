"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { BannerManagement } from "@/components/admin/banner-management"

export default function BannersPage() {
  return (
    <SuperAdminLayout title="Banner Management" description="Manage promotional banners across all tenants">
      <BannerManagement isSuperAdmin={true} />
    </SuperAdminLayout>
  )
}
