"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught application error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center p-4 text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6 animate-scale-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
          <AlertCircle className="h-8 w-8 text-rose-600" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            Unexpected Exception
          </span>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Something Went Wrong</h1>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            An error occurred while loading this page. Our team has been notified.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Button onClick={() => reset()} size="lg" className="w-full font-bold text-xs gap-2 rounded-2xl bg-slate-900 text-white">
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
          <a href="/" className="w-full">
            <Button size="lg" variant="outline" className="w-full font-bold text-xs gap-2 rounded-2xl border-slate-200">
              <Home className="h-4 w-4 text-slate-600" />
              <span>Go to Home</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
