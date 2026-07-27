"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Booking } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";
import { apiService } from "@/lib/services/api";
import {
  Ticket,
  Printer,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Phone,
  Mail,
  Calendar,
  FileText,
  Download,
  X,
  CreditCard,
  User,
  Trash2
} from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [selectedBookingModal, setSelectedBookingModal] = useState<Booking | null>(null);

  async function loadData() {
    try {
      const data = await apiService.getBookings();
      setBookings(data);
    } catch (err) {
      console.warn("Bookings load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useSupabaseRealtime("bookings", loadData);

  useEffect(() => {
    loadData();

    const handleDataUpdate = () => loadData();
    window.addEventListener("storage", handleDataUpdate);
    window.addEventListener("isbah_data_updated", handleDataUpdate);

    return () => {
      window.removeEventListener("storage", handleDataUpdate);
      window.removeEventListener("isbah_data_updated", handleDataUpdate);
    };
  }, []);

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

      // 3. Update modal state if open
      if (selectedBookingModal?.id === booking.id) {
        setSelectedBookingModal(prev => prev ? { ...prev, booking_status: nextStatus as any } : null);
      }

      // 4. Trigger email notification to the user
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

      setToast({ msg: `Booking ${nextStatus} and notification sent to customer.`, ok: true });
    } catch (err: any) {
      setToast({ msg: `Error: ${err.message}`, ok: false });
    }

    setUpdating(null);
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenReceipt = (bookingId: string, download = false) => {
    const url = `/api/receipt?booking_id=${bookingId}${download ? "&download=true" : ""}`;
    window.open(url, "_blank");
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm(`Are you sure you want to delete booking #${id}? This action cannot be undone.`)) {
      await apiService.deleteBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
      if (selectedBookingModal?.id === id) {
        setSelectedBookingModal(null);
      }
      setToast({ msg: `Booking #${id} deleted successfully.`, ok: true });
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-white text-xs font-bold ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Customer Bookings</h1>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <RefreshCw className="h-3 w-3" /> Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            View full booking records, customer phone numbers, receipts, and confirm/cancel status.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "confirmed", "pending", "paid", "cancelled"].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                filterStatus === st
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
                <th className="p-4">Customer & Phone</th>
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
              ) : filteredBookings.map((b) => {
                const phoneNum = b.details?.customer_phone || b.details?.phone || "+880 1711-998877";
                return (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 font-mono text-[10px]">{b.id?.slice(0, 12)}</td>
                    <td className="p-4">
                      <span className="font-bold block text-slate-900">{b.details?.title || b.details?.airline || "Reservation"}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{b.booking_type}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{b.details?.customer_name || b.details?.lead_passenger || "Valued Customer"}</p>
                      <p className="text-[11px] font-bold text-emerald-700">{phoneNum}</p>
                      <p className="text-[10px] text-slate-500">{b.details?.customer_email || b.details?.email || "customer@example.com"}</p>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBookingModal(b)}
                          className="text-xs font-bold rounded-xl gap-1 bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReceipt(b.id, false)}
                          className="text-xs font-bold rounded-xl gap-1"
                        >
                          <Printer className="h-3.5 w-3.5 text-emerald-700" />
                          <span>PDF</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updating === b.id}
                          onClick={() => handleToggleStatus(b)}
                          className={`text-xs font-bold rounded-xl gap-1 ${
                            b.booking_status === "confirmed"
                              ? "text-amber-700 border-amber-200 hover:bg-amber-50"
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

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBooking(b.id)}
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

      {/* Full Booking Details Modal */}
      {selectedBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Full Reservation Specification</span>
                <h3 className="font-outfit text-xl font-black text-slate-900">
                  Booking Specification #{selectedBookingModal.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBookingModal(null)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Type:</span>
                <Badge variant="outline" className="font-extrabold uppercase">{selectedBookingModal.booking_type}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Booking Status:</span>
                <Badge variant={selectedBookingModal.booking_status === "confirmed" ? "default" : "secondary"}>
                  {selectedBookingModal.booking_status.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Payment:</span>
                <Badge variant={selectedBookingModal.payment_status === "paid" ? "default" : "destructive"}>
                  {selectedBookingModal.payment_status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4 text-emerald-700" />
                Customer Contact Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Customer Full Name</span>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {selectedBookingModal.details?.customer_name || selectedBookingModal.details?.lead_passenger || "Customer"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Customer Phone Number (Required)
                  </span>
                  <p className="font-black text-emerald-950 text-sm">
                    {selectedBookingModal.details?.customer_phone || selectedBookingModal.details?.phone || "+880 1711-998877"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email Address
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedBookingModal.details?.customer_email || selectedBookingModal.details?.email || "customer@example.com"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <FileText className="h-3 w-3" /> NID / Passport Document #
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedBookingModal.details?.nid_or_passport || selectedBookingModal.details?.passport_number || "Not Provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Reservation Line Item Details */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Ticket className="h-4 w-4 text-emerald-700" />
                Package / Service Specification
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Service Title:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {selectedBookingModal.details?.title || selectedBookingModal.details?.airline || `${selectedBookingModal.booking_type.toUpperCase()} Booking`}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Travel / Journey Date:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {selectedBookingModal.details?.travel_date || new Date(selectedBookingModal.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Guests / Passenger Count:</span>
                  <span className="font-bold text-slate-900">
                    {selectedBookingModal.details?.guests_count || 1} Person(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Financial Summary */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount BDT</span>
                  <p className="text-2xl font-black text-emerald-400">
                    {formatBDT(selectedBookingModal.total_price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Channel</span>
                  <p className="text-xs font-bold text-slate-200 flex items-center gap-1 justify-end">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                    {selectedBookingModal.payment_details?.method || "SSLCommerz Online Payment"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    TxID: {selectedBookingModal.payment_details?.transaction_id || `ISBAH-SSL-${selectedBookingModal.id}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleOpenReceipt(selectedBookingModal.id, true)}
                  className="gap-1.5 font-bold text-xs rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF Receipt</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenReceipt(selectedBookingModal.id, false)}
                  className="gap-1.5 font-bold text-xs rounded-xl"
                >
                  <Printer className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Print View</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updating === selectedBookingModal.id}
                  onClick={() => handleToggleStatus(selectedBookingModal)}
                  className={`font-bold text-xs rounded-xl gap-1 ${
                    selectedBookingModal.booking_status === "confirmed"
                      ? "text-red-700 border-red-200 hover:bg-red-50"
                      : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  {updating === selectedBookingModal.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : selectedBookingModal.booking_status === "confirmed" ? (
                    <><XCircle className="h-3.5 w-3.5" /><span>Cancel Booking</span></>
                  ) : (
                    <><CheckCircle2 className="h-3.5 w-3.5" /><span>Confirm Booking</span></>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteBooking(selectedBookingModal.id)}
                  className="font-bold text-xs rounded-xl gap-1 text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Booking</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedBookingModal(null)}
                  className="font-bold text-xs rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
