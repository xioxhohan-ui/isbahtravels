"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiService } from "@/lib/services/api";
import { Hotel } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Filter, ArrowRight, Tag } from "lucide-react";
import GoogleMapView from "@/components/maps/google-map-view";

function HotelsContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") || "";

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState("All");
  const [activeHotelMap, setActiveHotelMap] = useState<Hotel | null>(null);

  useEffect(() => {
    async function loadHotels() {
      setLoading(true);
      const data = await apiService.getHotels({
        city: selectedCity,
        star_rating: selectedRating > 0 ? selectedRating : undefined,
      });
      setHotels(data);
      if (data.length > 0) setActiveHotelMap(data[0]);
      setLoading(false);
    }
    loadHotels();
  }, [selectedCity, selectedRating]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white text-slate-900">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <Badge variant="outline" className="font-bold text-xs">🏨 Resort & Hotel Directory</Badge>
          <h1 className="font-outfit text-3xl font-black text-slate-900">
            Book Hotels & Resorts in {selectedCity || "Bangladesh"}
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Compare room rates, view Google Maps locations, and book instantly.
          </p>
        </div>
      </div>

      {/* Hotel Search Tags Filter */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-4 no-scrollbar">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-2">
          <Tag className="h-3.5 w-3.5" /> Filter by Type:
        </span>
        {["All", "Business", "Couple", "Families", "Friends", "Solo"].map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
              selectedTag === tag
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {tag === "All" ? "All Stays" : tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className="space-y-6 rounded-2xl border border-slate-200 p-5 bg-slate-50 h-fit">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-emerald-700" />
              Filter Hotels
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{hotels.length} Properties</span>
          </div>

          {/* City Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">City Destination</label>
            <div className="space-y-1 text-xs font-semibold text-slate-700">
              {["All Cities", "Cox's Bazar", "Sylhet", "Dhaka", "Chittagong"].map((city) => (
                <label key={city} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white">
                  <input
                    type="radio"
                    name="city"
                    checked={(city === "All Cities" && !selectedCity) || selectedCity === city}
                    onChange={() => setSelectedCity(city === "All Cities" ? "" : city)}
                    className="accent-slate-900"
                  />
                  <span>{city}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Star Rating Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Minimum Star Rating</label>
            <div className="flex items-center gap-2">
              {[0, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedRating === star
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {star === 0 ? "All" : `${star}★`}
                </button>
              ))}
            </div>
          </div>

          {/* Active Map Preview Widget */}
          {activeHotelMap && (
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Map Location</span>
              <GoogleMapView
                latitude={activeHotelMap.latitude}
                longitude={activeHotelMap.longitude}
                title={activeHotelMap.name}
                address={activeHotelMap.address}
                nearby={activeHotelMap.nearby}
              />
            </div>
          )}
        </div>

        {/* Hotel Cards Catalog */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full p-12 text-center text-slate-500 font-bold">
              Loading hotel listings...
            </div>
          ) : hotels.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed border-slate-300 rounded-3xl space-y-3">
              <p className="font-bold text-slate-700">No hotels found matching criteria.</p>
              <Button onClick={() => { setSelectedCity(""); setSelectedRating(0); setSelectedTag("All"); }} variant="outline">Clear Filters</Button>
            </div>
          ) : (
            hotels.map((hotel) => (
              <Card
                key={hotel.id}
                onMouseEnter={() => setActiveHotelMap(hotel)}
                className="overflow-hidden flex flex-col border border-slate-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={hotel.images[0]}
                    alt={hotel.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-lg text-slate-900 text-xs font-bold border border-slate-200 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{hotel.star_rating} Star</span>
                  </div>

                  {/* Discount Badge */}
                  {hotel.discount && hotel.discount > 0 && (
                    <div className="absolute top-3 right-3 bg-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs">
                      {hotel.discount}% OFF
                    </div>
                  )}
                </div>

                <CardHeader className="p-5 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{hotel.area}, {hotel.city}</span>
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-1 mt-1 text-slate-900">
                    {hotel.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-0 flex-1">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {hotel.description}
                  </p>
                </CardContent>

                <CardFooter className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nightly rate</span>
                    <span className="text-lg font-black text-slate-900">
                      {formatBDT(hotel.min_price || 6500)}
                    </span>
                  </div>
                  <Link href={`/hotels/${hotel.id}`}>
                    <Button size="sm" className="font-bold text-xs rounded-xl gap-1">
                      <span>View Rooms</span>
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

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading Hotels...</div>}>
      <HotelsContent />
    </Suspense>
  );
}
