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
import { MapPin, Star, Filter, ArrowRight, Tag, Heart } from "lucide-react";

const GoogleMapView = dynamic(() => import("@/components/maps/google-map-view"), {
  ssr: false,
  loading: () => <div className="h-48 w-full rounded-2xl bg-slate-100 skeleton border border-slate-200" />,
});

function HotelsContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") || "";

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState("All");
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
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 bg-white text-slate-900">
      
      {/* Compact Header Banner */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5">
          <Badge variant="outline" className="font-bold text-[10px] py-0">🏨 Resort & Hotel Directory</Badge>
          <h1 className="font-outfit text-xl sm:text-2xl font-black text-slate-900">
            Book Hotels in {selectedCity || "Bangladesh"}
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Compare room rates, view location maps, and save favorites instantly.
          </p>
        </div>
      </div>

      {/* Compact Hotel Search Tags Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 pb-2.5 no-scrollbar">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Tag className="h-3 w-3" /> Types:
        </span>
        {["All", "Business", "Couple", "Families", "Friends", "Solo"].map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 border ${
              selectedTag === tag
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {tag === "All" ? "All Stays" : tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Filters Sidebar */}
        <div className="space-y-4 rounded-2xl border border-slate-200 p-3.5 bg-slate-50 h-fit">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-emerald-700" />
              Filter Hotels
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">{hotels.length} Properties</span>
          </div>

          {/* City Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">City Destination</label>
            <div className="space-y-0.5 text-xs font-semibold text-slate-700">
              {["All Cities", "Cox's Bazar", "Sylhet", "Dhaka", "Chittagong"].map((city) => (
                <label key={city} className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-white text-xs">
                  <input
                    type="radio"
                    name="city"
                    checked={(city === "All Cities" && !selectedCity) || selectedCity === city}
                    onChange={() => setSelectedCity(city === "All Cities" ? "" : city)}
                    className="accent-slate-900 h-3.5 w-3.5"
                  />
                  <span>{city}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Star Rating Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Star Rating</label>
            <div className="flex items-center gap-1">
              {[0, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
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
            <div className="pt-3 border-t border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Map Preview</span>
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
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {loading ? (
            <div className="col-span-full p-8 text-center text-slate-500 font-bold text-xs">
              Loading hotel listings...
            </div>
          ) : hotels.length === 0 ? (
            <div className="col-span-full p-8 text-center border border-dashed border-slate-300 rounded-2xl space-y-2 text-xs">
              <p className="font-bold text-slate-700">No hotels found matching criteria.</p>
              <Button onClick={() => { setSelectedCity(""); setSelectedRating(0); setSelectedTag("All"); }} size="sm" variant="outline" className="text-xs font-bold">Clear Filters</Button>
            </div>
          ) : (
            hotels.map((hotel) => {
              const isFavorite = savedHotelIds.has(hotel.id);
              return (
                <Card
                  key={hotel.id}
                  onMouseEnter={() => setActiveHotelMap(hotel)}
                  className="overflow-hidden flex flex-col border border-slate-200 bg-white hover:shadow-md transition-all rounded-xl"
                >
                  <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={hotel.images[0]}
                      alt={hotel.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded-md text-slate-900 text-[11px] font-bold border border-slate-200 flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{hotel.star_rating}★</span>
                    </div>

                    {/* Favorite Bookmark Button */}
                    <button
                      onClick={(e) => toggleSaveHotel(hotel, e)}
                      title={isFavorite ? "Remove from Favorites" : "Save to Favorites"}
                      className={`absolute top-2 right-2 p-1.5 rounded-full border transition-all ${
                        isFavorite ? "bg-rose-500 text-white border-rose-500" : "bg-white/90 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-600"
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
                    </button>

                    {/* Discount Badge */}
                    {hotel.discount && hotel.discount > 0 && (
                      <div className="absolute bottom-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {hotel.discount}% OFF
                      </div>
                    )}
                  </div>

                  <CardHeader className="p-3 pb-1 space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-1">{hotel.area}, {hotel.city}</span>
                    </div>
                    <CardTitle className="text-sm font-bold line-clamp-1 text-slate-900">
                      {hotel.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-3 pt-0 flex-1">
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                      {hotel.description}
                    </p>
                  </CardContent>

                  <CardFooter className="p-3 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Nightly rate</span>
                      <span className="text-sm font-black text-slate-900">
                        {formatBDT(hotel.min_price || 6500)}
                      </span>
                    </div>
                    <Link href={`/hotels/${hotel.id}`}>
                      <Button size="sm" className="font-bold text-xs rounded-lg h-7 px-2.5 gap-1">
                        <span>View</span>
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
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-500 text-xs">Loading Hotels...</div>}>
      <HotelsContent />
    </Suspense>
  );
}
