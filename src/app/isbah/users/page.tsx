"use client";

import { useState } from "react";
import { MOCK_PROFILE } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserX, ShieldCheck } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([
    MOCK_PROFILE,
    {
      id: "usr-2",
      email: "tariq@example.com",
      phone: "+880 1819-223344",
      display_name: "Tariqul Islam",
      passport_number: "BN-44120912",
      role: "user" as const,
      created_at: "2026-02-10T00:00:00Z",
      updated_at: "2026-02-10T00:00:00Z",
    },
  ]);

  const handleDeactivate = (id: string) => {
    if (confirm("Deactivate user profile?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Registered Users</h1>
          <p className="text-xs text-slate-500 font-semibold">View customer profile details, passport status, and account deactivation.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Passport #</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{u.display_name}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">{u.phone || "N/A"}</td>
                  <td className="p-4 font-bold">{u.passport_number || "Pending"}</td>
                  <td className="p-4 uppercase">
                    <Badge variant="outline" className="font-bold">{u.role}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleDeactivate(u.id)} className="text-rose-600 hover:bg-rose-50 text-xs font-bold gap-1 rounded-xl">
                      <UserX className="h-4 w-4" />
                      <span>Deactivate</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
