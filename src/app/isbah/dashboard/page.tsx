"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatBDT } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Ticket, DollarSign, Users, PhoneCall, Plane, Hotel, Compass,
  FileCheck, ArrowRight, TrendingUp, Mail, Loader2,
} from "lucide-react";

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

interface DashStats {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  pendingInquiries: number;
  recentBookings: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashStats>({
    totalRevenue: 0,
    totalBookings: 0,
    totalUsers: 0,
    pendingInquiries: 0,
    recentBookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveStats() {
      setLoading(true);
      try {
        const supabase = createClient();

        // Run all queries in parallel
        const [bookingsRes, profilesRes, visaInqRes, tourInqRes] = await Promise.all([
          supabase.from("bookings").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("id", { count: "exact" }),
          supabase.from("visa_inquiries").select("id", { count: "exact" }).eq("status", "new"),
          supabase.from("tour_inquiries").select("id", { count: "exact" }).eq("status", "new"),
        ]);

        const bookings = bookingsRes.data || [];
        const totalRevenue = bookings
          .filter((b) => b.payment_status === "paid")
          .reduce((sum: number, b: any) => sum + Number(b.total_price), 0);

        setStats({
          totalRevenue,
          totalBookings: bookings.length,
          totalUsers: profilesRes.count || 0,
          pendingInquiries: (visaInqRes.count || 0) + (tourInqRes.count || 0),
          recentBookings: bookings.slice(0, 8),
        });
      } catch (err) {
        console.warn("Admin dashboard load error:", err);
      }
      setLoading(false);
    }

    loadLiveStats();

    // Real-time subscription for bookings
    const supabase = createClient();
    const channel = supabase
      .channel("admin-bookings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        loadLiveStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const cards = [
    {
      label: "Total Revenue",
      value: stats.totalRevenue,
      prefix: "৳",
      icon: DollarSign,
      iconBg: "bg-emerald-50 text-emerald-600",
      subtext: "SSLCommerz Verified Payments",
      subtextClass: "text-emerald-700",
      suffix: <TrendingUp className="h-3 w-3 inline mr-1" />,
      delay: 0,
    },
    {
      label: "Total Bookings",
      value: stats.totalBookings,
      icon: Ticket,
      iconBg: "bg-blue-50 text-blue-600",
      subtext: "Flights, Hotels, Tours & Visas",
      subtextClass: "text-slate-500",
      delay: 0.1,
    },
    {
      label: "Registered Users",
      value: stats.totalUsers,
      icon: Users,
      iconBg: "bg-purple-50 text-purple-600",
      subtext: "Active Customer Profiles",
      subtextClass: "text-slate-500",
      delay: 0.2,
    },
    {
      label: "Pending Inquiries",
      value: stats.pendingInquiries,
      icon: PhoneCall,
      iconBg: "bg-amber-50 text-amber-600",
      subtext: "Requires Admin Action",
      subtextClass: "text-amber-600",
      delay: 0.3,
    },
  ];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Admin Control Overview</h1>
          <p className="text-xs text-slate-500 font-semibold">Live Supabase metrics — real-time revenue, bookings and customer activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Badge variant="outline" className="font-bold text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
            Live Data
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all animate-fade-up delay-${idx}`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : (
                  <>{card.prefix || ""}<AnimatedNumber value={card.value} /></>
                )}
              </p>
              <p className={`text-[11px] font-bold flex items-center gap-0.5 ${card.subtextClass}`}>
                {card.suffix}{card.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Module Quick Links */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-base">Quick Management Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { href: "/isbah/flights", icon: Plane, label: "Manage Flights" },
            { href: "/isbah/hotels", icon: Hotel, label: "Manage Hotels" },
            { href: "/isbah/tours", icon: Compass, label: "Manage Tours" },
            { href: "/isbah/visas", icon: FileCheck, label: "Manage Visas" },
            { href: "/isbah/email-logs", icon: Mail, label: "Email Logs" },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-900 hover:shadow-sm transition-all flex items-center justify-between shadow-xs group">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-emerald-700" />
                  <span className="font-bold text-xs text-slate-900">{label}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Recent Booking Activity</h3>
          <Link href="/isbah/bookings" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500 font-bold text-xs flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
            Loading live activity...
          </div>
        ) : stats.recentBookings.length === 0 ? (
          <div className="p-6 text-center text-slate-400 font-bold text-xs">No bookings yet.</div>
        ) : (
          <div className="space-y-3">
            {stats.recentBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100/80 transition-colors">
                <div>
                  <span className="font-bold text-slate-900">
                    {booking.details?.title || booking.details?.airline || `${booking.booking_type?.toUpperCase()} Booking`}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    ID: {booking.id?.slice(0, 8)}… • {booking.details?.customer_name || booking.details?.lead_passenger || "Guest"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 block">{formatBDT(booking.total_price)}</span>
                  <Badge variant={booking.payment_status === "paid" ? "default" : "destructive"} className="text-[10px]">
                    {booking.payment_status?.toUpperCase()}
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
