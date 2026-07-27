"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiService } from "@/lib/services/api";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, CheckCircle2, FileCheck, Compass, Loader2, Trash2 } from "lucide-react";

interface InquiryItem {
  id: string;
  type: "visa" | "tour";
  name: string;
  phone: string;
  email: string;
  details: string;
  status: "new" | "contacted" | "closed";
  date: string;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadInquiries() {
    setLoading(true);
    try {
      const [visaInqs, tourInqs] = await Promise.all([
        apiService.getVisaInquiries(),
        apiService.getTourInquiries(),
      ]);

      const list: InquiryItem[] = [];

      visaInqs.forEach((v) => {
        list.push({
          id: v.id,
          type: "visa",
          name: v.name,
          phone: v.phone,
          email: v.email,
          details: v.additional_requirements || `Preferred Date: ${v.preferred_date || "Flexible"}`,
          status: v.status || "new",
          date: new Date(v.created_at).toLocaleString(),
        });
      });

      tourInqs.forEach((t) => {
        list.push({
          id: t.id,
          type: "tour",
          name: t.name,
          phone: t.phone,
          email: t.email,
          details: t.additional_requirements || `Journey Date: ${t.journey_date || "Flexible"}`,
          status: t.status || "new",
          date: new Date(t.created_at).toLocaleString(),
        });
      });

      // Sort newest first
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setInquiries(list);
    } catch (err) {
      console.warn("Error loading inquiries", err);
    }
    setLoading(false);
  }

  useSupabaseRealtime("visa_inquiries", loadInquiries);
  useSupabaseRealtime("tour_inquiries", loadInquiries);

  useEffect(() => {
    loadInquiries();

    const handleUpdate = () => loadInquiries();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("isbah_data_updated", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("isbah_data_updated", handleUpdate);
    };
  }, []);

  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      const storedUnread = JSON.parse(localStorage.getItem("isbah_unread_inquiries") || "[]");
      setUnreadIds(storedUnread);
    } catch {}
  }, []);

  const persistUnread = (newIds: string[]) => {
    setUnreadIds(newIds);
    try {
      localStorage.setItem("isbah_unread_inquiries", JSON.stringify(newIds));
      window.dispatchEvent(new CustomEvent("isbah_data_updated"));
    } catch {}
  };

  const handleToggleUnread = (id: string) => {
    if (unreadIds.includes(id)) {
      persistUnread(unreadIds.filter(item => item !== id));
    } else {
      persistUnread([...unreadIds, id]);
    }
    setContextMenu(null);
  };

  const handleMarkAllRead = () => {
    persistUnread([]);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const handleDeleteInquiry = async (inq: InquiryItem) => {
    if (confirm(`Are you sure you want to permanently delete inquiry from ${inq.name} (${inq.phone})? This action cannot be undone.`)) {
      apiService.deleteChatSession(inq.id);
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !inq.id.startsWith("sample-")) {
        try {
          const supabase = createClient();
          const table = inq.type === "visa" ? "visa_inquiries" : "tour_inquiries";
          await supabase.from(table).delete().eq("id", inq.id);
        } catch (err) {
          console.warn("Delete inquiry error", err);
        }
      }
      await apiService.logRankingChange({
        entity_type: "booking",
        entity_id: inq.id,
        old_rank: 0,
        new_rank: 0,
        old_visibility: true,
        new_visibility: false,
      });
      setInquiries((prev) => prev.filter((i) => i.id !== inq.id));
    }
  };

  const updateStatus = async (inq: InquiryItem, newStatus: "contacted" | "closed") => {
    setInquiries((prev) =>
      prev.map((item) => (item.id === inq.id ? { ...item, status: newStatus } : item))
    );

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !inq.id.startsWith("sample-")) {
      try {
        const supabase = createClient();
        const table = inq.type === "visa" ? "visa_inquiries" : "tour_inquiries";
        await supabase.from(table).update({ status: newStatus }).eq("id", inq.id);
      } catch (err) {
        console.warn("Error updating inquiry status in Supabase", err);
      }
    }
  };

  return (
    <div className="space-y-6" onClick={() => setContextMenu(null)}>

      {/* Right Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 w-48 text-xs font-bold space-y-1"
        >
          <button
            onClick={() => handleToggleUnread(contextMenu.id)}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-800"
          >
            <span>{unreadIds.includes(contextMenu.id) ? "Mark as Read" : "Mark as Unread"}</span>
            <PhoneCall className="h-4 w-4 text-blue-600" />
          </button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Inquiries & Callbacks</h1>
          <p className="text-xs text-slate-500 font-semibold">Right click any inquiry or tap phone controls to mark as unread / read.</p>
        </div>

        <div className="flex items-center gap-2">
          {unreadIds.length > 0 && (
            <Badge variant="destructive" className="font-bold text-[10px] animate-pulse">
              {unreadIds.length} Unread Callbacks
            </Badge>
          )}
          <Button onClick={handleMarkAllRead} size="sm" variant="outline" className="font-bold text-xs gap-1.5 rounded-xl border-slate-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Mark All as Read</span>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Type & Customer</th>
                <th className="p-4">Phone / Email</th>
                <th className="p-4">Inquiry Details</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-700 mb-1" />
                    <span>Loading Inquiries...</span>
                  </td>
                </tr>
              ) : inquiries.map((inq) => {
                const isUnread = unreadIds.includes(inq.id);
                return (
                  <tr
                    key={inq.id}
                    onContextMenu={(e) => handleContextMenu(e, inq.id)}
                    className={`hover:bg-slate-50 transition-colors ${isUnread ? "bg-blue-50/50" : ""}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse shrink-0" title="Unread Inquiry" />
                        )}
                        {inq.type === "visa" ? (
                          <FileCheck className="h-4 w-4 text-emerald-700" />
                        ) : (
                          <Compass className="h-4 w-4 text-amber-600" />
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{inq.name}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{inq.type} Request • {inq.date}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{inq.phone}</p>
                      <p className="text-[11px] text-slate-500">{inq.email}</p>
                    </td>
                    <td className="p-4">{inq.details}</td>
                    <td className="p-4">
                      <Badge variant={inq.status === "new" ? "destructive" : "default"} className="capitalize font-bold">
                        {inq.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleUnread(inq.id)}
                          title={isUnread ? "Mark as Read" : "Mark as Unread"}
                          className={`p-2 rounded-xl text-xs font-bold border transition-colors ${isUnread ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200"}`}
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </button>

                        {inq.status !== "contacted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(inq, "contacted")}
                            className="font-bold text-[11px] gap-1 rounded-xl text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
                          >
                            <PhoneCall className="h-3 w-3" />
                            <span>Mark Contacted</span>
                          </Button>
                        )}

                      {inq.status !== "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(inq, "closed")}
                          className="font-bold text-[11px] gap-1 rounded-xl text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Close</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteInquiry(inq)}
                        className="text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
