import Link from "next/link";
import { Compass, Phone, Mail, MapPin, ShieldCheck, Heart, CreditCard } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">
                <Compass className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                ISBAH <span className="text-emerald-700">TRAVELS</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm font-medium">
              Your trusted travel agency in Bangladesh for domestic and international flights, luxury resort bookings, Umrah packages, customized tours, and visa processing services.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span>Civil Aviation Authorized</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Services</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li><Link href="/flights" className="hover:text-emerald-700 transition-colors">Flight Booking</Link></li>
              <li><Link href="/hotels" className="hover:text-emerald-700 transition-colors">Hotels & Resorts</Link></li>
              <li><Link href="/tours" className="hover:text-emerald-700 transition-colors">Domestic Packages</Link></li>
              <li><Link href="/tours?cat=International" className="hover:text-emerald-700 transition-colors">International Tours</Link></li>
              <li><Link href="/visa" className="hover:text-emerald-700 transition-colors">Visa Services</Link></li>
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Top Destinations</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li><Link href="/hotels?city=Cox's Bazar" className="hover:text-emerald-700 transition-colors">Cox's Bazar</Link></li>
              <li><Link href="/hotels?city=Sylhet" className="hover:text-emerald-700 transition-colors">Sylhet</Link></li>
              <li><Link href="/tours?q=Sundarbans" className="hover:text-emerald-700 transition-colors">Sundarbans</Link></li>
              <li><Link href="/tours?q=Dubai" className="hover:text-emerald-700 transition-colors">Dubai, UAE</Link></li>
              <li><Link href="/tours?q=Saudi" className="hover:text-emerald-700 transition-colors">Makkah & Madinah</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Contact Desk</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>Suite 402, Main Gulshan Avenue, Dhaka-1212</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-700 shrink-0" />
                <a href="tel:+8801700123456" className="hover:text-slate-900 transition-colors">+880 1700-123456</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-700 shrink-0" />
                <a href="mailto:info@isbahtravels.com" className="hover:text-slate-900 transition-colors">info@isbahtravels.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* SSLCommerz & Payment Partners */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <CreditCard className="h-4 w-4 text-emerald-700" />
            <span>Payment Partner: <strong className="text-slate-900">SSLCommerz Bangladesh</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">bKash</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">Nagad</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">Rocket</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">VISA</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">Mastercard</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-semibold">
          <p>© {new Date().getFullYear()} Isbah Travels Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> for travelers worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
