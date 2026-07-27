import { NextResponse } from "next/server";
import { AIRPORTS } from "@/lib/mock-data";

/**
 * GET /api/airports?search=query
 * Airport Autocomplete API returning airport code, city, name, country
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("search") || "").toLowerCase().trim();

    if (!query) {
      return NextResponse.json(AIRPORTS);
    }

    const filtered = AIRPORTS.filter(
      (a) =>
        a.code.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
    );

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch airports" }, { status: 500 });
  }
}
