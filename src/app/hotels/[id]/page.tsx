"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiService } from "@/lib/services/api";
import { Hotel, Room } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Star, MapPin, CheckCircle, BedDouble, ChevronLeft, ChevronRight, MessageSquare, Heart, PlusCircle, Loader2 } from "lucide-react";

const GoogleMapView = dynamic(() => import("@/components/maps/google-map-view"), {
  ssr: false,
  loading: () => <div className="h-48 w-full rounded-2xl bg-slate-100 skeleton border border-slate-200" />,
});

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params?.id as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Auto-slide image carousel state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review submission state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadHotelData() {
      if (!hotelId) return;
      setLoading(true);
      const data = await apiService.getHotelById(hotelId);
      const roomData = await apiService.getHotelRooms(hotelId);
      setHotel(data);
      setRooms(roomData);

      // Check if saved favorite
      const saved = await apiService.getSavedItems();
      const exists = saved.some((s) => s.entity_type === "hotel" && s.entity_id === hotelId);
      setIsFavorite(exists);

      // Fetch reviews
      const allReviews = await apiService.getUserReviews();
      const hotelRev = allReviews.filter((r) => r.target_type === "hotel" && (r.target_id === hotelId || r.target_title === data?.name));
      setReviews(hotelRev);

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

  const toggleFavorite = async () => {
    if (!hotel) return;
    if (isFavorite) {
      await apiService.removeSavedItem("", "hotel", hotel.id);
      setIsFavorite(false);
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
      setIsFavorite(true);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || !hotel) return;

    setSubmittingReview(true);
    const newRev = await apiService.addReview({
      target_type: "hotel",
      target_id: hotel.id,
      target_title: hotel.name,
      rating: reviewRating,
      comment: `${reviewerName ? `[${reviewerName}] ` : ""}${reviewComment.trim()}`,
    });

    setReviews((prev) => [newRev, ...prev]);
    setSubmittingReview(false);
    setShowReviewModal(false);
    setReviewComment("");
    setReviewerName("");
  };

  if (loading) {
    return <div className="p-8 text-center font-bold text-slate-500 text-xs">Loading hotel details...</div>;
  }

  if (!hotel) {
    return <div className="p-8 text-center font-bold text-xs">Hotel not found.</div>;
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
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 bg-white text-slate-900">
      
      {/* Compact Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-bold text-[10px] py-0">{hotel.city}</Badge>
            <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Star className="h-3 w-3 fill-amber-400" />
              <span>{hotel.star_rating} Star Resort</span>
            </div>
          </div>

          <h1 className="font-outfit text-2xl sm:text-3xl font-black text-slate-900">
            {hotel.name}
          </h1>

          <div className="flex items-center gap-1 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            <span>{hotel.address}</span>
          </div>
        </div>

        <Button
          onClick={toggleFavorite}
          variant={isFavorite ? "default" : "outline"}
          size="sm"
          className={`font-bold text-xs rounded-xl gap-1.5 h-9 ${isFavorite ? "bg-rose-600 hover:bg-rose-700 text-white" : "hover:text-rose-600"}`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          <span>{isFavorite ? "Saved in Favorites" : "Save to Favorites"}</span>
        </Button>
      </div>

      {/* Compact Image Carousel */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs bg-slate-900 group">
        <Image
          src={hotel.images[activeImageIndex] || hotel.images[0]}
          alt={hotel.name}
          fill
          priority
          sizes="100vw"
          className="object-cover transition-opacity duration-500"
        />

        {/* Carousel controls */}
        {hotel.images.length > 1 && (
          <>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center shadow-xs transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev + 1) % hotel.images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center shadow-xs transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
              {hotel.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeImageIndex === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Description, Rooms, Facilities, Reviews */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About Hotel */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">About the Hotel</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{hotel.description}</p>
          </div>

          {/* Room Types Listing */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-emerald-700" />
              Available Room Types & Rates
            </h3>

            <div className="space-y-2.5">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1 w-full sm:w-auto">
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {room.room_type}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                      <span className="font-bold">Max {room.max_adults} Adults, {room.max_children} Children</span>
                      <span className="text-emerald-700 font-bold">• {room.available_count} Left</span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {room.features.map((feat, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-slate-50 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Rate per night</span>
                      <span className="text-base font-black text-slate-900">
                        {formatBDT(room.price_per_night)}
                      </span>
                    </div>

                    <Button onClick={() => handleBookRoom(room)} size="sm" className="font-bold rounded-lg h-8 px-4 text-xs">
                      Book Room
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grouped Facilities */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Facilities & Amenities</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {facilityCategories.map((categoryKey) => {
                const items = hotel.facilities?.[categoryKey] || [];
                if (items.length === 0) return null;

                return (
                  <div key={categoryKey} className="space-y-0.5 p-2 bg-white rounded-lg border border-slate-200 text-xs">
                    <h4 className="text-[11px] font-bold text-emerald-700 uppercase">{categoryKey}</h4>
                    <ul className="space-y-0.5 text-slate-600">
                      {items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />
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
          <div className="space-y-2 p-4 rounded-2xl bg-white border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900">Hotel Policies</h3>
            
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Check-in Time:</span>
                <span className="font-bold">{hotel.policies?.check_in_time || "02:00 PM"}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Check-out Time:</span>
                <span className="font-bold">{hotel.policies?.check_out_time || "12:00 PM"}</span>
              </div>

              {hotel.policies?.child_policy && (
                <div className="py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block">Child Policy:</span>
                  <p className="text-slate-600 mt-0.5">{hotel.policies.child_policy}</p>
                </div>
              )}
            </div>
          </div>

          {/* Guest Reviews Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-700" />
                Guest Reviews ({reviews.length})
              </h3>
              <Button size="sm" variant="outline" onClick={() => setShowReviewModal(!showReviewModal)} className="gap-1 font-bold text-xs h-7 rounded-lg">
                <PlusCircle className="h-3 w-3" />
                <span>Write Review</span>
              </Button>
            </div>

            {/* Inline Review Form */}
            {showReviewModal && (
              <form onSubmit={handleAddReview} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-1.5 font-semibold text-slate-900 outline-none"
                  />
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-200 p-1.5 font-semibold text-slate-900 outline-none"
                  >
                    {[5, 4, 3, 2, 1].map((num) => (
                      <option key={num} value={num}>{num} Stars</option>
                    ))}
                  </select>
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Share your experience staying at this hotel..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-md border border-slate-200 p-1.5 font-semibold text-slate-900 outline-none"
                />
                <div className="flex justify-end gap-1.5">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowReviewModal(false)} className="text-xs h-7">Cancel</Button>
                  <Button type="submit" size="sm" disabled={submittingReview} className="text-xs h-7 font-bold">
                    {submittingReview ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post Review"}
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500 font-semibold p-2">No guest reviews yet. Be the first to leave a review!</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{rev.user_name || "Verified Guest"}</span>
                      <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{rev.rating} / 5</span>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-normal">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Google Maps Location & Nearby */}
        <div className="space-y-4">
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
