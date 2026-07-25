import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/checkout?status=cancelled", request.url), { status: 303 });
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/checkout?status=cancelled", request.url));
}
