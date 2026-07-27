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
 * POST /api/v1/admin/[entity]/[id]/dates
 * Body: { date: string, dates?: string[] }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  try {
    const { entity, id } = await params;
    const allowed = ["flights", "hotels", "tours", "visas", "bookings"];
    if (!allowed.includes(entity)) {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    const body = await request.json();
    const targetDate = body.date || body.dates?.[0] || new Date().toISOString().split("T")[0];

    const supabase = await getSupabaseServer();
    
    let updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (entity === "flights") {
      const { data: flight } = await supabase.from("flights").select("*").eq("id", id).single();
      if (flight) {
        const segments = flight.segments || [{}];
        segments[0].departure_date = targetDate;
        updatePayload.segments = segments;
      }
    } else {
      updatePayload.created_at = new Date(targetDate).toISOString();
    }

    const { data, error } = await supabase
      .from(entity)
      .update(updatePayload)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data?.[0], updated_date: targetDate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
