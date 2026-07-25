"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiService } from "@/lib/services/api";
import { Booking } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, CheckCircle2, Printer, ShieldCheck, Plane, Hotel, Compass, FileCheck, Download } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("status");
  const newBookingId = searchParams.get("booking_id");
  const tranId = searchParams.get("tran_id");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserBookings() {
      setLoading(true);
      const data = await apiService.getBookings();
      setBookings(data);
      setLoading(false);
    }
    loadUserBookings();
  }, []);

  const handleOpenReceipt = (bookingId: string) => {
    window.open(`/api/receipt?booking_id=${bookingId}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white text-slate-900">
      
      {/* Payment Success Toast */}
      {paymentStatus === "paid" && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-extrabold text-sm">SSLCommerz Payment Successful!</p>
              <p className="text-xs text-emerald-100 font-medium">
                Your booking #{newBookingId || "bk-1001"} is confirmed. Transaction ID: {tranId || "SSL-BKASH-982143"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenReceipt(newBookingId || "bk-1001")}
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs gap-1 rounded-xl"
          >
            <Download className="h-4 w-4 text-emerald-700" />
            <span>Download PDF Receipt</span>
          </Button>
        </div>
      )}

      {/* User Header Banner */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white font-extrabold text-xl shadow-xs">
            MR
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Customer Dashboard</span>
            <h1 className="font-outfit text-2xl font-black text-slate-900">Mohammad Rahman</h1>
            <p className="text-xs text-slate-500 font-semibold">rahman@example.com • +880 1711-223344</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 text-xs font-semibold">
          <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
          <div>
            <p className="font-bold text-slate-900">Passport Verified</p>
            <p className="text-slate-500">BN-98214309 • Bangladesh</p>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-emerald-700" />
            My Bookings & E-Tickets
          </h3>
          <span className="text-xs font-bold text-slate-500">{bookings.length} Orders</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading your dashboard...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-300 rounded-3xl">
            No active bookings found.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const typeIcon = booking.booking_type === "flight" ? Plane : booking.booking_type === "hotel" ? Hotel : booking.booking_type === "visa" ? FileCheck : Compass;
              const Icon = typeIcon;

              return (
                <div
                  key={booking.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900 font-bold border border-slate-200">
                        <Icon className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                          Booking ID: #{booking.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {booking.details.title || booking.details.airline || `${booking.booking_type.toUpperCase()} Booking`}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={booking.payment_status === "paid" ? "default" : "destructive"}>
                        {booking.payment_status.toUpperCase()}
                      </Badge>
                      <Badge variant={booking.booking_status === "confirmed" ? "gold" : "secondary"}>
                        {booking.booking_status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Lead Passenger</span>
                      <span className="font-bold text-slate-900">{booking.details.lead_passenger || "Mohammad Rahman"}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Gateway</span>
                      <span className="font-bold text-emerald-700">{booking.payment_details.method || "SSLCommerz bKash"}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Amount Paid</span>
                      <span className="font-black text-slate-900 text-sm">{formatBDT(booking.total_price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Transaction ID: {booking.payment_details.transaction_id || "SSL-BKASH-982143"}
                    </span>

                    <Button onClick={() => handleOpenReceipt(booking.id)} size="sm" variant="outline" className="gap-1.5 font-bold rounded-xl text-xs">
                      <Printer className="h-4 w-4 text-emerald-700" />
                      <span>Download PDF Receipt</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
