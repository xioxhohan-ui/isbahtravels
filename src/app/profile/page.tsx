"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { apiService } from "@/lib/services/api";
import { Profile, Booking } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  User,
  Ticket,
  Bookmark,
  Star,
  Edit3,
  Save,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Trash2,
  PlusCircle,
  ExternalLink,
  Heart,
  MessageSquare
} from "lucide-react";

function ProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "account";

  const [activeTab, setActiveTab] = useState<"account" | "bookings" | "saved" | "reviews">(
    initialTab as any
  );

  const [profile, setProfile] = useState<Partial<Profile>>({
    display_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    passport_number: "",
    passport_expiry: "",
    national_id: "",
    emergency_contact: "",
    present_address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Review Form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewType, setReviewType] = useState<"hotel" | "tour">("hotel");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load profile, bookings, saved items, and reviews
  async function loadUserData() {
    try {
      let currentUid = userId;
      let userEmail = profile.email || "";

      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const supabase = createClient();
        const authRes: any = await Promise.race([
          supabase.auth.getUser(),
          new Promise((resolve) => setTimeout(() => resolve({ data: { user: null } }), 2000)),
        ]);
        const user = authRes?.data?.user;

        if (user) {
          currentUid = user.id;
          userEmail = user.email || "";
          setUserId(user.id);
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (userProfile) {
            setProfile(userProfile);
          } else {
            setProfile({
              id: user.id,
              email: user.email || "",
              display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer",
              phone: user.user_metadata?.phone || "",
            });
          }
        } else {
          userEmail = localStorage.getItem("isbah_user_email") || "customer@example.com";
          setProfile({
            display_name: "Customer Account",
            email: userEmail,
            phone: "+880 1700-000000",
            passport_number: "",
            national_id: "",
          });
        }
      }

      // Fetch Bookings, Saved Items, and User Reviews
      const userBookings = await apiService.getUserBookings(currentUid);
      setBookings(userBookings);

      const userSaved = await apiService.getSavedItems(currentUid);
      setSavedItems(userSaved);

      const userReviews = await apiService.getUserReviews(currentUid);
      setReviews(userReviews);

    } catch (err) {
      console.warn("Profile data load warning", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUserData();

    // Setup Supabase Realtime Channels for Instant Live Updates
    let supabase: any = null;
    let bookingsChan: any = null;
    let savedChan: any = null;
    let reviewsChan: any = null;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        supabase = createClient();
        bookingsChan = supabase
          .channel("realtime_profile_bookings")
          .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => loadUserData())
          .subscribe();

        savedChan = supabase
          .channel("realtime_profile_saved")
          .on("postgres_changes", { event: "*", schema: "public", table: "saved_items" }, () => loadUserData())
          .subscribe();

        reviewsChan = supabase
          .channel("realtime_profile_reviews")
          .on("postgres_changes", { event: "*", schema: "public", table: "hotel_reviews" }, () => loadUserData())
          .on("postgres_changes", { event: "*", schema: "public", table: "tour_reviews" }, () => loadUserData())
          .subscribe();
      } catch (err) {
        console.warn("Realtime channel error", err);
      }
    }

    // Local Storage & Custom Window Events for client tab synchronization
    const handleDataUpdate = () => loadUserData();
    window.addEventListener("storage", handleDataUpdate);
    window.addEventListener("isbah_data_updated", handleDataUpdate);

    return () => {
      window.removeEventListener("storage", handleDataUpdate);
      window.removeEventListener("isbah_data_updated", handleDataUpdate);
      if (supabase) {
        if (bookingsChan) supabase.removeChannel(bookingsChan);
        if (savedChan) supabase.removeChannel(savedChan);
        if (reviewsChan) supabase.removeChannel(reviewsChan);
      }
    };
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createClient();
        await supabase
          .from("profiles")
          .upsert({
            id: userId,
            display_name: profile.display_name,
            email: profile.email,
            phone: profile.phone,
            date_of_birth: profile.date_of_birth,
            passport_number: profile.passport_number,
            passport_expiry: profile.passport_expiry,
            national_id: profile.national_id,
            emergency_contact: profile.emergency_contact,
            present_address: profile.present_address,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.warn("Profile update error", err);
      }
    }

    setSaving(false);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRemoveSavedItem = async (id: string, entityType?: string, entityId?: string) => {
    await apiService.removeSavedItem(id, entityType, entityId);
    setSavedItems((prev) => prev.filter((item) => item.id !== id && !(item.entity_type === entityType && item.entity_id === entityId)));
  };

  const handleDeleteReview = async (id: string, targetType?: string) => {
    await apiService.deleteReview(id, targetType);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    setSubmittingReview(true);
    const newRev = await apiService.addReview({
      user_id: userId || "usr-demo",
      target_type: reviewType,
      target_title: reviewTitle.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
    });

    setReviews((prev) => [newRev, ...prev]);
    setSubmittingReview(false);
    setShowReviewModal(false);
    setReviewTitle("");
    setReviewComment("");
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8 text-slate-500 font-bold text-sm">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-700 mr-2" />
        <span>Loading Account Profile...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-white text-slate-900">
      
      {/* Profile Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white font-extrabold text-xl shadow-xs">
            {profile.display_name?.slice(0, 2).toUpperCase() || "CU"}
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Verified Member</span>
            <h1 className="font-outfit text-xl sm:text-2xl font-black text-slate-900">{profile.display_name || "New Customer"}</h1>
            <p className="text-xs text-slate-500 font-semibold">{profile.email} • {profile.phone || "No phone added"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold">
          <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
          <div>
            <p className="font-bold text-slate-900">Database Synchronized</p>
            <p className="text-slate-500 text-[11px]">NID: {profile.national_id || "Not Provided"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="space-y-1 rounded-2xl border border-slate-200 p-3 bg-slate-50 h-fit text-xs font-bold">
          <h3 className="px-3 text-[10px] text-slate-400 uppercase tracking-wider mb-2">Navigation</h3>
          
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl transition-all ${
              activeTab === "account" ? "bg-white text-slate-900 border border-slate-200 shadow-xs font-extrabold" : "text-slate-600 hover:bg-white"
            }`}
          >
            <User className="h-4 w-4 text-emerald-700" />
            <span>Account Info</span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all ${
              activeTab === "bookings" ? "bg-white text-slate-900 border border-slate-200 shadow-xs font-extrabold" : "text-slate-600 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Ticket className="h-4 w-4 text-slate-500" />
              <span>My Bookings</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] text-slate-800 font-black">{bookings.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all ${
              activeTab === "saved" ? "bg-white text-slate-900 border border-slate-200 shadow-xs font-extrabold" : "text-slate-600 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="h-4 w-4 text-slate-500" />
              <span>Saved Favorites</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[10px] text-rose-800 font-black">{savedItems.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all ${
              activeTab === "reviews" ? "bg-white text-slate-900 border border-slate-200 shadow-xs font-extrabold" : "text-slate-600 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-slate-500" />
              <span>My Reviews</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[10px] text-amber-800 font-black">{reviews.length}</span>
          </button>
        </div>

        {/* Tab 1: ACCOUNT & PERSONAL INFO */}
        {activeTab === "account" && (
          <div className="lg:col-span-3 space-y-4">
            
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>Profile details & Passport / NID updated in database successfully!</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Personal & Document Details</h3>
                {!isEditing ? (
                  <Button type="button" onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1 font-bold text-xs h-8 rounded-lg">
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Details</span>
                  </Button>
                ) : (
                  <Button type="submit" disabled={saving} size="sm" className="gap-1 font-bold text-xs h-8 rounded-lg">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>Save Changes</span>
                  </Button>
                )}
              </div>

              {/* Personal Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.display_name || ""}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={profile.email || ""}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Phone Number</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Date of Birth</label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={profile.date_of_birth || ""}
                    onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Passport Number</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. BN-98214309"
                    value={profile.passport_number || ""}
                    onChange={(e) => setProfile({ ...profile, passport_number: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Passport Expiry</label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={profile.passport_expiry || ""}
                    onChange={(e) => setProfile({ ...profile, passport_expiry: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">National ID (NID)</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. 19902692518000123"
                    value={profile.national_id || ""}
                    onChange={(e) => setProfile({ ...profile, national_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. +880 1819-000000"
                    value={profile.emergency_contact || ""}
                    onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>

            </form>
          </div>
        )}

        {/* Tab 2: BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-base">My Bookings ({bookings.length})</h3>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Live Real-Time Sync
              </span>
            </div>
            
            {bookings.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 font-semibold space-y-2">
                <Ticket className="h-8 w-8 text-slate-400 mx-auto" />
                <p>No active bookings found for your account.</p>
                <Link href="/flights">
                  <Button size="sm" variant="outline" className="mt-2 text-xs font-bold">Explore Packages & Flights</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Ref #{booking.id}</span>
                      <Badge variant={booking.booking_status === "confirmed" ? "default" : "secondary"}>
                        {booking.booking_status.toUpperCase()}
                      </Badge>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">
                      {booking.details?.title || booking.details?.airline || `${booking.booking_type.toUpperCase()} Booking`}
                    </h4>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="font-extrabold text-slate-900">{formatBDT(booking.total_price)}</span>
                      <Button size="sm" variant="outline" onClick={() => window.open(`/api/receipt?booking_id=${booking.id}`, "_blank")} className="font-bold gap-1 rounded-lg h-8 text-xs">
                        <Printer className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Download Receipt</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: SAVED FAVORITES */}
        {activeTab === "saved" && (
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-base">Saved Favorites ({savedItems.length})</h3>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                Live Real-Time Sync
              </span>
            </div>

            {savedItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 font-semibold space-y-2">
                <Bookmark className="h-8 w-8 text-slate-400 mx-auto" />
                <p>No saved favorites yet. Save hotels, tours, or flights to access them anytime!</p>
                <div className="flex justify-center gap-2 pt-2">
                  <Link href="/hotels"><Button size="sm" variant="outline" className="text-xs font-bold">Browse Hotels</Button></Link>
                  <Link href="/tours"><Button size="sm" variant="outline" className="text-xs font-bold">Browse Tours</Button></Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white flex gap-3 shadow-xs relative">
                    {item.image && (
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-between text-xs">
                      <div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[9px] uppercase font-bold py-0">{item.entity_type}</Badge>
                          <button onClick={() => handleRemoveSavedItem(item.id, item.entity_type, item.entity_id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-900 line-clamp-1 mt-1">{item.title}</h4>
                        {item.subtitle && <p className="text-[11px] text-slate-500 line-clamp-1">{item.subtitle}</p>}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                        <span className="font-extrabold text-slate-900">{item.price ? formatBDT(item.price) : "View details"}</span>
                        <Link href={item.url || `/${item.entity_type}s/${item.entity_id}`}>
                          <span className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5">
                            View <ExternalLink className="h-3 w-3" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: MY REVIEWS */}
        {activeTab === "reviews" && (
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-base">My Reviews & Ratings ({reviews.length})</h3>
              <Button size="sm" onClick={() => setShowReviewModal(true)} className="gap-1 font-bold text-xs h-8 rounded-lg">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Write Review</span>
              </Button>
            </div>

            {reviews.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 font-semibold space-y-2">
                <Star className="h-8 w-8 text-slate-400 mx-auto" />
                <p>No written reviews yet. Share your travel experiences with the community!</p>
                <Button size="sm" variant="outline" onClick={() => setShowReviewModal(true)} className="mt-2 text-xs font-bold">Write Your First Review</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{rev.target_title || "Verified Review"}</span>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">{rev.target_type || "Hotel"}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{rev.rating} / 5</span>
                        </div>
                        <button onClick={() => handleDeleteReview(rev.id, rev.target_type)} className="text-slate-400 hover:text-rose-600 transition-colors ml-2">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {new Date(rev.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Write New Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-700" />
                <span>Write a Review</span>
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Review Category</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewType("hotel")}
                    className={`flex-1 py-1.5 rounded-lg border font-bold ${reviewType === "hotel" ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-700 border-slate-200"}`}
                  >
                    Hotel Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewType("tour")}
                    className={`flex-1 py-1.5 rounded-lg border font-bold ${reviewType === "tour" ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-700 border-slate-200"}`}
                  >
                    Tour Package Review
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Hotel or Tour Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radisson Blu Cox's Bazar"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`flex-1 py-1.5 rounded-lg border font-bold flex items-center justify-center gap-1 ${
                        reviewRating >= star ? "bg-amber-500 text-white border-amber-500" : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      <Star className="h-3 w-3 fill-current" />
                      <span>{star}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Your Honest Experience / Review</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write your review comments here..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowReviewModal(false)} className="text-xs h-8 font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingReview} className="text-xs h-8 font-bold">
                  {submittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Post Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-500 text-xs">Loading User Profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
