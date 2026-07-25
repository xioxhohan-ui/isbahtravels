import { NextResponse } from "next/server";
import { apiService } from "@/lib/services/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const trip_type = searchParams.get("trip_type") || "";
  const flightClass = searchParams.get("class") || "";

  try {
    const flights = await apiService.getFlights({
      from,
      to,
      trip_type,
      class: flightClass,
    });
    return NextResponse.json({ flights });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to search flights" }, { status: 500 });
  }
}
