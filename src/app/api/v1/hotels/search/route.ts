import { NextResponse } from "next/server";
import { apiService } from "@/lib/services/api";

/**
 * GET /api/v1/hotels/search
 * Gozayaan-style hotel search API supporting query parameters:
 * checkin, checkout, search, location, rooms (ROOMS,ADULTS,CHILDREN), child_ages, sort
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkin = searchParams.get("checkin") || "2026-08-01";
    const checkout = searchParams.get("checkout") || "2026-08-02";
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";
    const roomsParam = searchParams.get("rooms") || "1,2,0";
    const sortParam = (searchParams.get("sort") || "POPULARITY").toUpperCase();
    const starParam = Number(searchParams.get("star_rating") || "0");
    const maxPriceParam = Number(searchParams.get("max_price") || "150000");

    // Parse rooms format: "ROOMS,ADULTS,CHILDREN" -> "1,2,0"
    const roomParts = roomsParam.split(",");
    const reqRoomsCount = Number(roomParts[0] || "1");
    const reqAdultsCount = Number(roomParts[1] || "2");
    const reqChildrenCount = Number(roomParts[2] || "0");

    const allHotels = await apiService.getHotels({
      city: location || undefined,
      star_rating: starParam > 0 ? starParam : undefined,
    });

    let filtered = allHotels.filter((hotel) => {
      const minPrice = hotel.min_price || 6500;
      if (minPrice > maxPriceParam) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchesName = hotel.name.toLowerCase().includes(q);
        const matchesCity = hotel.city.toLowerCase().includes(q);
        const matchesArea = (hotel.area || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesArea) return false;
      }

      return true;
    });

    // Apply Gozayaan Sort logic
    if (sortParam === "PRICE_LOW_TO_HIGH") {
      filtered.sort((a, b) => (a.min_price || 6500) - (b.min_price || 6500));
    } else if (sortParam === "PRICE_HIGH_TO_LOW") {
      filtered.sort((a, b) => (b.min_price || 6500) - (a.min_price || 6500));
    } else if (sortParam === "RATING") {
      filtered.sort((a, b) => b.star_rating - a.star_rating);
    }

    return NextResponse.json({
      hotels: filtered,
      total: filtered.length,
      search_meta: {
        checkin,
        checkout,
        search,
        location,
        rooms_config: {
          rooms: reqRoomsCount,
          adults: reqAdultsCount,
          children: reqChildrenCount,
        },
        sort: sortParam,
      },
    });
  } catch (error: any) {
    console.error("Hotel search API error:", error);
    return NextResponse.json({ error: error.message || "Failed to search hotels" }, { status: 500 });
  }
}
