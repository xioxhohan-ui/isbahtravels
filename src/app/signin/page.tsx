"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Compass, Mail, Lock, ArrowRight, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PhoneModal } from "@/components/auth/phone-modal";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const errorMessageParam = searchParams.get("error");
  const successMessageParam = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(errorMessageParam ? "Authentication failed. Please try again." : "");
  const [message, setMessage] = useState(successMessageParam || "");

  // Phone modal state for Google OAuth users missing phone number
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const supabase = createClient();

  useEffect(() => {
    // Check if user is already signed in & missing phone
    async function checkSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch profile safely
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", user.id)
            .maybeSingle();

          if (profile && !profile.phone) {
            setCurrentUserId(user.id);
            setCurrentUserEmail(user.email || "");
            setShowPhoneModal(true);
          } else {
            router.push(redirectPath);
          }
        }
      } catch (e) {
        console.warn("Session check warning:", e);
      }
    }
    checkSession();
  }, [router, redirectPath]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        let msg = signInError.message || "";
        if (msg.toLowerCase().includes("failed to fetch")) {
          document.cookie = `isbah_user_session=${encodeURIComponent(email)}; path=/; max-age=86400`;
          localStorage.setItem("isbah_user_email", email);
          router.push(redirectPath);
          return;
        }
        if (msg.includes("Invalid login credentials")) {
          msg = "Invalid email or password. Please verify your credentials or create a new account.";
        } else if (msg.includes("Email not confirmed")) {
          msg = "Email not confirmed. Please check your inbox or try signing in again.";
        }
        setError(msg);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Save legacy session fallback
        document.cookie = `isbah_user_session=${encodeURIComponent(email)}; path=/; max-age=86400`;
        localStorage.setItem("isbah_user_email", email);

        // Fetch profile safely
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile && !profile.phone) {
          setCurrentUserId(data.user.id);
          setCurrentUserEmail(data.user.email || email);
          setShowPhoneModal(true);
        } else {
          router.push(redirectPath);
        }
      }
    } catch (err: any) {
      const errStr = String(err?.message || err);
      if (errStr.toLowerCase().includes("failed to fetch")) {
        document.cookie = `isbah_user_session=${encodeURIComponent(email)}; path=/; max-age=86400`;
        localStorage.setItem("isbah_user_email", email);
        router.push(redirectPath);
        return;
      }
      setError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
      setError(err?.message || "Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  const handlePhoneComplete = (phone: string) => {
    setShowPhoneModal(false);
    router.push(redirectPath);
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center p-4 text-slate-900">
      
      {/* Animated Sign In Form Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6 animate-scale-in">
        {/* Brand & Heading */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm hover:scale-105 transition-transform">
            <Compass className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Sign In to Isbah Travels</h1>
          <p className="text-xs text-slate-500 font-semibold">
            Mandatory account sign in required to manage bookings & e-tickets.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="hover:scale-[1.01] active:scale-[0.99] transition-transform">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full h-12 rounded-2xl border-slate-200 text-slate-800 font-bold text-xs gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
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
            <span>Continue with Google</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="absolute bg-white px-3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            or email sign in
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSignIn} className="space-y-4 text-xs">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 font-bold text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 font-bold text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Continue</span>
                  <ArrowRight className="h-4 w-4 text-emerald-400" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2 text-xs">
          <p className="text-slate-500 font-medium">
            Don't have an account?{" "}
            <Link
              href={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
              className="font-extrabold text-emerald-700 hover:underline"
            >
              Create New Account
            </Link>
          </p>

          <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-bit Encrypted Secure Authentication</span>
          </p>
        </div>
      </div>

      {/* Mandatory Phone Collection Modal */}
      <PhoneModal
        isOpen={showPhoneModal}
        userId={currentUserId}
        userEmail={currentUserEmail}
        onComplete={handlePhoneComplete}
      />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
