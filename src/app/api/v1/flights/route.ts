import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
}

/**
 * GET /api/v1/flights
 * Query params: trip_type, class, from, to, sort=rank
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trip_type = searchParams.get("trip_type");
    const flight_class = searchParams.get("class");
    const sort = searchParams.get("sort");

    const supabase = await getSupabaseServer();
    let query = supabase.from("flights").select("*");

    if (trip_type) query = query.eq("trip_type", trip_type);
    if (flight_class) query = query.eq("class", flight_class);

    if (sort === "rank") {
      query = query.order("display_order", { ascending: false });
    } else {
      query = query.order("price", { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], meta: { total: data?.length || 0 } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
