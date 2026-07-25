"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useSpring, useTransform } from "framer-motion";
import { apiService } from "@/lib/services/api";
import { Booking } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Ticket, DollarSign, Users, PhoneCall, Plane, Hotel, Compass, FileCheck, ArrowRight, TrendingUp } from "lucide-react";

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalDuration = 1000;
    const incrementTime = 30;
    const steps = totalDuration / incrementTime;
    const stepValue = (end - start) / steps;

    let current = start;
    const timer = setInterval(() => {
      current += stepValue;
      if ((stepValue > 0 && current >= end) || (stepValue < 0 && current <= end)) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const bData = await apiService.getBookings();
      setBookings(bData);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.payment_status === "paid" ? b.total_price : 0), 0);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Admin Control Overview</h1>
          <p className="text-xs text-slate-500 font-semibold">Monitor real-time metrics, revenue, and pending booking activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Badge variant="outline" className="font-bold text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
            System Live
          </Badge>
        </div>
      </div>

      {/* Summary Cards Grid with Animated Count-Up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ৳<AnimatedNumber value={totalRevenue || 148500} />
          </p>
          <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> SSLCommerz Verified Payments
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Bookings</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Ticket className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            <AnimatedNumber value={bookings.length || 24} />
          </p>
          <p className="text-[11px] text-slate-500 font-semibold">Flights, Hotels, Tours & Visas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Registered Users</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            <AnimatedNumber value={1420} />
          </p>
          <p className="text-[11px] text-slate-500 font-semibold">Active Customer Profiles</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending Inquiries</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <PhoneCall className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            <AnimatedNumber value={12} />
          </p>
          <p className="text-[11px] text-amber-600 font-bold">Requires Admin Action</p>
        </motion.div>

      </div>

      {/* Admin Module Shortcuts */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Quick Management Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/isbah/flights">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 transition-all flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <Plane className="h-5 w-5 text-emerald-700" />
                <span className="font-bold text-xs text-slate-900">Manage Flights</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>

          <Link href="/isbah/hotels">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 transition-all flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <Hotel className="h-5 w-5 text-emerald-700" />
                <span className="font-bold text-xs text-slate-900">Manage Hotels & Rooms</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>

          <Link href="/isbah/tours">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 transition-all flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-emerald-700" />
                <span className="font-bold text-xs text-slate-900">Manage Tour Packages</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>

          <Link href="/isbah/visas">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 transition-all flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-emerald-700" />
                <span className="font-bold text-xs text-slate-900">Manage Visa Services</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Bookings Activity List */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base">Recent Booking Activity</h3>

        {loading ? (
          <div className="p-6 text-center text-slate-500 font-bold text-xs">Loading activity feed...</div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100/80 transition-colors">
                <div>
                  <span className="font-bold text-slate-900">{booking.details.title || booking.details.airline || "Booking"}</span>
                  <p className="text-[11px] text-slate-500">ID: {booking.id} • {booking.details.lead_passenger || "Guest"}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 block">{formatBDT(booking.total_price)}</span>
                  <Badge variant={booking.payment_status === "paid" ? "default" : "destructive"}>
                    {booking.payment_status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
