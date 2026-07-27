import { MOCK_BOOKINGS, MOCK_FLIGHTS, MOCK_HOTELS, MOCK_ROOMS, MOCK_TOURS, MOCK_VISAS } from "../mock-data";
import { createClient } from "../supabase/client";
import { Booking, BookingStatus, Flight, Hotel, PaymentStatus, Room, Tour, TourInquiry, Visa, VisaInquiry } from "../types/database";

const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-anon-key"
  );
};

/**
 * Returns a Supabase client instance.
 * Uses the browser client by default (safe for both client and server components
 * when called from client contexts). For server-only API routes, use
 * createServerSupabaseClient directly.
 */
function getClient() {
  return createClient();
}

function withTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Network timeout")), ms)),
  ]);
}

function getDeletedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const list = JSON.parse(localStorage.getItem("isbah_deleted_ids") || "[]");
    return new Set(list);
  } catch {
    return new Set();
  }
}

function addDeletedId(id: string) {
  if (typeof window === "undefined" || !id) return;
  try {
    const deletedSet = getDeletedIds();
    deletedSet.add(id);
    localStorage.setItem("isbah_deleted_ids", JSON.stringify(Array.from(deletedSet)));
  } catch {}
}

function filterDeleted<T extends { id: string }>(items: T[]): T[] {
  const deleted = getDeletedIds();
  return items.filter(item => !deleted.has(item.id));
}

export function computeDisplayOrder(item: { is_starred?: boolean; star_rank?: number; admin_rank?: number; rank_priority?: number; display_order?: number }): number {
  const starVal = typeof item.star_rank === "number" ? item.star_rank : (item.is_starred ? 100 : 0);
  const adminVal = typeof item.admin_rank === "number" ? item.admin_rank : (item.rank_priority || 0);
  const calculated = (starVal * 1000) + adminVal;
  return Math.max(calculated, item.display_order || 0);
}

function sortByRankAndStar<T extends { is_starred?: boolean; star_rank?: number; admin_rank?: number; rank_priority?: number; display_order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const scoreA = computeDisplayOrder(a);
    const scoreB = computeDisplayOrder(b);
    return scoreB - scoreA;
  });
}

