import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper: create Supabase server client from cookies
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

const createBookingSchema = z.object({
  booking_type: z.enum(["flight", "hotel", "tour", "visa"]),
  reference_id: z.string().optional(),
  total_price: z.number().positive(),
  currency: z.string().default("BDT"),
  details: z.record(z.string(), z.any()).default({}),
});

/**
 * GET /api/v1/bookings
 * Returns authenticated user's bookings ordered by newest first.
 * Requires valid Supabase session cookie.
 */
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized — please sign in" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      meta: {
        total: data?.length || 0,
        user_id: user.id,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/v1/bookings
 * Creates a new booking for the authenticated user.
 */
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized — please sign in" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([{
        user_id: user.id,
        ...parsed.data,
        payment_status: "pending",
        booking_status: "pending",
        payment_details: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
