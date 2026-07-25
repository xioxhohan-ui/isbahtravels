"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center p-4 text-slate-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
          <Compass className="h-8 w-8 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Error 404 • Destination Not Found
          </span>
          <h1 className="font-outfit text-3xl font-black text-slate-900">Lost Your Way?</h1>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            The page or travel package you are looking for might have been moved, renamed, or is currently unavailable.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link href="/" className="w-full">
            <Button size="lg" className="w-full font-bold text-xs gap-2 rounded-2xl bg-slate-900 text-white">
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <Link href="/flights" className="w-full">
            <Button size="lg" variant="outline" className="w-full font-bold text-xs gap-2 rounded-2xl border-slate-200">
              <Search className="h-4 w-4 text-slate-600" />
              <span>Search Flights</span>
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
