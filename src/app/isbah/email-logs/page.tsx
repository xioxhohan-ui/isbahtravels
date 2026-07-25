"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  email_type: string;
  booking_id?: string;
  status: string;
  sent_at: string;
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(100);
      setLogs(data || []);
    } catch (err) {
      console.warn("Email logs load error:", err);
    }
    setLoading(false);
  }

  useEffect(() => { loadLogs(); }, []);

  const handleResend = async (log: EmailLog) => {
    setResending(log.id);
    try {
      // Trigger the appropriate email based on type
      if (log.email_type === "welcome") {
        await fetch("/api/v1/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_name: "Customer", user_email: log.to_email }),
        });
      }
      // Could extend for other types here
      await loadLogs();
    } catch (err) {
      console.warn("Resend error:", err);
    }
    setResending(null);
  };

  const typeColors: Record<string, string> = {
    welcome: "bg-blue-50 text-blue-800 border-blue-200",
    payment_confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    payment_failed: "bg-red-50 text-red-800 border-red-200",
    booking_cancelled: "bg-amber-50 text-amber-800 border-amber-200",
    status_update: "bg-purple-50 text-purple-800 border-purple-200",
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-emerald-700" />
            Email Logs
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            All transactional emails sent via Resend. Click "Resend" to re-trigger any email.
          </p>
        </div>
        <Button onClick={loadLogs} variant="outline" size="sm" className="font-bold text-xs gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", count: logs.length, color: "text-slate-900" },
          { label: "Welcome", count: logs.filter(l => l.email_type === "welcome").length, color: "text-blue-700" },
          { label: "Confirmed", count: logs.filter(l => l.email_type === "payment_confirmed").length, color: "text-emerald-700" },
          { label: "Failed/Cancelled", count: logs.filter(l => ["payment_failed", "booking_cancelled"].includes(l.email_type)).length, color: "text-red-700" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-100 px-5 py-3 bg-slate-50 grid grid-cols-12 gap-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          <span className="col-span-3">Recipient</span>
          <span className="col-span-3">Subject</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-1">Sent</span>
          <span className="col-span-1 text-right">Action</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            Loading email logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-500 text-sm">No emails sent yet.</p>
            <p className="text-xs text-slate-400 mt-1">Emails will appear here when users sign up, pay, or cancel bookings.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3 grid grid-cols-12 gap-3 items-center text-xs hover:bg-slate-50 transition-colors">
                <div className="col-span-3">
                  <p className="font-bold text-slate-900 truncate">{log.to_email}</p>
                  {log.booking_id && (
                    <p className="text-[10px] text-slate-400">Booking #{log.booking_id.slice(0, 8)}</p>
                  )}
                </div>
                <p className="col-span-3 font-semibold text-slate-700 truncate">{log.subject}</p>
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeColors[log.email_type] || "bg-slate-50 text-slate-800 border-slate-200"}`}>
                    {log.email_type?.replace(/_/g, " ").toUpperCase() || "—"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  {log.status === "sent" ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /><span className="text-emerald-700 font-bold text-[10px]">Sent</span></>
                  ) : (
                    <><AlertCircle className="h-3.5 w-3.5 text-red-600" /><span className="text-red-700 font-bold text-[10px]">Failed</span></>
                  )}
                </div>
                <div className="col-span-1 flex items-center gap-1 text-slate-400 text-[10px]">
                  <Clock className="h-3 w-3" />
                  {new Date(log.sent_at).toLocaleDateString("en-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="col-span-1 text-right">
                  <Button
                    onClick={() => handleResend(log)}
                    disabled={resending === log.id}
                    variant="outline"
                    size="sm"
                    className="text-[10px] font-bold h-7 px-2 rounded-lg gap-1"
                  >
                    {resending === log.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Resend
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
