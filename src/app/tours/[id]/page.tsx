"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiService } from "@/lib/services/api";
import { Tour } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Star, CheckCircle, XCircle, Calendar, Users, PhoneCall, ShieldCheck, ArrowRight } from "lucide-react";

const GoogleMapView = dynamic(() => import("@/components/maps/google-map-view"), {
  ssr: false,
  loading: () => <div className="h-72 w-full rounded-3xl bg-slate-100 skeleton border border-slate-200" />,
});

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking drawer state
  const [travelDate, setTravelDate] = useState("2026-08-15");
  const [guestsCount, setGuestsCount] = useState(2);

  // Callback form state
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackSuccess, setCallbackSuccess] = useState(false);

  useEffect(() => {
    async function loadTour() {
      setLoading(true);
      const data = await apiService.getTourById(id);
      setTour(data);
      setLoading(false);
    }
    loadTour();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500 font-bold">
        Loading tour details...
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Tour Package Not Found</h2>
        <Button onClick={() => router.push("/tours")}>Back to Tour Packages</Button>
      </div>
    );
  }

  const totalPrice = tour.price_per_person * guestsCount;

  const handleProceedToBooking = () => {
    const query = new URLSearchParams({
      type: "tour",
      ref_id: tour.id,
      title: tour.title,
      price: totalPrice.toString(),
      travel_date: travelDate,
      guests: guestsCount.toString(),
    });
    router.push(`/checkout?${query.toString()}`);
  };

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackName || !callbackPhone) return;
    setCallbackSuccess(true);
    setTimeout(() => {
      setCallbackSuccess(false);
      setCallbackName("");
      setCallbackPhone("");
    }, 4000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white text-slate-900">
      
      {/* Title & Metadata Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-bold text-xs">{tour.category || "Tour Package"}</Badge>
          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-full">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            <span>{tour.rating || 4.9}</span>
            <span className="text-slate-500 font-medium">({tour.reviews_count || 140} reviews)</span>
          </div>
        </div>

        <h1 className="font-outfit text-3xl sm:text-5xl font-black text-slate-900">
          {tour.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <MapPin className="h-4 w-4" />
            {tour.location}
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Clock className="h-4 w-4 text-slate-400" />
            {tour.duration_days} Days / {tour.duration_days - 1} Nights
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Users className="h-4 w-4 text-slate-400" />
            Max Group: {tour.max_group_size || 20} People
          </span>
        </div>
      </div>

      {/* Main Image Banner */}
      <div className="relative h-96 sm:h-[450px] w-full overflow-hidden rounded-3xl border border-slate-200 shadow-xl bg-slate-900">
        <Image
          src={tour.images[0]}
          alt={tour.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Tour Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Overview */}
          <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900">Tour Overview</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {tour.description || tour.overview}
            </p>
          </div>

          {/* Day-by-Day Itinerary */}
          <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900">Day-by-Day Itinerary</h3>
            <div className="space-y-4">
              {tour.itinerary.map((day) => (
                <div key={day.day} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-700 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                      Day {day.day}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{day.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-1">
                    {day.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-slate-200">
            <div className="space-y-3">
              <h4 className="font-bold text-emerald-700 text-sm flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> Package Inclusions
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 font-semibold">
                {tour.inclusions.map((inc, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-700 shrink-0" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-rose-600 text-sm flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> Exclusions
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 font-semibold">
                {tour.exclusions.map((exc, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Google Maps Location */}
          <GoogleMapView
            latitude={tour.latitude}
            longitude={tour.longitude}
            title={tour.title}
            address={tour.location}
          />

        </div>

        {/* Right Column: Booking Box & Callback Request */}
        <div className="space-y-6">
          
          {/* Booking Box Card */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xl space-y-6 sticky top-24">
            
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs uppercase font-bold text-slate-400 block">Package Price</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-700">
                  {formatBDT(tour.price_per_person)}
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ person</span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Select Travel Date</label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Number of Travelers</label>
                <div className="flex items-center justify-between border border-slate-200 rounded-xl p-2 bg-slate-50">
                  <span className="font-bold text-slate-800">Guests Count</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                      className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-black text-sm w-4 text-center">{guestsCount}</span>
                    <button
                      type="button"
                      onClick={() => setGuestsCount(guestsCount + 1)}
                      className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex justify-between items-center text-emerald-900 font-black">
                <span>Total Amount:</span>
                <span className="text-xl text-emerald-700">{formatBDT(totalPrice)}</span>
              </div>

              <Button
                onClick={handleProceedToBooking}
                size="lg"
                className="w-full font-bold text-xs gap-2 rounded-2xl"
              >
                <span>Book Package Now</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Request a Callback Form */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <PhoneCall className="h-4 w-4 text-emerald-700" />
                Request a Tour Callback
              </h4>

              {callbackSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center">
                  ✓ Request received! Tour manager will call you shortly.
                </div>
              ) : (
                <form onSubmit={handleCallbackSubmit} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={callbackName}
                    onChange={(e) => setCallbackName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={callbackPhone}
                    onChange={(e) => setCallbackPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold outline-none"
                  />
                  <Button type="submit" variant="outline" size="sm" className="w-full font-bold text-xs">
                    Send Callback Request
                  </Button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