export const apiService = {
  // FLIGHTS API
  async getFlights(filters?: { from?: string; to?: string; trip_type?: string; class?: string }): Promise<Flight[]> {
    let dbFlights: Flight[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await withTimeout(supabase.from("flights").select("*"));
        if (!error && data && data.length > 0) dbFlights = data as Flight[];
      } catch (err) {
        console.warn("Supabase flights fetch failed", err);
      }
    }

    let localFlights: Flight[] = [];
    if (typeof window !== "undefined") {
      try {
        localFlights = JSON.parse(localStorage.getItem("isbah_custom_flights") || "[]");
      } catch {}
    }

    const combined = [...localFlights, ...dbFlights, ...MOCK_FLIGHTS];
    const uniqueMap = new Map<string, Flight>();
    combined.forEach((f) => uniqueMap.set(f.id, f));
    let result = Array.from(uniqueMap.values());

    if (filters?.from) {
      const fromLower = filters.from.toLowerCase();
      result = result.filter(f => f.segments?.some(s => s.from.toLowerCase().includes(fromLower)));
    }
    if (filters?.to) {
      const toLower = filters.to.toLowerCase();
      result = result.filter(f => f.segments?.some(s => s.to.toLowerCase().includes(toLower)));
    }
    if (filters?.trip_type) {
      result = result.filter(f => f.trip_type === filters.trip_type);
    }
    if (filters?.class) {
      result = result.filter(f => f.class === filters.class);
    }
    return sortByRankAndStar(filterDeleted(result));
  },

  async getFlightById(id: string): Promise<Flight | null> {
    const flights = await this.getFlights();
    return flights.find(f => f.id === id) || null;
  },

  async saveFlight(flight: Flight): Promise<Flight> {
    if (typeof window !== "undefined") {
      try {
        const existing: Flight[] = JSON.parse(localStorage.getItem("isbah_custom_flights") || "[]");
        const idx = existing.findIndex(f => f.id === flight.id);
        if (idx !== -1) {
          existing[idx] = flight;
        } else {
          existing.unshift(flight);
        }
        localStorage.setItem("isbah_custom_flights", JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_flights_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("flights").upsert([flight]);
      } catch (err) {
        console.warn("Supabase save flight error", err);
      }
    }

    const mockIdx = MOCK_FLIGHTS.findIndex(f => f.id === flight.id);
    if (mockIdx !== -1) MOCK_FLIGHTS[mockIdx] = flight;
    else MOCK_FLIGHTS.unshift(flight);
    return flight;
  },

  async deleteFlight(id: string): Promise<boolean> {
    addDeletedId(id);
    if (typeof window !== "undefined") {
      try {
        const existing: Flight[] = JSON.parse(localStorage.getItem("isbah_custom_flights") || "[]");
        const filtered = existing.filter(f => f.id !== id);
        localStorage.setItem("isbah_custom_flights", JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_flights_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("flights").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete flight error", err);
      }
    }

    const mockIdx = MOCK_FLIGHTS.findIndex(f => f.id === id);
    if (mockIdx !== -1) MOCK_FLIGHTS.splice(mockIdx, 1);
    return true;
  },

  // HOTELS API
  async getHotels(filters?: { city?: string; star_rating?: number }): Promise<Hotel[]> {
    let dbHotels: Hotel[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await withTimeout(supabase.from("hotels").select("*"));
        if (!error && data && data.length > 0) dbHotels = data as Hotel[];
      } catch (err) {
        console.warn("Supabase fetch hotels failed", err);
      }
    }

    let localHotels: Hotel[] = [];
    if (typeof window !== "undefined") {
      try {
        localHotels = JSON.parse(localStorage.getItem("isbah_custom_hotels") || "[]");
      } catch {}
    }

    const combined = [...localHotels, ...dbHotels, ...MOCK_HOTELS];
    const uniqueMap = new Map<string, Hotel>();
    combined.forEach((h) => uniqueMap.set(h.id, h));
    let result = Array.from(uniqueMap.values());

    if (filters?.city) {
      const cityLower = filters.city.toLowerCase();
      result = result.filter(h => h.city.toLowerCase().includes(cityLower) || h.name.toLowerCase().includes(cityLower));
    }
    if (filters?.star_rating) {
      result = result.filter(h => h.star_rating >= filters.star_rating!);
    }
    return sortByRankAndStar(filterDeleted(result));
  },

  async getHotelById(id: string): Promise<Hotel | null> {
    const hotels = await this.getHotels();
    return hotels.find(h => h.id === id) || MOCK_HOTELS[0];
  },

  async saveHotel(hotel: Hotel): Promise<Hotel> {
    if (typeof window !== "undefined") {
      try {
        const existing: Hotel[] = JSON.parse(localStorage.getItem("isbah_custom_hotels") || "[]");
        const idx = existing.findIndex(h => h.id === hotel.id);
        if (idx !== -1) {
          existing[idx] = hotel;
        } else {
          existing.unshift(hotel);
        }
        localStorage.setItem("isbah_custom_hotels", JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_hotels_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("hotels").upsert([hotel]);
      } catch (err) {
        console.warn("Supabase save hotel error", err);
      }
    }

    const mockIdx = MOCK_HOTELS.findIndex(h => h.id === hotel.id);
    if (mockIdx !== -1) MOCK_HOTELS[mockIdx] = hotel;
    else MOCK_HOTELS.unshift(hotel);
    return hotel;
  },

  async deleteHotel(id: string): Promise<boolean> {
    addDeletedId(id);
    if (typeof window !== "undefined") {
      try {
        const existing: Hotel[] = JSON.parse(localStorage.getItem("isbah_custom_hotels") || "[]");
        const filtered = existing.filter(h => h.id !== id);
        localStorage.setItem("isbah_custom_hotels", JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_hotels_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("hotels").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete hotel error", err);
      }
    }

    const mockIdx = MOCK_HOTELS.findIndex(h => h.id === id);
    if (mockIdx !== -1) MOCK_HOTELS.splice(mockIdx, 1);
    return true;
  },

  async getHotelRooms(hotelId: string): Promise<Room[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await supabase.from("rooms").select("*").eq("hotel_id", hotelId);
        if (!error && data && data.length > 0) return data as Room[];
      } catch (err) {
        console.warn("Supabase rooms fetch error", err);
      }
    }
    const rooms = MOCK_ROOMS.filter(r => r.hotel_id === hotelId);
    return rooms.length > 0 ? rooms : MOCK_ROOMS;
  },

  // TOURS API
  async getTours(filters?: { category?: string; search?: string }): Promise<Tour[]> {
    let dbTours: Tour[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await withTimeout(supabase.from("tours").select("*"));
        if (!error && data && data.length > 0) dbTours = data as Tour[];
      } catch (err) {
        console.warn("Supabase tours fetch error", err);
      }
    }

    let localTours: Tour[] = [];
    if (typeof window !== "undefined") {
      try {
        localTours = JSON.parse(localStorage.getItem("isbah_custom_tours") || "[]");
      } catch {}
    }

    const combined = [...localTours, ...dbTours, ...MOCK_TOURS];
    const uniqueMap = new Map<string, Tour>();
    combined.forEach((t) => uniqueMap.set(t.id, t));
    let result = Array.from(uniqueMap.values());

    if (filters?.category && filters.category !== "All") {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.location.toLowerCase().includes(q));
    }
    return sortByRankAndStar(filterDeleted(result));
  },

  async getTourById(id: string): Promise<Tour | null> {
    const tours = await this.getTours();
    return tours.find(t => t.id === id) || MOCK_TOURS[0];
  },

  async saveTour(tour: Tour): Promise<Tour> {
    if (typeof window !== "undefined") {
      try {
        const existing: Tour[] = JSON.parse(localStorage.getItem("isbah_custom_tours") || "[]");
        const idx = existing.findIndex(t => t.id === tour.id);
        if (idx !== -1) {
          existing[idx] = tour;
        } else {
          existing.unshift(tour);
        }
        localStorage.setItem("isbah_custom_tours", JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_tours_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("tours").upsert([tour]);
      } catch (err) {
        console.warn("Supabase save tour error", err);
      }
    }

    const mockIdx = MOCK_TOURS.findIndex(t => t.id === tour.id);
    if (mockIdx !== -1) MOCK_TOURS[mockIdx] = tour;
    else MOCK_TOURS.unshift(tour);
    return tour;
  },

  async deleteTour(id: string): Promise<boolean> {
    addDeletedId(id);
    if (typeof window !== "undefined") {
      try {
        const existing: Tour[] = JSON.parse(localStorage.getItem("isbah_custom_tours") || "[]");
        const filtered = existing.filter(t => t.id !== id);
        localStorage.setItem("isbah_custom_tours", JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_tours_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("tours").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete tour error", err);
      }
    }

    const mockIdx = MOCK_TOURS.findIndex(t => t.id === id);
    if (mockIdx !== -1) MOCK_TOURS.splice(mockIdx, 1);
    return true;
  },

  // VISAS API
  async getVisas(searchCountry?: string): Promise<Visa[]> {
    let dbVisas: Visa[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await withTimeout(supabase.from("visas").select("*"));
        if (!error && data && data.length > 0) dbVisas = data as Visa[];
      } catch (err) {
        console.warn("Supabase visa fetch error", err);
      }
    }

    let localVisas: Visa[] = [];
    if (typeof window !== "undefined") {
      try {
        localVisas = JSON.parse(localStorage.getItem("isbah_custom_visas") || "[]");
      } catch {}
    }

    const combined = [...localVisas, ...dbVisas, ...MOCK_VISAS];
    const uniqueMap = new Map<string, Visa>();
    combined.forEach((v) => uniqueMap.set(v.id, v));
    let result = Array.from(uniqueMap.values());

    if (searchCountry) {
      const q = searchCountry.toLowerCase();
      result = result.filter(v => v.country.toLowerCase().includes(q));
    }
    return sortByRankAndStar(filterDeleted(result));
  },

  async getVisaById(id: string): Promise<Visa | null> {
    const visas = await this.getVisas();
    return visas.find(v => v.id === id) || MOCK_VISAS[0];
  },

  async saveVisa(visa: Visa): Promise<Visa> {
    if (typeof window !== "undefined") {
      try {
        const existing: Visa[] = JSON.parse(localStorage.getItem("isbah_custom_visas") || "[]");
        const idx = existing.findIndex(v => v.id === visa.id);
        if (idx !== -1) {
          existing[idx] = visa;
        } else {
          existing.unshift(visa);
        }
        localStorage.setItem("isbah_custom_visas", JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_visas_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("visas").upsert([visa]);
      } catch (err) {
        console.warn("Supabase save visa error", err);
      }
    }

    const mockIdx = MOCK_VISAS.findIndex(v => v.id === visa.id);
    if (mockIdx !== -1) MOCK_VISAS[mockIdx] = visa;
    else MOCK_VISAS.unshift(visa);
    return visa;
  },

  async deleteVisa(id: string): Promise<boolean> {
    addDeletedId(id);
    if (typeof window !== "undefined") {
      try {
        const existing: Visa[] = JSON.parse(localStorage.getItem("isbah_custom_visas") || "[]");
        const filtered = existing.filter(v => v.id !== id);
        localStorage.setItem("isbah_custom_visas", JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_visas_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("visas").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete visa error", err);
      }
    }

    const mockIdx = MOCK_VISAS.findIndex(v => v.id === id);
    if (mockIdx !== -1) MOCK_VISAS.splice(mockIdx, 1);
    return true;
  },

  // BOOKINGS API
  async getBookings(): Promise<Booking[]> {
    let dbBookings: Booking[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await withTimeout(
          supabase.from("bookings").select("*").order("created_at", { ascending: false })
        );
        if (!error && data && data.length > 0) dbBookings = data as Booking[];
      } catch (err) {
        console.warn("Supabase bookings fetch error", err);
      }
    }

    let localSaved: Booking[] = [];
    if (typeof window !== "undefined") {
      try {
        localSaved = JSON.parse(localStorage.getItem("isbah_local_bookings") || "[]");
      } catch {}
    }

    const combined = [...localSaved, ...dbBookings, ...MOCK_BOOKINGS];
    const uniqueMap = new Map<string, Booking>();
    combined.forEach((b) => uniqueMap.set(b.id, b));
    return sortByRankAndStar(filterDeleted(Array.from(uniqueMap.values())));
  },

  async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      user_id: bookingData.user_id || "usr-demo",
      booking_type: bookingData.booking_type || "tour",
      reference_id: bookingData.reference_id,
      details: bookingData.details || {},
      total_price: bookingData.total_price || 0,
      currency: "BDT",
      payment_status: bookingData.payment_status || "pending",
      payment_details: bookingData.payment_details || {},
      booking_status: bookingData.booking_status || "confirmed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem("isbah_local_bookings") || "[]");
        localStorage.setItem("isbah_local_bookings", JSON.stringify([newBooking, ...existing]));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_bookings_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await supabase.from("bookings").insert([newBooking]).select().single();
        if (!error && data) return data as Booking;
      } catch (err) {
        console.warn("Supabase booking creation error", err);
      }
    }

    MOCK_BOOKINGS.unshift(newBooking);
    return newBooking;
  },

  async updateBookingStatus(id: string, paymentStatus: PaymentStatus, bookingStatus: BookingStatus): Promise<boolean> {
    if (typeof window !== "undefined") {
      try {
        const local = JSON.parse(localStorage.getItem("isbah_local_bookings") || "[]");
        const idx = local.findIndex((b: any) => b.id === id);
        if (idx !== -1) {
          local[idx].payment_status = paymentStatus;
          local[idx].booking_status = bookingStatus;
          local[idx].updated_at = new Date().toISOString();
          localStorage.setItem("isbah_local_bookings", JSON.stringify(local));
          window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        }
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase
          .from("bookings")
          .update({ payment_status: paymentStatus, booking_status: bookingStatus, updated_at: new Date().toISOString() })
          .eq("id", id);
      } catch (err) {
        console.warn("Supabase update booking status error", err);
      }
    }

    const mockIdx = MOCK_BOOKINGS.findIndex(b => b.id === id);
    if (mockIdx !== -1) {
      MOCK_BOOKINGS[mockIdx].payment_status = paymentStatus;
      MOCK_BOOKINGS[mockIdx].booking_status = bookingStatus;
    }
    return true;
  },

  async getUserBookings(userId?: string): Promise<Booking[]> {
    let supabaseBookings: Booking[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });
        if (userId) query = query.eq("user_id", userId);
        const { data, error } = await withTimeout(query);
        if (!error && data && data.length > 0) supabaseBookings = data as Booking[];
      } catch (err) {
        console.warn("Supabase user bookings error", err);
      }
    }

    let localSaved: Booking[] = [];
    if (typeof window !== "undefined") {
      try {
        localSaved = JSON.parse(localStorage.getItem("isbah_local_bookings") || "[]");
      } catch {}
    }

    const combined = [...localSaved, ...supabaseBookings, ...MOCK_BOOKINGS.filter((b) => !userId || b.user_id === userId || b.user_id === "usr-demo")];
    const uniqueMap = new Map<string, Booking>();
    combined.forEach((b) => uniqueMap.set(b.id, b));
    return filterDeleted(Array.from(uniqueMap.values()));
  },

  async deleteBooking(id: string): Promise<boolean> {
    addDeletedId(id);
    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem("isbah_local_bookings") || "[]");
        const updated = existing.filter((b: any) => b.id !== id);
        localStorage.setItem("isbah_local_bookings", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_bookings_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("bookings").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase booking delete error", err);
      }
    }

    const idx = MOCK_BOOKINGS.findIndex((b) => b.id === id);
    if (idx !== -1) MOCK_BOOKINGS.splice(idx, 1);
    return true;
  },

  // INQUIRIES API
  async getVisaInquiries(): Promise<VisaInquiry[]> {
    let dbInquiries: VisaInquiry[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await withTimeout(supabase.from("visa_inquiries").select("*").order("created_at", { ascending: false }));
        if (!error && data && data.length > 0) dbInquiries = data as VisaInquiry[];
      } catch (err) {
        console.warn("Supabase visa inquiries fetch error", err);
      }
    }
    let localInquiries: VisaInquiry[] = [];
    if (typeof window !== "undefined") {
      try {
        localInquiries = JSON.parse(localStorage.getItem("isbah_local_visa_inquiries") || "[]");
      } catch {}
    }
    const mockInquiries: VisaInquiry[] = [];
    const combined = [...localInquiries, ...dbInquiries, ...mockInquiries];
    const map = new Map<string, VisaInquiry>();
    combined.forEach(i => map.set(i.id, i));
    return filterDeleted(Array.from(map.values()));
  },

  async getTourInquiries(): Promise<TourInquiry[]> {
    let dbInquiries: TourInquiry[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await withTimeout(supabase.from("tour_inquiries").select("*").order("created_at", { ascending: false }));
        if (!error && data && data.length > 0) dbInquiries = data as TourInquiry[];
      } catch (err) {
        console.warn("Supabase tour inquiries fetch error", err);
      }
    }
    let localInquiries: TourInquiry[] = [];
    if (typeof window !== "undefined") {
      try {
        localInquiries = JSON.parse(localStorage.getItem("isbah_local_tour_inquiries") || "[]");
      } catch {}
    }
    const mockInquiries: TourInquiry[] = [];
    const combined = [...localInquiries, ...dbInquiries, ...mockInquiries];
    const map = new Map<string, TourInquiry>();
    combined.forEach(i => map.set(i.id, i));
    return filterDeleted(Array.from(map.values()));
  },

  async submitVisaInquiry(inquiry: Omit<VisaInquiry, "id" | "status" | "created_at">): Promise<boolean> {
    const newInquiry: VisaInquiry = {
      ...inquiry,
      id: `vinq-${Date.now()}`,
      status: "new",
      created_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem("isbah_local_visa_inquiries") || "[]");
        localStorage.setItem("isbah_local_visa_inquiries", JSON.stringify([newInquiry, ...existing]));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_new_inquiry"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("visa_inquiries").insert([newInquiry]);
      } catch (err) {
        console.warn("Supabase visa inquiry error", err);
      }
    }
    return true;
  },

  async submitTourInquiry(inquiry: Omit<TourInquiry, "id" | "status" | "created_at">): Promise<boolean> {
    const newInquiry: TourInquiry = {
      ...inquiry,
      id: `tinq-${Date.now()}`,
      status: "new",
      created_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem("isbah_local_tour_inquiries") || "[]");
        localStorage.setItem("isbah_local_tour_inquiries", JSON.stringify([newInquiry, ...existing]));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_new_inquiry"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("tour_inquiries").insert([newInquiry]);
      } catch (err) {
        console.warn("Supabase tour inquiry error", err);
      }
    }
    return true;
  },

  // SAVED FAVORITES API
  async getSavedItems(userId?: string): Promise<any[]> {
    let items: any[] = [];
    if (isSupabaseConfigured() && userId) {
      try {
        const supabase = getClient();
        const { data, error } = await supabase
          .from("saved_items")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (!error && data) {
          items = data;
        }
      } catch (err) {
        console.warn("Error fetching saved_items from Supabase", err);
      }
    }
    let localSaved: any[] = [];
    if (typeof window !== "undefined") {
      try {
        localSaved = JSON.parse(localStorage.getItem("isbah_saved_favorites") || "[]");
      } catch {}
    }
    const combined = [...localSaved, ...items];
    const uniqueMap = new Map<string, any>();
    combined.forEach(item => uniqueMap.set(item.id || `${item.entity_type}-${item.entity_id}`, item));
    return Array.from(uniqueMap.values());
  },

  async saveItem(item: { user_id?: string; entity_type: 'hotel' | 'tour' | 'flight'; entity_id: string; title: string; subtitle?: string; image?: string; price?: number; url?: string }): Promise<any> {
    const newItem = {
      id: `fav-${Date.now()}`,
      user_id: item.user_id || "usr-demo",
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      title: item.title,
      subtitle: item.subtitle || "",
      image: item.image || "",
      price: item.price || 0,
      url: item.url || "#",
      created_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const existing: any[] = JSON.parse(localStorage.getItem("isbah_saved_favorites") || "[]");
        const filtered = existing.filter(i => !(i.entity_type === newItem.entity_type && i.entity_id === newItem.entity_id));
        localStorage.setItem("isbah_saved_favorites", JSON.stringify([newItem, ...filtered]));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
      } catch {}
    }

    if (isSupabaseConfigured() && item.user_id) {
      try {
        const supabase = getClient();
        await supabase.from("saved_items").upsert({
          user_id: item.user_id,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
        });
      } catch (err) {
        console.warn("Error saving favorite to Supabase", err);
      }
    }
    return newItem;
  },

  async removeSavedItem(id: string, entityType?: string, entityId?: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      try {
        const existing: any[] = JSON.parse(localStorage.getItem("isbah_saved_favorites") || "[]");
        const filtered = existing.filter(i => i.id !== id && !(i.entity_type === entityType && i.entity_id === entityId));
        localStorage.setItem("isbah_saved_favorites", JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        if (id && !id.startsWith("fav-")) {
          await supabase.from("saved_items").delete().eq("id", id);
        } else if (entityId) {
          await supabase.from("saved_items").delete().eq("entity_id", entityId);
        }
      } catch (err) {
        console.warn("Error deleting saved item from Supabase", err);
      }
    }
    return true;
  },

  // USER REVIEWS API
  async getUserReviews(userId?: string): Promise<any[]> {
    let dbReviews: any[] = [];
    if (isSupabaseConfigured() && userId) {
      try {
        const supabase = getClient();
        const { data: hReviews } = await supabase
          .from("hotel_reviews")
          .select("*, hotels(name)")
          .eq("user_id", userId);

        const { data: tReviews } = await supabase
          .from("tour_reviews")
          .select("*, tours(title)")
          .eq("user_id", userId);

        if (hReviews) {
          hReviews.forEach((r: any) => {
            dbReviews.push({
              id: r.id,
              user_id: r.user_id,
              target_type: "hotel",
              target_id: r.hotel_id,
              target_title: r.hotels?.name || "Hotel Review",
              rating: r.rating,
              comment: r.comment,
              created_at: r.created_at,
            });
          });
        }
        if (tReviews) {
          tReviews.forEach((r: any) => {
            dbReviews.push({
              id: r.id,
              user_id: r.user_id,
              target_type: "tour",
              target_id: r.tour_id,
              target_title: r.tours?.title || "Tour Review",
              rating: r.rating,
              comment: r.comment,
              created_at: r.created_at,
            });
          });
        }
      } catch (err) {
        console.warn("Error loading user reviews from Supabase", err);
      }
    }

    let localReviews: any[] = [];
    if (typeof window !== "undefined") {
      try {
        localReviews = JSON.parse(localStorage.getItem("isbah_user_reviews") || "[]");
      } catch {}
    }

    const combined = [...localReviews, ...dbReviews];
    const uniqueMap = new Map<string, any>();
    combined.forEach(r => uniqueMap.set(r.id, r));
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async addReview(review: { user_id?: string; target_type: 'hotel' | 'tour'; target_id?: string; target_title: string; rating: number; comment: string }): Promise<any> {
    const newReview = {
      ...review,
      id: `rev-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const existing: any[] = JSON.parse(localStorage.getItem("isbah_user_reviews") || "[]");
        localStorage.setItem("isbah_user_reviews", JSON.stringify([newReview, ...existing]));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
      } catch {}
    }

    if (isSupabaseConfigured() && review.user_id && review.target_id) {
      try {
        const supabase = getClient();
        const table = review.target_type === "hotel" ? "hotel_reviews" : "tour_reviews";
        const fkField = review.target_type === "hotel" ? "hotel_id" : "tour_id";
        await supabase.from(table).insert({
          user_id: review.user_id,
          [fkField]: review.target_id,
          rating: review.rating,
          comment: review.comment,
        });
      } catch (err) {
        console.warn("Error inserting review into Supabase", err);
      }
    }
    return newReview;
  },

  async deleteReview(id: string, targetType?: string): Promise<boolean> {
    addDeletedId(id);
    if (typeof window !== "undefined") {
      try {
        const existing: any[] = JSON.parse(localStorage.getItem("isbah_user_reviews") || "[]");
        const filtered = existing.filter(r => r.id !== id);
        localStorage.setItem("isbah_user_reviews", JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        if (!id.startsWith("rev-")) {
          const table = targetType === "tour" ? "tour_reviews" : "hotel_reviews";
          await supabase.from(table).delete().eq("id", id);
        }
      } catch (err) {
        console.warn("Error deleting review from Supabase", err);
      }
    }
    return true;
  },

  // BACKUP & RESTORE JSON API
  async exportBackupJSON(): Promise<string> {
    const [flights, hotels, tours, visas, bookings, visaInqs, tourInqs, reviews] = await Promise.all([
      this.getFlights(),
      this.getHotels(),
      this.getTours(),
      this.getVisas(),
      this.getBookings(),
      this.getVisaInquiries(),
      this.getTourInquiries(),
      this.getUserReviews(),
    ]);

    const backupData = {
      app: "Isbah Travels",
      version: "1.0",
      exported_at: new Date().toISOString(),
      deleted_ids: Array.from(getDeletedIds()),
      data: {
        flights,
        hotels,
        tours,
        visas,
        bookings,
        visa_inquiries: visaInqs,
        tour_inquiries: tourInqs,
        user_reviews: reviews,
      },
    };

    return JSON.stringify(backupData, null, 2);
  },

  async restoreBackupJSON(jsonContent: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonContent);
      const data = parsed.data || parsed;

      if (typeof window !== "undefined") {
        if (parsed.deleted_ids && Array.isArray(parsed.deleted_ids)) {
          localStorage.setItem("isbah_deleted_ids", JSON.stringify(parsed.deleted_ids));
        } else {
          localStorage.removeItem("isbah_deleted_ids");
        }

        if (data.flights) localStorage.setItem("isbah_custom_flights", JSON.stringify(data.flights));
        if (data.hotels) localStorage.setItem("isbah_custom_hotels", JSON.stringify(data.hotels));
        if (data.tours) localStorage.setItem("isbah_custom_tours", JSON.stringify(data.tours));
        if (data.visas) localStorage.setItem("isbah_custom_visas", JSON.stringify(data.visas));
        if (data.bookings) localStorage.setItem("isbah_local_bookings", JSON.stringify(data.bookings));
        if (data.visa_inquiries) localStorage.setItem("isbah_local_visa_inquiries", JSON.stringify(data.visa_inquiries));
        if (data.tour_inquiries) localStorage.setItem("isbah_local_tour_inquiries", JSON.stringify(data.tour_inquiries));
        if (data.user_reviews) localStorage.setItem("isbah_user_reviews", JSON.stringify(data.user_reviews));

        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_bookings_updated"));
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = getClient();
          if (data.hotels?.length) await supabase.from("hotels").upsert(data.hotels);
          if (data.tours?.length) await supabase.from("tours").upsert(data.tours);
          if (data.flights?.length) await supabase.from("flights").upsert(data.flights);
          if (data.visas?.length) await supabase.from("visas").upsert(data.visas);
          if (data.bookings?.length) await supabase.from("bookings").upsert(data.bookings);
        } catch (err) {
          console.warn("Supabase restore error", err);
        }
      }

      return true;
    } catch (err) {
      console.error("Restore error", err);
      throw new Error("Invalid backup JSON format");
    }
  },

  // LIVE CHAT API
  async getChatMessages(sessionId: string): Promise<any[]> {
    let dbMsgs: any[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await supabase.from("chat_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true });
        if (!error && data) dbMsgs = data;
      } catch (err) {
        console.warn("Error fetching chat messages from Supabase", err);
      }
    }
    let localMsgs: any[] = [];
    if (typeof window !== "undefined") {
      try {
        const all: any[] = JSON.parse(localStorage.getItem("isbah_chat_messages") || "[]");
        localMsgs = all.filter((m) => m.session_id === sessionId);
      } catch {}
    }
    const combined = [...localMsgs, ...dbMsgs];
    const map = new Map<string, any>();
    combined.forEach((m) => map.set(m.id, m));
    return Array.from(map.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async sendChatMessage(msg: { session_id: string; sender: "customer" | "admin" | "ai"; sender_name: string; message: string }): Promise<any> {
    const newMsg = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const existing: any[] = JSON.parse(localStorage.getItem("isbah_chat_messages") || "[]");
        localStorage.setItem("isbah_chat_messages", JSON.stringify([...existing, newMsg]));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_chat_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("chat_messages").insert([newMsg]);
      } catch (err) {
        console.warn("Error sending chat message to Supabase", err);
      }
    }

    return newMsg;
  },

  async getAllChatSessions(): Promise<{ session_id: string; last_message: string; last_time: string; sender_name: string; count: number }[]> {
    let localMsgs: any[] = [];
    if (typeof window !== "undefined") {
      try {
        localMsgs = JSON.parse(localStorage.getItem("isbah_chat_messages") || "[]");
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          const map = new Map<string, any>();
          [...localMsgs, ...data].forEach((m) => {
            if (!map.has(m.id)) map.set(m.id, m);
          });
          localMsgs = Array.from(map.values());
        }
      } catch (err) {
        console.warn("Supabase fetch chat sessions error", err);
      }
    }

    const sessionsMap = new Map<string, any[]>();
    localMsgs.forEach((m) => {
      const list = sessionsMap.get(m.session_id) || [];
      list.push(m);
      sessionsMap.set(m.session_id, list);
    });

    const result: any[] = [];
    sessionsMap.forEach((msgs, sid) => {
      msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const last = msgs[0];
      result.push({
        session_id: sid,
        last_message: last.message,
        last_time: last.created_at,
        sender_name: last.sender_name || "Customer",
        count: msgs.length,
      });
    });

    // Default sample session if empty
    if (result.length === 0) {
      result.push({
        session_id: "demo-chat-session-1",
        last_message: "Can you tell me about Saudi Arabia Umrah Visa packages?",
        last_time: new Date().toISOString(),
        sender_name: "Visitor (Dhaka)",
        count: 2,
      });
    }

    return result.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
  },

  async deleteChatSession(sessionId: string): Promise<boolean> {
    addDeletedId(sessionId);
    if (typeof window !== "undefined") {
      try {
        const existing: any[] = JSON.parse(localStorage.getItem("isbah_chat_messages") || "[]");
        const filtered = existing.filter((m) => m.session_id !== sessionId);
        localStorage.setItem("isbah_chat_messages", JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
        window.dispatchEvent(new CustomEvent("isbah_chat_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("chat_messages").delete().eq("session_id", sessionId);
      } catch (err) {
        console.warn("Error deleting chat session from Supabase", err);
      }
    }
    return true;
  },

  async logRankingChange(log: { admin_id?: string; entity_type: 'flight' | 'hotel' | 'tour' | 'visa' | 'booking'; entity_id: string; old_rank: number; new_rank: number; old_visibility: boolean; new_visibility: boolean }): Promise<void> {
    const newLog = {
      ...log,
      id: `rl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem("isbah_ranking_logs") || "[]");
        localStorage.setItem("isbah_ranking_logs", JSON.stringify([newLog, ...existing]));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        await supabase.from("ranking_logs").insert([newLog]);
      } catch (err) {
        console.warn("Error inserting ranking_log into Supabase", err);
      }
    }
  },
};
