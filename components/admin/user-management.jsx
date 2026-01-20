"use client";
import { useState } from "react";
import { Card3D } from "@/components/ui/3d-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Search, Filter, MoreVertical, Mail, Phone } from "lucide-react";
import AdminSidebar from "./admin-sidebar";

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      balance: "$1,250",
      status: "Active",
      joined: "Jan 15, 2025",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1234567891",
      balance: "$850",
      status: "Active",
      joined: "Jan 20, 2025",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      phone: "+1234567892",
      balance: "$2,100",
      status: "Suspended",
      joined: "Jan 10, 2025",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5] p-6">
      <div className="max-w-7xl mx-auto mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage and monitor all users</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#B8C5D6]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-full bg-[#1A2F45] border border-[#2A3F55] rounded-xl text-[#F5F5F5] placeholder-[#B8C5D6] focus:outline-none focus:border-[#FFD700]"
            />
          </div>
          <AnimatedButton variant="glass" className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter
          </AnimatedButton>
        </div>

        <Card3D>
          <div className="glass p-6 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A3F55]">
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                      Contact
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                      Balance
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                      Joined
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#2A3F55]/50 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-green-400">
                        {user.balance}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.status === "Active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {user.joined}
                      </td>
                      <td className="py-4 px-4">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card3D>
      </div>
    </div>
  );
}
