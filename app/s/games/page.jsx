"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import GamesLibrary from "@/components/provider/games-library"

export default function GamesPage() {
  return (
    <SuperAdminLayout title="Games Library" description="Manage casino games and slot configurations">
      <GamesLibrary />
    </SuperAdminLayout>
  )
}
