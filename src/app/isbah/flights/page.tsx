"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/services/api";
import { Flight } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";
import { Plane, Plus, Edit3, Trash2, X, RefreshCw, Star } from "lucide-react";

export default function AdminFlightsPage() {
  const queryClient = useQueryClient();

  // Enable Supabase Real-time postgres_changes subscription
  useSupabaseRealtime("flights", ["flights"]);

  const { data: flightsData, isLoading } = useQuery({
    queryKey: ["flights"],
    queryFn: () => apiService.getFlights(),
    initialData: [],
  });

  const [flights, setFlights] = useState<Flight[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (flightsData) setFlights(flightsData);
  }, [flightsData]);

  // Form state
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [airline, setAirline] = useState("Biman Bangladesh");
  const [flightNumber, setFlightNumber] = useState("BG-501");
  const [tripType, setTripType] = useState<"oneway" | "roundtrip" | "multicity">("oneway");
  const [fromAirport, setFromAirport] = useState("Dhaka (DAC)");
  const [toAirport, setToAirport] = useState("Cox's Bazar (CXB)");
  const [flightClass, setFlightClass] = useState<"economy" | "business">("economy");
  const [price, setPrice] = useState(4800);
  const [seats, setSeats] = useState(25);
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split("T")[0]);
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [rankPriority, setRankPriority] = useState(50);

  const handleOpenAddModal = () => {
    setEditingFlight(null);
    setAirline("Biman Bangladesh");
    setFlightNumber(`BG-${Math.floor(100 + Math.random() * 900)}`);
    setPrice(5200);
    setSeats(20);
    setFlightDate(new Date().toISOString().split("T")[0]);
    setShowOnHomepage(true);
    setIsStarred(false);
    setRankPriority(50);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (flight: Flight) => {
    setEditingFlight(flight);
    setAirline(flight.airline);
    setFlightNumber(flight.flight_number);
    setTripType(flight.trip_type);
    setFromAirport(flight.segments[0]?.from || "Dhaka (DAC)");
    setToAirport(flight.segments[0]?.to || "Cox's Bazar (CXB)");
    setFlightClass(flight.class as any);
    setPrice(flight.price);
    setSeats(flight.available_seats);
    setFlightDate(flight.segments[0]?.departure_date || new Date().toISOString().split("T")[0]);
    setShowOnHomepage(flight.show_on_homepage !== false);
    setIsStarred(Boolean(flight.is_starred));
    setRankPriority(flight.rank_priority || 50);
    setIsModalOpen(true);
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRankInput, setBulkRankInput] = useState<number>(80);
  const [bulkDateInput, setBulkDateInput] = useState<string>(new Date().toISOString().split("T")[0]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === flights.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(flights.map(f => f.id));
    }
  };

  const handleToggleStarFlight = async (flight: Flight) => {
    const isStarred = !flight.is_starred;
    const starRank = isStarred ? 100 : 0;
    const updated = {
      ...flight,
      is_starred: isStarred,
      star_rank: starRank,
      display_order: (starRank * 1000) + (flight.admin_rank || flight.rank_priority || 50),
    };
    await apiService.saveFlight(updated);
    await apiService.logRankingChange({
      entity_type: "flight",
      entity_id: flight.id,
      old_rank: flight.star_rank || (flight.is_starred ? 100 : 0),
      new_rank: starRank,
      old_visibility: flight.show_on_homepage !== false,
      new_visibility: flight.show_on_homepage !== false,
    });
    setFlights(prev => prev.map(f => f.id === flight.id ? updated : f));
    queryClient.invalidateQueries({ queryKey: ["flights"] });
  };

  const handleInlineRankChange = async (flight: Flight, newAdminRank: number) => {
    const starRank = flight.star_rank ?? (flight.is_starred ? 100 : 0);
    const updated = {
      ...flight,
      admin_rank: newAdminRank,
      rank_priority: newAdminRank,
      display_order: (starRank * 1000) + newAdminRank,
    };
    await apiService.saveFlight(updated);
    await apiService.logRankingChange({
      entity_type: "flight",
      entity_id: flight.id,
      old_rank: flight.admin_rank || flight.rank_priority || 50,
      new_rank: newAdminRank,
      old_visibility: flight.show_on_homepage !== false,
      new_visibility: flight.show_on_homepage !== false,
    });
    setFlights(prev => prev.map(f => f.id === flight.id ? updated : f));
    queryClient.invalidateQueries({ queryKey: ["flights"] });
  };

  const handleInlineHomepageToggle = async (flight: Flight, show: boolean) => {
    const updated = { ...flight, show_on_homepage: show };
    await apiService.saveFlight(updated);
    await apiService.logRankingChange({
      entity_type: "flight",
      entity_id: flight.id,
      old_rank: flight.admin_rank || 50,
      new_rank: flight.admin_rank || 50,
      old_visibility: flight.show_on_homepage !== false,
      new_visibility: show,
    });
    setFlights(prev => prev.map(f => f.id === flight.id ? updated : f));
    queryClient.invalidateQueries({ queryKey: ["flights"] });
  };

  const handleBulkSetRank = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const flight = flights.find(f => f.id === id);
      if (flight) {
        await handleInlineRankChange(flight, bulkRankInput);
      }
    }
  };

  const handleBulkToggleHomepage = async (show: boolean) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const flight = flights.find(f => f.id === id);
      if (flight) {
        await handleInlineHomepageToggle(flight, show);
      }
    }
  };

  const handleBulkSetDate = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const flight = flights.find(f => f.id === id);
      if (flight) {
        const updated = {
          ...flight,
          segments: [{ ...flight.segments[0], departure_date: bulkDateInput }],
        };
        await apiService.saveFlight(updated);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["flights"] });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this flight offer?")) {
      await apiService.deleteFlight(id);
      setFlights(prev => prev.filter(f => f.id !== id));
      queryClient.invalidateQueries({ queryKey: ["flights"] });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const flightObj: Flight = {
      id: editingFlight ? editingFlight.id : `fl-${Date.now()}`,
      airline,
      flight_number: flightNumber,
      trip_type: tripType,
      class: flightClass,
      price: Number(price),
      currency: "BDT",
      available_seats: Number(seats),
      max_travelers: 9,
      show_on_homepage: showOnHomepage,
      is_starred: isStarred,
      rank_priority: Number(rankPriority),
      segments: [{ from: fromAirport, to: toAirport, departure_date: flightDate, duration: "1h 10m" }],
    };

    await apiService.saveFlight(flightObj);

    if (editingFlight) {
      setFlights(prev => prev.map(f => f.id === flightObj.id ? flightObj : f));
    } else {
      setFlights(prev => [flightObj, ...prev]);
    }
    queryClient.invalidateQueries({ queryKey: ["flights"] });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Flight Inventory</h1>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <RefreshCw className="h-3 w-3 animate-spin" /> Real-time Subscribed
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold">Changes are pushed instantly across user search screens via Supabase real-time.</p>
        </div>
        <Button onClick={handleOpenAddModal} size="sm" className="font-bold text-xs gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" />
          <span>Add New Flight</span>
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-emerald-950 text-white rounded-2xl shadow-lg border border-emerald-800">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-emerald-700 px-2 py-0.5 rounded-full text-white">{selectedIds.length} Selected</span>
            <span>Bulk Ranking & Visibility Operations</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-emerald-900/60 p-1.5 rounded-xl border border-emerald-800">
              <span className="text-[10px] text-slate-300 font-bold uppercase">Rank:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={bulkRankInput}
                onChange={(e) => setBulkRankInput(Number(e.target.value))}
                className="w-14 bg-emerald-950 border border-emerald-700 rounded px-1.5 py-0.5 text-center font-bold text-white outline-none"
              />
              <Button size="sm" onClick={handleBulkSetRank} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 font-bold">
                Apply Rank
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button size="sm" onClick={() => handleBulkToggleHomepage(true)} className="h-7 text-[11px] bg-blue-600 hover:bg-blue-500 font-bold">
                Show Homepage
              </Button>
              <Button size="sm" onClick={() => handleBulkToggleHomepage(false)} className="h-7 text-[11px] bg-slate-800 hover:bg-slate-700 font-bold">
                Hide Homepage
              </Button>
            </div>

            <div className="flex items-center gap-1 bg-emerald-900/60 p-1.5 rounded-xl border border-emerald-800">
              <input
                type="date"
                value={bulkDateInput}
                onChange={(e) => setBulkDateInput(e.target.value)}
                className="bg-emerald-950 border border-emerald-700 rounded px-1.5 py-0.5 font-bold text-white text-[11px] outline-none"
              />
              <Button size="sm" onClick={handleBulkSetDate} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 font-bold">
                Set Date
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Flight Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={flights.length > 0 && selectedIds.length === flights.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="p-4">Airline & Flight #</th>
                <th className="p-4">Route & Date</th>
                <th className="p-4">Rank Priority</th>
                <th className="p-4">Homepage</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Loading real-time flights inventory...</td>
                </tr>
              ) : flights.map((flight) => (
                <tr key={flight.id} className={`hover:bg-slate-50 ${selectedIds.includes(flight.id) ? "bg-emerald-50/40" : ""}`}>
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(flight.id)}
                      onChange={() => handleToggleSelect(flight.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStarFlight(flight)}
                        title="Star / Favorite Flight (Sets Star Rank to 100)"
                        className="p-1 rounded-md hover:bg-amber-50"
                      >
                        <Star className={`h-4 w-4 ${flight.is_starred ? "fill-amber-400 text-amber-500" : "text-slate-300"}`} />
                      </button>
                      <div>
                        <span>{flight.airline} ({flight.flight_number})</span>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {flight.id.slice(0, 10)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>{flight.segments[0]?.from} ➔ {flight.segments[0]?.to}</div>
                    <div className="text-[10px] font-bold text-emerald-700 mt-0.5">{flight.segments[0]?.departure_date || "Any Date"}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={flight.admin_rank ?? flight.rank_priority ?? 50}
                        onChange={(e) => handleInlineRankChange(flight, Number(e.target.value))}
                        className="w-14 rounded-lg border border-slate-200 p-1 font-bold text-center text-xs outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">Score: {flight.display_order || ((flight.is_starred ? 100 : 0) * 1000 + (flight.admin_rank || 50))}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <label className="inline-flex items-center cursor-pointer gap-1.5">
                      <input
                        type="checkbox"
                        checked={flight.show_on_homepage !== false}
                        onChange={(e) => handleInlineHomepageToggle(flight, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${flight.show_on_homepage !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                        {flight.show_on_homepage !== false ? "Visible" : "Hidden"}
                      </span>
                    </label>
                  </td>
                  <td className="p-4 font-black text-slate-900">{formatBDT(flight.price)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenEditModal(flight)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(flight.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Flight Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingFlight ? "Edit Flight Offer" : "Add New Flight Offer"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Airline Name</label>
                  <input
                    type="text"
                    required
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Flight Number</label>
                  <input
                    type="text"
                    required
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">From Airport</label>
                  <input
                    type="text"
                    required
                    value={fromAirport}
                    onChange={(e) => setFromAirport(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">To Airport</label>
                  <input
                    type="text"
                    required
                    value={toAirport}
                    onChange={(e) => setToAirport(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Ticket Price (BDT)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Available Seats</label>
                  <input
                    type="number"
                    required
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Flight Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Priority Ranking (1–100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={rankPriority}
                    onChange={(e) => setRankPriority(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnHomepage}
                    onChange={(e) => setShowOnHomepage(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-900">Show on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isStarred}
                    onChange={(e) => setIsStarred(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-amber-800 flex items-center gap-1">
                    <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
                    Star / Favorite Item
                  </span>
                </label>
              </div>

              <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-100">
                {editingFlight ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleDelete(editingFlight.id);
                      setIsModalOpen(false);
                    }}
                    size="sm"
                    className="font-bold text-xs text-rose-700 border-rose-200 hover:bg-rose-50 gap-1 rounded-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Flight</span>
                  </Button>
                ) : <div />}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold px-6">
                    Save & Push Real-time
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
