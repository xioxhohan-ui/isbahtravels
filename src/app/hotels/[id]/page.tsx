"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiService } from "@/lib/services/api";
import { Hotel, HotelReview, Room } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, MapPin, CheckCircle, BedDouble, ChevronLeft, ChevronRight,
  MessageSquare, Heart, PlusCircle, Loader2, Clock, Shield, Baby,
  PawPrint, BookOpen, Percent, Users, ArrowRight, X, Navigation,
} from "lucide-react";

const GoogleMapView = dynamic(() => import("@/components/maps/google-map-view"), {
  ssr: false,
  loading: () => <div className="h-48 w-full rounded-2xl bg-slate-100 skeleton border border-slate-200" />,
});

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const staggerChildren = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params?.id as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<HotelReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Image carousel
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Room image viewer
  const [viewingRoomImages, setViewingRoomImages] = useState<string[] | null>(null);
  const [roomImageIdx, setRoomImageIdx] = useState(0);

  // Review pagination
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 5;

  useEffect(() => {
    async function loadHotelData() {
      if (!hotelId) return;
      setLoading(true);
      const data = await apiService.getHotelById(hotelId);
      const roomData = await apiService.getHotelRooms(hotelId);
      setHotel(data);
      setRooms(roomData);

      // Fetch reviews via dedicated method
      const hotelReviews = await apiService.getHotelReviews(hotelId);
      setReviews(hotelReviews);

      // Check favorite
      const saved = await apiService.getSavedItems();
      const exists = saved.some((s) => s.entity_type === "hotel" && s.entity_id === hotelId);
      setIsFavorite(exists);

      setLoading(false);
    }
    loadHotelData();
  }, [hotelId]);

  // Auto-slide images
  useEffect(() => {
    if (!hotel || hotel.images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % hotel.images.length);
    }, 5000);
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
    setReviews((prev) => [{
      id: newRev.id,
      hotel_id: hotel.id,
      user_id: newRev.user_id || "usr-demo",
      rating: newRev.rating,
      comment: newRev.comment,
      user_name: reviewerName || "Guest",
      created_at: newRev.created_at,
    }, ...prev]);
    setSubmittingReview(false);
    setShowReviewForm(false);
    setReviewComment("");
    setReviewerName("");
  };

  const handleBookRoom = (room: Room) => {
    const query = new URLSearchParams({
      type: "hotel",
      ref_id: hotel!.id,
      title: `${hotel!.name} - ${room.room_type}`,
      price: room.price_per_night.toString(),
    });
    router.push(`/checkout?${query.toString()}`);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
        <p className="mt-3 font-bold text-slate-500 text-xs">Loading hotel details...</p>
      </div>
    );
  }

  if (!hotel) {
    return <div className="p-8 text-center font-bold text-xs text-slate-500">Hotel not found.</div>;
  }

  // Dynamic facility groups from DB (not hardcoded)
  const facilityGroups = hotel.facilities ? Object.entries(hotel.facilities).filter(([, items]) => items.length > 0) : [];

  // Paginated reviews
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = reviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE);

  // Avg rating
  const avgRating = hotel.avg_rating || (reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "4.5");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 bg-white text-slate-900"
    >
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-bold text-[10px] py-0">{hotel.city}</Badge>
            {hotel.area && <span className="text-[10px] text-slate-400 font-medium">• {hotel.area}</span>}
            <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Star className="h-3 w-3 fill-amber-400" />
              <span>{hotel.star_rating} Star</span>
            </div>
            {hotel.discount > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <Percent className="h-3 w-3" />
                <span>{hotel.discount}% OFF</span>
              </div>
            )}
          </div>

          <h1 className="font-outfit text-2xl sm:text-3xl font-black text-slate-900">{hotel.name}</h1>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              {hotel.address}
            </span>
            {reviews.length > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="h-3 w-3 fill-amber-400" /> {avgRating} ({reviews.length} reviews)
              </span>
            )}
          </div>
        </div>

        <Button
          onClick={toggleFavorite}
          variant={isFavorite ? "default" : "outline"}
          size="sm"
          className={`font-bold text-xs rounded-xl gap-1.5 h-9 ${isFavorite ? "bg-rose-600 hover:bg-rose-700 text-white" : "hover:text-rose-600"}`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          <span>{isFavorite ? "Saved" : "Save"}</span>
        </Button>
      </motion.div>

      {/* ─── Image Carousel ──────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="relative h-56 sm:h-80 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs bg-slate-900 group">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src={hotel.images[activeImageIndex] || hotel.images[0]}
              alt={hotel.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {hotel.images.length > 1 && (
          <>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev + 1) % hotel.images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-sm px-3 py-1 rounded-full">
              {hotel.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeImageIndex === idx ? "w-6 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left Column ───────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* About */}
          <motion.div variants={fadeInUp} className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">About the Hotel</h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{hotel.description}</p>
          </motion.div>

          {/* Room Types */}
          <motion.div variants={fadeInUp} className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-emerald-700" />
              Available Room Types & Rates
            </h3>

            <div className="space-y-3">
              {rooms.map((room) => (
                <motion.div
                  key={room.id}
                  variants={fadeInUp}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Room image */}
                    {room.images.length > 0 && (
                      <button
                        onClick={() => { setViewingRoomImages(room.images); setRoomImageIdx(0); }}
                        className="shrink-0 w-full sm:w-32 h-24 rounded-lg overflow-hidden border border-slate-200 relative group"
                      >
                        <img src={room.images[0]} alt={room.room_type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {room.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-slate-900/70 text-white px-1.5 py-0.5 rounded-full">
                            +{room.images.length - 1}
                          </span>
                        )}
                      </button>
                    )}

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-sm font-extrabold text-slate-900">{room.room_type}</span>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1 font-bold">
                              <Users className="h-3 w-3" /> Max {room.max_adults} Adults, {room.max_children} Child
                            </span>
                            <span className="text-emerald-700 font-bold">• {room.available_count} rooms left</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Per night</span>
                          <span className="text-lg font-black text-slate-900">{formatBDT(room.price_per_night)}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5">
                        {room.features.map((feat, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5 text-emerald-600" /> {feat}
                          </span>
                        ))}
                      </div>

                      <Button onClick={() => handleBookRoom(room)} size="sm" className="font-bold rounded-lg h-8 px-5 text-xs gap-1.5 mt-1">
                        Book Room <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Facilities — Dynamic Groups */}
          {facilityGroups.length > 0 && (
            <motion.div variants={fadeInUp} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Facilities & Amenities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {facilityGroups.map(([category, items]) => (
                  <div key={category} className="space-y-1 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                    <h4 className="text-[11px] font-bold text-emerald-700 uppercase">{category}</h4>
                    <ul className="space-y-0.5 text-slate-600">
                      {items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Policies */}
          <motion.div variants={fadeInUp} className="space-y-3 p-4 rounded-2xl bg-white border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900">Hotel Policies</h3>

            <div className="space-y-2 text-slate-700">
              {/* Check-in/out */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Check-in</span>
                    <span className="font-bold text-slate-900">{hotel.policies?.check_in_time || "02:00 PM"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Check-out</span>
                    <span className="font-bold text-slate-900">{hotel.policies?.check_out_time || "12:00 PM"}</span>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {hotel.policies?.special_instructions && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="font-bold text-amber-800 text-[10px] uppercase flex items-center gap-1.5 mb-1">
                    <Shield className="h-3 w-3" /> Special Instructions
                  </span>
                  <p className="text-amber-900 leading-relaxed whitespace-pre-line">{hotel.policies.special_instructions}</p>
                </div>
              )}

              {/* Child Policy */}
              {hotel.policies?.child_policy && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                  <span className="font-bold text-sky-800 text-[10px] uppercase flex items-center gap-1.5 mb-1">
                    <Baby className="h-3 w-3" /> Child Policy
                  </span>
                  <p className="text-sky-900 leading-relaxed">{hotel.policies.child_policy}</p>
                </div>
              )}

              {/* Pet Policy */}
              {hotel.policies?.pet_policy && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="font-bold text-purple-800 text-[10px] uppercase flex items-center gap-1.5 mb-1">
                    <PawPrint className="h-3 w-3" /> Pet Policy
                  </span>
                  <p className="text-purple-900 leading-relaxed">{hotel.policies.pet_policy}</p>
                </div>
              )}

              {/* Cancellation Policy */}
              {hotel.policies?.cancellation_policy && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="font-bold text-rose-800 text-[10px] uppercase flex items-center gap-1.5 mb-1">
                    <BookOpen className="h-3 w-3" /> Cancellation Policy
                  </span>
                  <p className="text-rose-900 leading-relaxed">{hotel.policies.cancellation_policy}</p>
                </div>
              )}

              {/* Refund Policy */}
              {hotel.policies?.refund_policy && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="font-bold text-emerald-800 text-[10px] uppercase flex items-center gap-1.5 mb-1">
                    <Percent className="h-3 w-3" /> Refund Policy
                  </span>
                  <p className="text-emerald-900 leading-relaxed">{hotel.policies.refund_policy}</p>
                </div>
              )}

              {/* House Rules */}
              {hotel.policies?.house_rules && hotel.policies.house_rules.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-[10px] uppercase mb-1.5 block">House Rules</span>
                  <ul className="space-y-1">
                    {hotel.policies.house_rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>

          {/* Custom Sections */}
          {hotel.custom_sections && hotel.custom_sections.length > 0 && (
            hotel.custom_sections.map((section) => (
              <motion.div key={section.id} variants={fadeInUp} className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</p>
              </motion.div>
            ))
          )}

          {/* Reviews */}
          <motion.div variants={fadeInUp} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-700" />
                Guest Reviews ({reviews.length})
              </h3>
              <Button size="sm" variant="outline" onClick={() => setShowReviewForm(!showReviewForm)} className="gap-1 font-bold text-xs h-7 rounded-lg">
                <PlusCircle className="h-3 w-3" />
                <span>Write Review</span>
              </Button>
            </div>

            {/* Review Form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddReview}
                  className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Your Name (Optional)" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full rounded-md border border-slate-200 p-2 font-semibold text-slate-900 outline-none" />
                    <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-200 p-2 font-semibold text-slate-900 outline-none">
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
                    </select>
                  </div>
                  <textarea required rows={3} placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2 font-semibold text-slate-900 outline-none" />
                  <div className="flex justify-end gap-1.5">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowReviewForm(false)} className="text-xs h-7">Cancel</Button>
                    <Button type="submit" size="sm" disabled={submittingReview} className="text-xs h-7 font-bold">
                      {submittingReview ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post Review"}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Reviews List */}
            <div className="space-y-2.5">
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500 font-semibold p-3 text-center">No guest reviews yet. Be the first!</p>
              ) : (
                <>
                  {paginatedReviews.map((rev) => (
                    <motion.div key={rev.id} variants={fadeInUp} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                            {rev.user_name?.charAt(0)?.toUpperCase() || "G"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-[11px]">{rev.user_name || "Guest"}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(rev.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[11px]">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{rev.comment}</p>

                      {/* Admin response */}
                      {rev.admin_response && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 mt-1">
                          <span className="font-bold text-emerald-800 text-[9px] uppercase block mb-0.5">Hotel Response</span>
                          <p className="text-emerald-900 text-[11px] font-medium">{rev.admin_response}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button size="sm" variant="outline" disabled={reviewPage <= 1}
                        onClick={() => setReviewPage(p => p - 1)} className="h-7 text-xs font-bold rounded-lg">
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-[11px] font-bold text-slate-500">
                        Page {reviewPage} of {totalPages}
                      </span>
                      <Button size="sm" variant="outline" disabled={reviewPage >= totalPages}
                        onClick={() => setReviewPage(p => p + 1)} className="h-7 text-xs font-bold rounded-lg">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* ─── Right Column: Map & Nearby ────────────────────────────── */}
        <motion.div variants={fadeInUp} className="space-y-4">
          {/* Price Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 sticky top-4">
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Starting from</span>
              <span className="text-2xl font-black text-slate-900">{formatBDT(hotel.min_price || rooms[0]?.price_per_night || 6500)}</span>
              <span className="text-[10px] font-medium text-slate-400"> / night</span>
            </div>
            {rooms.length > 0 && (
              <Button
                onClick={() => handleBookRoom(rooms[0])}
                className="w-full font-bold text-xs gap-1.5 rounded-xl h-10"
              >
                Book Now <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <div className="text-[10px] text-center text-slate-500 font-semibold">
              {rooms.length} room type{rooms.length !== 1 ? "s" : ""} available
            </div>
          </div>

          {/* Google Map */}
          <GoogleMapView
            latitude={hotel.latitude}
            longitude={hotel.longitude}
            title={hotel.name}
            address={hotel.address}
            nearby={hotel.nearby}
          />

          {/* Nearby Places List */}
          {hotel.nearby && hotel.nearby.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-emerald-700" /> Nearby Places ({hotel.nearby.length})
              </h3>
              <div className="space-y-1.5">
                {hotel.nearby.map((place, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="font-bold text-slate-900">{place.name}</span>
                      <span className="text-slate-400 ml-1">({place.type})</span>
                    </div>
                    <span className="font-bold text-emerald-700 text-[10px] shrink-0">{place.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Room Image Lightbox ─────────────────────────────────────── */}
      <AnimatePresence>
        {viewingRoomImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4"
            onClick={() => setViewingRoomImages(null)}
          >
            <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
            <div className="relative max-w-3xl w-full max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
              <img src={viewingRoomImages[roomImageIdx]} alt="" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
              {viewingRoomImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <button
                    onClick={() => setRoomImageIdx(p => (p === 0 ? viewingRoomImages.length - 1 : p - 1))}
                    className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-white">{roomImageIdx + 1} / {viewingRoomImages.length}</span>
                  <button
                    onClick={() => setRoomImageIdx(p => (p + 1) % viewingRoomImages.length)}
                    className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
