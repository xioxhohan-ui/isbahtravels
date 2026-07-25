import { MOCK_BOOKINGS, MOCK_FLIGHTS, MOCK_HOTELS, MOCK_ROOMS, MOCK_TOURS, MOCK_VISAS } from "../mock-data";
import { createClient } from "../supabase/client";
import { Booking, Flight, Hotel, Room, Tour, TourInquiry, Visa, VisaInquiry } from "../types/database";

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

export const apiService = {
  // FLIGHTS API
  async getFlights(filters?: { from?: string; to?: string; trip_type?: string; class?: string }): Promise<Flight[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        let query = supabase.from("flights").select("*");
        if (filters?.trip_type) query = query.eq("trip_type", filters.trip_type);
        if (filters?.class) query = query.eq("class", filters.class);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as Flight[];
      } catch (err) {
        console.warn("Supabase fetch failed, fallback to mock flights", err);
      }
    }
    
    let result = [...MOCK_FLIGHTS];
    if (filters?.from) {
      const fromLower = filters.from.toLowerCase();
      result = result.filter(f => f.segments.some(s => s.from.toLowerCase().includes(fromLower)));
    }
    if (filters?.to) {
      const toLower = filters.to.toLowerCase();
      result = result.filter(f => f.segments.some(s => s.to.toLowerCase().includes(toLower)));
    }
    if (filters?.trip_type) {
      result = result.filter(f => f.trip_type === filters.trip_type);
    }
    if (filters?.class) {
      result = result.filter(f => f.class === filters.class);
    }
    return result;
  },

  async getFlightById(id: string): Promise<Flight | null> {
    const flights = await this.getFlights();
    return flights.find(f => f.id === id) || null;
  },

  // HOTELS API
  async getHotels(filters?: { city?: string; star_rating?: number }): Promise<Hotel[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        let query = supabase.from("hotels").select("*");
        if (filters?.city) query = query.ilike("city", `%${filters.city}%`);
        if (filters?.star_rating) query = query.gte("star_rating", filters.star_rating);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as Hotel[];
      } catch (err) {
        console.warn("Supabase fetch failed, fallback to mock hotels", err);
      }
    }

    let result = [...MOCK_HOTELS];
    if (filters?.city) {
      const cityLower = filters.city.toLowerCase();
      result = result.filter(h => h.city.toLowerCase().includes(cityLower) || h.name.toLowerCase().includes(cityLower));
    }
    if (filters?.star_rating) {
      result = result.filter(h => h.star_rating >= filters.star_rating!);
    }
    return result;
  },

  async getHotelById(id: string): Promise<Hotel | null> {
    const hotels = await this.getHotels();
    return hotels.find(h => h.id === id) || MOCK_HOTELS[0];
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
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        let query = supabase.from("tours").select("*");
        if (filters?.category) query = query.eq("category", filters.category);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as Tour[];
      } catch (err) {
        console.warn("Supabase tours fetch error", err);
      }
    }

    let result = [...MOCK_TOURS];
    if (filters?.category && filters.category !== "All") {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.location.toLowerCase().includes(q));
    }
    return result;
  },

  async getTourById(id: string): Promise<Tour | null> {
    const tours = await this.getTours();
    return tours.find(t => t.id === id) || MOCK_TOURS[0];
  },

  // VISAS API
  async getVisas(searchCountry?: string): Promise<Visa[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        let query = supabase.from("visas").select("*");
        if (searchCountry) query = query.ilike("country", `%${searchCountry}%`);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as Visa[];
      } catch (err) {
        console.warn("Supabase visa fetch error", err);
      }
    }

    let result = [...MOCK_VISAS];
    if (searchCountry) {
      const q = searchCountry.toLowerCase();
      result = result.filter(v => v.country.toLowerCase().includes(q));
    }
    return result;
  },

  async getVisaById(id: string): Promise<Visa | null> {
    const visas = await this.getVisas();
    return visas.find(v => v.id === id) || MOCK_VISAS[0];
  },

  // BOOKINGS API
  async getBookings(): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
        if (!error && data) return data as Booking[];
      } catch (err) {
        console.warn("Supabase bookings fetch error", err);
      }
    }
    return MOCK_BOOKINGS;
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
      booking_status: bookingData.booking_status || "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

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

  // INQUIRIES API
  async submitVisaInquiry(inquiry: Omit<VisaInquiry, "id" | "status" | "created_at">): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { error } = await supabase.from("visa_inquiries").insert([{ ...inquiry, status: "new" }]);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase visa inquiry error", err);
      }
    }
    return true;
  },

  async submitTourInquiry(inquiry: Omit<TourInquiry, "id" | "status" | "created_at">): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getClient();
        const { error } = await supabase.from("tour_inquiries").insert([{ ...inquiry, status: "new" }]);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase tour inquiry error", err);
      }
    }
    return true;
  },
};
