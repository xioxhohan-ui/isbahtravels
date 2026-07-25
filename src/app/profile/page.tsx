"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiService } from "@/lib/services/api";
import { Profile, Booking, SavedItem, HotelReview } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Ticket, Bookmark, Star, Edit3, Save, Printer, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";

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
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [reviews, setReviews] = useState<HotelReview[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
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

            // Load User Bookings
            const { data: userBookings } = await supabase
              .from("bookings")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false });

            if (userBookings) {
              setBookings(userBookings as Booking[]);
            }
          } else {
            // Local storage fallback for legacy session
            const localEmail = localStorage.getItem("isbah_user_email") || "customer@example.com";
            setProfile({
              display_name: "Customer Account",
              email: localEmail,
              phone: "+880 1700-000000",
              passport_number: "",
              national_id: "",
            });
          }
        } catch (err) {
          console.warn("Profile load warning", err);
        }
      }
      setLoading(false);
    }
    loadUserData();
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-12 text-slate-500 font-bold">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700 mr-2" />
        <span>Loading Your Account Profile...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white text-slate-900">
      
      {/* Profile Banner Header */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white font-extrabold text-2xl shadow-sm">
            {profile.display_name?.slice(0, 2).toUpperCase() || "CU"}
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Member Profile</span>
            <h1 className="font-outfit text-2xl sm:text-3xl font-black text-slate-900">{profile.display_name || "New Customer"}</h1>
            <p className="text-xs text-slate-500">{profile.email} • {profile.phone || "No phone added"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 text-xs font-semibold">
          <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
          <div>
            <p className="font-bold text-slate-900">Verified Database Account</p>
            <p className="text-slate-500">NID: {profile.national_id || "Not Provided"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="space-y-2 rounded-2xl border border-slate-200 p-4 bg-slate-50 h-fit text-xs font-bold">
          <h3 className="px-3 text-[10px] text-slate-400 uppercase tracking-wider mb-2">Navigation</h3>
          
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "account" ? "bg-white text-slate-900 border border-slate-200 shadow-xs" : "text-slate-600 hover:bg-white"
            }`}
          >
            <User className="h-4 w-4 text-emerald-700" />
            <span>Account & Personal Info</span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "bookings" ? "bg-white text-slate-900 border border-slate-200 shadow-xs" : "text-slate-600 hover:bg-white"
            }`}
          >
            <Ticket className="h-4 w-4 text-slate-500" />
            <span>My Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "saved" ? "bg-white text-slate-900 border border-slate-200 shadow-xs" : "text-slate-600 hover:bg-white"
            }`}
          >
            <Bookmark className="h-4 w-4 text-slate-500" />
            <span>Saved Favorites ({savedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all ${
              activeTab === "reviews" ? "bg-white text-slate-900 border border-slate-200 shadow-xs" : "text-slate-600 hover:bg-white"
            }`}
          >
            <Star className="h-4 w-4 text-slate-500" />
            <span>My Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* Tab 1: ACCOUNT & PERSONAL INFO */}
        {activeTab === "account" && (
          <div className="lg:col-span-3 space-y-6">
            
            {saveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>Profile details & Passport / NID updated in database successfully!</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="p-6 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Personal & Passport Details</h3>
                {!isEditing ? (
                  <Button type="button" onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-1.5 font-bold text-xs">
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Info</span>
                  </Button>
                ) : (
                  <Button type="submit" disabled={saving} size="sm" className="gap-1.5 font-bold text-xs">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>Save Changes</span>
                  </Button>
                )}
              </div>

              {/* Personal Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.display_name || ""}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={profile.email || ""}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Phone Number</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Date of Birth</label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={profile.date_of_birth || ""}
                    onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none disabled:bg-slate-50"
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
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Passport Expiry</label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={profile.passport_expiry || ""}
                    onChange={(e) => setProfile({ ...profile, passport_expiry: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none disabled:bg-slate-50"
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
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none disabled:bg-slate-50"
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
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>

            </form>
          </div>
        )}

        {/* Tab 2: BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">My Past & Upcoming Bookings</h3>
            
            {bookings.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl text-xs text-slate-500 font-bold">
                No active bookings found for your account.
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Order #{booking.id}</span>
                    <Badge variant={booking.booking_status === "confirmed" ? "default" : "secondary"}>
                      {booking.booking_status.toUpperCase()}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base">
                    {booking.details.title || booking.details.airline || `${booking.booking_type.toUpperCase()} Booking`}
                  </h4>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-extrabold text-slate-900">{formatBDT(booking.total_price)}</span>
                    <Button size="sm" variant="outline" onClick={() => window.open(`/api/receipt?booking_id=${booking.id}`, "_blank")} className="font-bold gap-1 rounded-xl">
                      <Printer className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Download Receipt</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: SAVED FAVORITES */}
        {activeTab === "saved" && (
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Saved Favorite Items</h3>
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-3xl text-xs text-slate-500 font-bold">
              No saved items yet. Explore flights, hotels & tours to save favorites!
            </div>
          </div>
        )}

        {/* Tab 4: MY REVIEWS */}
        {activeTab === "reviews" && (
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">My Reviews & Ratings</h3>
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-3xl text-xs text-slate-500 font-bold">
              No written reviews yet.
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading User Profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
