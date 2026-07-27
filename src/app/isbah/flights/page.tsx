"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/services/api";
import { Flight } from "@/lib/types/database";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";
import { Plane, Plus, Edit3, Trash2, X, RefreshCw } from "lucide-react";

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

  const handleOpenAddModal = () => {
    setEditingFlight(null);
    setAirline("Biman Bangladesh");
    setFlightNumber(`BG-${Math.floor(100 + Math.random() * 900)}`);
    setPrice(5200);
    setSeats(20);
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
    setIsModalOpen(true);
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
      segments: [{ from: fromAirport, to: toAirport, departure_date: "2026-08-15", duration: "1h 10m" }],
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

      {/* Flight Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Airline & Flight #</th>
                <th className="p-4">Route</th>
                <th className="p-4">Class</th>
                <th className="p-4">Price</th>
                <th className="p-4">Seats Left</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Loading real-time flights inventory...</td>
                </tr>
              ) : flights.map((flight) => (
                <tr key={flight.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">
                    {flight.airline} ({flight.flight_number})
                  </td>
                  <td className="p-4">
                    {flight.segments[0]?.from} ➔ {flight.segments[0]?.to}
                  </td>
                  <td className="p-4 capitalize">
                    <Badge variant="outline" className="font-bold">{flight.class}</Badge>
                  </td>
                  <td className="p-4 font-black text-slate-900">{formatBDT(flight.price)}</td>
                  <td className="p-4 text-emerald-700 font-extrabold">{flight.available_seats} Seats</td>
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
