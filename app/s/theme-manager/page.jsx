"use client"

import { useState } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Home, FileText, Upload, Save } from "lucide-react"

export default function ThemeManagerPage() {
  const [colors, setColors] = useState({
    primary: "#FFD700",
    secondary: "#0A1A2F",
    accent: "#4A90E2",
    background: "#0D1F35",
    text: "#F5F5F5",
  })

  return (
    <SuperAdminLayout title="White-Label Theme Manager" description="Customize branding and appearance for tenants">
      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="bg-[#0D1F35]/80 border border-[#2A3F55]">
          <TabsTrigger value="colors" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Palette className="mr-2 h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="homepage" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Home className="mr-2 h-4 w-4" />
            Homepage
          </TabsTrigger>
          <TabsTrigger value="footer" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <FileText className="mr-2 h-4 w-4" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="assets" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Upload className="mr-2 h-4 w-4" />
            Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Brand Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-[#B8C5D6] capitalize">{key} Color</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-10 rounded-lg border border-[#2A3F55]"
                        style={{ backgroundColor: value }}
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                        className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
                  <Save className="w-4 h-4 mr-2" />
                  Save Colors
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homepage">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Homepage Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#B8C5D6]">Configure homepage layout, hero banners, and featured sections.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Footer Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#B8C5D6]">Configure footer links, social media, and legal information.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Asset Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#B8C5D6]">Upload logos, favicons, and other brand assets.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SuperAdminLayout>
  )
}
