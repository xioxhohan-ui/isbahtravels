"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiService } from "@/lib/services/api";
import { Flight } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Filter, ArrowRight, ShieldCheck, Clock, Users, ArrowLeftRight, CheckCircle2 } from "lucide-react";

function FlightListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const adult = searchParams.get("adult") || "1";
  const child = searchParams.get("child") || "0";
  const infant = searchParams.get("infant") || "0";
  const cabinClass = searchParams.get("cabin_class") || "Economy";
  const trips = searchParams.get("trips") || "DAC,CXB,2026-07-31";

  // Parse trips: DAC,CXB,2026-07-31
  const parts = trips.split(",");
  const fromCode = parts[0] || "DAC";
  const toCode = parts[1] || "CXB";
  const deptDate = parts[2] || "2026-07-31";

  const totalTravelers = Number(adult) + Number(child) + Number(infant);

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAirline, setSelectedAirline] = useState("All");
  const [maxPrice, setMaxPrice] = useState(150000);

  useEffect(() => {
    async function fetchSearch() {
      setLoading(true);
      try {
        const url = `/api/v1/flights/search?adult=${adult}&child=${child}&infant=${infant}&cabin_class=${cabinClass}&trips=${encodeURIComponent(trips)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.flights) {
          setFlights(data.flights);
        } else {
          const fallback = await apiService.getFlights();
          setFlights(fallback);
        }
      } catch (err) {
        const fallback = await apiService.getFlights();
        setFlights(fallback);
      }
      setLoading(false);
    }
    fetchSearch();

    window.addEventListener("isbah_data_updated", fetchSearch);
    window.addEventListener("storage", fetchSearch);
    return () => {
      window.removeEventListener("isbah_data_updated", fetchSearch);
      window.removeEventListener("storage", fetchSearch);
    };
  }, [adult, child, infant, cabinClass, trips]);

  const filteredFlights = flights.filter((f) => {
    if (f.price > maxPrice) return false;
    if (selectedAirline !== "All" && !f.airline.toLowerCase().includes(selectedAirline.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSelectFlight = (flight: Flight) => {
    const params = new URLSearchParams({
      type: "flight",
      ref_id: flight.id,
      title: `${flight.airline} (${flight.flight_number}) ${flight.segments[0].from} to ${flight.segments[0].to}`,
      price: flight.price.toString(),
      guests: totalTravelers.toString(),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-white text-slate-900">
      
      {/* Gozayaan Style Search Summary Bar */}
      <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Badge variant="outline" className="font-bold text-[10px] text-emerald-400 border-emerald-400">
              Live Search Query
            </Badge>
            <span className="text-xs text-slate-300 font-semibold">{deptDate}</span>
          </div>
          <h1 className="font-outfit text-2xl sm:text-3xl font-black flex items-center justify-center md:justify-start gap-3">
            <span>{fromCode}</span>
            <ArrowLeftRight className="h-5 w-5 text-emerald-400" />
            <span>{toCode}</span>
          </h1>
          <p className="text-xs text-slate-300 font-semibold">
            {totalTravelers} Traveler(s) ({adult} Adult, {child} Child, {infant} Infant) • <span className="text-emerald-400 font-bold">{cabinClass}</span>
          </p>
        </div>

        <Link href="/">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-4 py-2">
            Modify Search
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filter Sidebar */}
        <div className="space-y-6 rounded-2xl border border-slate-200 p-5 bg-slate-50 h-fit lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-emerald-700" />
              Filter Results
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{filteredFlights.length} Available</span>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-extrabold text-slate-400 uppercase text-[10px]">Max Price</label>
              <span className="font-extrabold text-slate-900">{formatBDT(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={3000}
              max={150000}
              step={2500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          {/* Airline Filter */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Airlines</label>
            <div className="space-y-1 text-xs font-semibold text-slate-700">
              {["All", "Biman Bangladesh", "US-Bangla", "Emirates", "Air Astra", "Saudia"].map((airline) => (
                <label key={airline} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white">
                  <input
                    type="radio"
                    name="airline"
                    checked={selectedAirline === airline}
                    onChange={() => setSelectedAirline(airline)}
                    className="accent-slate-900"
                  />
                  <span>{airline}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Flight Cards Stream */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200">
              Searching flights for {fromCode} to {toCode}...
            </div>
          ) : filteredFlights.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-300 rounded-2xl space-y-3 bg-slate-50">
              <Plane className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No direct flights found for {fromCode} to {toCode}.</p>
              <p className="text-xs text-slate-500">Try adjusting your date or cabin class filter.</p>
            </div>
          ) : (
            filteredFlights.map((flight) => {
              const seg = flight.segments[0];
              return (
                <Card key={flight.id} className="p-5 border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md transition-all rounded-2xl">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Airline Info */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-800 border border-slate-200 shrink-0">
                        {flight.airline.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{flight.airline}</h4>
                        <p className="text-[11px] font-bold text-slate-400">{flight.flight_number} • {flight.class.toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Flight Times & Duration */}
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <span className="font-black text-lg text-slate-900 block">{seg?.departure_time || "08:00 AM"}</span>
                        <span className="text-xs font-bold text-slate-500 block">{seg?.from}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 block">{seg?.duration || "1h 30m"}</span>
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <div className="w-16 h-0.5 bg-slate-300" />
                          <Plane className="h-3.5 w-3.5 text-slate-900" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 block">Direct Flight</span>
                      </div>

                      <div>
                        <span className="font-black text-lg text-slate-900 block">{seg?.arrival_time || "09:30 AM"}</span>
                        <span className="text-xs font-bold text-slate-500 block">{seg?.to}</span>
                      </div>
                    </div>

                    {/* Pricing & Booking */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Price per Person</span>
                        <span className="text-lg font-black text-slate-900 block">{formatBDT(flight.price)}</span>
                      </div>
                      <Button
                        onClick={() => handleSelectFlight(flight)}
                        className="font-bold text-xs rounded-xl px-4 py-2 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        <span>Select Flight</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                  </div>
                </Card>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}

export default function FlightListPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-500">Loading Gozayaan flight results...</div>}>
      <FlightListContent />
    </Suspense>
  );
}
