"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertCircle, ShieldCheck } from "lucide-react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const bookingType = searchParams.get("type") || "tour";
  const refId = searchParams.get("ref_id") || "";
  const title = searchParams.get("title") || "Cox's Bazar Beach & Inani Sunset Adventure";
  const priceParam = Number(searchParams.get("price") || "8500");
  const travelDate = searchParams.get("travel_date") || "2026-08-15";

  // Form state
  const [passengerName, setPassengerName] = useState("Mohammad Rahman");
  const [email, setEmail] = useState("rahman@example.com");
  const [phone, setPhone] = useState("01711002233");
  const [nidOrPassport, setNidOrPassport] = useState("BN-98214309");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Mandatory Authentication Check
  useEffect(() => {
    const isUserAuth = document.cookie.includes("isbah_user_session") || localStorage.getItem("isbah_user_email");
    if (!isUserAuth) {
      const fullPath = `${pathname}?${searchParams.toString()}`;
      router.push(`/signin?redirect=${encodeURIComponent(fullPath)}`);
    }
  }, [router, pathname, searchParams]);

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "ISBAH10") {
      setDiscount(priceParam * 0.1);
    } else {
      alert("Invalid promo code. Try 'ISBAH10' for 10% discount!");
    }
  };

  const finalPrice = Math.max(0, priceParam - discount);

  const handleInitiateSSLCommerz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName || !phone || !email) {
      setErrorMessage("Please fill in your name, email, and phone number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          },
        }),
      });

      const data = await response.json();
      if (data.gateway_url) {
        window.location.href = data.gateway_url;
      } else {
        setErrorMessage("Failed to initiate payment gateway.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Payment initiation error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white text-slate-900">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 p-6 sm:p-8 flex items-center justify-between shadow-xs">
        <div>
          <Badge variant="outline" className="font-bold text-xs">🔒 SSLCommerz Secured Checkout</Badge>
          <h1 className="font-outfit text-3xl font-black text-slate-900 mt-1">
            Confirm & Pay Booking
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Mandatory Registered User Account Verified • 256-bit Encrypted Payment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Passenger Info Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleInitiateSSLCommerz} className="p-6 rounded-3xl border border-slate-200 bg-white space-y-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Passenger & Contact Details
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01711002233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address (for e-Ticket) *</label>
                <input
                  type="email"
                  required
                  placeholder="rahim@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NID or Passport Number</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={nidOrPassport}
                  onChange={(e) => setNidOrPassport(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Channels (SSLCommerz)</h4>
              <div className="flex flex-wrap gap-1.5 text-xs font-bold text-slate-700">
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">bKash</span>
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Nagad</span>
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Rocket</span>
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">VISA / Mastercard</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full font-bold text-xs gap-2 rounded-2xl mt-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>{isSubmitting ? "Initiating SSLCommerz..." : `Pay ${formatBDT(finalPrice)} via SSLCommerz`}</span>
            </Button>
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

            {/* Promo Code Input */}
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
