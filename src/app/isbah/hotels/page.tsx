"use client";

import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/lib/services/api";
import { Hotel, HotelCustomSection, HotelPolicy, HotelReview, NearbyPlace, Room } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";
import {
  Hotel as HotelIcon, Plus, Edit3, Trash2, MapPin, Star, X, Sparkles, RefreshCw,
  BedDouble, Settings2, ClipboardList, Navigation, MessageSquare, BarChart3,
  ChevronLeft, PlusCircle, MinusCircle, GripVertical, CheckCircle, Eye, EyeOff,
  Image as ImageIcon, Save, ArrowLeft, Loader2,
} from "lucide-react";

// ─── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { key: "basic", label: "Basic Info", icon: HotelIcon },
  { key: "rooms", label: "Room Types", icon: BedDouble },
  { key: "facilities", label: "Facilities", icon: Settings2 },
  { key: "policies", label: "Policies", icon: ClipboardList },
  { key: "location", label: "Location", icon: Navigation },
  { key: "reviews", label: "Reviews", icon: MessageSquare },
  { key: "ranking", label: "Ranking", icon: BarChart3 },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// ─── Default facility groups ────────────────────────────────────────────────
const DEFAULT_FACILITY_GROUPS: Record<string, string[]> = {
  General: ["Free Wi-Fi", "Swimming Pool", "Garden", "Air Conditioning", "24/7 Room Service"],
  "Business Facilities": ["Conference Hostess", "Auditorium", "Business Center"],
  "Fitness & Wellness": ["Swimming Pool", "Gym", "Massage", "Sauna"],
  "Food & Drink": ["Buffet Lunch", "Dinner", "Set Menu", "Brunch", "Restaurant"],
  "Indoor Entertainment": ["Table Tennis", "Billiards"],
  "Media & Technology": ["Phone Coverage", "Telephone", "Smart TV"],
  Parking: ["Garage", "Free Large Vehicle Parking", "Valet Parking"],
  "Safety & Security": ["24-Hour Security", "CCTV", "Fire Safety"],
  "Services & Extras": ["Medical Service", "Tours/Ticket Assistance", "Laundry"],
  Transportation: ["Car Rental", "Airport Shuttle", "Local Transport"],
};

