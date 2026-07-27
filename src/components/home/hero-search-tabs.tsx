"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plane, Hotel, Compass, FileCheck, Search, Calendar, Users, MapPin, Plus, Minus, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIRPORTS } from "@/lib/mock-data";

interface RoomConfig {
  id: number;
  adults: number;
  children: number;
}

interface MultiCitySegment {
  id: number;
  from: string;
  to: string;
  departDate: string;
}

export default function HeroSearchTabs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"flights" | "hotels" | "tours" | "visa">("flights");

  // Flight search state
  const [flightType, setFlightType] = useState<"oneway" | "roundtrip" | "multicity">("roundtrip");
  const [flightFrom, setFlightFrom] = useState("Dhaka (DAC)");
  const [flightTo, setFlightTo] = useState("Cox's Bazar (CXB)");
  const [departDate, setDepartDate] = useState("2026-08-15");
  const [returnDate, setReturnDate] = useState("2026-08-22");
  const [flightClass, setFlightClass] = useState("economy");

  // Flight travelers state with +/- breakdown
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);
  const [travelerModalOpen, setTravelerModalOpen] = useState(false);

  // Multi-city segments state
  const [multiCitySegments, setMultiCitySegments] = useState<MultiCitySegment[]>([
    { id: 1, from: "Dhaka (DAC)", to: "Bangkok (BKK)", departDate: "2026-08-15" },
    { id: 2, from: "Bangkok (BKK)", to: "Kuala Lumpur (KUL)", departDate: "2026-08-20" },
  ]);

  // Hotel search state
  const [hotelCity, setHotelCity] = useState("Cox's Bazar");
  const [checkIn, setCheckIn] = useState("2026-08-15");
  const [checkOut, setCheckOut] = useState("2026-08-18");
  
  // Dynamic Rooms & Guests configuration
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([
    { id: 1, adults: 2, children: 0 }
  ]);
  const [roomModalOpen, setRoomModalOpen] = useState(false);

  // Tour search state
  const [tourQuery, setTourQuery] = useState("");

  // Visa search state
  const [visaCountry, setVisaCountry] = useState("Saudi Arabia (Umrah / Tourist)");

  // Room builder helpers
  const handleAddRoom = () => {
    setRoomConfigs(prev => [...prev, { id: Date.now(), adults: 2, children: 0 }]);
  };

  const handleRemoveRoom = (id: number) => {
    if (roomConfigs.length > 1) {
      setRoomConfigs(prev => prev.filter(r => r.id !== id));
    }
  };

  const updateRoomGuests = (id: number, type: "adults" | "children", delta: number) => {
    setRoomConfigs(prev =>
      prev.map(r => {
        if (r.id === id) {
          const newVal = r[type] + delta;
          if (type === "adults" && newVal >= 1 && newVal <= 10) return { ...r, adults: newVal };
          if (type === "children" && newVal >= 0 && newVal <= 10) return { ...r, children: newVal };
        }
        return r;
      })
    );
  };

  // Multi-city helpers
  const handleAddMultiSegment = () => {
    setMultiCitySegments(prev => [
      ...prev,
      { id: Date.now(), from: "Kuala Lumpur (KUL)", to: "Dhaka (DAC)", departDate: "2026-08-25" }
    ]);
  };

  const handleRemoveMultiSegment = (id: number) => {
    if (multiCitySegments.length > 1) {
      setMultiCitySegments(prev => prev.filter(s => s.id !== id));
    }
  };

  const totalGuestsCount = roomConfigs.reduce((sum, r) => sum + r.adults + r.children, 0);
  const totalTravelersCount = adultsCount + childrenCount + infantsCount;

  const handleSearchFlights = (e: React.FormEvent) => {
    e.preventDefault();
    const fromCode = flightFrom.match(/\(([^)]+)\)/)?.[1] || "DAC";
    const toCode = flightTo.match(/\(([^)]+)\)/)?.[1] || "CXB";

    let trips = `${fromCode},${toCode},${departDate}`;
    if (flightType === "multicity" && multiCitySegments.length > 0) {
      trips = multiCitySegments.map(s => {
        const fc = s.from.match(/\(([^)]+)\)/)?.[1] || "DAC";
        const tc = s.to.match(/\(([^)]+)\)/)?.[1] || "CXB";
        return `${fc},${tc},${s.departDate}`;
      }).join("|");
    }

    const cClass = flightClass.toLowerCase() === "business" ? "Business" : "Economy";
    router.push(`/flight/list?adult=${adultsCount}&child=${childrenCount}&child_age=&infant=${infantsCount}&cabin_class=${cClass}&trips=${encodeURIComponent(trips)}`);
  };

  const handleSearchHotels = (e: React.FormEvent) => {
    e.preventDefault();
    const roomsCount = roomConfigs.length;
    const totalAdults = roomConfigs.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomConfigs.reduce((sum, r) => sum + r.children, 0);
    const roomsParam = `${roomsCount},${totalAdults},${totalChildren}`;

    router.push(`/hotel/list?checkin=${checkIn}&checkout=${checkOut}&search=&location=${encodeURIComponent(hotelCity)}&rooms=${roomsParam}&child_ages=&sort=POPULARITY`);
  };

  const handleSearchTours = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/tours?q=${encodeURIComponent(tourQuery)}`);
  };

  const handleSearchVisa = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/visa?country=${encodeURIComponent(visaCountry)}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-white p-5 sm:p-8 shadow-xl border border-slate-200 text-slate-900">
      
      {/* Navigation Service Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("flights")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === "flights"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Plane className="h-4 w-4" />
          <span>Flights</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hotels")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === "hotels"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Hotel className="h-4 w-4" />
          <span>Hotels & Resorts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tours")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === "tours"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Tour Packages</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("visa")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === "visa"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          <span>Visa Services</span>
        </button>
      </div>

      {/* FLIGHT SEARCH TAB */}
      {activeTab === "flights" && (
        <form onSubmit={handleSearchFlights} className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Trip Type Radio Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFlightType("oneway")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  flightType === "oneway" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                One-Way
              </button>
              <button
                type="button"
                onClick={() => setFlightType("roundtrip")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  flightType === "roundtrip" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Round-Trip
              </button>
              <button
                type="button"
                onClick={() => setFlightType("multicity")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  flightType === "multicity" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Multi-City
              </button>
            </div>

            {/* Travelers & Class Controls */}
            <div className="flex items-center gap-3">
              
              {/* Travelers Selector Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTravelerModalOpen(!travelerModalOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
                >
                  <Users className="h-4 w-4 text-emerald-700" />
                  <span>{totalTravelersCount} Traveler{totalTravelersCount > 1 ? "s" : ""}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {/* Travelers breakdown popup */}
                {travelerModalOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-900 uppercase">Select Passengers</h4>

                    {/* Adults 12+ */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <div>
                        <p className="font-bold text-xs text-slate-800">Adults</p>
                        <p className="text-[10px] text-slate-400">12+ years</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                          className="h-7 w-7 rounded-lg bg-slate-100 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-extrabold text-xs w-4 text-center">{adultsCount}</span>
                        <button
                          type="button"
                          onClick={() => setAdultsCount(adultsCount + 1)}
                          className="h-7 w-7 rounded-lg bg-slate-100 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-200"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Children 2-11 */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <div>
                        <p className="font-bold text-xs text-slate-800">Children</p>
                        <p className="text-[10px] text-slate-400">2-11 years</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                          className="h-7 w-7 rounded-lg bg-slate-100 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-extrabold text-xs w-4 text-center">{childrenCount}</span>
                        <button
                          type="button"
                          onClick={() => setChildrenCount(childrenCount + 1)}
                          className="h-7 w-7 rounded-lg bg-slate-100 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-200"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Infants <2 */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="font-bold text-xs text-slate-800">Infants</p>
                        <p className="text-[10px] text-slate-400">Under 2 years</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInfantsCount(Math.max(0, infantsCount - 1))}
                          className="h-7 w-7 rounded-lg bg-slate-100 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-extrabold text-xs w-4 text-center">{infantsCount}</span>
                        <button
                          type="button"
                          onClick={() => setInfantsCount(infantsCount + 1)}
                          className="h-7 w-7 rounded-lg bg-slate-100 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-200"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <Button type="button" onClick={() => setTravelerModalOpen(false)} size="sm" className="w-full font-bold">
                      Done
                    </Button>
                  </div>
                )}
              </div>

              {/* Class Selector */}
              <select
                value={flightClass}
                onChange={(e) => setFlightClass(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="economy">Economy Class</option>
                <option value="business">Business Class</option>
              </select>

            </div>

          </div>

          {/* Standard One-way / Round-trip Inputs */}
          {flightType !== "multicity" ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400">From (Airport)</label>
                <select
                  value={flightFrom}
                  onChange={(e) => setFlightFrom(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none cursor-pointer mt-1"
                >
                  {AIRPORTS.map((ap) => (
                    <option key={ap.code} value={`${ap.city} (${ap.code})`}>
                      {ap.city} - {ap.name} ({ap.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400">To (Airport)</label>
                <select
                  value={flightTo}
                  onChange={(e) => setFlightTo(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none cursor-pointer mt-1"
                >
                  {AIRPORTS.map((ap) => (
                    <option key={ap.code} value={`${ap.city} (${ap.code})`}>
                      {ap.city} - {ap.name} ({ap.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400">Departure</label>
                <input
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none mt-1 cursor-pointer"
                />
              </div>

              {flightType === "roundtrip" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400">Return</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none mt-1 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="flex items-end">
                  <Button type="submit" size="lg" className="w-full font-extrabold gap-2 rounded-2xl">
                    <Search className="h-4 w-4" />
                    <span>Search Flights</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Multi-City Inputs Builder */
            <div className="space-y-3">
              {multiCitySegments.map((segment, idx) => (
                <div key={segment.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400">Flight {idx + 1} From</label>
                    <select
                      value={segment.from}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMultiCitySegments(prev => prev.map(s => s.id === segment.id ? { ...s, from: val } : s));
                      }}
                      className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none mt-1 cursor-pointer"
                    >
                      {AIRPORTS.map((ap) => (
                        <option key={ap.code} value={`${ap.city} (${ap.code})`}>{ap.city} ({ap.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400">To</label>
                    <select
                      value={segment.to}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMultiCitySegments(prev => prev.map(s => s.id === segment.id ? { ...s, to: val } : s));
                      }}
                      className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none mt-1 cursor-pointer"
                    >
                      {AIRPORTS.map((ap) => (
                        <option key={ap.code} value={`${ap.city} (${ap.code})`}>{ap.city} ({ap.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400">Departure</label>
                    <input
                      type="date"
                      value={segment.departDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMultiCitySegments(prev => prev.map(s => s.id === segment.id ? { ...s, departDate: val } : s));
                      }}
                      className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none mt-1 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {multiCitySegments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMultiSegment(segment.id)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleAddMultiSegment}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add another city pair</span>
                </button>
              </div>
            </div>
          )}

          {flightType === "roundtrip" && (
            <div className="flex justify-end pt-2">
              <Button type="submit" size="lg" className="w-full md:w-auto font-black text-xs gap-2 rounded-2xl">
                <Search className="h-4 w-4" />
                <span>Search Round-Trip Flights</span>
              </Button>
            </div>
          )}
        </form>
      )}

      {/* HOTEL SEARCH TAB WITH ROOM & GUESTS BUILDER */}
      {activeTab === "hotels" && (
        <form onSubmit={handleSearchHotels} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* City / Hotel Autocomplete */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <label className="block text-[10px] font-extrabold uppercase text-slate-400">City / Resort / Area</label>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
                <select
                  value={hotelCity}
                  onChange={(e) => setHotelCity(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none cursor-pointer"
                >
                  <option value="Cox's Bazar">Cox's Bazar (Kolatoli & Sugandha Beach)</option>
                  <option value="Sylhet">Sylhet (Sreemangal & Tea Gardens)</option>
                  <option value="Dhaka">Dhaka (Gulshan, Banani, Uttara)</option>
                  <option value="Chittagong">Chittagong (Agrabad, Patenga)</option>
                </select>
              </div>
            </div>

            {/* Check-in */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <label className="block text-[10px] font-extrabold uppercase text-slate-400">Check-in Date</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none mt-1 cursor-pointer"
              />
            </div>

            {/* Check-out */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <label className="block text-[10px] font-extrabold uppercase text-slate-400">Check-out Date</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none mt-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Rooms & Guests Builder Popup Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoomModalOpen(!roomModalOpen)}
              className="flex items-center justify-between w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-700" />
                <span>
                  {roomConfigs.length} Room{roomConfigs.length > 1 ? "s" : ""}, {totalGuestsCount} Guest{totalGuestsCount > 1 ? "s" : ""}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {/* Dynamic Rooms & Guests Builder Modal */}
            {roomModalOpen && (
              <div className="absolute left-0 mt-2 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl z-50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase">Rooms & Guest Capacity</h4>
                  <span className="text-[10px] text-slate-400 font-bold">{roomConfigs.length} Room(s) Configured</span>
                </div>

                <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                  {roomConfigs.map((room, idx) => (
                    <div key={room.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Room {idx + 1}</span>
                        {roomConfigs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRoom(room.id)}
                            className="text-[10px] text-rose-600 font-bold hover:underline"
                          >
                            Remove Room
                          </button>
                        )}
                      </div>

                      {/* Adults 10+ */}
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-700">Adults</p>
                          <p className="text-[10px] text-slate-400">10+ years</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateRoomGuests(room.id, "adults", -1)}
                            className="h-6 w-6 rounded bg-white border border-slate-300 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-extrabold text-xs w-4 text-center">{room.adults}</span>
                          <button
                            type="button"
                            onClick={() => updateRoomGuests(room.id, "adults", 1)}
                            className="h-6 w-6 rounded bg-white border border-slate-300 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Children 0-10 */}
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-700">Children</p>
                          <p className="text-[10px] text-slate-400">0-10 years</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateRoomGuests(room.id, "children", -1)}
                            className="h-6 w-6 rounded bg-white border border-slate-300 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-extrabold text-xs w-4 text-center">{room.children}</span>
                          <button
                            type="button"
                            onClick={() => updateRoomGuests(room.id, "children", 1)}
                            className="h-6 w-6 rounded bg-white border border-slate-300 font-bold flex items-center justify-center text-slate-700 hover:bg-slate-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <Button
                    type="button"
                    onClick={handleAddRoom}
                    variant="outline"
                    size="sm"
                    className="font-bold text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add another room</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setRoomModalOpen(false)}
                    size="sm"
                    className="font-bold text-xs px-6"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" className="w-full md:w-auto font-black text-xs gap-2 rounded-2xl">
              <Hotel className="h-4 w-4" />
              <span>Search Available Hotels</span>
            </Button>
          </div>
        </form>
      )}

      {/* TOUR SEARCH TAB */}
      {activeTab === "tours" && (
        <form onSubmit={handleSearchTours} className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400">Search Location or Tour Package</label>
            <input
              type="text"
              placeholder="e.g. Cox's Bazar, Sundarbans, Dubai, Umrah, Thailand..."
              value={tourQuery}
              onChange={(e) => setTourQuery(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none mt-1"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" className="w-full md:w-auto font-black text-xs gap-2 rounded-2xl">
              <Compass className="h-4 w-4" />
              <span>Explore Tour Packages</span>
            </Button>
          </div>
        </form>
      )}

      {/* VISA SEARCH TAB */}
      {activeTab === "visa" && (
        <form onSubmit={handleSearchVisa} className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400">Select Country for Visa Information</label>
            <select
              value={visaCountry}
              onChange={(e) => setVisaCountry(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none mt-1 cursor-pointer"
            >
              <option value="Saudi Arabia (Umrah / Tourist)">Saudi Arabia (Umrah / Tourist E-Visa)</option>
              <option value="United Arab Emirates (Dubai)">United Arab Emirates (Dubai 30 Days E-Visa)</option>
              <option value="Thailand">Thailand (Tourist Sticker Visa)</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" className="w-full md:w-auto font-black text-xs gap-2 rounded-2xl">
              <FileCheck className="h-4 w-4" />
              <span>View Visa Checklist & Fees</span>
            </Button>
          </div>
        </form>
      )}

    </div>
  );
}
