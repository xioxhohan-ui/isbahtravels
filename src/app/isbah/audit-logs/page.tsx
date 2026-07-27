"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Search, Filter, RefreshCw, Calendar, UserCheck, Database, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
  details: string;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "aud-901",
    admin_email: "admin@isbahtravels.com",
    action: "UPDATE_RANKING",
    table_name: "hotels",
    record_id: "ht-101",
    created_at: "2026-07-27T12:04:30Z",
    details: "Starred hotel Sea Pearl Resort (Star Rank: 100, Admin Rank: 85, Display Order: 100,085).",
  },
  {
    id: "aud-902",
    admin_email: "admin@isbahtravels.com",
    action: "CONFIRM_BOOKING",
    table_name: "bookings",
    record_id: "bk-1001",
    created_at: "2026-07-27T11:45:10Z",
    details: "Updated payment_status to 'paid' and generated PDF e-ticket receipt.",
  },
];

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [allLogs, setAllLogs] = useState<AuditLog[]>(mockAuditLogs);

  const loadLogs = () => {
    try {
      const storedRankingLogs = JSON.parse(localStorage.getItem("isbah_ranking_logs") || "[]");
      const convertedRankingLogs: AuditLog[] = storedRankingLogs.map((rl: any) => ({
        id: rl.id,
        admin_email: rl.admin_id || "admin@isbahtravels.com",
        action: `UPDATE_RANKING_${rl.entity_type.toUpperCase()}`,
        table_name: `${rl.entity_type}s`,
        record_id: rl.entity_id,
        created_at: rl.created_at,
        details: `Updated ${rl.entity_type} ID ${rl.entity_id.slice(0, 12)}: Rank Priority changed from ${rl.old_rank} to ${rl.new_rank}. Homepage Visibility: ${rl.new_visibility ? "Visible" : "Hidden"}.`,
      }));
      const combined = [...convertedRankingLogs, ...mockAuditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAllLogs(combined);
    } catch {
      setAllLogs(mockAuditLogs);
    }
  };

  useEffect(() => {
    loadLogs();
    window.addEventListener("isbah_data_updated", loadLogs);
    return () => window.removeEventListener("isbah_data_updated", loadLogs);
  }, []);

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.admin_email.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
    return matchesSearch && matchesTable;
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-2xl font-black text-slate-900">Security Audit Logs</h1>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <ShieldAlert className="h-3 w-3" /> System Immutable Audit Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            Track and inspect every administrative mutation, schema update, and status change across Isbah Travels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Logs</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, admin email, or log details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-bold outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none"
          >
            <option value="all">All Tables</option>
            <option value="hotels">hotels</option>
            <option value="bookings">bookings</option>
            <option value="flights">flights</option>
            <option value="profiles">profiles</option>
            <option value="hotel_reviews">hotel_reviews</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Log ID & Timestamp</th>
                <th className="p-4">Admin Email</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Target Table</th>
                <th className="p-4">Details Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block">{log.id}</span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(log.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                      {log.admin_email}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-slate-700 flex items-center gap-1 text-xs">
                      <Database className="h-3.5 w-3.5 text-slate-400" />
                      {log.table_name}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-600 max-w-xs truncate">
                    {log.details}
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
