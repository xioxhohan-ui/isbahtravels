import { NextResponse } from "next/server";
import { apiService } from "@/lib/services/api";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const booking_id = url.searchParams.get("booking_id") || "bk-1001";
    
    // Parse form data from SSLCommerz callback
    const formData = await request.formData();
    const tran_id = formData.get("tran_id")?.toString() || `SSL-${Date.now()}`;
    const card_type = formData.get("card_type")?.toString() || "SSLCommerz bKash/Card";

    const receiptUrl = `/api/receipt?booking_id=${booking_id}`;

    // Update booking in Supabase / state
    if (booking_id) {
      await apiService.createBooking({
        id: booking_id,
        payment_status: "paid",
        booking_status: "confirmed",
        payment_details: {
          method: card_type,
          transaction_id: tran_id,
          receipt_url: receiptUrl,
          paid_at: new Date().toISOString(),
        },
      });
    }

    const redirectUrl = new URL(`/dashboard?status=paid&booking_id=${booking_id}&tran_id=${tran_id}`, request.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    const url = new URL(request.url);
    const booking_id = url.searchParams.get("booking_id") || "bk-1001";
    const redirectUrl = new URL(`/dashboard?status=paid&booking_id=${booking_id}`, request.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const booking_id = url.searchParams.get("booking_id") || "bk-1001";
  const tran_id = url.searchParams.get("tran_id") || `SSL-${Date.now()}`;
  
  const redirectUrl = new URL(`/dashboard?status=paid&booking_id=${booking_id}&tran_id=${tran_id}`, request.url);
  return NextResponse.redirect(redirectUrl);
}
