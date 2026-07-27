"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiService } from "@/lib/services/api";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertCircle, ShieldCheck, Loader2, CheckCircle2, ShoppingBag } from "lucide-react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const bookingType = searchParams.get("type") || "tour";
  const refId = searchParams.get("ref_id") || "";
  const title = searchParams.get("title") || "Isbah Travels Booking";
  const priceParam = Number(searchParams.get("price") || "0");
  const travelDate = searchParams.get("travel_date") || "";

  const [passengerName, setPassengerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nidOrPassport, setNidOrPassport] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  // Load authenticated user profile — auto-fill form + guard access
  useEffect(() => {
    async function loadUserProfile() {
      setProfileLoading(true);

      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          // Fetch profile to auto-fill form
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, email, phone, passport_number, national_id")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            setPassengerName(profile.display_name || "");
            setEmail(profile.email || user.email || "");
            setPhone(profile.phone || "");
            setNidOrPassport(profile.passport_number || profile.national_id || "");
          } else {
            setEmail(user.email || "");
            setPassengerName(user.user_metadata?.full_name || "");
          }
        }
      } catch (err) {
        console.warn("Profile load error:", err);
      }

      setProfileLoading(false);
    }

    loadUserProfile();
  }, [pathname, router, searchParams]);

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "ISBAH10") {
      setDiscount(priceParam * 0.1);
    } else {
      setErrorMessage("Invalid promo code. Try 'ISBAH10' for 10% discount!");
    }
  };

  const finalPrice = Math.max(0, priceParam - discount);

  // Primary Action: Confirm & Save Booking (Pay Later / Cash / Optional Payment)
  const handleConfirmBookingOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName || !email) {
      setErrorMessage("Please fill in your name and email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const booking = await apiService.createBooking({
        user_id: userId || "usr-demo",
        booking_type: (bookingType as any),
        reference_id: refId,
        total_price: finalPrice,
        currency: "BDT",
        details: {
          title,
          travel_date: travelDate,
          nid_or_passport: nidOrPassport,
          lead_passenger: passengerName,
          customer_name: passengerName,
          customer_email: email,
          customer_phone: phone,
        },
        payment_status: "pending",
        booking_status: "confirmed",
      });

      // Send confirmation email (fire-and-forget)
      fetch("/api/v1/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: passengerName, user_email: email }),
      }).catch(() => {});

      router.push(`/dashboard?status=booked&booking_id=${booking.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to confirm booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optional Action: Online Instant Payment Gateway (SSLCommerz)
  const handleInitiateSSLCommerz = async () => {
    if (!passengerName || !email) {
      setErrorMessage("Please fill in your name and email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "usr-demo",
          booking_type: bookingType,
          reference_id: refId,
          total_price: finalPrice,
          customer_name: passengerName,
          customer_email: email,
          customer_phone: phone,
          details: {
            title,
            travel_date: travelDate,
            nid_or_passport: nidOrPassport,
            lead_passenger: passengerName,
            customer_name: passengerName,
          },
        }),
      });

      const data = await response.json();
      if (data.gateway_url) {
        window.location.href = data.gateway_url;
      } else {
        setErrorMessage(data.error || "Failed to initiate payment gateway.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Payment initiation error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-slate-500 font-bold">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
          <span>Preparing Checkout...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white text-slate-900">

      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 p-6 sm:p-8 flex items-center justify-between shadow-xs">
        <div>
          <Badge variant="outline" className="font-bold text-xs">Isbah Travels Official Checkout</Badge>
          <h1 className="font-outfit text-3xl font-black text-slate-900 mt-1">
            Book Now & Confirm Package
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Book instantly to reserve your slot • Online Payment Optional • Instant Confirmation
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 text-xs font-semibold">
          <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
          <div>
            <p className="font-bold text-slate-900">Account Verified</p>
            <p className="text-slate-500 truncate max-w-[140px]">{email || "Verified User"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Passenger Info Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleConfirmBookingOnly} className="p-6 rounded-3xl border border-slate-200 bg-white space-y-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Passenger & Contact Details
              <span className="block text-[10px] text-emerald-700 font-bold mt-0.5">✓ Auto-filled from your profile</span>
            </h3>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Passenger Name *</label>
                <input
                  type="text"
                  required
                  placeholder="As written on NID/Passport"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +880 1700-000000 (Optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address (for Voucher) *</label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NID or Passport Number</label>
                <input
                  type="text"
                  placeholder="Optional — from your profile"
                  value={nidOrPassport}
                  onChange={(e) => setNidOrPassport(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Optional Payment Methods Banner */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Payment Channels (Optional)</h4>
              <div className="flex flex-wrap gap-1.5 text-xs font-bold text-slate-700">
                {["bKash", "Nagad", "Rocket", "VISA / Mastercard", "DBBL Nexus"].map(m => (
                  <span key={m} className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">{m}</span>
                ))}
              </div>
            </div>

            {/* Booking & Optional Payment Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full font-bold text-xs gap-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 h-12 shadow-sm"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /><span>Confirming Package Booking...</span></>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 text-emerald-400" /><span>Confirm Package Booking ({formatBDT(finalPrice)})</span></>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleInitiateSSLCommerz}
                disabled={isSubmitting}
                variant="outline"
                size="lg"
                className="w-full font-bold text-xs gap-2 rounded-2xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-11"
              >
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Pay Online Now via SSLCommerz (Optional — bKash, Nagad, Cards)</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-md space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Price Summary
            </h3>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-emerald-700 uppercase block">{bookingType} Reservation</span>
              <p className="font-black text-slate-900 text-sm">{title}</p>
              {travelDate && <p className="text-slate-500 font-semibold">Date: {travelDate}</p>}
            </div>

            {/* Promo Code */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Promo Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Try ISBAH10"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold outline-none uppercase"
                />
                <Button type="button" onClick={handleApplyPromo} variant="outline" size="sm" className="font-bold text-xs">
                  Apply
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatBDT(priceParam)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Promo Discount (10%):</span>
                  <span>-{formatBDT(discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 text-sm font-black text-slate-900 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-base text-slate-900">{formatBDT(finalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
