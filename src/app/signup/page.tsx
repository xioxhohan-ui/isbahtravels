"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Compass, Mail, Lock, User, Phone, CheckSquare, Square, ArrowRight, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service & Privacy Policy.");
      return;
    }

    if (!phone || phone.length < 10) {
      setError("Please provide a valid mobile contact number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
            display_name: displayName,
            phone: phone,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Upsert into profiles table
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: email,
          display_name: displayName,
          phone: phone,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Send welcome email (fire-and-forget, non-blocking)
        fetch("/api/v1/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_name: displayName, user_email: email }),
        }).catch(() => {});

        // Set session fallback
        document.cookie = `isbah_user_session=${encodeURIComponent(email)}; path=/; max-age=86400`;
        localStorage.setItem("isbah_user_email", email);

        router.push(redirectPath);
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        },
      });

      if (googleError) {
        setError(googleError.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Google sign-up failed.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-50 flex items-center justify-center p-4 text-slate-900 my-4">
      
      {/* Animated Sign Up Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-5 animate-scale-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm hover:scale-105 transition-transform">
            <Compass className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Create Isbah Account</h1>
          <p className="text-xs text-slate-500 font-semibold">
            Sign up to unlock instant bookings, e-tickets, and member discounts.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="hover:scale-[1.01] active:scale-[0.99] transition-transform">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full h-12 rounded-2xl border-slate-200 text-slate-800 font-bold text-xs gap-3 hover:bg-slate-50 transition-all shadow-xs"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign Up with Google</span>
          </Button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="absolute bg-white px-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            or register with email
          </span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Mohammad Rahman"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 font-bold text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="rahman@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 font-bold text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
              Mobile Number (+880...)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="+880 1700-123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 font-bold text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 font-bold text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setAgreeTerms(!agreeTerms)}
              className="mt-0.5 text-slate-700 hover:text-slate-900"
            >
              {agreeTerms ? (
                <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <Square className="h-4 w-4 text-slate-400 shrink-0" />
              )}
            </button>
            <span className="text-[11px] text-slate-600 font-medium leading-tight">
              I agree to Isbah Travels'{" "}
              <a href="#" className="underline font-bold text-slate-900">Terms of Service</a>{" "}
              & <a href="#" className="underline font-bold text-slate-900">Privacy Policy</a>.
            </span>
          </div>

          <div className="hover:scale-[1.01] active:scale-[0.99] transition-transform">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full font-bold text-xs gap-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-md mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4 text-emerald-400" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 text-center space-y-2 text-xs">
          <p className="text-slate-500 font-medium">
            Already have an account?{" "}
            <Link
              href={`/signin?redirect=${encodeURIComponent(redirectPath)}`}
              className="font-extrabold text-emerald-700 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
