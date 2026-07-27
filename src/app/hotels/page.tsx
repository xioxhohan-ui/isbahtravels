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
import Image from "next/image";
import dynamic from "next/dynamic";
import { MapPin, Star, Filter, ArrowRight, Tag, Heart, Map } from "lucide-react";

const GoogleMapView = dynamic(() => import("@/components/maps/google-map-view"), {
  ssr: false,
  loading: () => <div className="h-44 w-full rounded-2xl bg-slate-100 skeleton border border-slate-200" />,
});

function HotelsContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") || "";

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState("All");
  const [showMap, setShowMap] = useState(false);
  const [activeHotelMap, setActiveHotelMap] = useState<Hotel | null>(null);
  const [savedHotelIds, setSavedHotelIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadHotels() {
      setLoading(true);
      const data = await apiService.getHotels({
        city: selectedCity,
        star_rating: selectedRating > 0 ? selectedRating : undefined,
      });
      setHotels(data);
      if (data.length > 0) setActiveHotelMap(data[0]);

      // Load saved favorites
      const saved = await apiService.getSavedItems();
      const hotelFavs = new Set<string>(
        saved.filter((s) => s.entity_type === "hotel").map((s) => s.entity_id)
      );
      setSavedHotelIds(hotelFavs);

      setLoading(false);
    }
    loadHotels();
  }, [selectedCity, selectedRating]);

  const toggleSaveHotel = async (hotel: Hotel, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isSaved = savedHotelIds.has(hotel.id);
    if (isSaved) {
      await apiService.removeSavedItem("", "hotel", hotel.id);
      setSavedHotelIds((prev) => {
        const next = new Set(prev);
        next.delete(hotel.id);
        return next;
      });
    } else {
      await apiService.saveItem({
        entity_type: "hotel",
        entity_id: hotel.id,
        title: hotel.name,
        subtitle: `${hotel.area || ""}, ${hotel.city}`,
        image: hotel.images[0],
        price: hotel.min_price || 6500,
        url: `/hotels/${hotel.id}`,
      });
      setSavedHotelIds((prev) => new Set(prev).add(hotel.id));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-5 py-4 space-y-3.5 bg-white text-slate-900">
      
      {/* Compact Top Header & Quick Filter Bar */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-outfit text-lg sm:text-xl font-black text-slate-900">
                Hotels & Resorts {selectedCity ? `in ${selectedCity}` : ""}
              </h1>
              <Badge variant="outline" className="text-[9px] font-bold uppercase">{hotels.length} Properties</Badge>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold">
              Instant room booking, SSLCommerz verified payments, and free cancellation.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            className="text-xs font-bold gap-1 rounded-xl h-8 self-start sm:self-auto"
          >
            <Map className="h-3.5 w-3.5 text-emerald-700" />
            <span>{showMap ? "Hide Map" : "Show Map View"}</span>
          </Button>
        </div>

        {/* Compact Horizontal Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs">
          {/* City Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1">City:</span>
            {["All", "Cox's Bazar", "Sylhet", "Dhaka", "Chittagong"].map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city === "All" ? "" : city)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 border ${
                  (!selectedCity && city === "All") || selectedCity === city
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Star Filter Buttons */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1">Stars:</span>
            {[0, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setSelectedRating(star)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                  selectedRating === star
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {star === 0 ? "All" : `${star}★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible Google Map Banner */}
      {showMap && activeHotelMap && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <GoogleMapView
            latitude={activeHotelMap.latitude}
            longitude={activeHotelMap.longitude}
            title={activeHotelMap.name}
            address={activeHotelMap.address}
            nearby={activeHotelMap.nearby}
          />
        </div>
      )}

      {/* High-Density Hotel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-500 font-bold text-xs">
            Loading hotel listings...
          </div>
        ) : hotels.length === 0 ? (
          <div className="col-span-full p-8 text-center border border-dashed border-slate-300 rounded-2xl space-y-2 text-xs">
            <p className="font-bold text-slate-700">No hotels found matching selected filters.</p>
            <Button onClick={() => { setSelectedCity(""); setSelectedRating(0); }} size="sm" variant="outline" className="text-xs font-bold rounded-xl">Clear Filters</Button>
          </div>
        ) : (
          hotels.map((hotel) => {
            const isFavorite = savedHotelIds.has(hotel.id);
            return (
              <Card
                key={hotel.id}
                onMouseEnter={() => setActiveHotelMap(hotel)}
                className="overflow-hidden flex flex-col border border-slate-200 bg-white hover:shadow-md transition-all rounded-2xl"
              >
                <div className="relative h-32 w-full overflow-hidden bg-slate-100">
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

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => toggleSaveHotel(hotel, e)}
                    title={isFavorite ? "Remove from Favorites" : "Save to Favorites"}
                    className={`absolute top-2 right-2 p-1.5 rounded-full border transition-all shadow-xs ${
                      isFavorite ? "bg-rose-500 text-white border-rose-500" : "bg-white/95 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>

                  {/* Discount Badge */}
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
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-500 text-xs">Loading Hotels...</div>}>
      <HotelsContent />
    </Suspense>
  );
}
