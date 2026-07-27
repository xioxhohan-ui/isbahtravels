"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, LayoutDashboard, Plane, Hotel, Compass as TourIcon, FileCheck, Ticket, Users, Star, PhoneCall, MessageSquare, ShieldAlert, LogOut, ArrowLeft, Menu, X, Mail, Bell, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/services/api";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileAdminMenuOpen, setMobileAdminMenuOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Live Notification Counts
  const [bookingsCount, setBookingsCount] = useState(0);
  const [inquiriesCount, setInquiriesCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  const loadNotificationData = async () => {
    try {
      const [allBookings, visaInqs, tourInqs] = await Promise.all([
        apiService.getBookings(),
        apiService.getVisaInquiries(),
        apiService.getTourInquiries(),
      ]);

      const pendingBks = allBookings.filter(b => b.payment_status === "pending" || b.booking_status === "pending");
      const pendingVisaInqs = visaInqs.filter(i => i.status === "new");
      const pendingTourInqs = tourInqs.filter(i => i.status === "new");

      const bCount = pendingBks.length > 0 ? pendingBks.length : allBookings.length;
      const iCount = pendingVisaInqs.length + pendingTourInqs.length;

      setBookingsCount(bCount);
      setInquiriesCount(iCount);

      const items: any[] = [];
      pendingBks.slice(0, 3).forEach(b => {
        items.push({
          id: b.id,
          title: `New Booking #${b.id}`,
          subtitle: `${b.booking_type.toUpperCase()} • ৳${b.total_price.toLocaleString()}`,
          time: new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          href: "/isbah/bookings",
          type: "booking",
        });
      });
      pendingVisaInqs.slice(0, 2).forEach(i => {
        items.push({
          id: i.id,
          title: `Visa Inquiry: ${i.name}`,
          subtitle: `${i.phone} • ${i.additional_requirements || "Visa Request"}`,
          time: new Date(i.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          href: "/isbah/inquiries",
          type: "inquiry",
        });
      });
      pendingTourInqs.slice(0, 2).forEach(i => {
        items.push({
          id: i.id,
          title: `Tour Inquiry: ${i.name}`,
          subtitle: `${i.phone} • ${i.additional_requirements || "Tour Inquiry"}`,
          time: new Date(i.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          href: "/isbah/inquiries",
          type: "inquiry",
        });
      });

      setRecentNotifications(items);
    } catch (err) {
      console.warn("Failed to load admin notifications", err);
    }
  };

  useEffect(() => {
    loadNotificationData();

    window.addEventListener("isbah_data_updated", loadNotificationData);
    window.addEventListener("isbah_bookings_updated", loadNotificationData);
    window.addEventListener("isbah_new_inquiry", loadNotificationData);
    window.addEventListener("storage", loadNotificationData);

    return () => {
      window.removeEventListener("isbah_data_updated", loadNotificationData);
      window.removeEventListener("isbah_bookings_updated", loadNotificationData);
      window.removeEventListener("isbah_new_inquiry", loadNotificationData);
      window.removeEventListener("storage", loadNotificationData);
    };
  }, []);

  // Supabase Realtime subscriptions
  useSupabaseRealtime("bookings", loadNotificationData);
  useSupabaseRealtime("visa_inquiries", loadNotificationData);
  useSupabaseRealtime("tour_inquiries", loadNotificationData);

  // If on login page, don't show admin sidebar
  if (pathname === "/isbah") {
    return <>{children}</>;
  }

  const totalAlertsCount = bookingsCount + inquiriesCount;

  const navItems = [
    { label: "Dashboard Overview", href: "/isbah/dashboard", icon: LayoutDashboard },
    { label: "Manage Flights", href: "/isbah/flights", icon: Plane },
    { label: "Manage Hotels & Rooms", href: "/isbah/hotels", icon: Hotel },
    { label: "Manage Tour Packages", href: "/isbah/tours", icon: TourIcon },
    { label: "Manage Visa Services", href: "/isbah/visas", icon: FileCheck },
    { label: "Manage Bookings", href: "/isbah/bookings", icon: Ticket, badge: bookingsCount > 0 ? bookingsCount : null, badgeColor: "bg-rose-600 text-white" },
    { label: "Manage Users", href: "/isbah/users", icon: Users },
    { label: "Manage Reviews", href: "/isbah/reviews", icon: Star },
    { label: "Inquiries & Callbacks", href: "/isbah/inquiries", icon: PhoneCall, badge: inquiriesCount > 0 ? inquiriesCount : null, badgeColor: "bg-amber-500 text-white" },
    { label: "Live Customer Chat", href: "/isbah/chat", icon: MessageSquare },
    { label: "Security Audit Logs", href: "/isbah/audit-logs", icon: ShieldAlert },
    { label: "Email Logs", href: "/isbah/email-logs", icon: Mail },
  ];

  const handleLogout = () => {
    document.cookie = "isbah_admin_session=; path=/; max-age=0";
    localStorage.removeItem("isbah_admin");
    router.push("/isbah");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      
      {/* Top Admin Header */}
      <header className="sticky top-0 z-50 h-16 w-full border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileAdminMenuOpen(!mobileAdminMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {mobileAdminMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/isbah/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">
              <Compass className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="font-outfit font-black text-lg text-slate-900">
              ISBAH <span className="text-emerald-700">ADMIN</span>
            </span>
          </Link>
          <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Control Console
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">

          {/* Real-time Notification Bell Widget */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="relative p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Real-time Admin Notifications"
            >
              <Bell className="h-4 w-4" />
              {totalAlertsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse shadow-xs">
                  {totalAlertsCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-rose-600" />
                    <h4 className="font-bold text-xs text-slate-900">Live Customer Alerts</h4>
                  </div>
                  <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                    {totalAlertsCount} Pending
                  </span>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 font-semibold">
                      No pending notifications right now.
                    </div>
                  ) : (
                    recentNotifications.map((item, idx) => (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => setShowNotificationsDropdown(false)}
                        className="flex items-start justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <p className="font-bold text-xs text-slate-900 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold text-slate-400 block">{item.time}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 ml-auto mt-0.5" />
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <Link
                    href="/isbah/bookings"
                    onClick={() => setShowNotificationsDropdown(false)}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    View All Bookings
                  </Link>
                  <Link
                    href="/isbah/inquiries"
                    onClick={() => setShowNotificationsDropdown(false)}
                    className="font-bold text-amber-700 hover:underline"
                  >
                    View Inquiries
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link href="/" target="_blank">
            <Button size="sm" variant="outline" className="text-xs font-bold gap-1 rounded-xl px-3">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Main Website</span>
            </Button>
          </Link>

          <Button size="sm" variant="ghost" onClick={handleLogout} className="text-rose-600 hover:bg-rose-50 text-xs font-bold gap-1 rounded-xl px-3">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 border-r border-slate-200 bg-white p-4 space-y-1 shrink-0">
          <p className="px-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
            Admin Navigation
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${item.badgeColor || "bg-rose-600 text-white"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileAdminMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white p-4 space-y-1 shadow-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileAdminMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-emerald-600" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${item.badgeColor || "bg-rose-600 text-white"}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Dynamic Admin View */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
