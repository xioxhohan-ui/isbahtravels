"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface PhoneModalProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  onComplete: (phone: string) => void;
}

export function PhoneModal({ isOpen, userId, userEmail, onComplete }: PhoneModalProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.length < 10) {
      setError("Please enter a valid mobile number (min 10 digits).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email: userEmail,
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        setError(updateError.message);
      } else {
        onComplete(phone.trim());
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update phone number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-slate-900 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Phone className="h-7 w-7" />
            </div>
            <h2 className="font-outfit text-xl font-extrabold text-slate-900">
              Mobile Number Required
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              To complete your Isbah Travels account and receive SMS booking confirmation, please provide your mobile contact number.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Mobile Number (+880...)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="+880 1700-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full font-bold text-xs gap-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Account</span>
                  <ArrowRight className="h-4 w-4 text-emerald-400" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Your phone number is kept private & strictly secured</span>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
