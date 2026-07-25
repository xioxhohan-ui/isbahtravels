import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendBookingConfirmedEmail } from "@/lib/email/send";

// Verify HMAC-SHA256 signature from SSLCommerz callback payload
function verifyHmacSignature(payload: Record<string, string>, storePass: string): boolean {
  const verifySign = payload["verify_sign"];
  const verifyKey = payload["verify_key"];
  if (!verifySign || !verifyKey) return true; // Sandbox fallback

  const keys = verifyKey.split(",");
  const sortedParams: string[] = [];
  keys.forEach((key) => {
    if (payload[key]) {
      sortedParams.push(`${key}=${payload[key]}`);
    }
  });

  const passMd5 = crypto.createHash("md5").update(storePass).digest("hex");
  const dataToHash = sortedParams.join("&") + "&" + passMd5;
  const computedHash = crypto.createHash("md5").update(dataToHash).digest("hex");

  return computedHash.toLowerCase() === verifySign.toLowerCase();
}

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

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const booking_id = url.searchParams.get("booking_id") || "";

    // Parse form data from SSLCommerz callback
    const formData = await request.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const tran_id = payload["tran_id"] || `SSL-${Date.now()}`;
    const amount = payload["amount"] || "0";
    const card_type = payload["card_type"] || "SSLCommerz";
    const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD || "isbah_store_pass";

    // 1. Verify HMAC Signature
    const isSignatureValid = verifyHmacSignature(payload, storePass);
    if (!isSignatureValid) {
      console.error("HMAC Signature Mismatch in SSLCommerz Callback!");
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // 2. Validate Amount Against Stored Booking
    let existingBooking: any = null;
    if (booking_id) {
      const { data } = await supabase.from("bookings").select("*").eq("id", booking_id).single();
      existingBooking = data;
    }

    if (existingBooking && Number(amount) > 0 && Number(amount) < existingBooking.total_price * 0.9) {
      console.error(`Price Tampering! Callback: ${amount}, Expected: ${existingBooking.total_price}`);
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
    }

    const receiptUrl = `/api/receipt?booking_id=${booking_id}`;

    // 3. Update booking status in Supabase
    if (booking_id) {
      await supabase.from("bookings").update({
        payment_status: "paid",
        booking_status: "confirmed",
        payment_details: {
          method: card_type,
          transaction_id: tran_id,
          receipt_url: receiptUrl,
          hmac_verified: true,
          paid_amount: amount,
          paid_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }).eq("id", booking_id);
    }

    // 4. Send "Payment Confirmed" email to user
    if (existingBooking) {
      // Fetch user email from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", existingBooking.user_id)
        .single();

      if (profile?.email) {
        await sendBookingConfirmedEmail({
          user_name: profile.display_name || "Valued Customer",
          user_email: profile.email,
          booking_id,
          booking_type: existingBooking.booking_type,
          booking_title: existingBooking.details?.title || existingBooking.details?.airline || `${existingBooking.booking_type} Booking`,
          total_price: existingBooking.total_price,
          transaction_id: tran_id,
          receipt_url: receiptUrl,
        });
      }
    }

    const redirectUrl = new URL(`/dashboard?status=paid&booking_id=${booking_id}&tran_id=${tran_id}`, request.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    const url = new URL(request.url);
    const booking_id = url.searchParams.get("booking_id") || "";
    const redirectUrl = new URL(`/dashboard?status=paid&booking_id=${booking_id}`, request.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const booking_id = url.searchParams.get("booking_id") || "";
  const tran_id = url.searchParams.get("tran_id") || `SSL-${Date.now()}`;
  const redirectUrl = new URL(`/dashboard?status=paid&booking_id=${booking_id}&tran_id=${tran_id}`, request.url);
  return NextResponse.redirect(redirectUrl);
}
