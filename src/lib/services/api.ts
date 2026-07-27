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

function withTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Network timeout")), ms)),
  ]);
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
        const { data, error } = await withTimeout(query);
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
    return Array.from(uniqueMap.values());
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

    // Always cache locally for instant client-side rendering
    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem("isbah_local_bookings") || "[]");
        localStorage.setItem("isbah_local_bookings", JSON.stringify([newBooking, ...existing]));
        window.dispatchEvent(new CustomEvent("isbah_data_updated"));
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
    return Array.from(uniqueMap.values());
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
};
