"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiService } from "@/lib/services/api";
import { Hotel, Room, HotelReview } from "@/lib/types/database";
import { MOCK_HOTEL_REVIEWS } from "@/lib/mock-data";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle, ShieldCheck, Users, BedDouble, ChevronLeft, ChevronRight, MessageSquare, Clock, AlertCircle } from "lucide-react";
import GoogleMapView from "@/components/maps/google-map-view";

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params?.id as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<HotelReview[]>(MOCK_HOTEL_REVIEWS);
  const [loading, setLoading] = useState(true);
  
  // Auto-slide image carousel state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function loadHotelData() {
      if (!hotelId) return;
      setLoading(true);
      const data = await apiService.getHotelById(hotelId);
      const roomData = await apiService.getHotelRooms(hotelId);
      setHotel(data);
      setRooms(roomData);
      setLoading(false);
    }
    loadHotelData();
  }, [hotelId]);

  // Auto-slide effect every 4 seconds
  useEffect(() => {
    if (!hotel || hotel.images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % hotel.images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [hotel]);

  if (loading) {
    return <div className="p-12 text-center font-bold text-slate-500">Loading hotel details...</div>;
  }

  if (!hotel) {
    return <div className="p-12 text-center font-bold">Hotel not found.</div>;
  }

  const handleBookRoom = (room: Room) => {
    const query = new URLSearchParams({
      type: "hotel",
      ref_id: hotel.id,
      title: `${hotel.name} - ${room.room_type}`,
      price: room.price_per_night.toString(),
    });
    router.push(`/checkout?${query.toString()}`);
  };

  const facilityCategories = [
    "Business",
    "Fitness",
    "Food",
    "General",
    "Indoor Entertainment",
    "Media",
    "Parking",
    "Safety",
    "Services",
    "Transportation",
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-white text-slate-900">
      
      {/* Title Header */}
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-bold text-xs">{hotel.city}</Badge>
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            <span>{hotel.star_rating} Star Luxury Hotel</span>
          </div>
        </div>

        <h1 className="font-outfit text-3xl sm:text-4xl font-black text-slate-900">
          {hotel.name}
        </h1>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{hotel.address}</span>
        </div>
      </div>

      {/* Auto-Slide Image Carousel */}
      <div className="relative h-80 sm:h-[420px] w-full overflow-hidden rounded-3xl border border-slate-200 shadow-md bg-slate-900 group">
        <img
          src={hotel.images[activeImageIndex] || hotel.images[0]}
          alt={hotel.name}
          className="h-full w-full object-cover transition-opacity duration-700"
        />

        {/* Carousel controls */}
        {hotel.images.length > 1 && (
          <>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center shadow-md transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev + 1) % hotel.images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center shadow-md transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-xs px-3 py-1 rounded-full">
              {hotel.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    activeImageIndex === idx ? "w-6 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Description, Rooms, Facilities, Reviews */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* About Hotel */}
          <div className="space-y-3 p-6 rounded-3xl bg-slate-50 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">About the Hotel</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{hotel.description}</p>
          </div>

          {/* Room Types Listing */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-emerald-700" />
              Available Room Types & Rates
            </h3>

            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2 w-full md:w-auto">
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                      {room.room_type}
                    </span>

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-bold">
                        <Users className="h-3.5 w-3.5 text-slate-600" />
                        Max {room.max_adults} Adults, {room.max_children} Children
                      </span>
                      <span className="text-emerald-700 font-bold">• {room.available_count} Rooms Left</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {room.features.map((feat, i) => (
                        <span key={i} className="text-[11px] font-semibold bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Rate per night</span>
                      <span className="text-xl font-black text-slate-900">
                        {formatBDT(room.price_per_night)}
                      </span>
                    </div>

                    <Button onClick={() => handleBookRoom(room)} size="sm" className="mt-2 font-bold rounded-xl px-5">
                      Book Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grouped Facilities per User Spec */}
          <div className="space-y-4 p-6 rounded-3xl bg-slate-50 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Hotel Facilities & Amenities</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {facilityCategories.map((categoryKey) => {
                const items = hotel.facilities?.[categoryKey] || [];
                if (items.length === 0) return null;

                return (
                  <div key={categoryKey} className="space-y-1 p-3 bg-white rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase">{categoryKey}</h4>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Policies Section */}
          <div className="space-y-4 p-6 rounded-3xl bg-white border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Hotel Policies</h3>
            
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Check-in Time:</span>
                <span className="font-bold">{hotel.policies?.check_in_time || "02:00 PM"}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Check-out Time:</span>
                <span className="font-bold">{hotel.policies?.check_out_time || "12:00 PM"}</span>
              </div>

              {hotel.policies?.child_policy && (
                <div className="py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block">Child Policy:</span>
                  <p className="text-slate-600 mt-0.5">{hotel.policies.child_policy}</p>
                </div>
              )}

              {hotel.policies?.pet_policy && (
                <div className="py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block">Pet Policy:</span>
                  <p className="text-slate-600 mt-0.5">{hotel.policies.pet_policy}</p>
                </div>
              )}

              {hotel.policies?.house_rules && (
                <div className="pt-1">
                  <span className="font-bold text-slate-900 block">House Rules:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 mt-1">
                    {hotel.policies.house_rules.map((rule, i) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Guest Reviews Section */}
          <div className="space-y-4 p-6 rounded-3xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-700" />
                Guest Reviews ({reviews.length})
              </h3>
              <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>4.8 / 5.0</span>
              </div>
            </div>

            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{rev.user_name || "Verified Guest"}</span>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span>{rev.rating} / 5</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Google Maps Location & Nearby */}
        <div className="space-y-6">
          <GoogleMapView
            latitude={hotel.latitude}
            longitude={hotel.longitude}
            title={hotel.name}
            address={hotel.address}
            nearby={hotel.nearby}
          />
        </div>

      </div>

    </div>
  );
}
