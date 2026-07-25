"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Booking } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";
import { Ticket, Printer, RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function AdminBookingsPage() {
  useSupabaseRealtime("bookings", ["bookings"]);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      setBookings((data || []) as Booking[]);
    } catch (err) {
      console.warn("Bookings load error:", err);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filteredBookings = filterStatus === "all"
    ? bookings
    : bookings.filter(b => b.booking_status === filterStatus || b.payment_status === filterStatus);

  const handleToggleStatus = async (booking: Booking) => {
    const nextStatus = booking.booking_status === "confirmed" ? "cancelled" : "confirmed";
    setUpdating(booking.id);

    try {
      const supabase = createClient();

      // 1. Persist to Supabase
      await supabase
        .from("bookings")
        .update({ booking_status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", booking.id);

      // 2. Update local state
      setBookings(prev =>
        prev.map(b => b.id === booking.id ? { ...b, booking_status: nextStatus as any } : b)
      );

      // 3. Trigger email notification to the user
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", booking.user_id)
        .single();

      if (profile?.email) {
        await fetch("/api/v1/email/status-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_name: profile.display_name || "Valued Customer",
            user_email: profile.email,
            booking_id: booking.id,
            booking_title: booking.details?.title || booking.details?.airline || `${booking.booking_type} Booking`,
            new_status: nextStatus,
            note: `Your booking has been ${nextStatus} by our admin team.`,
          }),
        }).catch(() => {});
      }

      setToast({ msg: `Booking ${nextStatus} and email sent to customer.`, ok: true });
    } catch (err: any) {
      setToast({ msg: `Error: ${err.message}`, ok: false });
    }

    setUpdating(null);
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenReceipt = (bookingId: string) => {
    window.open(`/api/receipt?booking_id=${bookingId}`, "_blank");
  };

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-white text-xs font-bold ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Customer Bookings</h1>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <RefreshCw className="h-3 w-3 animate-spin" /> Real-time
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Status updates are saved to Supabase and trigger automatic email notifications to customers.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "confirmed", "pending", "cancelled", "paid"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                filterStatus === st
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", count: bookings.length, color: "text-slate-900" },
          { label: "Confirmed", count: bookings.filter(b => b.booking_status === "confirmed").length, color: "text-emerald-700" },
          { label: "Pending", count: bookings.filter(b => b.booking_status === "pending").length, color: "text-amber-600" },
          { label: "Cancelled", count: bookings.filter(b => b.booking_status === "cancelled").length, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Type & Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                      Loading bookings...
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    <Ticket className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                    No bookings found for this filter.
                  </td>
                </tr>
              ) : filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 font-mono text-[10px]">{b.id?.slice(0, 12)}…</td>
                  <td className="p-4">
                    <span className="font-bold block text-slate-900">{b.details.title || b.details.airline || "Reservation"}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{b.booking_type}</span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{b.details.customer_name || b.details.lead_passenger || "—"}</p>
                    <p className="text-[11px] text-slate-500">{b.details.customer_email || b.details.customer_phone || "—"}</p>
                  </td>
                  <td className="p-4 font-black text-slate-900">{formatBDT(b.total_price)}</td>
                  <td className="p-4">
                    <Badge variant={b.payment_status === "paid" ? "default" : "destructive"}>
                      {b.payment_status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={b.booking_status === "confirmed" ? "default" : "secondary"}>
                      {b.booking_status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReceipt(b.id)}
                        className="text-xs font-bold rounded-xl gap-1"
                      >
                        <Printer className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Receipt</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating === b.id}
                        onClick={() => handleToggleStatus(b)}
                        className={`text-xs font-bold rounded-xl gap-1 ${
                          b.booking_status === "confirmed"
                            ? "text-red-700 border-red-200 hover:bg-red-50"
                            : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        {updating === b.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : b.booking_status === "confirmed" ? (
                          <><XCircle className="h-3.5 w-3.5" /><span>Cancel</span></>
                        ) : (
                          <><CheckCircle2 className="h-3.5 w-3.5" /><span>Confirm</span></>
                        )}
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
