"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/services/api";
import { Flight } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Filter, ArrowRight, ShieldCheck } from "lucide-react";

function FlightsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFrom = searchParams.get("from") || "Dhaka (DAC)";
  const initialTo = searchParams.get("to") || "Cox's Bazar (CXB)";
  const initialType = searchParams.get("type") || "oneway";
  const initialClass = searchParams.get("class") || "economy";

  const [selectedAirline, setSelectedAirline] = useState("All");

  // User-facing pages rely on React Query (stale-while-revalidate + window focus refetch) without Realtime
  const { data: flights = [], isLoading } = useQuery({
    queryKey: ["flights", initialFrom, initialTo, initialType, initialClass],
    queryFn: () =>
      apiService.getFlights({
        from: initialFrom,
        to: initialTo,
        trip_type: initialType,
        class: initialClass,
      }),
  });

  const filteredFlights = selectedAirline === "All"
    ? flights
    : flights.filter(f => f.airline.toLowerCase().includes(selectedAirline.toLowerCase()));

  const handleSelectFlight = (flight: Flight) => {
    const params = new URLSearchParams({
      type: "flight",
      ref_id: flight.id,
      title: `${flight.airline} (${flight.flight_number}) ${flight.segments[0].from} to ${flight.segments[0].to}`,
      price: flight.price.toString(),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white text-slate-900">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1 text-center md:text-left">
          <Badge variant="outline" className="font-bold text-xs">Flight Search Results</Badge>
          <h1 className="font-outfit text-2xl sm:text-3xl font-black text-slate-900">
            {initialFrom} <span className="text-emerald-700">➔</span> {initialTo}
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Trip Type: <span className="font-bold text-slate-900 capitalize">{initialType}</span> • Class: <span className="font-bold text-slate-900 capitalize">{initialClass}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-slate-900">Direct Airline Inventory</p>
            <p className="text-slate-500">SSLCommerz Secured E-Ticket</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className="space-y-6 rounded-2xl border border-slate-200 p-5 bg-slate-50 h-fit">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-emerald-700" />
              Filter Flights
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{filteredFlights.length} Flights</span>
          </div>

          {/* Airline Filter */}
          <div className="space-y-2">
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

        {/* Flight Results Cards */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 space-y-3 font-bold">
              <Plane className="h-6 w-6 mx-auto animate-bounce text-emerald-700" />
              <p>Searching lowest available fares...</p>
            </div>
          ) : filteredFlights.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-300 rounded-3xl space-y-3">
              <p className="font-bold text-slate-700">No flights matched your search.</p>
              <Button onClick={() => setSelectedAirline("All")} variant="outline">Reset Filters</Button>
            </div>
          ) : (
            filteredFlights.map((flight) => (
              <div
                key={flight.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 font-black text-slate-900 text-xs text-center p-1 border border-slate-200">
                    {flight.airline.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{flight.airline} • {flight.flight_number}</span>
                    <h4 className="font-black text-slate-900 text-lg">
                      {flight.segments[0].departure_time || "08:30 AM"} ➔ {flight.segments[0].arrival_time || "09:35 AM"}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {flight.segments[0].from} to {flight.segments[0].to} ({flight.segments[0].duration || "1h 05m"})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Badge variant="outline" className="capitalize font-bold">{flight.class}</Badge>
                  <span className="text-emerald-700 font-bold">{flight.available_seats} Seats left</span>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Fare per ticket</span>
                    <span className="text-xl font-black text-slate-900">
                      {formatBDT(flight.price)}
                    </span>
                  </div>
                  <Button onClick={() => handleSelectFlight(flight)} className="font-bold gap-1 rounded-xl text-xs">
                    <span>Book Flight</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading Flights...</div>}>
      <FlightsContent />
    </Suspense>
  );
}
