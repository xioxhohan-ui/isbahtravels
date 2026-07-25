"use client";

import { useState } from "react";
import { ShieldAlert, Search, Filter, RefreshCw, Calendar, UserCheck, Database } from "lucide-react";
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
    admin_email: "isbah41.com",
    action: "UPDATE_HOTEL_NEARBY",
    table_name: "hotels",
    record_id: "ht-101",
    created_at: "2026-07-25T12:04:30Z",
    details: "Auto-collected Google Places 1km landmarks for Sea Pearl Beach Resort.",
  },
  {
    id: "aud-902",
    admin_email: "isbah41.com",
    action: "CONFIRM_BOOKING",
    table_name: "bookings",
    record_id: "bk-1001",
    created_at: "2026-07-25T11:45:10Z",
    details: "Updated payment_status to 'paid' and generated PDF e-ticket receipt.",
  },
  {
    id: "aud-903",
    admin_email: "isbah41.com",
    action: "CREATE_FLIGHT",
    table_name: "flights",
    record_id: "fl-302",
    created_at: "2026-07-25T10:12:00Z",
    details: "Added Biman Bangladesh flight BG-433 Dhaka to Cox's Bazar.",
  },
  {
    id: "aud-904",
    admin_email: "isbah41.com",
    action: "TOGGLE_USER_ROLE",
    table_name: "profiles",
    record_id: "usr-441",
    created_at: "2026-07-25T09:30:15Z",
    details: "Updated user role for Mohammad Rahman to 'admin'.",
  },
  {
    id: "aud-905",
    admin_email: "isbah41.com",
    action: "DELETE_REVIEW",
    table_name: "hotel_reviews",
    record_id: "rev-501",
    created_at: "2026-07-25T08:15:00Z",
    details: "Moderated offensive hotel review.",
  },
];

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");

  const filteredLogs = mockAuditLogs.filter((log) => {
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
