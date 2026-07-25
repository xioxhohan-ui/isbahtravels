"use client";

import { useState, useEffect } from "react";
import { apiService } from "@/lib/services/api";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserX, ShieldCheck, RefreshCw } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
          if (!error && data) {
            setUsers(data as Profile[]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Supabase fetch users warning", err);
        }
      }
      setUsers([]);
      setLoading(false);
    }
    loadUsers();
  }, []);

  const handleDeactivate = async (id: string) => {
    if (confirm("Deactivate user profile?")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const supabase = createClient();
          await supabase.from("profiles").delete().eq("id", id);
        } catch (err) {
          console.warn("Delete profile error", err);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-2xl font-black text-slate-900">Registered Database Accounts ({users.length})</h1>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <RefreshCw className="h-3 w-3" /> Live Supabase Database
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            Real user accounts created via Sign Up page are stored directly in Supabase Postgres `profiles` table.
          </p>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">Loading user database...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-bold">
                    No accounts found in database. Create a new account from the Sign Up page!
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{u.display_name || "New Customer"}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">{u.phone || "Pending"}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
