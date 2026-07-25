"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiService } from "@/lib/services/api";
import { Tour } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Star, ArrowRight, Search, Filter } from "lucide-react";

function ToursContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("cat") || "All";
  const initialQuery = searchParams.get("q") || "";

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);

  useEffect(() => {
    async function loadTours() {
      setLoading(true);
      const data = await apiService.getTours({
        category: category !== "All" ? category : undefined,
        search: searchQuery,
      });
      setTours(data);
      setLoading(false);
    }
    loadTours();
  }, [category, searchQuery]);

  const toggleDuration = (dur: string) => {
    setSelectedDurations(prev =>
      prev.includes(dur) ? prev.filter(d => d !== dur) : [...prev, dur]
    );
  };

  const filteredTours = tours.filter(t => {
    if (t.price_per_person > maxPrice) return false;
    if (selectedDurations.length > 0) {
      if (selectedDurations.includes("1-3") && t.duration_days <= 3) return true;
      if (selectedDurations.includes("4-7") && t.duration_days >= 4 && t.duration_days <= 7) return true;
      if (selectedDurations.includes("8+") && t.duration_days >= 8) return true;
      return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white text-slate-900">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <Badge variant="outline" className="font-bold text-xs">🏖️ Tour Packages & Expeditions</Badge>
          <h1 className="font-outfit text-3xl font-black text-slate-900">
            Explore Handcrafted Holiday Packages
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Cox's Bazar, Sundarbans, Sylhet, Dubai, Thailand & Umrah Packages.
          </p>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {["All", "Domestic", "International", "Umrah", "Adventure"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                category === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat} Packages
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar: Price Slider & Duration Checkboxes */}
        <div className="space-y-6 rounded-2xl border border-slate-200 p-5 bg-slate-50 h-fit">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-emerald-700" />
              Filter Packages
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{filteredTours.length} Packages</span>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-extrabold text-slate-400 uppercase text-[10px]">Max Price per Person</label>
              <span className="font-extrabold text-slate-900">{formatBDT(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={5000}
              max={150000}
              step={2500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          {/* Duration Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="font-extrabold text-slate-400 uppercase text-[10px] block">Trip Duration</label>
            <div className="space-y-1.5 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDurations.includes("1-3")}
                  onChange={() => toggleDuration("1-3")}
                  className="accent-slate-900 rounded"
                />
                <span>1 - 3 Days Getaways</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDurations.includes("4-7")}
                  onChange={() => toggleDuration("4-7")}
                  className="accent-slate-900 rounded"
                />
                <span>4 - 7 Days Holidays</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDurations.includes("8+")}
                  onChange={() => toggleDuration("8+")}
                  className="accent-slate-900 rounded"
                />
                <span>8+ Days Expeditions (Umrah)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tour Cards Catalog */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-12 text-center text-slate-500 font-bold">
              Loading tour packages...
            </div>
          ) : filteredTours.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed border-slate-300 rounded-3xl space-y-3">
              <p className="font-bold text-slate-700">No tour packages found matching search.</p>
              <Button onClick={() => { setCategory("All"); setSearchQuery(""); setMaxPrice(150000); setSelectedDurations([]); }} variant="outline">Reset Filters</Button>
            </div>
          ) : (
            filteredTours.map((tour) => (
              <Card key={tour.id} className="overflow-hidden flex flex-col border border-slate-200 bg-white hover:shadow-md transition-shadow">
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={tour.images[0]}
                    alt={tour.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-lg text-slate-900 text-xs font-bold border border-slate-200">
                    {tour.category || "Tour"}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-400" />
                    <span>{tour.duration_days} Days / {tour.duration_days - 1} Nights</span>
                  </div>
                </div>

                <CardHeader className="p-5 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{tour.location}</span>
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-1 mt-1 text-slate-900">
                    {tour.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-0 flex-1">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {tour.overview}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-800">{tour.rating || 4.9}</span>
                    <span className="text-slate-400">({tour.reviews_count || 140} reviews)</span>
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Starts from</span>
                    <span className="text-lg font-black text-slate-900">
                      {formatBDT(tour.price_per_person)}
                    </span>
                  </div>
                  <Link href={`/tours/${tour.id}`}>
                    <Button size="sm" className="font-bold text-xs rounded-xl gap-1">
                      <span>View Itinerary</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

      </div>

    </div>
  );
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading Tours...</div>}>
      <ToursContent />
    </Suspense>
  );
}
