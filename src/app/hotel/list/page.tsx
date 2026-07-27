"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiService } from "@/lib/services/api";
import { Hotel } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hotel as HotelIcon, Filter, ArrowRight, Star, MapPin, Heart, Calendar, Users, SlidersHorizontal } from "lucide-react";

function HotelListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const checkin = searchParams.get("checkin") || "2026-08-01";
  const checkout = searchParams.get("checkout") || "2026-08-02";
  const search = searchParams.get("search") || "";
  const location = searchParams.get("location") || "";
  const roomsParam = searchParams.get("rooms") || "1,2,0";
  const sortParam = searchParams.get("sort") || "POPULARITY";

  const roomParts = roomsParam.split(",");
  const reqRooms = roomParts[0] || "1";
  const reqAdults = roomParts[1] || "2";
  const reqChildren = roomParts[2] || "0";

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState(sortParam);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchSearch() {
      setLoading(true);
      try {
        const url = `/api/v1/hotels/search?checkin=${checkin}&checkout=${checkout}&search=${encodeURIComponent(search)}&location=${encodeURIComponent(location)}&rooms=${roomsParam}&sort=${sortOption}&max_price=${maxPrice}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.hotels) {
          setHotels(data.hotels);
        } else {
          const fallback = await apiService.getHotels();
          setHotels(fallback);
        }
      } catch (err) {
        const fallback = await apiService.getHotels();
        setHotels(fallback);
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
  }, [checkin, checkout, search, location, roomsParam, sortOption, maxPrice]);

  const toggleStar = (star: number) => {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  };

  const filteredHotels = hotels.filter((h) => {
    if (selectedStars.length > 0 && !selectedStars.includes(h.star_rating)) {
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
            <Badge variant="outline" className="font-bold text-[10px] text-emerald-400 border-emerald-400">
              Live Hotel Search Query
            </Badge>
            <span className="text-xs text-slate-300 font-semibold">{checkin} ➔ {checkout}</span>
          </div>
          <h1 className="font-outfit text-2xl sm:text-3xl font-black">
            Hotels {location ? `in ${location}` : "Available"}
          </h1>
          <p className="text-xs text-slate-300 font-semibold">
            {reqRooms} Room(s), {reqAdults} Adult(s), {reqChildren} Child(ren)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="POPULARITY" className="text-slate-900 font-bold">Sort: Popularity</option>
              <option value="PRICE_LOW_TO_HIGH" className="text-slate-900 font-bold">Price: Low to High</option>
              <option value="PRICE_HIGH_TO_LOW" className="text-slate-900 font-bold">Price: High to Low</option>
              <option value="RATING" className="text-slate-900 font-bold">Rating: High to Low</option>
            </select>
          </div>

          <Link href="/hotels">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-4 py-2">
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
              <Filter className="h-4 w-4 text-emerald-700" />
              Filter Properties
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{filteredHotels.length} Hotels</span>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-extrabold text-slate-400 uppercase text-[10px]">Max Price per Night</label>
              <span className="font-extrabold text-slate-900">{formatBDT(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={2000}
              max={100000}
              step={2500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          {/* Star Rating Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="font-extrabold text-slate-400 uppercase text-[10px] block">Star Rating</label>
            <div className="space-y-1.5 text-xs font-semibold text-slate-700">
              {[5, 4, 3].map((star) => (
                <label key={star} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStars.includes(star)}
                    onChange={() => toggleStar(star)}
                    className="accent-slate-900 rounded"
                  />
                  <span>{star}-Star Luxury & Resorts</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Hotel Cards Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full p-12 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200">
                Loading hotel listings...
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="col-span-full p-12 text-center border border-dashed border-slate-300 rounded-2xl space-y-2 bg-slate-50">
                <p className="font-bold text-slate-700 text-sm">No hotels found matching selected search filters.</p>
                <Button onClick={() => { setMaxPrice(100000); setSelectedStars([]); }} size="sm" variant="outline" className="text-xs font-bold rounded-xl">Clear Filters</Button>
              </div>
            ) : (
              filteredHotels.map((hotel) => {
                const isFavorite = savedIds.has(hotel.id);
                return (
                  <Card key={hotel.id} className="overflow-hidden flex flex-col border border-slate-200 bg-white hover:shadow-md transition-all rounded-2xl">
                    <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                      <Image
                        src={hotel.images[0]}
                        alt={hotel.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-lg text-slate-900 text-[10px] font-black border border-slate-200 flex items-center gap-0.5 shadow-xs">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{hotel.star_rating}★</span>
                      </div>
                      {hotel.discount && hotel.discount > 0 && (
                        <div className="absolute bottom-2 left-2 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          {hotel.discount}% OFF
                        </div>
                      )}
                    </div>

                    <CardHeader className="p-3 pb-1 space-y-0.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{hotel.area}, {hotel.city}</span>
                      </div>
                      <CardTitle className="text-xs font-black line-clamp-1 text-slate-900">
                        {hotel.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-3 pt-0 flex-1">
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug">
                        {hotel.description}
                      </p>
                    </CardContent>

                    <CardFooter className="p-2.5 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="text-[8px] uppercase font-extrabold text-slate-400 block">From</span>
                        <span className="text-xs font-black text-slate-900">
                          {formatBDT(hotel.min_price || 6500)}
                        </span>
                      </div>
                      <Link href={`/hotels/${hotel.id}`}>
                        <Button size="sm" className="font-bold text-[11px] rounded-xl h-7 px-2.5 gap-1 bg-slate-900 hover:bg-slate-800 text-white">
                          <span>Book</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function HotelListPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-500">Loading Gozayaan hotel results...</div>}>
      <HotelListContent />
    </Suspense>
  );
}
