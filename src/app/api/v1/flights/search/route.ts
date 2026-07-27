import { NextResponse } from "next/server";
import { apiService } from "@/lib/services/api";

/**
 * GET /api/v1/flights/search
 * Gozayaan-style flight search API supporting query parameters:
 * adult, child, child_age, infant, cabin_class, trips (FORMAT: FROM,TO,DATE)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adult = Number(searchParams.get("adult") || "1");
    const child = Number(searchParams.get("child") || "0");
    const infant = Number(searchParams.get("infant") || "0");
    const cabin_class = searchParams.get("cabin_class") || "Economy";
    const trips = searchParams.get("trips") || "";

    const totalTravelers = adult + child + infant;

    // Parse trips parameter e.g. "DAC,CXB,2026-07-31" or "DAC,CXB,2026-07-31|CXB,DAC,2026-08-05"
    let fromCode = "";
    let toCode = "";
    let departureDate = "";

    if (trips) {
      const firstSegment = trips.split("|")[0];
      const parts = firstSegment.split(",");
      if (parts.length >= 2) {
        fromCode = parts[0].trim();
        toCode = parts[1].trim();
        if (parts[2]) departureDate = parts[2].trim();
      }
    }

    const allFlights = await apiService.getFlights();

    const filtered = allFlights.filter((flight) => {
      // Available seats check
      if (flight.available_seats && flight.available_seats < totalTravelers) {
        return false;
      }

      // Cabin class check (case-insensitive)
      if (cabin_class && flight.class.toLowerCase() !== cabin_class.toLowerCase()) {
        // Match unless explicitly mismatched
        if (flight.class.toLowerCase() === "business" && cabin_class.toLowerCase() === "economy") {
          return false;
        }
      }

      // Segment origin / destination code check
      if (fromCode || toCode) {
        const seg = flight.segments[0];
        if (seg) {
          if (fromCode && !seg.from.toUpperCase().includes(fromCode.toUpperCase())) return false;
          if (toCode && !seg.to.toUpperCase().includes(toCode.toUpperCase())) return false;
        }
      }

      return true;
    });

    return NextResponse.json({
      flights: filtered,
      total: filtered.length,
      search_meta: {
        adult,
        child,
        infant,
        total_travelers: totalTravelers,
        cabin_class,
        trips,
        from_code: fromCode,
        to_code: toCode,
        departure_date: departureDate,
      },
    });
  } catch (error: any) {
    console.error("Flight search API error:", error);
    return NextResponse.json({ error: error.message || "Failed to search flights" }, { status: 500 });
  }
}
