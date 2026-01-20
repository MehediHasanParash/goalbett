"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { AdminAnalytics } from "@/components/admin/admin-analytics"

export default function AnalyticsPage() {
  return (
    <SuperAdminLayout title="Analytics" description="Platform performance and insights">
      <AdminAnalytics />
    </SuperAdminLayout>
  )
}
