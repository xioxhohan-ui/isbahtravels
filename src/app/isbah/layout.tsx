"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, LayoutDashboard, Plane, Hotel, Compass as TourIcon, FileCheck, Ticket, Users, Star, PhoneCall, ShieldAlert, LogOut, ArrowLeft, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileAdminMenuOpen, setMobileAdminMenuOpen] = useState(false);

  // If on login page, don't show admin sidebar
  if (pathname === "/isbah") {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard Overview", href: "/isbah/dashboard", icon: LayoutDashboard },
    { label: "Manage Flights", href: "/isbah/flights", icon: Plane },
    { label: "Manage Hotels & Rooms", href: "/isbah/hotels", icon: Hotel },
    { label: "Manage Tour Packages", href: "/isbah/tours", icon: TourIcon },
    { label: "Manage Visa Services", href: "/isbah/visas", icon: FileCheck },
    { label: "Manage Bookings", href: "/isbah/bookings", icon: Ticket },
    { label: "Manage Users", href: "/isbah/users", icon: Users },
    { label: "Manage Reviews", href: "/isbah/reviews", icon: Star },
    { label: "Inquiries & Callbacks", href: "/isbah/inquiries", icon: PhoneCall },
    { label: "Security Audit Logs", href: "/isbah/audit-logs", icon: ShieldAlert },
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4 text-emerald-600" />
                  <span>{item.label}</span>
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