export default function AdminHotelsPage() {
  useSupabaseRealtime("hotels", ["hotels"]);
  useSupabaseRealtime("rooms", ["hotels"]);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingView, setEditingView] = useState<"list" | "editor">("list");
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── Editor state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  // Tab 1: Basic Info
  const [name, setName] = useState("");
  const [city, setCity] = useState("Cox's Bazar");
  const [area, setArea] = useState("Kolatoli Beach");
  const [address, setAddress] = useState("");
  const [starRating, setStarRating] = useState(5);
  const [description, setDescription] = useState("");
  const [minPrice, setMinPrice] = useState(6500);
  const [discount, setDiscount] = useState(10);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Tab 2: Room Types
  const [rooms, setRooms] = useState<Room[]>([]);
  const [deletedRoomIds, setDeletedRoomIds] = useState<string[]>([]);

  // Tab 3: Facilities
  const [facilities, setFacilities] = useState<Record<string, string[]>>({});
  const [newGroupName, setNewGroupName] = useState("");

  // Tab 4: Policies
  const [policies, setPolicies] = useState<HotelPolicy>({
    check_in_time: "02:00 PM",
    check_out_time: "12:00 PM",
    special_instructions: "",
    child_policy: "",
    pet_policy: "",
    cancellation_policy: "",
    refund_policy: "",
    house_rules: [],
  });
  const [newRule, setNewRule] = useState("");

  // Tab 5: Location
  const [latitude, setLatitude] = useState(21.4172);
  const [longitude, setLongitude] = useState(91.9804);
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const [autoCollecting, setAutoCollecting] = useState(false);

  // Tab 6: Reviews
  const [reviews, setReviews] = useState<HotelReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Tab 7: Ranking
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [starRank, setStarRank] = useState(50);
  const [adminRank, setAdminRank] = useState(0);

  // Custom sections
  const [customSections, setCustomSections] = useState<HotelCustomSection[]>([]);

  // ─── Load hotels list ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadHotels() {
      setLoading(true);
      const data = await apiService.getHotels();
      setHotels(data);
      setLoading(false);
    }
    loadHotels();
  }, []);

  // ─── Populate editor from hotel data ─────────────────────────────────────
  const populateEditor = useCallback(async (hotel: Hotel | null) => {
    if (hotel) {
      setName(hotel.name);
      setCity(hotel.city);
      setArea(hotel.area || "");
      setAddress(hotel.address);
      setStarRating(hotel.star_rating);
      setDescription(hotel.description || "");
      setMinPrice(hotel.min_price || 6500);
      setDiscount(hotel.discount || 0);
      setImages(hotel.images || []);
      setFacilities(hotel.facilities && Object.keys(hotel.facilities).length > 0 ? hotel.facilities : { ...DEFAULT_FACILITY_GROUPS });
      setPolicies({
        check_in_time: hotel.policies?.check_in_time || "02:00 PM",
        check_out_time: hotel.policies?.check_out_time || "12:00 PM",
        special_instructions: hotel.policies?.special_instructions || "",
        child_policy: hotel.policies?.child_policy || "",
        pet_policy: hotel.policies?.pet_policy || "",
        cancellation_policy: hotel.policies?.cancellation_policy || "",
        refund_policy: hotel.policies?.refund_policy || "",
        house_rules: hotel.policies?.house_rules || [],
      });
      setLatitude(hotel.latitude || 21.4172);
      setLongitude(hotel.longitude || 91.9804);
      setNearby(hotel.nearby || []);
      setShowOnHomepage(hotel.show_on_homepage !== false);
      setStarRank(hotel.star_rank || 50);
      setAdminRank(hotel.admin_rank || 0);
      setCustomSections(hotel.custom_sections || []);
      setDeletedRoomIds([]);

      // Load rooms
      const roomData = await apiService.getHotelRooms(hotel.id);
      setRooms(roomData);

      // Load reviews
      setReviewsLoading(true);
      const revData = await apiService.getHotelReviews(hotel.id);
      setReviews(revData);
      setReviewsLoading(false);
    } else {
      // New hotel defaults
      setName("");
      setCity("Cox's Bazar");
      setArea("Kolatoli Beach");
      setAddress("");
      setStarRating(5);
      setDescription("");
      setMinPrice(6500);
      setDiscount(10);
      setImages(["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"]);
      setFacilities({ ...DEFAULT_FACILITY_GROUPS });
      setPolicies({
        check_in_time: "02:00 PM",
        check_out_time: "12:00 PM",
        special_instructions: "",
        child_policy: "Children of all ages are welcome. Children 0-5 years stay free with existing beds.",
        pet_policy: "Pets are not allowed.",
        cancellation_policy: "Free cancellation up to 48 hours before check-in.",
        refund_policy: "Full refund if cancelled 48 hours before check-in. 50% refund for later cancellations.",
        house_rules: ["No smoking inside the room", "No parties or events allowed", "Quiet hours from 10 PM to 7 AM"],
      });
      setLatitude(21.4172);
      setLongitude(91.9804);
      setNearby([]);
      setShowOnHomepage(true);
      setStarRank(50);
      setAdminRank(0);
      setRooms([]);
      setReviews([]);
      setDeletedRoomIds([]);
      setCustomSections([]);
    }
    setActiveTab("basic");
  }, []);

  const handleOpenEditor = (hotel: Hotel | null) => {
    setEditingHotel(hotel);
    populateEditor(hotel);
    setEditingView("editor");
  };

  const handleBackToList = () => {
    setEditingView("list");
    setEditingHotel(null);
  };

  // ─── Delete hotel ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this hotel property and all its rooms?")) {
      await apiService.deleteHotel(id);
      setHotels(prev => prev.filter(h => h.id !== id));
      if (editingHotel?.id === id) handleBackToList();
    }
  };

  // ─── Auto-collect nearby places ─────────────────────────────────────────
  const handleAutoCollect = async () => {
    setAutoCollecting(true);
    try {
      const res = await fetch("/api/hotels/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotel_id: editingHotel?.id || "new", latitude, longitude, radius: 1000 }),
      });
      const data = await res.json();
      if (data.nearby?.length > 0) setNearby(data.nearby);
    } catch (err) {
      console.warn("Auto-collection failed", err);
    }
    setAutoCollecting(false);
  };

  // ─── Save hotel (all tabs) ──────────────────────────────────────────────
  const handleSaveHotel = async () => {
    if (!name.trim() || !city.trim() || !address.trim()) {
      alert("Please fill in Hotel Name, City, and Address (Tab: Basic Info).");
      setActiveTab("basic");
      return;
    }

    setSaving(true);

    const hotelObj: Hotel = {
      id: editingHotel?.id || `ht-${Date.now()}`,
      name: name.trim(),
      city: city.trim(),
      area: area.trim(),
      address: address.trim(),
      star_rating: Number(starRating),
      description: description.trim(),
      min_price: Number(minPrice),
      discount: Number(discount),
      images,
      facilities,
      policies,
      latitude: Number(latitude),
      longitude: Number(longitude),
      nearby,
      custom_sections: customSections.length > 0 ? customSections : undefined,
      show_on_homepage: showOnHomepage,
      star_rank: Number(starRank),
      admin_rank: Number(adminRank),
      rooms_count: rooms.length,
    };

    await apiService.saveHotel(hotelObj);

    // Save rooms
    for (const room of rooms) {
      const roomToSave = { ...room, hotel_id: hotelObj.id };
      await apiService.saveRoom(roomToSave);
    }

    // Delete removed rooms
    for (const rid of deletedRoomIds) {
      await apiService.deleteRoom(rid);
    }

    // Update list
    setHotels(prev => {
      const idx = prev.findIndex(h => h.id === hotelObj.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = hotelObj;
        return updated;
      }
      return [hotelObj, ...prev];
    });

    setSaving(false);
    handleBackToList();
  };

  // ─── Room helpers ───────────────────────────────────────────────────────
  const addNewRoom = () => {
    const newRoom: Room = {
      id: `rm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      hotel_id: editingHotel?.id || "new",
      room_type: "Standard Room",
      price_per_night: 5000,
      available_count: 5,
      max_adults: 2,
      max_children: 1,
      features: ["Free Wi-Fi", "Air Conditioning", "Room Service"],
      images: [],
    };
    setRooms(prev => [...prev, newRoom]);
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...updates } : r));
  };

  const removeRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
    if (!roomId.startsWith("rm-")) setDeletedRoomIds(prev => [...prev, roomId]);
  };

  const addRoomFeature = (roomId: string, feature: string) => {
    if (!feature.trim()) return;
    setRooms(prev => prev.map(r =>
      r.id === roomId ? { ...r, features: [...r.features, feature.trim()] } : r
    ));
  };

  const removeRoomFeature = (roomId: string, featureIdx: number) => {
    setRooms(prev => prev.map(r =>
      r.id === roomId ? { ...r, features: r.features.filter((_, i) => i !== featureIdx) } : r
    ));
  };

  // ─── Facility helpers ───────────────────────────────────────────────────
  const addFacilityGroup = () => {
    if (!newGroupName.trim() || facilities[newGroupName.trim()]) return;
    setFacilities(prev => ({ ...prev, [newGroupName.trim()]: [] }));
    setNewGroupName("");
  };

  const removeFacilityGroup = (group: string) => {
    setFacilities(prev => {
      const updated = { ...prev };
      delete updated[group];
      return updated;
    });
  };

  const addFacilityItem = (group: string, item: string) => {
    if (!item.trim()) return;
    setFacilities(prev => ({
      ...prev,
      [group]: [...(prev[group] || []), item.trim()],
    }));
  };

  const removeFacilityItem = (group: string, idx: number) => {
    setFacilities(prev => ({
      ...prev,
      [group]: prev[group].filter((_, i) => i !== idx),
    }));
  };

  // ─── Policy helpers ─────────────────────────────────────────────────────
  const addHouseRule = () => {
    if (!newRule.trim()) return;
    setPolicies(prev => ({ ...prev, house_rules: [...(prev.house_rules || []), newRule.trim()] }));
    setNewRule("");
  };

  const removeHouseRule = (idx: number) => {
    setPolicies(prev => ({ ...prev, house_rules: (prev.house_rules || []).filter((_, i) => i !== idx) }));
  };

  // ─── Image helpers ──────────────────────────────────────────────────────
  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setImages(prev => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const moveImage = (idx: number, direction: "up" | "down") => {
    setImages(prev => {
      const arr = [...prev];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return arr;
      [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
      return arr;
    });
  };

  // ─── Nearby helpers ─────────────────────────────────────────────────────
  const addNearbyPlace = () => {
    setNearby(prev => [...prev, { name: "", type: "Landmark", distance: "0.5 km" }]);
  };

  const updateNearbyPlace = (idx: number, updates: Partial<NearbyPlace>) => {
    setNearby(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const removeNearbyPlace = (idx: number) => {
    setNearby(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Custom section helpers ─────────────────────────────────────────────
  const addCustomSection = () => {
    setCustomSections(prev => [...prev, { id: `cs-${Date.now()}`, title: "", content: "" }]);
  };

  const updateCustomSection = (id: string, updates: Partial<HotelCustomSection>) => {
    setCustomSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeCustomSection = (id: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== id));
  };

  // ─── Review moderation ─────────────────────────────────────────────────
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review permanently?")) return;
    await apiService.deleteReview(reviewId, "hotel");
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  const handleRespondToReview = async (reviewId: string, response: string) => {
    await apiService.updateHotelReview(reviewId, { admin_response: response });
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, admin_response: response } : r));
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: HOTEL LIST
  // ═══════════════════════════════════════════════════════════════════════
  if (editingView === "list") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Hotels & Resorts</h1>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <RefreshCw className="h-3 w-3 animate-spin" /> Real-time
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">Full per-hotel customization • Rooms, Facilities, Policies, Reviews, Ranking</p>
          </div>
          <Button onClick={() => handleOpenEditor(null)} size="sm" className="font-bold text-xs gap-1.5 rounded-xl">
            <Plus className="h-4 w-4" />
            <span>Add New Hotel</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full p-12 text-center text-slate-500 font-bold">Loading hotels...</div>
          ) : hotels.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 font-semibold">
              No hotels yet. Click &quot;Add New Hotel&quot; to get started.
            </div>
          ) : (
            hotels.map((hotel) => (
              <div key={hotel.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col">
                {/* Card image */}
                {hotel.images?.[0] && (
                  <div className="h-36 w-full bg-slate-100 relative overflow-hidden">
                    <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {hotel.show_on_homepage !== false && (
                        <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow">Homepage</span>
                      )}
                      <span className="text-[9px] font-extrabold bg-slate-900/70 text-white px-2 py-0.5 rounded-full shadow">
                        ⭐ {hotel.star_rating}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-bold">{hotel.city}</Badge>
                      {hotel.area && <span className="text-[10px] text-slate-400 font-medium">• {hotel.area}</span>}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{hotel.name}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="h-3 w-3 text-emerald-700 shrink-0" />
                      {hotel.address}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                      <span>📍 {hotel.nearby?.length || 0} nearby places</span>
                      <span>🛏 {hotel.rooms_count || 0} room types</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">From</span>
                      <span className="font-black text-slate-900 text-sm">{formatBDT(hotel.min_price || 6500)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button onClick={() => handleOpenEditor(hotel)} size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button onClick={() => handleDelete(hotel.id)} size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:bg-rose-50 border-rose-200">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: MULTI-TAB EDITOR
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={handleBackToList} className="p-2 rounded-xl hover:bg-slate-100 transition">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <div>
            <h1 className="font-outfit text-xl font-black text-slate-900">
              {editingHotel ? `Edit: ${editingHotel.name}` : "Add New Hotel"}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold">Complete all tabs then click Save to publish changes.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editingHotel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(editingHotel.id)}
              className="font-bold text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 rounded-xl"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Hotel
            </Button>
          )}
          <Button
            onClick={handleSaveHotel}
            disabled={saving}
            size="sm"
            className="font-bold text-xs gap-1.5 rounded-xl px-6"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Hotel"}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 min-h-[420px]">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 1: BASIC INFO */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === "basic" && (
          <div className="space-y-5 max-w-3xl">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <HotelIcon className="h-4 w-4 text-emerald-700" /> Basic Information
            </h2>

            <div>
              <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Hotel Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition" placeholder="e.g. Sea Pearl Beach Resort & Spa" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">City *</label>
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition" />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Area</label>
                <input type="text" value={area} onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition" />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Star Rating</label>
                <select value={starRating} onChange={(e) => setStarRating(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition">
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Full Address *</label>
              <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition" placeholder="e.g. Inani, Ukhia, Cox's Bazar" />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Description</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-xs outline-none focus:border-emerald-500 transition leading-relaxed"
                placeholder="Describe the hotel, its unique selling points, atmosphere, and what guests can expect..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Min Price (BDT/night)</label>
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition" />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Discount (%)</label>
                <input type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition" />
              </div>
            </div>

            {/* Images Manager */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-emerald-700" /> Hotel Images ({images.length})
              </h3>

              <div className="flex gap-2">
                <input type="text" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 font-semibold text-xs outline-none"
                  placeholder="Paste image URL..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }} />
                <Button size="sm" variant="outline" onClick={addImage} className="text-xs font-bold rounded-xl gap-1">
                  <PlusCircle className="h-3.5 w-3.5" /> Add
                </Button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 h-24 bg-slate-100">
                      <img src={img} alt={`Hotel ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {idx > 0 && (
                          <button onClick={() => moveImage(idx, "up")} className="h-6 w-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px] font-bold">←</button>
                        )}
                        {idx < images.length - 1 && (
                          <button onClick={() => moveImage(idx, "down")} className="h-6 w-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px] font-bold">→</button>
                        )}
                        <button onClick={() => removeImage(idx)} className="h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      {idx === 0 && <span className="absolute top-1 left-1 text-[8px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">Cover</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Sections */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Custom Sections (Optional)</h3>
                <Button size="sm" variant="outline" onClick={addCustomSection} className="text-xs font-bold rounded-xl gap-1 h-7">
                  <PlusCircle className="h-3 w-3" /> Add Section
                </Button>
              </div>
              {customSections.map((section) => (
                <div key={section.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={section.title} onChange={(e) => updateCustomSection(section.id, { title: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-xs outline-none" placeholder="Section title..." />
                    <button onClick={() => removeCustomSection(section.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea rows={2} value={section.content} onChange={(e) => updateCustomSection(section.id, { content: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-xs outline-none" placeholder="Section content..." />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 2: ROOM TYPES */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === "rooms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <BedDouble className="h-4 w-4 text-emerald-700" /> Room Types ({rooms.length})
              </h2>
              <Button onClick={addNewRoom} size="sm" className="font-bold text-xs gap-1.5 rounded-xl">
                <PlusCircle className="h-3.5 w-3.5" /> Add Room Type
              </Button>
            </div>

            {rooms.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-sm border border-dashed border-slate-300 rounded-2xl">
                No rooms added yet. Click &quot;Add Room Type&quot; to create your first room.
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.map((room, roomIdx) => (
                  <div key={room.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Room #{roomIdx + 1}</span>
                      <button onClick={() => removeRoom(room.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Room Name</label>
                        <input type="text" value={room.room_type} onChange={(e) => updateRoom(room.id, { room_type: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 p-2 font-bold text-xs outline-none bg-white focus:border-emerald-500 transition"
                          placeholder="e.g. Deluxe Ocean View King" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Price / Night (BDT)</label>
                        <input type="number" value={room.price_per_night} onChange={(e) => updateRoom(room.id, { price_per_night: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 p-2 font-bold text-xs outline-none bg-white focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Available Count</label>
                        <input type="number" min={0} value={room.available_count} onChange={(e) => updateRoom(room.id, { available_count: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 p-2 font-bold text-xs outline-none bg-white focus:border-emerald-500 transition" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Max Adults</label>
                        <input type="number" min={1} value={room.max_adults} onChange={(e) => updateRoom(room.id, { max_adults: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 p-2 font-bold text-xs outline-none bg-white focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Max Children</label>
                        <input type="number" min={0} value={room.max_children} onChange={(e) => updateRoom(room.id, { max_children: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 p-2 font-bold text-xs outline-none bg-white focus:border-emerald-500 transition" />
                      </div>
                    </div>

                    {/* Room Features */}
                    <div className="space-y-2">
                      <label className="block font-bold text-slate-400 uppercase text-[10px]">Features & Amenities</label>
                      <div className="flex flex-wrap gap-1.5">
                        {room.features.map((feat, fi) => (
                          <span key={fi} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                            <CheckCircle className="h-3 w-3 text-emerald-600" /> {feat}
                            <button onClick={() => removeRoomFeature(room.id, fi)} className="ml-0.5 text-slate-400 hover:text-rose-500">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Add feature (e.g. Sea View, King Bed)..."
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-xs outline-none bg-white"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addRoomFeature(room.id, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }} />
                      </div>
                    </div>

                    {/* Room Images */}
                    <div className="space-y-2">
                      <label className="block font-bold text-slate-400 uppercase text-[10px]">Room Images ({room.images.length})</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Paste room image URL..."
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-xs outline-none bg-white"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const url = (e.target as HTMLInputElement).value.trim();
                              if (url) {
                                updateRoom(room.id, { images: [...room.images, url] });
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                          }} />
                      </div>
                      {room.images.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {room.images.map((img, ii) => (
                            <div key={ii} className="relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border border-slate-200 group">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => updateRoom(room.id, { images: room.images.filter((_, i) => i !== ii) })}
                                className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 3: FACILITIES */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === "facilities" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Settings2 className="h-4 w-4 text-emerald-700" /> Facilities & Amenities ({Object.keys(facilities).length} groups)
              </h2>
            </div>

            {/* Add new group */}
            <div className="flex gap-2">
              <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 font-semibold text-xs outline-none"
                placeholder="New category name (e.g. Spa & Wellness)..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFacilityGroup(); } }} />
              <Button size="sm" variant="outline" onClick={addFacilityGroup} className="text-xs font-bold rounded-xl gap-1">
                <PlusCircle className="h-3.5 w-3.5" /> Add Group
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(facilities).map(([group, items]) => (
                <div key={group} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-emerald-700 uppercase">{group}</h4>
                    <button onClick={() => removeFacilityGroup(group)} className="text-rose-400 hover:text-rose-600 p-1 rounded">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                        <CheckCircle className="h-2.5 w-2.5 text-emerald-600" /> {item}
                        <button onClick={() => removeFacilityItem(group, idx)} className="text-slate-300 hover:text-rose-500 ml-0.5">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <input type="text" placeholder="Add item & press Enter..."
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-[11px] outline-none bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFacilityItem(group, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 4: POLICIES */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === "policies" && (
          <div className="space-y-5 max-w-3xl">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ClipboardList className="h-4 w-4 text-emerald-700" /> Hotel Policies
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Check-in Time</label>
                <input type="text" value={policies.check_in_time} onChange={(e) => setPolicies(p => ({ ...p, check_in_time: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition" placeholder="e.g. 02:00 PM" />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Check-out Time</label>
                <input type="text" value={policies.check_out_time} onChange={(e) => setPolicies(p => ({ ...p, check_out_time: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition" placeholder="e.g. 12:00 PM" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Special Instructions</label>
              <textarea rows={3} value={policies.special_instructions || ""} onChange={(e) => setPolicies(p => ({ ...p, special_instructions: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-xs outline-none focus:border-emerald-500 transition leading-relaxed"
                placeholder="Any special instructions for guests (e.g. ID requirements, deposit info)..." />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Child Policy</label>
              <textarea rows={2} value={policies.child_policy || ""} onChange={(e) => setPolicies(p => ({ ...p, child_policy: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-xs outline-none focus:border-emerald-500 transition leading-relaxed"
                placeholder="e.g. Children of all ages are welcome. Children 0-5 years stay free..." />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Pet Policy</label>
              <textarea rows={2} value={policies.pet_policy || ""} onChange={(e) => setPolicies(p => ({ ...p, pet_policy: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-xs outline-none focus:border-emerald-500 transition leading-relaxed"
                placeholder="e.g. Pets are not allowed / Small pets allowed with additional fee..." />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Cancellation Policy</label>
              <textarea rows={2} value={policies.cancellation_policy || ""} onChange={(e) => setPolicies(p => ({ ...p, cancellation_policy: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-xs outline-none focus:border-emerald-500 transition leading-relaxed"
                placeholder="e.g. Free cancellation up to 48 hours before check-in..." />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Refund Policy</label>
              <textarea rows={2} value={policies.refund_policy || ""} onChange={(e) => setPolicies(p => ({ ...p, refund_policy: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-xs outline-none focus:border-emerald-500 transition leading-relaxed"
                placeholder="e.g. Full refund for cancellations made 48+ hours before check-in..." />
            </div>

            {/* House Rules */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900">House Rules ({policies.house_rules?.length || 0})</h3>
              <div className="space-y-1">
                {(policies.house_rules || []).map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="flex-1 font-semibold text-slate-700">{rule}</span>
                    <button onClick={() => removeHouseRule(idx)} className="text-rose-400 hover:text-rose-600 p-0.5 rounded">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newRule} onChange={(e) => setNewRule(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-xs outline-none bg-white"
                  placeholder="Add house rule..."
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHouseRule(); } }} />
                <Button size="sm" variant="outline" onClick={addHouseRule} className="text-xs font-bold rounded-xl h-8">Add</Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 5: LOCATION & MAP */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === "location" && (
          <div className="space-y-5 max-w-3xl">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Navigation className="h-4 w-4 text-emerald-700" /> Location & Nearby Places
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Latitude</label>
                <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition" />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Longitude</label>
                <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-xs outline-none focus:border-emerald-500 transition" />
              </div>
            </div>

            {/* Auto-collect button */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <Sparkles className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>Auto-collect nearby places from Google Places API</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleAutoCollect} disabled={autoCollecting}
                className="text-xs font-bold rounded-xl gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                {autoCollecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {autoCollecting ? "Collecting..." : "Auto-Collect"}
              </Button>
            </div>

            {/* Nearby Places List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Nearby Places ({nearby.length})</h3>
                <Button size="sm" variant="outline" onClick={addNearbyPlace} className="text-xs font-bold rounded-xl gap-1 h-7">
                  <PlusCircle className="h-3 w-3" /> Add Place
                </Button>
              </div>

              {nearby.map((place, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <input type="text" value={place.name} onChange={(e) => updateNearbyPlace(idx, { name: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-xs outline-none bg-white" placeholder="Place name" />
                  <input type="text" value={place.type} onChange={(e) => updateNearbyPlace(idx, { type: e.target.value })}
                    className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-xs outline-none bg-white" placeholder="Type" />
                  <input type="text" value={place.distance} onChange={(e) => updateNearbyPlace(idx, { distance: e.target.value })}
                    className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-xs outline-none bg-white" placeholder="Dist." />
                  <button onClick={() => removeNearbyPlace(idx)} className="text-rose-400 hover:text-rose-600 p-1 rounded">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 6: REVIEWS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MessageSquare className="h-4 w-4 text-emerald-700" /> Guest Reviews ({reviews.length})
            </h2>

            {!editingHotel ? (
              <p className="text-xs text-slate-400 font-semibold p-4 text-center">Save the hotel first, then manage reviews here.</p>
            ) : reviewsLoading ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold p-8 text-center border border-dashed border-slate-300 rounded-2xl">
                No reviews yet for this hotel.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <ReviewModerationCard
                    key={rev.id}
                    review={rev}
                    onDelete={() => handleDeleteReview(rev.id)}
                    onRespond={(text) => handleRespondToReview(rev.id, text)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 7: RANKING & VISIBILITY */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === "ranking" && (
          <div className="space-y-5 max-w-2xl">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BarChart3 className="h-4 w-4 text-emerald-700" /> Ranking & Visibility
            </h2>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <div>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {showOnHomepage ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                    Show on Homepage
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">When enabled, this hotel appears on the homepage featured section.</p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700 text-xs">Star Rank (1–100)</label>
                <p className="text-[10px] text-slate-500 font-medium">Higher rank = appears first in search results.</p>
                <input type="range" min={1} max={100} value={starRank} onChange={(e) => setStarRank(Number(e.target.value))}
                  className="w-full accent-emerald-600" />
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Low</span>
                  <span className="text-emerald-700 text-lg">{starRank}</span>
                  <span className="text-slate-400">High</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700 text-xs">Admin Rank Override</label>
                <p className="text-[10px] text-slate-500 font-medium">Fine-tune display order. Higher = more prominent.</p>
                <input type="number" min={0} max={1000} value={adminRank} onChange={(e) => setAdminRank(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-sm outline-none text-center focus:border-emerald-500 transition" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Review Moderation Card Component ───────────────────────────────────────
function ReviewModerationCard({
  review,
  onDelete,
  onRespond,
}: {
  review: HotelReview;
  onDelete: () => void;
  onRespond: (text: string) => void;
}) {
  const [showRespond, setShowRespond] = useState(false);
  const [responseText, setResponseText] = useState(review.admin_response || "");

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
            {review.user_name?.charAt(0)?.toUpperCase() || "G"}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">{review.user_name || "Guest"}</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Star className="h-3 w-3 fill-amber-400" /> {review.rating}/5
          </div>
          <button onClick={onDelete} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>

      {/* Admin Response */}
      {review.admin_response && !showRespond && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
          <span className="font-bold text-emerald-800 text-[10px] uppercase block mb-0.5">Admin Response</span>
          <p className="text-emerald-900 font-medium">{review.admin_response}</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={() => setShowRespond(!showRespond)}
          className="text-[10px] font-bold rounded-lg h-7 gap-1">
          <MessageSquare className="h-3 w-3" /> {review.admin_response ? "Edit Response" : "Respond"}
        </Button>
      </div>

      {showRespond && (
        <div className="space-y-2 pt-1">
          <textarea rows={2} value={responseText} onChange={(e) => setResponseText(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-semibold text-xs outline-none"
            placeholder="Write your response to the guest..." />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowRespond(false)} className="text-xs h-7">Cancel</Button>
            <Button size="sm" onClick={() => { onRespond(responseText); setShowRespond(false); }} className="text-xs h-7 font-bold">
              Save Response
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
