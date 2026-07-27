"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
    let list: InquiryItem[] = [];

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createClient();
        const [visaRes, tourRes] = await Promise.all([
          supabase.from("visa_inquiries").select("*").order("created_at", { ascending: false }),
          supabase.from("tour_inquiries").select("*").order("created_at", { ascending: false }),
        ]);

        if (visaRes.data) {
          visaRes.data.forEach((v: any) => {
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
        }

        if (tourRes.data) {
          tourRes.data.forEach((t: any) => {
            list.push({
              id: t.id,
              type: "tour",
              name: t.name,
              phone: t.phone,
              email: t.email,
              details: t.additional_requirements || `Journey Date: ${t.preferred_date || "Flexible"}`,
              status: t.status || "new",
              date: new Date(t.created_at).toLocaleString(),
            });
          });
        }
      } catch (err) {
        console.warn("Error fetching inquiries from Supabase", err);
      }
    }

    // Add fallback sample inquiries if DB is empty
    if (list.length === 0) {
      list = [
        {
          id: "inq-1",
          type: "visa",
          name: "Tariqul Islam",
          phone: "+880 1711-998877",
          email: "tariq@example.com",
          details: "Saudi Arabia Umrah Visa Assistance for 4 Family Members",
          status: "new",
          date: new Date().toLocaleString(),
        },
        {
          id: "inq-2",
          type: "tour",
          name: "Nusrat Jahan",
          phone: "+880 1819-334455",
          email: "nusrat@example.com",
          details: "Customization inquiry for Cox's Bazar 3D2N Package",
          status: "new",
          date: new Date().toLocaleString(),
        },
      ];
    }

    setInquiries(list);
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

  const handleDeleteInquiry = async (inq: InquiryItem) => {
    if (confirm(`Delete inquiry from ${inq.name}?`)) {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !inq.id.startsWith("sample-")) {
        try {
          const supabase = createClient();
          const table = inq.type === "visa" ? "visa_inquiries" : "tour_inquiries";
          await supabase.from(table).delete().eq("id", inq.id);
        } catch (err) {
          console.warn("Delete inquiry error", err);
        }
      }
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
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Inquiries & Callbacks</h1>
          <p className="text-xs text-slate-500 font-semibold">View live customer visa assistance forms and tour callback requests from Supabase.</p>
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
              ) : inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
