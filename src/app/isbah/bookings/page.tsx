"use client";

import { useState, useEffect } from "react";
import { apiService } from "@/lib/services/api";
import { Booking } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";
import { Ticket, Printer, RefreshCw } from "lucide-react";

export default function AdminBookingsPage() {
  // Real-time updates for Admin Bookings table
  useSupabaseRealtime("bookings", ["bookings"]);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await apiService.getBookings();
      setBookings(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredBookings = filterStatus === "all"
    ? bookings
    : bookings.filter(b => b.booking_status === filterStatus || b.payment_status === filterStatus);

  const toggleBookingStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "confirmed" ? "cancelled" : "confirmed";
    setBookings(prev =>
      prev.map(b => (b.id === id ? { ...b, booking_status: nextStatus as any } : b))
    );
  };

  const handleOpenReceipt = (bookingId: string) => {
    window.open(`/api/receipt?booking_id=${bookingId}`, "_blank");
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Customer Bookings</h1>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <RefreshCw className="h-3 w-3 animate-spin" /> Real-time Subscribed
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold">View, filter, and update status for flight, hotel, and tour reservations in real-time.</p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          {["all", "confirmed", "pending", "paid"].map((st) => (
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

      {/* Bookings Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Type & Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Loading bookings...</td>
                </tr>
              ) : filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{b.id}</td>
                  <td className="p-4">
                    <span className="font-bold block text-slate-900">{b.details.title || b.details.airline || "Reservation"}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{b.booking_type}</span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{b.details.customer_name || b.details.lead_passenger || "Mohammad Rahman"}</p>
                    <p className="text-[11px] text-slate-500">{b.details.customer_phone || b.details.phone || "+880 1711-223344"}</p>
                  </td>
                  <td className="p-4 font-black text-slate-900">{formatBDT(b.total_price)}</td>
                  <td className="p-4">
                    <Badge variant={b.payment_status === "paid" ? "default" : "destructive"}>
                      {b.payment_status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={b.booking_status === "confirmed" ? "gold" : "secondary"}>
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
                        <span>PDF Receipt</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleBookingStatus(b.id, b.booking_status)}
                        className="text-xs font-bold rounded-xl"
                      >
                        {b.booking_status === "confirmed" ? "Cancel Order" : "Confirm Order"}
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
