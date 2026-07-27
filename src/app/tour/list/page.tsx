"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiService } from "@/lib/services/api";
import { Tour } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Filter, ArrowRight, Clock, MapPin, Heart, Users, SlidersHorizontal } from "lucide-react";

function TourListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const location = searchParams.get("location") || "";
  const minPriceParam = Number(searchParams.get("minPrice") || "0");
  const maxPriceParam = Number(searchParams.get("maxPrice") || "150000");
  const durationParam = searchParams.get("duration") || "";
  const sortParam = searchParams.get("sort") || "POPULARITY";

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState(sortParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [selectedDurations, setSelectedDurations] = useState<string[]>(durationParam ? [durationParam] : []);

  useEffect(() => {
    async function fetchSearch() {
      setLoading(true);
      try {
        const url = `/api/v1/tours/search?location=${encodeURIComponent(location)}&minPrice=${minPriceParam}&maxPrice=${maxPrice}&duration=${encodeURIComponent(durationParam)}&sort=${sortOption}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.tours) {
          setTours(data.tours);
        } else {
          const fallback = await apiService.getTours();
          setTours(fallback);
        }
      } catch (err) {
        const fallback = await apiService.getTours();
        setTours(fallback);
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
  }, [location, minPriceParam, maxPrice, durationParam, sortOption]);

  const toggleDuration = (dur: string) => {
    setSelectedDurations((prev) =>
      prev.includes(dur) ? prev.filter((d) => d !== dur) : [...prev, dur]
    );
  };

  const filteredTours = tours.filter((t) => {
    if (selectedDurations.length > 0) {
      if (selectedDurations.includes("1-3") && t.duration_days <= 3) return true;
      if (selectedDurations.includes("4-7") && t.duration_days >= 4 && t.duration_days <= 7) return true;
      if (selectedDurations.includes("8+") && t.duration_days >= 8) return true;
      return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-white text-slate-900">
      
      {/* Gozayaan Style Search Bar Header */}
      <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Badge variant="outline" className="font-bold text-[10px] text-amber-400 border-amber-400">
              Live Tour Search Query
            </Badge>
          </div>
          <h1 className="font-outfit text-2xl sm:text-3xl font-black">
            Tour Packages {location ? `in ${location}` : "Available"}
          </h1>
          <p className="text-xs text-slate-300 font-semibold">
            Handcrafted itineraries, flight options, and verified local guides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs">
            <SlidersHorizontal className="h-4 w-4 text-amber-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="POPULARITY" className="text-slate-900 font-bold">Sort: Popularity</option>
              <option value="PRICE_LOW_TO_HIGH" className="text-slate-900 font-bold">Price: Low to High</option>
              <option value="PRICE_HIGH_TO_LOW" className="text-slate-900 font-bold">Price: High to Low</option>
              <option value="DURATION" className="text-slate-900 font-bold">Duration: Low to High</option>
            </select>
          </div>

          <Link href="/tours">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl px-4 py-2">
              Modify Search
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filter Sidebar */}
        <div className="space-y-6 rounded-2xl border border-slate-200 p-5 bg-slate-50 h-fit lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-amber-600" />
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

        {/* Tour Cards Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full p-12 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200">
                Loading tour packages...
              </div>
            ) : filteredTours.length === 0 ? (
              <div className="col-span-full p-12 text-center border border-dashed border-slate-300 rounded-2xl space-y-2 bg-slate-50">
                <p className="font-bold text-slate-700 text-sm">No tour packages found matching selected filters.</p>
                <Button onClick={() => { setMaxPrice(150000); setSelectedDurations([]); }} size="sm" variant="outline" className="text-xs font-bold rounded-xl">Clear Filters</Button>
              </div>
            ) : (
              filteredTours.map((tour) => (
                <Card key={tour.id} className="overflow-hidden flex flex-col border border-slate-200 bg-white hover:shadow-md transition-all rounded-2xl">
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={tour.images[0]}
                      alt={tour.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/90 text-white px-2 py-0.5 rounded-lg text-[10px] font-black border border-white/20 flex items-center gap-1 shadow-xs">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>{tour.duration_days} Days</span>
                    </div>
                  </div>

                  <CardHeader className="p-3 pb-1 space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-1">{tour.location}</span>
                    </div>
                    <CardTitle className="text-xs font-black line-clamp-2 text-slate-900">
                      {tour.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-3 pt-0 flex-1">
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug">
                      {tour.overview}
                    </p>
                  </CardContent>

                  <CardFooter className="p-2.5 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <span className="text-[8px] uppercase font-extrabold text-slate-400 block">Starting From</span>
                      <span className="text-xs font-black text-slate-900">
                        {formatBDT(tour.price_per_person)}
                      </span>
                    </div>
                    <Link href={`/tours/${tour.id}`}>
                      <Button size="sm" className="font-bold text-[11px] rounded-xl h-7 px-2.5 gap-1 bg-slate-900 hover:bg-slate-800 text-white">
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function TourListPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-500">Loading Gozayaan tour results...</div>}>
      <TourListContent />
    </Suspense>
  );
}
