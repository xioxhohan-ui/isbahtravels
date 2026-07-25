import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const booking_id = url.searchParams.get("booking_id");
  return NextResponse.redirect(new URL(`/checkout?status=failed&booking_id=${booking_id || ''}`, request.url), { status: 303 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const booking_id = url.searchParams.get("booking_id");
  return NextResponse.redirect(new URL(`/checkout?status=failed&booking_id=${booking_id || ''}`, request.url));
}
