"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plane, Hotel, Compass, FileCheck, PhoneCall, User, Menu, X, LogOut, Bookmark, Star, Ticket, ChevronDown, LogIn, UserPlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const navItems = [
    { label: "Flights", href: "/flights", icon: Plane },
    { label: "Hotels", href: "/hotels", icon: Hotel },
    { label: "Tour Packages", href: "/tours", icon: Compass },
    { label: "Visa Processing", href: "/visa", icon: FileCheck },
  ];

  // Subscribe to Supabase Auth state changes
  useEffect(() => {
    async function getInitialUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email || "");
        setUserName(user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Member");
      } else {
        const savedEmail = localStorage.getItem("isbah_user_email");
        const hasCookie = document.cookie.includes("isbah_user_session");
        if (hasCookie || savedEmail) {
          setIsLoggedIn(true);
          setUserEmail(savedEmail || "user@example.com");
          setUserName(savedEmail ? savedEmail.split("@")[0] : "Member");
        } else {
          setIsLoggedIn(false);
        }
      }
    }

    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || "");
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Member");
      } else {
        const savedEmail = localStorage.getItem("isbah_user_email");
        const hasCookie = document.cookie.includes("isbah_user_session");
        if (!hasCookie && !savedEmail) {
          setIsLoggedIn(false);
          setUserEmail("");
          setUserName("");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    document.cookie = "isbah_user_session=; path=/; max-age=0";
    localStorage.removeItem("isbah_user_email");
    setIsLoggedIn(false);
    setUserDropdownOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm transition-all shadow-xs">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-lg shadow-sm">
            <Compass className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-outfit text-2xl font-black tracking-tight text-slate-900">
                ISBAH
              </span>
              <span className="font-outfit text-2xl font-black tracking-tight text-emerald-700">
                TRAVELS
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Premier Travel Agency
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="hidden lg:flex items-center gap-3">
          
          {/* Hotline Pill */}
          <a
            href="tel:+8801700123456"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />
            <span>+880 1700-123456</span>
          </a>

          {/* User Account / Auth Buttons */}
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold">
                  {userName ? userName.slice(0, 2).toUpperCase() : "MR"}
                </div>
                <span className="text-xs font-bold text-slate-800">{userName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl space-y-1 z-50 text-xs font-semibold">
                  <div className="p-2.5 border-b border-slate-100 mb-1">
                    <p className="font-extrabold text-slate-900 text-sm">{userName}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{userEmail}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-500" />
                    <span>My Profile & Settings</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Ticket className="h-4 w-4 text-slate-500" />
                    <span>My Bookings & Tickets</span>
                  </Link>

                  <Link
                    href="/profile?tab=saved"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Bookmark className="h-4 w-4 text-slate-500" />
                    <span>Saved Favorites</span>
                  </Link>

                  <Link
                    href="/profile?tab=reviews"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Star className="h-4 w-4 text-slate-500" />
                    <span>My Reviews</span>
                  </Link>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-rose-600 hover:bg-rose-50 font-bold transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/signin">
                <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5 rounded-xl border-slate-200">
                  <LogIn className="h-3.5 w-3.5 text-slate-600" />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="font-bold text-xs gap-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </div>
          )}

        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          {isLoggedIn ? (
            <Link href="/profile">
              <Button size="sm" variant="outline" className="px-3">
                <User className="h-4 w-4 text-slate-900" />
              </Button>
            </Link>
          ) : (
            <Link href="/signin">
              <Button size="sm" variant="outline" className="text-xs font-bold px-3">
                Sign In
              </Button>
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl text-slate-800 hover:bg-slate-100"
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center font-bold">
                    My Profile & Settings
                  </Button>
                </Link>
                <Button onClick={handleSignOut} variant="ghost" className="w-full text-rose-600 font-bold">
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full font-bold">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full font-bold bg-slate-900 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
