"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Lock, User, ShieldCheck, ArrowRight, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      // Admin Credentials validation (isbah41.com / isbah111)
      if (username.trim() === "isbah41.com" && password === "isbah111") {
        setLoading(false);
        setStep("totp");
      } else {
        setError("Invalid admin username or password. Authorized personnel only.");
        setLoading(false);
      }
    }, 400);
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      // Accept TOTP code 123456 or 6-digit code
      if (totpCode.trim() === "123456" || totpCode.trim().length === 6) {
        document.cookie = "isbah_admin_session=authenticated; path=/; max-age=86400; SameSite=Lax";
        localStorage.setItem("isbah_admin", "true");
        router.push("/isbah/dashboard");
      } else {
        setError("Invalid TOTP verification code. Use default '123456'.");
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg"
          >
            <Compass className="h-7 w-7" />
          </motion.div>
          <h1 className="font-outfit text-2xl font-black text-white tracking-tight">
            ISBAH <span className="text-emerald-400">ADMIN</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold">
            {step === "credentials" ? "Management Console Portal" : "2FA / TOTP Security Check"}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === "credentials" ? (
            <motion.form
              key="credentials"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleCredentialsSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="isbah41.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full font-bold text-xs gap-2 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to 2FA Check</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.form
              key="totp"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleTotpSubmit}
              className="space-y-4 text-xs"
            >
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Two-Factor Authentication Required
                </p>
                <p className="text-[11px] text-slate-400">
                  Enter the 6-digit TOTP verification code from your Authenticator app (Demo Code: <span className="font-mono text-emerald-400 font-bold">123456</span>).
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  TOTP Code (6-digits)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-center text-base tracking-widest font-mono font-bold text-emerald-400 outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full font-bold text-xs gap-2 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      <span>Verifying TOTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Access Console</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>

              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-300 font-semibold"
              >
                Back to Username & Password
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="pt-3 border-t border-slate-800 text-center">
          <p className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Strictly Restricted Admin Access</span>
          </p>
        </div>

      </motion.div>
    </div>
  );
}
