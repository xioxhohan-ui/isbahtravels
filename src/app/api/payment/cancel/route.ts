import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendBookingCancelledEmail } from "@/lib/email/send";

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

async function handleCancellation(request: Request) {
  const url = new URL(request.url);
  const booking_id = url.searchParams.get("booking_id") || "";

  if (booking_id) {
    try {
      const supabase = await getSupabaseServer();

      // Update booking to cancelled
      await supabase.from("bookings").update({
        booking_status: "cancelled",
        updated_at: new Date().toISOString(),
      }).eq("id", booking_id);

      // Get booking details for email
      const { data: booking } = await supabase.from("bookings").select("*").eq("id", booking_id).single();
      if (booking) {
        const { data: profile } = await supabase.from("profiles").select("email, display_name").eq("id", booking.user_id).single();
        if (profile?.email) {
          await sendBookingCancelledEmail({
            user_name: profile.display_name || "Valued Customer",
            user_email: profile.email,
            booking_id,
            booking_type: booking.booking_type,
            total_price: booking.total_price,
          });
        }
      }
    } catch (err) {
      console.warn("Failed to send cancellation email:", err);
    }
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const booking_id = url.searchParams.get("booking_id") || "";
  await handleCancellation(request);
  return NextResponse.redirect(new URL(`/checkout?status=cancelled&booking_id=${booking_id}`, request.url), { status: 303 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const booking_id = url.searchParams.get("booking_id") || "";
  await handleCancellation(request);
  return NextResponse.redirect(new URL(`/checkout?status=cancelled&booking_id=${booking_id}`, request.url));
}
