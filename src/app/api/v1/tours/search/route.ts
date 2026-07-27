import { NextResponse } from "next/server";
import { apiService } from "@/lib/services/api";

/**
 * GET /api/v1/tours/search
 * Gozayaan-style tour search API supporting query parameters:
 * location, minPrice, maxPrice, duration, sort
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "";
    const search = searchParams.get("search") || "";
    const minPrice = Number(searchParams.get("minPrice") || "0");
    const maxPrice = Number(searchParams.get("maxPrice") || "150000");
    const duration = searchParams.get("duration") || "";
    const sortParam = (searchParams.get("sort") || "POPULARITY").toUpperCase();

    const allTours = await apiService.getTours({
      search: search || location || undefined,
    });

    let filtered = allTours.filter((tour) => {
      const price = tour.price_per_person || 0;
      if (price < minPrice || price > maxPrice) return false;

      if (duration) {
        const dNum = Number(duration);
        if (!isNaN(dNum)) {
          if (dNum >= 4 && tour.duration_days < 4) return false;
          if (dNum < 4 && tour.duration_days !== dNum) return false;
        }
      }

      if (location) {
        const q = location.toLowerCase();
        const matchesLoc = tour.location.toLowerCase().includes(q);
        const matchesTitle = tour.title.toLowerCase().includes(q);
        if (!matchesLoc && !matchesTitle) return false;
      }

      return true;
    });

    // Gozayaan Sort Logic
    if (sortParam === "PRICE_LOW_TO_HIGH") {
      filtered.sort((a, b) => a.price_per_person - b.price_per_person);
    } else if (sortParam === "PRICE_HIGH_TO_LOW") {
      filtered.sort((a, b) => b.price_per_person - a.price_per_person);
    } else if (sortParam === "DURATION") {
      filtered.sort((a, b) => a.duration_days - b.duration_days);
    }

    return NextResponse.json({
      tours: filtered,
      total: filtered.length,
      search_meta: {
        location,
        search,
        minPrice,
        maxPrice,
        duration,
        sort: sortParam,
      },
    });
  } catch (error: any) {
    console.error("Tour search API error:", error);
    return NextResponse.json({ error: error.message || "Failed to search tours" }, { status: 500 });
  }
}
