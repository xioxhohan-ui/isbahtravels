"use client";

import { useState, useEffect } from "react";
import { apiService } from "@/lib/services/api";
import { Tour } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";
import { Compass, Plus, Edit3, Trash2, MapPin, Clock, X, RefreshCw } from "lucide-react";

export default function AdminToursPage() {
  // Enable Supabase Real-time postgres_changes subscription for tours
  useSupabaseRealtime("tours", ["tours"]);

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Cox's Bazar, Bangladesh");
  const [durationDays, setDurationDays] = useState(3);
  const [price, setPrice] = useState(8500);
  const [category, setCategory] = useState("Domestic");
  const [overview, setOverview] = useState("");

  useEffect(() => {
    async function loadTours() {
      setLoading(true);
      const data = await apiService.getTours();
      setTours(data);
      setLoading(false);
    }
    loadTours();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTour(null);
    setTitle("Sylhet Tea Garden & Ratargul Expedition");
    setLocation("Sylhet, Bangladesh");
    setDurationDays(3);
    setPrice(7200);
    setCategory("Domestic");
    setOverview("Explore Jaflong, Ratargul Swamp Forest, and Sreemangal Tea Gardens.");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tour: Tour) => {
    setEditingTour(tour);
    setTitle(tour.title);
    setLocation(tour.location);
    setDurationDays(tour.duration_days);
    setPrice(tour.price_per_person);
    setCategory(tour.category || "Domestic");
    setOverview(tour.overview);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tour package?")) {
      setTours(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTour) {
      setTours(prev =>
        prev.map(t =>
          t.id === editingTour.id
            ? { ...t, title, location, duration_days: Number(durationDays), price_per_person: Number(price), category: category as any, overview }
            : t
        )
      );
    } else {
      const newTour: Tour = {
        id: `tr-${Date.now()}`,
        title,
        location,
        duration_days: Number(durationDays),
        price_per_person: Number(price),
        currency: "BDT",
        category: category as any,
        overview,
        description: overview,
        inclusions: ["3-Star Hotel Stay", "Daily Breakfast", "Sightseeing Car Transfer"],
        exclusions: ["Airfare / Bus Ticket", "Shopping"],
        requirements: ["Valid NID Copy"],
        travel_tips: ["Carry comfortable footwear"],
        itinerary: [
          { day: 1, title: "Arrival & Sightseeing", description: "Check-in and local tour." },
          { day: 2, title: "Nature Exploration", description: "Full day sightseeing tour." }
        ],
        images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"],
        attractions: ["Local Scenic Points"],
        activities: ["Sightseeing", "Photography"],
        pickup_locations: ["City Center"],
        availability_dates: [{ start_date: "2026-08-15", end_date: "2026-08-18" }],
        max_group_size: 20,
        min_age: 3,
        cancellation_policy: "Free cancellation 72h prior",
        refund_policy: "Standard refund",
        latitude: 24.8949,
        longitude: 91.8687,
      };
      setTours(prev => [newTour, ...prev]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Tour Packages</h1>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <RefreshCw className="h-3 w-3 animate-spin" /> Real-time Subscribed
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold">List, create, edit holiday tour packages and day-wise itineraries in real-time.</p>
        </div>
        <Button onClick={handleOpenAddModal} size="sm" className="font-bold text-xs gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" />
          <span>Add New Package</span>
        </Button>
      </div>

      {/* Tour Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 font-bold">Loading tour packages...</div>
        ) : (
          tours.map((tour) => (
            <div key={tour.id} className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs space-y-3 p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-bold">{tour.category || "Domestic"}</Badge>
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {tour.duration_days} Days
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{tour.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  {tour.location}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm">{formatBDT(tour.price_per_person)} / person</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEditModal(tour)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(tour.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Tour Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTour ? "Edit Tour Package" : "Add New Tour Package"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Package Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  >
                    <option value="Domestic">Domestic</option>
                    <option value="International">International</option>
                    <option value="Umrah">Umrah</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Price per Person (BDT)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Overview</label>
                <textarea
                  rows={3}
                  required
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold outline-none"
                />
              </div>

              <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-100">
                {editingTour ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleDelete(editingTour.id);
                      setIsModalOpen(false);
                    }}
                    size="sm"
                    className="font-bold text-xs text-rose-700 border-rose-200 hover:bg-rose-50 gap-1 rounded-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Package</span>
                  </Button>
                ) : <div />}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold px-6">
                    Save Package
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
