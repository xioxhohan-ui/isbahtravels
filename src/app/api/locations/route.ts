import { NextResponse } from "next/server";

export const LOCATIONS = [
  { id: "loc-cxb", name: "Cox's Bazar", type: "city", country: "Bangladesh", area: "Marine Drive & Kolatoli Beach" },
  { id: "loc-syl", name: "Sylhet", type: "city", country: "Bangladesh", area: "Sreemangal & Jaflong" },
  { id: "loc-dac", name: "Dhaka", type: "city", country: "Bangladesh", area: "Gulshan & Banani" },
  { id: "loc-cgp", name: "Chittagong", type: "city", country: "Bangladesh", area: "Agrabad & Patenga Beach" },
  { id: "loc-dxb", name: "Dubai", type: "city", country: "United Arab Emirates", area: "Downtown & Marina" },
  { id: "loc-bkk", name: "Bangkok", type: "city", country: "Thailand", area: "Sukhumvit & Siam" },
  { id: "loc-kul", name: "Kuala Lumpur", type: "city", country: "Malaysia", area: "Bukit Bintang" },
];

/**
 * GET /api/locations?search=query
 * Location Autocomplete API returning city, resort area, country
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("search") || "").toLowerCase().trim();

    if (!query) {
      return NextResponse.json(LOCATIONS);
    }

    const filtered = LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.area.toLowerCase().includes(query) ||
        l.country.toLowerCase().includes(query)
    );

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch locations" }, { status: 500 });
  }
}
